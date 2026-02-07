const fetch = require('node-fetch');
const { prisma } = require('../config/db');
const env = require('../config/env');

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
  async generateSchedule(campusId, semester) {
    console.log('🔄 Starting AI schedule generation...');
    console.log('Campus:', campusId);
    console.log('Semester:', semester);

    // 0. Check AI service health
    console.log('🏥 Checking AI service health...');
    const isHealthy = await this.checkHealth();
    if (!isHealthy) {
      throw new Error('AI service is not available. Please ensure the AI service is running on ' + this.aiApiUrl);
    }
    console.log('✅ AI service is healthy');

    // 1. Fetch data from database
    console.log('📊 Fetching data from database...');
    const rooms = await this.fetchRooms(campusId);
    const courses = await this.fetchCourses();
    const instructors = await this.fetchInstructors();
    const divisions = await this.fetchDivisions();

    console.log(`Found: ${rooms.length} rooms, ${courses.length} courses, ${instructors.length} instructors, ${divisions.length} divisions`);

    // 2. Transform to AI format
    console.log('🔄 Transforming data for AI...');
    const aiData = {
      data: {
        rooms: rooms.map(r => this.transformRoomToAI(r)),
        courses: courses.map(c => this.transformCourseToAI(c)),
        doctors: instructors.map(i => this.transformInstructorToAI(i)),
        divisions: divisions.map(d => this.transformDivisionToAI(d))
      },
      config: {
        population_size: 50,
        generations: 100,
        mutation_rate: 0.15,
        crossover_rate: 0.8
      }
    };

    // 3. Call AI API
    console.log('🚀 Calling AI service at:', this.aiApiUrl);
    const response = await fetch(`${this.aiApiUrl}/schedule/generate`, {
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
    console.log('✅ AI returned schedule with', aiResult.total_assignments, 'sessions');

    // 4. Save to database
    console.log('💾 Saving schedule to database...');
    const schedule = await this.saveScheduleToDatabase(aiResult, semester, campusId);

    console.log('🎉 Schedule generation completed!');
    return schedule;
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
   * Fetch all courses with relations
   */
  async fetchCourses() {
    return prisma.course.findMany({
      include: {
        department: true,
        college: true,
        instructor: true
      }
    });
  }

  /**
   * Fetch all instructors with relations
   */
  async fetchInstructors() {
    return prisma.instructor.findMany({
      include: {
        department: true
      }
    });
  }

  /**
   * Fetch all student groups with relations
   */
  async fetchDivisions() {
    return prisma.studentGroup.findMany({
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
   * Transform Instructor to AI Doctor format
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

    // Extract time from DateTime
    let startTime = '09:00';
    let endTime = '17:00';

    if (instructor.startTime) {
      const date = new Date(instructor.startTime);
      startTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    if (instructor.endTime) {
      const date = new Date(instructor.endTime);
      endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    return {
      Instructor_ID: instructor.id,
      Instructor_Name: instructor.name,
      Department: instructor.department.code,
      Day: instructor.day ? dayMap[instructor.day] : 'Sunday',
      Start_Time: startTime,
      End_Time: endTime
    };
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
   * Save AI-generated schedule to database
   */
  async saveScheduleToDatabase(aiResult, semester, campusId) {
    // Create Schedule record
    const schedule = await prisma.schedule.create({
      data: {
        semester: semester,
        generatedBy: 'AI-GA'
      }
    });

    // Create Session records
    const sessions = [];
    for (const item of aiResult.schedule) {
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

    console.log(`✅ Created ${sessions.length} sessions`);

    // Fetch the complete schedule with all relations including course year
    const completeSchedule = await prisma.schedule.findUnique({
      where: { id: schedule.id },
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

    // Return schedule with sessions
    return {
      ...completeSchedule,
      totalSessions: sessions.length
    };
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
