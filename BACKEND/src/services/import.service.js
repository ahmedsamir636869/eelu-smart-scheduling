const XLSX = require('xlsx');
const { prisma } = require('../config/db');

/**
 * Find or create a college
 * Ensures colleges are properly linked to campuses when campusId is provided
 */
const findOrCreateCollege = async (collegeName, campusId) => {
  if (!collegeName) return null;
  
  const trimmedName = collegeName.trim();
  
  // Try to find existing college (prefer exact match, then contains)
  let college = await prisma.college.findFirst({
    where: {
      name: { equals: trimmedName, mode: 'insensitive' },
      ...(campusId && { campusId: campusId })
    }
  });
  
  // If not found with exact match, try contains
  if (!college) {
    college = await prisma.college.findFirst({
      where: {
        name: { contains: trimmedName, mode: 'insensitive' },
        ...(campusId && { campusId: campusId })
      }
    });
  }
  
  // If still not found, try without campus constraint
  if (!college && campusId) {
    college = await prisma.college.findFirst({
      where: {
        name: { equals: trimmedName, mode: 'insensitive' }
      }
    });
  }
  
  // If not found, create it
  if (!college) {
    college = await prisma.college.create({
      data: {
        name: trimmedName,
        ...(campusId && { campusId: campusId })
      }
    });
    console.log(`✓ Created new college: "${trimmedName}"${campusId ? ` (campus: ${campusId})` : ''}`);
  } else {
    // If college exists but campusId doesn't match, update it
    if (campusId && college.campusId !== campusId) {
      college = await prisma.college.update({
        where: { id: college.id },
        data: { campusId: campusId }
      });
      console.log(`✓ Updated college "${trimmedName}" to link to campus: ${campusId}`);
    } else {
      console.log(`✓ Found existing college: "${trimmedName}"`);
    }
  }
  
  return college;
};

/**
 * Find or create a department
 * Automatically creates college if needed
 * Ensures departments are always created within a college
 */
const findOrCreateDepartment = async (departmentName, collegeName, campusId, major = null) => {
  if (!departmentName && !major) return null;
  
  const deptName = departmentName || major;
  const deptCode = (departmentName || major || '').trim().toUpperCase();
  
  // Try to find existing department
  let department = await prisma.department.findFirst({
    where: {
      OR: [
        { name: { contains: deptName, mode: 'insensitive' } },
        { code: { contains: deptCode, mode: 'insensitive' } }
      ]
    },
    include: { college: true }
  });
  
  // If not found, try using Major
  if (!department && major && major !== departmentName) {
    department = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { contains: major, mode: 'insensitive' } },
          { code: { contains: major.toUpperCase(), mode: 'insensitive' } }
        ]
      },
      include: { college: true }
    });
  }
  
  // If still not found, create department (and college if needed)
  if (!department) {
    // Find or create college - ALWAYS ensure we have a college
    let college = null;
    
    if (collegeName) {
      // Use provided college name
      college = await findOrCreateCollege(collegeName, campusId);
    } else {
      // Try to find a college that matches the department or campus
      // First, try to find colleges in the same campus
      if (campusId) {
        const campusColleges = await prisma.college.findMany({
          where: { campusId: campusId },
          take: 1
        });
        if (campusColleges.length > 0) {
          college = campusColleges[0];
        }
      }
      
      // If still no college, try to find any college
      if (!college) {
        const existingColleges = await prisma.college.findMany({ take: 1 });
        if (existingColleges.length > 0) {
          college = existingColleges[0];
        }
      }
      
      // If still no college, create one with a meaningful name
      if (!college) {
        // Create a college based on department or use a generic name
        const newCollegeName = deptName 
          ? `${deptName} College` 
          : (campusId ? 'Main College' : 'Default College');
        
        college = await prisma.college.create({
          data: {
            name: newCollegeName,
            ...(campusId && { campusId: campusId })
          }
        });
        console.log(`Created new college: ${newCollegeName} for department: ${deptName}`);
      }
    }
    
    // Ensure we have a college before creating department
    if (!college) {
      throw new Error(`Cannot create department ${deptName}: Failed to create or find a college`);
    }
    
    // Verify college exists and has an ID
    if (!college.id) {
      throw new Error(`Cannot create department ${deptName}: Invalid college data`);
    }
    
    // Create department WITHIN the college
    department = await prisma.department.create({
      data: {
        name: deptName.trim(),
        code: deptCode,
        collegeId: college.id  // Always link to college
      },
      include: { 
        college: true  // Include college relation
      }
    });
    
    console.log(`✓ Created new department: "${deptName}" (code: ${deptCode}) inside college: "${college.name}"`);
  } else {
    // Department exists, verify it has a college
    if (!department.college) {
      console.warn(`Warning: Department "${deptName}" exists but has no college. This should not happen.`);
    } else {
      console.log(`✓ Found existing department: "${deptName}" in college: "${department.college.name}"`);
    }
  }
  
  // Final verification: ensure department has college relation
  if (!department.college) {
    department = await prisma.department.findUnique({
      where: { id: department.id },
      include: { college: true }
    });
  }
  
  return department;
};

/**
 * Parse Excel file and convert to JSON
 * Processes all sheets in the workbook
 */
const parseExcelToJSON = (buffer) => {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const allData = [];
    
    // Process all sheets
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      
      // Add sheet name as metadata to each row (optional, for debugging)
      const dataWithSheetInfo = sheetData.map(row => ({
        ...row,
        _sheetName: sheetName // Add sheet name for reference
      }));
      
      allData.push(...dataWithSheetInfo);
    }
    
    console.log(`Parsed ${workbook.SheetNames.length} sheet(s): ${workbook.SheetNames.join(', ')}`);
    console.log(`Total rows: ${allData.length}`);
    
    return allData;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Import student groups from JSON data
 */
const importStudentGroups = async (data, campusId) => {
  const results = {
    success: [],
    errors: [],
    total: data.length
  };

  for (const row of data) {
    try {
      // Map Excel columns to database fields
      // Expected columns: Name, Year, StudentCount, Department, College, Campus
      // Also support Division format: Num_ID, Year, StudentNum, Department, Major
      const name = row.Name || row.name || row['Student Group'] || row['Student Group Name'] || 
                   row.Num_ID || row['Num_ID'] || row['Division ID'] || row['Division'];
      const year = parseInt(row.Year || row.year || row.Level || row.level) || 1;
      const studentCount = parseInt(row.StudentCount || row['Student Count'] || row.studentCount || 
                                   row.Students || row.students || row.StudentNum || row['StudentNum']) || 0;
      const departmentName = row.Department || row.department || row.Dept || row.dept;
      const collegeName = row.College || row.college || row.CollegeName || row.collegeName;
      const major = row.Major || row.major; // For Division format
      const campusName = row.Campus || row.campus || row.CampusName || row.campusName;

      if (!name) {
        results.errors.push({ row, error: 'Missing required field: Name or Num_ID' });
        continue;
      }

      // Find or create department (automatically creates college if needed)
      let department = null;
      try {
        department = await findOrCreateDepartment(departmentName, collegeName, campusId, major);
      } catch (error) {
        results.errors.push({ row, error: `Failed to find or create department: ${error.message}` });
        continue;
      }

      if (!department) {
        results.errors.push({ row, error: `Department not found and could not be created: ${departmentName || major || 'N/A'}` });
        continue;
      }

      // Create or update student group
      const existingGroup = await prisma.studentGroup.findFirst({
        where: {
          name: name,
          departmentId: department.id,
          year: year
        }
      });

      let studentGroup;
      if (existingGroup) {
        studentGroup = await prisma.studentGroup.update({
          where: { id: existingGroup.id },
          data: { studentCount: studentCount }
        });
        results.success.push({ action: 'updated', group: studentGroup });
      } else {
        studentGroup = await prisma.studentGroup.create({
          data: {
            name: name,
            year: year,
            studentCount: studentCount,
            departmentId: department.id
          }
        });
        results.success.push({ action: 'created', group: studentGroup });
      }
    } catch (error) {
      results.errors.push({ row, error: error.message });
    }
  }

  return results;
};

/**
 * Import physical resources (classrooms) from JSON data
 */
const importPhysicalResources = async (data, campusId) => {
  const results = {
    success: [],
    errors: [],
    total: data.length
  };

  // Try to find campus if not provided
  let finalCampusId = campusId;
  if (!finalCampusId) {
    const campuses = await prisma.campus.findMany({ take: 1 });
    if (campuses.length > 0) {
      finalCampusId = campuses[0].id;
      console.log(`No campusId provided, using first available campus: ${finalCampusId}`);
    } else {
      data.forEach(row => {
        results.errors.push({ 
          row, 
          error: 'Campus ID is required for importing physical resources. Please provide campusId in the request or create a campus first.' 
        });
      });
      return results;
    }
  }

  const campus = await prisma.campus.findUnique({
    where: { id: finalCampusId }
  });

  if (!campus) {
    data.forEach(row => {
      results.errors.push({ 
        row, 
        error: `Campus with ID ${finalCampusId} not found. Please provide a valid campusId.` 
      });
    });
    return results;
  }

  for (const row of data) {
    try {
      // Skip Division rows - they should be handled as student groups
      const keys = Object.keys(row).map(k => k.toLowerCase());
      const sheetName = (row._sheetName || '').toLowerCase();
      const isDivisionRow = (
        sheetName.includes('division') ||
        (keys.some(k => k === 'num_id' || k.includes('num_id')) &&
         keys.some(k => k === 'major' || k.includes('major')) &&
         keys.some(k => k === 'studentnum' || k === 'student_num'))
      );
      
      if (isDivisionRow) {
        results.errors.push({ 
          row, 
          error: 'This row appears to be a Division/Student Group, not a physical resource. Please use the "All Data" import option.' 
        });
        continue;
      }
      
      // Map Excel columns to database fields - try multiple variations
      // Expected columns: Name, Capacity, Type, Campus
      const name = row.Name || row.name || row['Room Name'] || row['Classroom Name'] || 
                   row['Room'] || row.room || row['Classroom'] || row.classroom ||
                   row['Hall'] || row.hall || row['Lab'] || row.lab ||
                   Object.values(row).find((v, i) => i === 0 && typeof v === 'string' && v.trim().length > 0);
      
      // Try to find capacity in various formats
      let capacity = 0;
      const capacityStr = row.Capacity || row.capacity || row['Seats'] || row.seats || 
                         row['Student Capacity'] || row['Max Capacity'] || row['Max Students'] ||
                         row['Number of Seats'] || row['Seat Count'];
      
      if (capacityStr) {
        capacity = parseInt(String(capacityStr).replace(/[^0-9]/g, '')) || 0;
      }
      
      // Try to find type
      const typeStr = (row.Type || row.type || row['Room Type'] || row['Classroom Type'] || 
                      row['Type of Room'] || row['Category'] || row.category || '').toUpperCase();
      const type = typeStr.includes('LAB') || typeStr.includes('LABORATORY') || typeStr === 'LAB' ? 'LAB' : 'LECTURE_HALL';

      // Better error messages
      if (!name || (typeof name === 'string' && name.trim().length === 0)) {
        const availableColumns = Object.keys(row).join(', ');
        results.errors.push({ 
          row, 
          error: `Missing required field: Name. Available columns: ${availableColumns || 'none'}` 
        });
        continue;
      }

      if (capacity <= 0) {
        const capacityValue = capacityStr || 'not found';
        const availableColumns = Object.keys(row).map(k => `${k}: ${row[k]}`).join(', ');
        results.errors.push({ 
          row, 
          error: `Invalid capacity: "${capacityValue}". Capacity must be a number greater than 0. Row data: ${availableColumns}` 
        });
        continue;
      }

      // Create or update classroom
      const existingClassroom = await prisma.classroom.findFirst({
        where: {
          name: name.trim(),
          campusId: finalCampusId
        }
      });

      let classroom;
      if (existingClassroom) {
        classroom = await prisma.classroom.update({
          where: { id: existingClassroom.id },
          data: { capacity: capacity, type: type }
        });
        results.success.push({ action: 'updated', classroom });
      } else {
        classroom = await prisma.classroom.create({
          data: {
            name: name.trim(),
            capacity: capacity,
            type: type,
            campusId: finalCampusId
          }
        });
        results.success.push({ action: 'created', classroom });
      }
    } catch (error) {
      const errorMessage = error.message || 'Unknown error';
      const availableColumns = Object.keys(row).join(', ');
      results.errors.push({ 
        row, 
        error: `${errorMessage}. Row data: ${availableColumns ? `Columns: ${availableColumns}` : JSON.stringify(row).substring(0, 200)}` 
      });
      console.error('Error importing physical resource:', errorMessage, row);
    }
  }

  return results;
};

/**
 * Parse time string to DateTime
 * Handles formats like "8:00", "14:00", "8:00 AM", "2:00 PM"
 */
const parseTimeToDateTime = (timeStr) => {
  if (!timeStr) return null;
  
  const time = String(timeStr).trim();
  
  // Handle "HH:MM" format (24-hour)
  if (time.match(/^\d{1,2}:\d{2}$/)) {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  // Handle "HH:MM AM/PM" format (12-hour)
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }
  
  return null;
};

/**
 * Map day string to DayOfWeek enum
 */
const mapDayToEnum = (dayStr) => {
  if (!dayStr) return null;
  
  const dayMap = {
    'saturday': 'SATURDAY',
    'sunday': 'SUNDAY',
    'monday': 'MONDAY',
    'tuesday': 'TUESDAY',
    'wednesday': 'WEDNESDAY',
    'thursday': 'THURSDAY'
  };
  
  return dayMap[String(dayStr).trim().toLowerCase()] || null;
};

/**
 * Import instructors from JSON data
 * Creates Instructor records with schedule assignments (day, startTime, endTime)
 */
const importInstructors = async (data, campusId) => {
  const results = {
    success: [],
    errors: [],
    total: data.length
  };

  for (const row of data) {
    try {
      // Map Excel columns to database fields
      // Support schedule format: Instructor_ID, Instructor_Name, Department, Day, Start_Time, End_Time
      const instructorId = row['Instructor_ID'] || row['Instructor ID'] || row.instructor_id || row.instructorId;
      const name = row.Name || row.name || row['Instructor Name'] || row['Instructor_Name'] || 
                   row['Instructor_Name'] || row['Doctor Name'] || row['Doctor_Name'];
      const email = row.Email || row.email || row['Email Address'];
      const departmentName = row.Department || row.department || row.Dept || row.dept;
      const collegeName = row.College || row.college || row.CollegeName || row.collegeName;
      
      // Schedule fields
      const dayStr = row.Day || row.day || row['Day of Week'] || row['Day_of_Week'];
      const startTimeStr = row['Start_Time'] || row['Start Time'] || row['StartTime'] || 
                          row.start_time || row.startTime;
      const endTimeStr = row['End_Time'] || row['End Time'] || row['EndTime'] || 
                        row.end_time || row.endTime;

      if (!name && !instructorId) {
        results.errors.push({ row, error: 'Missing required field: Name or Instructor_ID' });
        continue;
      }

      // Find or create department (automatically creates college if needed)
      let department = null;
      try {
        department = await findOrCreateDepartment(departmentName, collegeName, campusId);
      } catch (error) {
        results.errors.push({ row, error: `Failed to find or create department: ${error.message}` });
        continue;
      }

      if (!department) {
        results.errors.push({ row, error: `Department not found and could not be created: ${departmentName || 'N/A'}` });
        continue;
      }

      // Parse schedule data
      const day = mapDayToEnum(dayStr);
      const startTime = parseTimeToDateTime(startTimeStr);
      const endTime = parseTimeToDateTime(endTimeStr);

      // Create or find User account for the instructor (for authentication)
      let user = null;
      if (email) {
        user = await prisma.user.findUnique({
          where: { email: email }
        });
      }

      // If no email, try to find by name
      if (!user && name) {
        user = await prisma.user.findFirst({
          where: {
            name: { contains: name, mode: 'insensitive' },
            roles: { has: 'INSTRUCTOR' }
          }
        });
      }

      // Create User if doesn't exist
      if (!user) {
        const defaultPassword = 'changeme123';
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        user = await prisma.user.create({
          data: {
            name: name.trim(),
            email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            password: hashedPassword,
            roles: ['INSTRUCTOR']
          }
        });
      }

      // Check if instructor assignment already exists (same name, department, day, and time)
      const existingInstructor = await prisma.instructor.findFirst({
        where: {
          name: { equals: name.trim(), mode: 'insensitive' },
          departmentId: department.id,
          day: day,
          startTime: startTime,
          endTime: endTime
        }
      });

      let instructor;
      if (existingInstructor) {
        // Update existing assignment
        instructor = await prisma.instructor.update({
          where: { id: existingInstructor.id },
          data: {
            name: name.trim(),
            departmentId: department.id,
            day: day,
            startTime: startTime,
            endTime: endTime
          }
        });
        results.success.push({ 
          action: 'updated', 
          instructor: {
            id: instructor.id,
            name: instructor.name,
            department: department.name,
            day: day,
            startTime: startTimeStr,
            endTime: endTimeStr
          }
        });
        console.log(`✓ Updated instructor assignment: ${name} - ${day} ${startTimeStr}-${endTimeStr} in ${department.name}`);
      } else {
        // Create new Instructor record with schedule assignment
        // Each row represents a time slot assignment for the instructor
        instructor = await prisma.instructor.create({
          data: {
            name: name.trim(),
            departmentId: department.id,
            day: day,
            startTime: startTime,
            endTime: endTime
          }
        });

        results.success.push({ 
          action: 'created', 
          instructor: {
            id: instructor.id,
            name: instructor.name,
            department: department.name,
            day: day,
            startTime: startTimeStr,
            endTime: endTimeStr
          }
        });
        
        console.log(`✓ Created instructor assignment: ${name} - ${day} ${startTimeStr}-${endTimeStr} in ${department.name}`);
      }
    } catch (error) {
      results.errors.push({ row, error: error.message });
      console.error('Error importing instructor:', error.message, row);
    }
  }

  return results;
};

/**
 * Import courses from JSON data
 * @param {Array} data - Course rows from spreadsheet
 * @param {string} campusId - Campus ID
 * @param {Map} instructorIdMap - Optional mapping of spreadsheet Instructor_ID (e.g. "I12") to instructor name
 */
const importCourses = async (data, campusId, instructorIdMap = new Map()) => {
  const results = {
    success: [],
    errors: [],
    total: data.length
  };

  console.log(`📚 Importing ${data.length} courses. Instructor ID mapping has ${instructorIdMap.size} entries.`);
  if (instructorIdMap.size > 0) {
    console.log('Instructor ID mapping:', Object.fromEntries(instructorIdMap));
  }

  for (const row of data) {
    try {
      // Map Excel columns to database fields
      // Expected columns: Code, Name, Type, Days, HoursPerDay, Year, Department, College, Instructor
      // Also support: Course_ID, Course_Name, Type, Days, Hours_per_day, Year, Department, Major, Instructor_ID
      const code = row.Code || row.code || row['Course Code'] || row['Course_ID'] || row['Course ID'] || 
                   row['Course_Code'] || row.course_id || row.courseId;
      const name = row.Name || row.name || row['Course Name'] || row['Course_Name'] || row.course_name;
      const typeStr = (row.Type || row.type || row['Course Type'] || row['Course_Type'] || '').toUpperCase();
      const type = typeStr.includes('PRACTICAL') || typeStr.includes('LAB') || typeStr.includes('SECTION') ? 'PRACTICAL' : 'THEORETICAL';
      const days = parseInt(row.Days || row.days || row['Days Per Week'] || row['Days_per_week'] || row.days_per_week) || 1;
      const hoursPerDay = parseInt(row['Hours Per Day'] || row['HoursPerDay'] || row['Hours_per_day'] || 
                           row['Hours_per_Day'] || row.hoursPerDay || row.hours_per_day || row.Hours || row.hours) || 1;
      const year = parseInt(row.Year || row.year || row.Level || row.level) || 1;
      const departmentName = row.Department || row.department || row.Dept || row.dept;
      const major = row.Major || row.major; // For Division format compatibility
      const collegeName = row.College || row.college || row.CollegeName || row.collegeName;
      const spreadsheetInstructorId = row['Instructor_ID'] || row['Instructor ID'] || 
                          row.instructor_id || row.instructorId;
      let instructorName = row.Instructor || row.instructor || row['Instructor Name'] || 
                            row['Instructor_Name'] || row['Doctor Name'] || row['Doctor_Name'];

      // If we have a spreadsheet Instructor_ID (like "I12") and a mapping, resolve it to the instructor name
      if (spreadsheetInstructorId && !instructorName && instructorIdMap.size > 0) {
        const mappedName = instructorIdMap.get(String(spreadsheetInstructorId).trim());
        if (mappedName) {
          instructorName = mappedName;
          console.log(`✓ Resolved Instructor_ID "${spreadsheetInstructorId}" → "${mappedName}" for course "${code}"`);
        }
      }

      if (!code || !name) {
        results.errors.push({ row, error: 'Missing required fields: Code and Name' });
        continue;
      }

      // Find or create department (automatically creates college if needed)
      let department = null;
      try {
        department = await findOrCreateDepartment(departmentName, collegeName, campusId, major);
      } catch (error) {
        results.errors.push({ row, error: `Failed to find or create department: ${error.message}` });
        continue;
      }

      if (!department) {
        results.errors.push({ row, error: `Department not found and could not be created: ${departmentName || major || 'N/A'}` });
        continue;
      }

      // Find instructor in the Instructor model (not User model)
      let instructor = null;
      
      // Try to find by instructor name (resolved from mapping or provided directly)
      if (instructorName) {
        // Find Instructor records by name in same department first
        const instructors = await prisma.instructor.findMany({
          where: {
            name: { equals: instructorName.trim(), mode: 'insensitive' },
            departmentId: department.id
          }
        });
        
        if (instructors.length > 0) {
          instructor = instructors[0];
          console.log(`✓ Matched instructor for course "${code}": ${instructor.name} (by name in dept "${department.name}")`);
        } else {
          // Try without department constraint
          const allInstructors = await prisma.instructor.findMany({
            where: {
              name: { equals: instructorName.trim(), mode: 'insensitive' }
            }
          });
          
          if (allInstructors.length > 0) {
            instructor = allInstructors[0];
            console.log(`✓ Matched instructor for course "${code}": ${instructor.name} (by name, any dept)`);
          }
        }
      }
      
      // If still not found and we have a spreadsheet ID but no mapping resolved it
      if (!instructor && spreadsheetInstructorId && !instructorName) {
        console.warn(`⚠️  Course "${code}" has Instructor_ID "${spreadsheetInstructorId}" but no instructor name mapping found. ` +
                     `Make sure instructors are imported first (from the Doctors sheet).`);
      }
      
      if (!instructor && (spreadsheetInstructorId || instructorName)) {
        console.warn(`⚠️  Could not find instructor for course "${code}". ` +
                    `Instructor_ID: ${spreadsheetInstructorId || 'N/A'}, Name: ${instructorName || 'N/A'}`);
      }

      // Create or update course
      const existingCourse = await prisma.course.findUnique({
        where: { code: code }
      });

      let course;
      if (existingCourse) {
        course = await prisma.course.update({
          where: { id: existingCourse.id },
          data: {
            name: name,
            type: type,
            days: days,
            hoursPerDay: hoursPerDay,
            year: year,
            departmentId: department.id,
            collegeId: department.collegeId,
            instructorId: instructor?.id || null
          }
        });
        results.success.push({ action: 'updated', course });
      } else {
        course = await prisma.course.create({
          data: {
            code: code,
            name: name,
            type: type,
            days: days,
            hoursPerDay: hoursPerDay,
            year: year,
            departmentId: department.id,
            collegeId: department.collegeId,
            instructorId: instructor?.id || null
          }
        });
        results.success.push({ action: 'created', course });
      }
    } catch (error) {
      results.errors.push({ row, error: error.message });
    }
  }

  return results;
};

/**
 * Import all data types from a single file
 * Automatically detects data type based on columns
 */
const importAllData = async (data, campusId) => {
  const results = {
    students: { success: [], errors: [], total: 0 },
    physical: { success: [], errors: [], total: 0 },
    instructors: { success: [], errors: [], total: 0 },
    courses: { success: [], errors: [], total: 0 },
    unknown: []
  };

  // Categorize rows based on column presence
  const studentRows = [];
  const physicalRows = [];
  const instructorRows = [];
  const courseRows = [];
  const unknownRows = [];

  for (const row of data) {
    const keys = Object.keys(row).map(k => k.toLowerCase().trim());
    const sheetName = (row._sheetName || '').toLowerCase();
    
    // First, check if this is a Division row (most specific check first)
    // Check sheet name first, then field patterns
    const hasNumId = keys.some(k => k === 'num_id' || k.includes('num_id') || k.includes('division'));
    const hasMajor = keys.some(k => k === 'major' || k.includes('major'));
    const hasYear = keys.some(k => k === 'year' || k.includes('year'));
    const hasStudentNum = keys.some(k => k === 'studentnum' || k === 'student_num' || 
                                      k.includes('studentnum') || (k.includes('student') && k.includes('num')));
    
    const isDivisionRow = (
      sheetName.includes('division') ||
      (hasNumId && hasMajor && hasYear && hasStudentNum)
    );
    
    // Detect student groups: has Name/Num_ID, Year/Level, StudentCount/Students/StudentNum
    // Also check for Division-specific fields: Num_ID, Major, StudentNum
    const hasStudentFields = isDivisionRow || (
      ((keys.some(k => k.includes('name') && !k.includes('course') && !k.includes('instructor') && 
                      !k.includes('room') && !k.includes('classroom') && !k.includes('hall') && 
                      !k.includes('lab')) ||
        keys.some(k => k.includes('group')) ||
        hasNumId) &&
      hasYear &&
      (hasStudentNum || keys.some(k => (k.includes('student') && k.includes('count')) || 
                                    k === 'student count')))
    );

    // Detect physical resources: has Name/Room/Hall/Lab, Capacity/Seats
    // Must NOT have Division-specific fields (Num_ID, Major, StudentNum)
    // Must have explicit capacity field (not just "student" which could be StudentNum)
    const hasPhysicalFields = !isDivisionRow && (
      (keys.some(k => (k.includes('name') || k.includes('room') || k.includes('classroom') || 
                      k.includes('hall') || k.includes('lab')) && 
                      !k.includes('course') && !k.includes('instructor') && !k.includes('group')) ||
       // Explicit room identifiers
       keys.some(k => k === 'room' || k === 'hall' || k === 'lab' || k === 'classroom')) &&
      // Must have explicit capacity/seats field (not just "student" which could be StudentNum)
      (keys.some(k => k.includes('capacity') || k.includes('seats') || 
                      (k.includes('max') && (k.includes('capacity') || k.includes('student'))))) &&
      // Must NOT have Division-specific fields
      !keys.some(k => k.includes('num_id') || k.includes('division') || 
                      (k.includes('major') && !k.includes('course'))) &&
      // Must NOT have StudentNum (which is different from capacity)
      !keys.some(k => k === 'studentnum' || k === 'student_num')
    );

    // Detect instructors: has Instructor_ID/Name, Department
    // Can have Email (basic info) OR Day/Start_Time/End_Time (schedule format)
    const hasInstructorFields = (
      (keys.some(k => k.includes('instructor_id') || k.includes('instructor id')) ||
       keys.some(k => (k.includes('name') || k.includes('instructor') || k.includes('doctor')) &&
                      !k.includes('course') && !k.includes('group'))) &&
      (keys.some(k => k.includes('department') || k.includes('dept'))) &&
      // Either has email (basic info) OR has schedule fields (Day, Start_Time, End_Time)
      (keys.some(k => k.includes('email')) ||
       (keys.some(k => k === 'day' || k.includes('day')) &&
        keys.some(k => k.includes('start_time') || k.includes('start time') || k.includes('start')) &&
        keys.some(k => k.includes('end_time') || k.includes('end time') || k.includes('end'))))
    );

    // Detect courses: has Course_ID/Code, Course_Name, Type, Days, Hours_per_day
    const hasCourseFields = (
      (keys.some(k => k.includes('course_id') || k.includes('course id') || 
                      k.includes('course_code') || k.includes('course code') ||
                      (k.includes('code') && !k.includes('instructor')))) &&
      (keys.some(k => k.includes('course_name') || k.includes('course name') ||
                      (k.includes('name') && k.includes('course')) ||
                      (k.includes('name') && !k.includes('instructor') && !k.includes('group') && 
                       !k.includes('room') && !k.includes('classroom')))) &&
      (keys.some(k => k.includes('type') || k.includes('course type'))) &&
      (keys.some(k => k.includes('day') || k.includes('days') ||
                      k.includes('hours_per_day') || k.includes('hours per day') ||
                      k.includes('hoursperday') || k.includes('hour')))
    );

    // Categorize row - prioritize student groups over physical resources
    // Check student groups first to avoid misclassification
    if (hasCourseFields) {
      courseRows.push(row);
    } else if (hasInstructorFields) {
      instructorRows.push(row);
    } else if (hasStudentFields) {
      // Check student groups before physical resources
      studentRows.push(row);
    } else if (hasPhysicalFields) {
      physicalRows.push(row);
    } else {
      unknownRows.push(row);
    }
  }

  // Import each category
  if (studentRows.length > 0) {
    try {
      results.students = await importStudentGroups(studentRows, campusId);
    } catch (error) {
      results.students.errors = studentRows.map(row => ({
        row,
        error: error.message || 'Failed to import student group'
      }));
      results.students.total = studentRows.length;
    }
  }

  if (physicalRows.length > 0) {
    try {
      results.physical = await importPhysicalResources(physicalRows, campusId);
    } catch (error) {
      results.physical.errors = physicalRows.map(row => ({
        row,
        error: error.message || 'Failed to import physical resource'
      }));
      results.physical.total = physicalRows.length;
    }
  }

  if (instructorRows.length > 0) {
    results.instructors = await importInstructors(instructorRows, campusId);
  }

  // Build a mapping of spreadsheet Instructor_ID (e.g. "I12") → Instructor_Name (e.g. "Dr. Amany")
  // This mapping comes from the Doctors/Instructors sheet data
  const instructorIdMap = new Map();
  for (const row of instructorRows) {
    const instructorId = row['Instructor_ID'] || row['Instructor ID'] || row.instructor_id || row.instructorId;
    const name = row.Name || row.name || row['Instructor Name'] || row['Instructor_Name'] || 
                 row['Instructor_Name'] || row['Doctor Name'] || row['Doctor_Name'];
    if (instructorId && name) {
      const idKey = String(instructorId).trim();
      if (!instructorIdMap.has(idKey)) {
        instructorIdMap.set(idKey, name.trim());
      }
    }
  }
  
  if (instructorIdMap.size > 0) {
    console.log(`📋 Built Instructor_ID mapping with ${instructorIdMap.size} entries from Doctors sheet`);
  }

  if (courseRows.length > 0) {
    results.courses = await importCourses(courseRows, campusId, instructorIdMap);
  }

  results.unknown = unknownRows;

  // Calculate totals
  const totalSuccess = 
    results.students.success.length +
    results.physical.success.length +
    results.instructors.success.length +
    results.courses.success.length;

  const totalErrors = 
    results.students.errors.length +
    results.physical.errors.length +
    results.instructors.errors.length +
    results.courses.errors.length;

  return {
    ...results,
    summary: {
      total: data.length,
      successful: totalSuccess,
      errors: totalErrors,
      unknown: unknownRows.length,
      breakdown: {
        students: { total: results.students.total, successful: results.students.success.length, errors: results.students.errors.length },
        physical: { total: results.physical.total, successful: results.physical.success.length, errors: results.physical.errors.length },
        instructors: { total: results.instructors.total, successful: results.instructors.success.length, errors: results.instructors.errors.length },
        courses: { total: results.courses.total, successful: results.courses.success.length, errors: results.courses.errors.length }
      }
    }
  };
};

module.exports = {
  parseExcelToJSON,
  importStudentGroups,
  importPhysicalResources,
  importInstructors,
  importCourses,
  importAllData
};

