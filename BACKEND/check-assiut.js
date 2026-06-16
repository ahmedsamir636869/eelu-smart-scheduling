const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const result = {};
  
  // Get all campuses
  const campuses = await prisma.campus.findMany({
    include: { colleges: true }
  });
  
  result.allCampuses = campuses.map(c => ({
    id: c.id,
    name: c.name,
    city: c.city,
    colleges: c.colleges.map(col => ({ id: col.id, name: col.name }))
  }));
  
  // Find Assiut
  const assiut = campuses.find(c => c.name.toLowerCase().includes('assiut'));
  
  if (!assiut) {
    result.error = "Assiut campus not found!";
    fs.writeFileSync('assiut-data.json', JSON.stringify(result, null, 2));
    return;
  }
  
  result.assiutId = assiut.id;
  result.assiutCollegeIds = assiut.colleges.map(c => c.id);
  
  // Get departments for Assiut colleges
  const departments = await prisma.department.findMany({
    where: {
      collegeId: { in: result.assiutCollegeIds }
    }
  });
  result.assiutDepartments = departments.map(d => ({ id: d.id, name: d.name, code: d.code, collegeId: d.collegeId }));
  result.assiutDepartmentIds = departments.map(d => d.id);
  
  // Check classrooms (by campusId)
  const rooms = await prisma.classroom.findMany({
    where: { campusId: assiut.id }
  });
  result.classrooms = rooms.length;
  result.classroomDetails = rooms.map(r => ({ id: r.id, name: r.name, type: r.type }));
  
  // Check courses (by collegeId)
  const courses = await prisma.course.findMany({
    where: { collegeId: { in: result.assiutCollegeIds } },
    include: { college: true, department: true }
  });
  result.courses = courses.length;
  result.courseDetails = courses.slice(0, 5).map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    collegeId: c.collegeId,
    collegeName: c.college?.name,
    departmentId: c.departmentId,
    departmentName: c.department?.name
  }));
  
  // Check instructors (by departmentId)
  const instructors = await prisma.instructor.findMany({
    where: { departmentId: { in: result.assiutDepartmentIds } },
    include: { department: true }
  });
  result.instructors = instructors.length;
  result.instructorDetails = instructors.slice(0, 5).map(i => ({
    id: i.id,
    name: i.name,
    departmentId: i.departmentId,
    departmentName: i.department?.name
  }));
  
  // Check student groups (by departmentId)
  const studentGroups = await prisma.studentGroup.findMany({
    where: { departmentId: { in: result.assiutDepartmentIds } },
    include: { department: { include: { college: true } } }
  });
  result.studentGroups = studentGroups.length;
  result.studentGroupDetails = studentGroups.slice(0, 5).map(sg => ({
    id: sg.id,
    name: sg.name,
    year: sg.year,
    departmentId: sg.departmentId,
    departmentName: sg.department?.name,
    collegeName: sg.department?.college?.name
  }));
  
  // Now check ALL courses, instructors, and student groups to see what's in the DB
  const allCourses = await prisma.course.findMany({ include: { college: true } });
  const allInstructors = await prisma.instructor.findMany({ include: { department: { include: { college: true } } } });
  const allStudentGroups = await prisma.studentGroup.findMany({ include: { department: { include: { college: true } } } });
  
  result.totalCourses = allCourses.length;
  result.totalInstructors = allInstructors.length;
  result.totalStudentGroups = allStudentGroups.length;
  
  // Show which colleges the data belongs to
  result.coursesByCollege = {};
  allCourses.forEach(c => {
    const key = c.college?.name || 'NULL';
    result.coursesByCollege[key] = (result.coursesByCollege[key] || 0) + 1;
  });
  
  result.instructorsByCollege = {};
  allInstructors.forEach(i => {
    const key = i.department?.college?.name || 'NULL';
    result.instructorsByCollege[key] = (result.instructorsByCollege[key] || 0) + 1;
  });
  
  result.studentGroupsByCollege = {};
  allStudentGroups.forEach(sg => {
    const key = sg.department?.college?.name || 'NULL';
    result.studentGroupsByCollege[key] = (result.studentGroupsByCollege[key] || 0) + 1;
  });
  
  // Summary
  result.summary = {
    forAssiut: {
      classrooms: result.classrooms,
      courses: result.courses,
      instructors: result.instructors,
      studentGroups: result.studentGroups
    },
    canGenerate: result.classrooms > 0 && result.courses > 0 && result.instructors > 0 && result.studentGroups > 0
  };
  
  fs.writeFileSync('assiut-data.json', JSON.stringify(result, null, 2));
  console.log('Results written to assiut-data.json');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
