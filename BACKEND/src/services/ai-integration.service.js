const fetch = require('node-fetch');
const { prisma } = require('../config/db');
const env = require('../config/env');

// Used to split a student group into sections when no rooms of the relevant
// type exist to derive a capacity from.
const DEFAULT_SECTION_SIZE = 25;

class AIIntegrationService {
  constructor() {
    this.aiApiUrl = env.AI_API_URL;
  }

  /**
   * Check if AI service is available
   * @returns {Promise<boolean>} True if service is healthy
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.aiApiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('AI service health check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate schedule using AI
   * @param {string} campusId - Campus ID to generate schedule for
   * @param {string} semester - Semester name (e.g., "Fall 2024")
   * @returns {Promise<Object>} Generated schedule with sessions
   */
  async generateSchedule(campusId, semester, scheduleType = 'all') {
    console.log('🔄 Starting AI schedule generation...');
    console.log('Campus:', campusId);
    console.log('Semester:', semester);
    console.log('Schedule type:', scheduleType);

    const includeLectures = scheduleType === 'lectures' || scheduleType === 'all';
    const includeSections = scheduleType === 'sections' || scheduleType === 'all';

    // 0. Check AI service health
    console.log('🏥 Checking AI service health...');
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('AI service is not available. Please ensure the AI service is running on ' + this.aiApiUrl);
    }
    console.log('✅ AI service is healthy');

    // 1. Fetch data from database (filtered by campus)
    console.log('📊 Fetching data from database...');
    const rooms = await this.fetchRooms(campusId);
    const courses = await this.fetchCourses(campusId);
    const instructors = await this.fetchInstructors(campusId);
    const divisions = await this.fetchDivisions(campusId);

    console.log(`Found: ${rooms.length} rooms, ${courses.length} courses, ${instructors.length} instructors, ${divisions.length} divisions`);

    // Validate that we have sufficient data for this campus
    const missingData = [];
    if (rooms.length === 0) missingData.push('classrooms');
    if (courses.length === 0) missingData.push('courses');
    if (instructors.length === 0) missingData.push('instructors');
    if (divisions.length === 0) missingData.push('student groups');

    if (missingData.length > 0) {
      const campus = await prisma.campus.findUnique({ where: { id: campusId } });
      const campusName = campus?.name || campusId;
      throw new Error(
        `Cannot generate schedule for "${campusName}": Missing ${missingData.join(', ')}. ` +
        `Please add the required data to this campus before generating a schedule.`
      );
    }

    // 2. Transform to AI format
    console.log('🔄 Transforming data for AI...');
    const aiData = {
      data: {
        rooms: rooms.map(r => this.transformRoomToAI(r)),
        courses: courses.map(c => this.transformCourseToAI(c)),
        doctors: instructors.flatMap(i => this.transformInstructorToAI(i)),
        divisions: divisions.map(d => this.transformDivisionToAI(d))
      },
      config: {
        time_limit_seconds: 300,
        max_days_per_year: 3,
        relax_if_infeasible: true
      }
    };

    // 3. Always run CP: lectures need it directly, sections need its slots as input
    console.log('🚀 Calling AI CP service at:', this.aiApiUrl);
    const response = await fetch(`${this.aiApiUrl}/cp/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(aiData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Service Error: ${response.status} - ${errorText}`);
    }

    const aiResult = await response.json();
    console.log('✅ CP returned', aiResult.total_assignments, 'lecture assignment(s)');

    // 4. Create a single Schedule record to hold lecture and/or section sessions
    const schedule = await prisma.schedule.create({
      data: {
        semester: semester,
        generatedBy: 'AI-CP'
      }
    });

    // 5. Save lecture sessions when requested
    if (includeLectures) {
      console.log('💾 Saving lecture sessions...');
      await this.saveLectureSessions(aiResult.schedule || [], schedule, campusId);
    }

    // 6. Generate and save section sessions when requested
    if (includeSections) {
      console.log('💾 Generating and saving section sessions...');
      const assistants = await this.fetchAssistants(campusId);
      const sectionRows = await this.generateSections(aiResult.schedule || [], {
        rooms,
        courses,
        divisions,
        instructors,
        assistants
      });
      await this.saveSectionsToDatabase(sectionRows, schedule, campusId);
    }

    console.log('🎉 Schedule generation completed!');
    return this.getCompleteSchedule(schedule.id);
  }

  /**
   * Fetch all classrooms for a campus
   */
  async fetchRooms(campusId) {
    return prisma.classroom.findMany({
      where: { campusId }
    });
  }

  /**
   * Fetch courses for a specific campus (via college relationship)
   * @param {string} campusId - Campus ID to filter courses by
   */
  async fetchCourses(campusId) {
    return prisma.course.findMany({
      where: {
        college: {
          campusId: campusId
        }
      },
      include: {
        department: true,
        college: true,
        instructor: true
      }
    });
  }

  /**
   * Fetch instructors for a specific campus (via department -> college relationship)
   * @param {string} campusId - Campus ID to filter instructors by
   */
  async fetchInstructors(campusId) {
    return prisma.instructor.findMany({
      where: {
        department: {
          college: {
            campusId: campusId
          }
        }
      },
      include: {
        department: true,
        availability: true
      }
    });
  }

  /**
   * Fetch student groups for a specific campus (via department -> college relationship)
   * @param {string} campusId - Campus ID to filter student groups by
   */
  async fetchDivisions(campusId) {
    return prisma.studentGroup.findMany({
      where: {
        department: {
          college: {
            campusId: campusId
          }
        }
      },
      include: {
        department: true
      }
    });
  }

  /**
   * Fetch teaching assistants (TAs) for a specific campus (via department -> college relationship).
   * TAs map to the AI "assistants" pool used for section scheduling.
   * @param {string} campusId - Campus ID to filter TAs by
   */
  async fetchAssistants(campusId) {
    return prisma.ta.findMany({
      where: {
        department: {
          college: {
            campusId: campusId
          }
        }
      },
      include: {
        department: true
      }
    });
  }

  /**
   * Transform Classroom to AI Room format
   */
  transformRoomToAI(classroom) {
    return {
      Room_ID: classroom.id,
      Room: classroom.name,
      Capacity: classroom.capacity,
      Type: classroom.type === 'LECTURE_HALL' ? 'Lecture' : 'Lab'
    };
  }

  /**
   * Transform Course to AI format
   */
  transformCourseToAI(course) {
    return {
      Course_ID: course.code.toLowerCase(),
      Course_Name: course.name,
      Department: course.department.code,
      Major: course.department.code,
      Days: course.days,
      Hours_per_day: course.hoursPerDay,
      Instructor_ID: course.instructorId || 'UNASSIGNED',
      Year: course.year,
      Type: course.type === 'THEORETICAL' ? 'Lecture' : 'Lab'
    };
  }

  /**
   * Transform an Instructor into one or more AI "doctor" availability rows.
   * The AI expects one row per (instructor, day) availability window.
   * Only APPROVED availability is respected; instructors without any approved
   * availability fall back to being broadly available on all working days.
   * @returns {Array<Object>} doctor rows
   */
  transformInstructorToAI(instructor) {
    const dayMap = {
      'SATURDAY': 'Saturday',
      'SUNDAY': 'Sunday',
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday',
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday'
    };
    const WORKING_DAYS = ['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

    const department = instructor.department?.code || '';

    const extractTime = (value, fallback) => {
      if (!value) return fallback;
      const date = new Date(value);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const approved = (instructor.availability || []).filter(
      slot => slot.status === 'APPROVED'
    );

    if (approved.length > 0) {
      return approved.map(slot => ({
        Instructor_ID: instructor.id,
        Instructor_Name: instructor.name,
        Department: department,
        Day: dayMap[slot.day] || 'Sunday',
        Start_Time: extractTime(slot.startTime, '09:00'),
        End_Time: extractTime(slot.endTime, '17:00')
      }));
    }

    // No approved availability: assume available across all working days
    return WORKING_DAYS.map(day => ({
      Instructor_ID: instructor.id,
      Instructor_Name: instructor.name,
      Department: department,
      Day: dayMap[day],
      Start_Time: '09:00',
      End_Time: '17:00'
    }));
  }

  /**
   * Transform StudentGroup to AI Division format
   */
  transformDivisionToAI(group) {
    return {
      Num_ID: group.name,
      Department: group.department.code,
      Major: group.department.code,
      Year: group.year,
      StudentNum: group.studentCount
    };
  }

  /**
   * Transform a TA to the AI "assistant" format.
   */
  transformAssistantToAI(ta) {
    return {
      Assistant_ID: ta.id,
      Assistant_Name: ta.name
    };
  }

  /**
   * Determine the section size (students per section) for a given classroom type.
   * Uses the minimum capacity among classrooms of that type so every section
   * fits any room of that type; falls back to DEFAULT_SECTION_SIZE when none exist.
   * @param {Array<Object>} classrooms - Classroom records (with type, capacity)
   * @param {string} classroomType - 'LAB' or 'LECTURE_HALL'
   * @returns {number}
   */
  getSectionSize(classrooms, classroomType) {
    const capacities = classrooms
      .filter(room => room.type === classroomType && room.capacity > 0)
      .map(room => room.capacity);

    if (capacities.length === 0) {
      return DEFAULT_SECTION_SIZE;
    }
    return Math.min(...capacities);
  }

  /**
   * Derive section definitions for the AI section scheduler.
   * Each course is matched to the student groups (divisions) of the same
   * department + year, and each group is split into ceil(studentCount / sectionSize)
   * sections. Instructor_Name is intentionally left empty so the AI auto-assigns
   * a TA from the assistants pool.
   * @param {Array<Object>} courses - Course records (with department)
   * @param {Array<Object>} divisions - StudentGroup records (with department)
   * @param {number} sectionSize - Students per section
   * @returns {Array<Object>} section input rows
   */
  buildSectionDefinitions(courses, divisions, sectionSize) {
    const size = sectionSize > 0 ? sectionSize : DEFAULT_SECTION_SIZE;
    const sections = [];

    for (const course of courses) {
      const matchingGroups = divisions.filter(
        group => group.departmentId === course.departmentId && group.year === course.year
      );

      for (const group of matchingGroups) {
        const studentCount = group.studentCount || 0;
        const numSections = Math.max(1, Math.ceil(studentCount / size));

        for (let n = 1; n <= numSections; n += 1) {
          sections.push({
            Course_Name: course.name,
            Major: course.department?.code || group.department?.code || '',
            Division: group.name,
            Section: `S-${String(n).padStart(2, '0')}`,
            Instructor_Name: ''
          });
        }
      }
    }

    return sections;
  }

  /**
   * Map a CP lecture schedule row (AI response, lowercase keys) to the
   * CPScheduleEntryInput shape expected by the section endpoint (capitalized keys).
   */
  mapCpRowToSectionInput(row) {
    return {
      Day: row.day || '',
      Course_Name: row.course_name || '',
      Start_Time: row.start_time || '',
      End_Time: row.end_time || '',
      Instructor_Name: row.instructor_name || '',
      Assistant_Name: '',
      Students: row.students ?? '',
      Room: row.room || '',
      Major: row.major || ''
    };
  }

  /**
   * POST a section-scheduling payload to the AI and return the section-only rows.
   * @param {Object} data - SectionDataInput payload
   * @returns {Promise<Array<Object>>} sections_schedule rows
   */
  async callSectionsEndpoint(data) {
    const response = await fetch(`${this.aiApiUrl}/sections/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI Section Service Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.sections_schedule || [];
  }

  /**
   * Generate section schedules. Because the AI section scheduler picks rooms
   * purely from the supplied rooms list (preferring "lab", else all rooms), we
   * make up to two calls so each course type lands in the right room type:
   *   - PRACTICAL courses + LAB rooms
   *   - THEORETICAL courses + LECTURE_HALL rooms
   * The section-only rows from both calls are merged and returned.
   * @param {Array<Object>} cpRows - CP lecture schedule rows (AI response shape)
   * @param {Object} sources - { rooms, courses, divisions, instructors, assistants }
   * @returns {Promise<Array<Object>>} merged section rows
   */
  async generateSections(cpRows, { rooms, courses, divisions, instructors, assistants }) {
    const cpScheduleInput = (cpRows || []).map(row => this.mapCpRowToSectionInput(row));
    const assistantsAI = assistants.map(a => this.transformAssistantToAI(a));
    const coursesAI = courses.map(c => this.transformCourseToAI(c));
    const doctorsAI = instructors.flatMap(i => this.transformInstructorToAI(i));
    const divisionsAI = divisions.map(d => this.transformDivisionToAI(d));

    const labRooms = rooms.filter(room => room.type === 'LAB');
    const lectureRooms = rooms.filter(room => room.type === 'LECTURE_HALL');

    const practicalCourses = courses.filter(course => course.type === 'PRACTICAL');
    const theoreticalCourses = courses.filter(course => course.type === 'THEORETICAL');

    const practicalSections = this.buildSectionDefinitions(
      practicalCourses,
      divisions,
      this.getSectionSize(rooms, 'LAB')
    );
    const theoreticalSections = this.buildSectionDefinitions(
      theoreticalCourses,
      divisions,
      this.getSectionSize(rooms, 'LECTURE_HALL')
    );

    const buildPayload = (roomSubset, sections) => ({
      cp_schedule: cpScheduleInput,
      rooms: roomSubset.map(room => this.transformRoomToAI(room)),
      sections,
      assistants: assistantsAI,
      divisions: divisionsAI,
      courses: coursesAI,
      doctors: doctorsAI
    });

    let sectionRows = [];

    // PRACTICAL sections -> LAB rooms (fall back to all rooms if no labs exist)
    if (practicalSections.length > 0) {
      console.log(`🧪 Generating ${practicalSections.length} practical section(s)...`);
      const roomSubset = labRooms.length > 0 ? labRooms : rooms;
      const rows = await this.callSectionsEndpoint(buildPayload(roomSubset, practicalSections));
      sectionRows = sectionRows.concat(rows);
    }

    // THEORETICAL sections -> LECTURE_HALL rooms (fall back to all rooms if none exist)
    if (theoreticalSections.length > 0) {
      console.log(`📖 Generating ${theoreticalSections.length} theoretical section(s)...`);
      const roomSubset = lectureRooms.length > 0 ? lectureRooms : rooms;
      const rows = await this.callSectionsEndpoint(buildPayload(roomSubset, theoreticalSections));
      sectionRows = sectionRows.concat(rows);
    }

    console.log(`✅ Section generation produced ${sectionRows.length} row(s)`);
    return sectionRows;
  }

  /**
   * Save AI-generated schedule to database
   */
  async saveScheduleToDatabase(aiResult, semester, campusId) {
    // Create Schedule record
    const schedule = await prisma.schedule.create({
      data: {
        semester: semester,
        generatedBy: 'AI-CP'
      }
    });

    const sessions = await this.saveLectureSessions(aiResult.schedule || [], schedule, campusId);

    return this.getCompleteSchedule(schedule.id, sessions.length);
  }

  /**
   * Create LECTURE Session records from CP lecture rows.
   * @param {Array<Object>} scheduleItems - CP lecture rows (AI response shape)
   * @param {Object} schedule - the Schedule record to attach sessions to
   * @param {string} campusId - Campus ID (to scope classroom lookups)
   * @returns {Promise<Array<Object>>} created lecture sessions
   */
  async saveLectureSessions(scheduleItems, schedule, campusId) {
    const sessions = [];
    for (const item of scheduleItems) {
      try {
        // Find course by name (extract course name without index)
        const courseName = item.course_name.split(' (')[0];
        const course = await prisma.course.findFirst({
          where: {
            name: {
              contains: courseName
            }
          },
          include: {
            instructor: true // Include instructor relation for fallback
          }
        });

        // Find instructor by name - try multiple strategies
        // Clean the instructor name (remove common prefixes/suffixes)
        const cleanInstructorName = item.instructor_name
          .replace(/^(Dr\.|Dr|Prof\.|Prof|Mr\.|Mr|Mrs\.|Mrs|Ms\.|Ms)\s+/i, '')
          .trim();

        // First try to find in User table (for sessions) - exact match
        let instructor = await prisma.user.findFirst({
          where: {
            name: {
              equals: item.instructor_name,
              mode: 'insensitive'
            },
            roles: {
              has: 'INSTRUCTOR'
            }
          }
        });

        // If not found, try with cleaned name
        if (!instructor) {
          instructor = await prisma.user.findFirst({
            where: {
              name: {
                equals: cleanInstructorName,
                mode: 'insensitive'
              },
              roles: {
                has: 'INSTRUCTOR'
              }
            }
          });
        }

        // If not found, try partial match with original name
        if (!instructor) {
          instructor = await prisma.user.findFirst({
            where: {
              name: {
                contains: item.instructor_name,
                mode: 'insensitive'
              },
              roles: {
                has: 'INSTRUCTOR'
              }
            }
          });
        }

        // If still not found, try partial match with cleaned name
        if (!instructor) {
          instructor = await prisma.user.findFirst({
            where: {
              name: {
                contains: cleanInstructorName,
                mode: 'insensitive'
              },
              roles: {
                has: 'INSTRUCTOR'
              }
            }
          });
        }

        // If still not found, try to find Instructor record first, then match User
        if (!instructor) {
          const instructorRecord = await prisma.instructor.findFirst({
            where: {
              OR: [
                { name: { equals: item.instructor_name, mode: 'insensitive' } },
                { name: { equals: cleanInstructorName, mode: 'insensitive' } },
                { name: { contains: item.instructor_name, mode: 'insensitive' } },
                { name: { contains: cleanInstructorName, mode: 'insensitive' } }
              ]
            }
          });

          if (instructorRecord) {
            // Try to find User by matching instructor name (exact)
            instructor = await prisma.user.findFirst({
              where: {
                name: {
                  equals: instructorRecord.name,
                  mode: 'insensitive'
                },
                roles: {
                  has: 'INSTRUCTOR'
                }
              }
            });

            // If still not found, try partial match
            if (!instructor) {
              instructor = await prisma.user.findFirst({
                where: {
                  name: {
                    contains: instructorRecord.name,
                    mode: 'insensitive'
                  },
                  roles: {
                    has: 'INSTRUCTOR'
                  }
                }
              });
            }
          }
        }

        // Log warning if instructor not found
        if (!instructor) {
          console.warn(`⚠️ Instructor not found for: "${item.instructor_name}" (cleaned: "${cleanInstructorName}"). Session will be created without instructor assignment.`);
          console.warn(`   Course: ${item.course_name}, Room: ${item.room}`);
        } else {
          console.log(`✓ Found instructor: ${instructor.name} (ID: ${instructor.id}) for "${item.instructor_name}"`);
        }

        // Find classroom by name and campus
        const classroom = await prisma.classroom.findFirst({
          where: {
            name: item.room,
            campusId: campusId
          }
        });

        // Transform day
        const dayMap = {
          'Saturday': 'SATURDAY',
          'Sunday': 'SUNDAY',
          'Monday': 'MONDAY',
          'Tuesday': 'TUESDAY',
          'Wednesday': 'WEDNESDAY',
          'Thursday': 'THURSDAY'
        };

        // Parse time
        const startTime = this.parseTime(item.start_time);
        const endTime = this.parseTime(item.end_time);

        // Ensure courseId is set - it's required in the schema
        if (!course?.id) {
          console.warn(`⚠️ Course not found for: ${courseName}. Skipping session creation.`);
          continue;
        }

        // Fallback: If instructor not found by name, try to use course's assigned instructor
        if (!instructor && course.instructor) {
          // Try to find User by matching instructor name
          instructor = await prisma.user.findFirst({
            where: {
              name: {
                equals: course.instructor.name,
                mode: 'insensitive'
              },
              roles: {
                has: 'INSTRUCTOR'
              }
            }
          });

          if (instructor) {
            console.log(`✓ Using course's assigned instructor: ${instructor.name} for "${item.course_name}"`);
          } else if (course.instructor) {
            // Try partial match
            instructor = await prisma.user.findFirst({
              where: {
                name: {
                  contains: course.instructor.name,
                  mode: 'insensitive'
                },
                roles: {
                  has: 'INSTRUCTOR'
                }
              }
            });

            if (instructor) {
              console.log(`✓ Using course's assigned instructor (partial match): ${instructor.name} for "${item.course_name}"`);
            }
          }
        }

        const session = await prisma.session.create({
          data: {
            name: item.course_name,
            type: 'LECTURE',
            day: dayMap[item.day] || 'MONDAY',
            startTime: startTime,
            endTime: endTime,
            studentCount: item.students,
            courseId: course.id, // Now guaranteed to exist
            instructorId: instructor?.id,
            classroomId: classroom?.id,
            scheduleId: schedule.id
          }
        });

        sessions.push(session);
      } catch (error) {
        console.error('Error creating session:', error.message);
        // Continue with other sessions
      }
    }

    console.log(`✅ Created ${sessions.length} lecture sessions`);

    return sessions;
  }

  /**
   * Fetch a schedule with all of its sessions and related course/instructor/classroom data.
   * @param {string} scheduleId - Schedule ID
   * @param {number} [totalSessions] - optional explicit session count for the response
   * @returns {Promise<Object>} schedule with sessions and totalSessions
   */
  async getCompleteSchedule(scheduleId, totalSessions) {
    const completeSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        sessions: {
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
                year: true
              }
            },
            instructor: {
              select: {
                id: true,
                name: true
              }
            },
            classroom: {
              select: {
                id: true,
                name: true,
                capacity: true
              }
            }
          },
          orderBy: [
            { day: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    return {
      ...completeSchedule,
      totalSessions: totalSessions ?? completeSchedule?.sessions?.length ?? 0
    };
  }

  /**
   * Persist AI-generated section rows as Session(type=SECTION) records.
   * In a section row, `assistant_name` is the TA (section teacher) and
   * `instructor_name` is the course's doctor. We link the TA's User via
   * instructorId when available, and keep the TA name in the session name.
   * @param {Array<Object>} sectionRows - merged section rows from the AI
   * @param {Object} schedule - the Schedule record to attach sessions to
   * @param {string} campusId - Campus ID (to scope classroom/TA lookups)
   * @returns {Promise<Array<Object>>} created section sessions
   */
  async saveSectionsToDatabase(sectionRows, schedule, campusId) {
    const dayMap = {
      'Saturday': 'SATURDAY',
      'Sunday': 'SUNDAY',
      'Monday': 'MONDAY',
      'Tuesday': 'TUESDAY',
      'Wednesday': 'WEDNESDAY',
      'Thursday': 'THURSDAY'
    };

    const sessions = [];

    for (const item of sectionRows) {
      try {
        const courseName = (item.course_name || '').split(' (')[0].trim();
        if (!courseName) {
          continue;
        }

        const course = await prisma.course.findFirst({
          where: {
            name: { contains: courseName, mode: 'insensitive' }
          }
        });

        if (!course?.id) {
          console.warn(`⚠️ Section course not found for: "${item.course_name}". Skipping.`);
          continue;
        }

        // Resolve the assistant (TA) and, if linked, its User for instructorId
        let instructorId;
        const assistantName = (item.assistant_name || '').trim();
        if (assistantName) {
          const ta = await prisma.ta.findFirst({
            where: {
              name: { equals: assistantName, mode: 'insensitive' },
              department: { college: { campusId } }
            }
          });
          if (ta?.userId) {
            instructorId = ta.userId;
          }
        }

        // Find classroom by name and campus
        const classroom = item.room
          ? await prisma.classroom.findFirst({
            where: { name: item.room, campusId }
          })
          : null;

        const isUnassigned = !item.day || item.day === 'UNASSIGNED';
        const day = isUnassigned ? null : (dayMap[item.day] || null);
        const startTime = isUnassigned || !item.start_time ? null : this.parseTime(item.start_time);
        const endTime = isUnassigned || !item.end_time ? null : this.parseTime(item.end_time);

        const parsedStudents = Number.parseInt(item.students, 10);
        const studentCount = Number.isNaN(parsedStudents) ? 0 : parsedStudents;

        const sessionName = assistantName
          ? `${item.course_name} - ${assistantName}`
          : item.course_name;

        const session = await prisma.session.create({
          data: {
            name: sessionName,
            type: 'SECTION',
            day,
            startTime,
            endTime,
            studentCount,
            courseId: course.id,
            instructorId,
            classroomId: classroom?.id,
            scheduleId: schedule.id
          }
        });

        sessions.push(session);
      } catch (error) {
        console.error('Error creating section session:', error.message);
        // Continue with other sections
      }
    }

    console.log(`✅ Created ${sessions.length} section sessions`);
    return sessions;
  }

  /**
   * Parse time string to DateTime
   * @param {string} timeString - Time in format "9:00 AM" or "14:00"
   * @returns {Date}
   */
  parseTime(timeString) {
    const today = new Date();
    today.setSeconds(0);
    today.setMilliseconds(0);

    // Check if it's 12-hour format with AM/PM
    if (timeString.includes('AM') || timeString.includes('PM')) {
      const [time, period] = timeString.split(' ');
      const [hours, minutes] = time.split(':').map(Number);

      let hour = hours;
      if (period === 'PM' && hours !== 12) {
        hour = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour = 0;
      }

      today.setHours(hour, minutes);
    } else {
      // 24-hour format
      const [hours, minutes] = timeString.split(':').map(Number);
      today.setHours(hours, minutes);
    }

    return today;
  }
}

module.exports = { AIIntegrationService };
