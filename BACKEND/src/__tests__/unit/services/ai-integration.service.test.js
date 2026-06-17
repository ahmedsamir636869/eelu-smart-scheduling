jest.mock('node-fetch', () => jest.fn());

jest.mock('../../../config/env', () => ({
  AI_API_URL: 'http://ai.test',
}));

jest.mock('../../../config/db', () => ({
  prisma: {
    classroom: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    course: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    instructor: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    studentGroup: {
      findMany: jest.fn(),
    },
    campus: {
      findUnique: jest.fn(),
    },
    schedule: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  },
}));

const fetch = require('node-fetch');
const { prisma } = require('../../../config/db');
const { AIIntegrationService } = require('../../../services/ai-integration.service');

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.log.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
});

describe('AIIntegrationService', () => {
  let service;

  beforeEach(() => {
    service = new AIIntegrationService();
  });

  describe('checkHealth', () => {
    test('returns true when AI health endpoint responds ok', async () => {
      fetch.mockResolvedValue({ ok: true });

      const result = await service.checkHealth();

      expect(fetch).toHaveBeenCalledWith('http://ai.test/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toBe(true);
    });

    test('returns false when health request fails', async () => {
      fetch.mockRejectedValue(new Error('network down'));

      const result = await service.checkHealth();

      expect(result).toBe(false);
    });
  });

  describe('database fetch helpers', () => {
    test('fetchRooms fetches classrooms by campusId', async () => {
      prisma.classroom.findMany.mockResolvedValue([{ id: 'room-1' }]);

      const result = await service.fetchRooms('campus-1');

      expect(prisma.classroom.findMany).toHaveBeenCalledWith({
        where: { campusId: 'campus-1' },
      });
      expect(result).toEqual([{ id: 'room-1' }]);
    });

    test('fetchCourses fetches courses through college campus relation', async () => {
      prisma.course.findMany.mockResolvedValue([{ id: 'course-1' }]);

      await service.fetchCourses('campus-1');

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: {
          college: { campusId: 'campus-1' },
        },
        include: {
          department: true,
          college: true,
          instructor: true,
        },
      });
    });

    test('fetchInstructors fetches instructors through department college campus relation', async () => {
      prisma.instructor.findMany.mockResolvedValue([{ id: 'inst-1' }]);

      await service.fetchInstructors('campus-1');

      expect(prisma.instructor.findMany).toHaveBeenCalledWith({
        where: {
          department: {
            college: { campusId: 'campus-1' },
          },
        },
        include: { department: true },
      });
    });

    test('fetchDivisions fetches student groups through department college campus relation', async () => {
      prisma.studentGroup.findMany.mockResolvedValue([{ id: 'group-1' }]);

      await service.fetchDivisions('campus-1');

      expect(prisma.studentGroup.findMany).toHaveBeenCalledWith({
        where: {
          department: {
            college: { campusId: 'campus-1' },
          },
        },
        include: { department: true },
      });
    });
  });

  describe('transform helpers', () => {
    test('transforms database records to AI payload shapes', () => {
      const startTime = new Date('2026-06-17T08:30:00.000Z');
      const endTime = new Date('2026-06-17T10:00:00.000Z');

      expect(service.transformRoomToAI({ id: 'room-1', name: 'A101', capacity: 40, type: 'LECTURE_HALL' })).toEqual({
        Room_ID: 'room-1',
        Room: 'A101',
        Capacity: 40,
        Type: 'Lecture',
      });
      expect(
        service.transformCourseToAI({
          code: 'CS101',
          name: 'Algorithms',
          department: { code: 'CS' },
          days: 2,
          hoursPerDay: 2,
          instructorId: null,
          year: 2,
          type: 'PRACTICAL',
        })
      ).toEqual({
        Course_ID: 'cs101',
        Course_Name: 'Algorithms',
        Department: 'CS',
        Major: 'CS',
        Days: 2,
        Hours_per_day: 2,
        Instructor_ID: 'UNASSIGNED',
        Year: 2,
        Type: 'Lab',
      });
      expect(
        service.transformInstructorToAI({
          id: 'inst-1',
          name: 'Dr Ahmed',
          department: { code: 'CS' },
          day: 'MONDAY',
          startTime,
          endTime,
        })
      ).toEqual({
        Instructor_ID: 'inst-1',
        Instructor_Name: 'Dr Ahmed',
        Department: 'CS',
        Day: 'Monday',
        Start_Time: expect.stringMatching(/^\d{2}:30$/),
        End_Time: expect.stringMatching(/^\d{2}:00$/),
      });
      expect(
        service.transformDivisionToAI({
          name: 'G1',
          department: { code: 'CS' },
          year: 2,
          studentCount: 35,
        })
      ).toEqual({
        Num_ID: 'G1',
        Department: 'CS',
        Major: 'CS',
        Year: 2,
        StudentNum: 35,
      });
    });

    test('parseTime supports 12-hour and 24-hour inputs', () => {
      expect(service.parseTime('2:15 PM').getHours()).toBe(14);
      expect(service.parseTime('09:30').getHours()).toBe(9);
      expect(service.parseTime('09:30').getMinutes()).toBe(30);
    });
  });

  describe('generateSchedule', () => {
    test('throws when AI service is unavailable', async () => {
      jest.spyOn(service, 'checkHealth').mockResolvedValue(false);

      await expect(service.generateSchedule('campus-1', 'Fall 2026')).rejects.toThrow('AI service is not available');
    });

    test('throws with missing campus data details before calling AI generate endpoint', async () => {
      jest.spyOn(service, 'checkHealth').mockResolvedValue(true);
      jest.spyOn(service, 'fetchRooms').mockResolvedValue([]);
      jest.spyOn(service, 'fetchCourses').mockResolvedValue([]);
      jest.spyOn(service, 'fetchInstructors').mockResolvedValue([]);
      jest.spyOn(service, 'fetchDivisions').mockResolvedValue([]);
      prisma.campus.findUnique.mockResolvedValue({ id: 'campus-1', name: 'Main Campus' });

      await expect(service.generateSchedule('campus-1', 'Fall 2026')).rejects.toThrow(
        'Cannot generate schedule for "Main Campus": Missing classrooms, courses, instructors, student groups.'
      );
      expect(fetch).not.toHaveBeenCalledWith('http://ai.test/schedule/generate', expect.any(Object));
    });
  });

  describe('saveScheduleToDatabase', () => {
    test('creates schedule sessions and returns complete schedule with totalSessions', async () => {
      prisma.schedule.create.mockResolvedValue({ id: 'schedule-1' });
      prisma.course.findFirst.mockResolvedValue({ id: 'course-1', instructor: null });
      prisma.user.findFirst.mockResolvedValue({ id: 'user-1', name: 'Dr Ahmed' });
      prisma.classroom.findFirst.mockResolvedValue({ id: 'room-1' });
      prisma.session.create.mockResolvedValue({ id: 'session-1' });
      const completeSchedule = { id: 'schedule-1', sessions: [{ id: 'session-1' }] };
      prisma.schedule.findUnique.mockResolvedValue(completeSchedule);

      const result = await service.saveScheduleToDatabase(
        {
          schedule: [
            {
              course_name: 'Algorithms (1)',
              instructor_name: 'Dr Ahmed',
              room: 'A101',
              day: 'Monday',
              start_time: '09:00',
              end_time: '11:00',
              students: 35,
            },
          ],
        },
        'Fall 2026',
        'campus-1'
      );

      expect(prisma.schedule.create).toHaveBeenCalledWith({
        data: {
          semester: 'Fall 2026',
          generatedBy: 'AI-GA',
        },
      });
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          name: 'Algorithms (1)',
          type: 'LECTURE',
          day: 'MONDAY',
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          studentCount: 35,
          courseId: 'course-1',
          instructorId: 'user-1',
          classroomId: 'room-1',
          scheduleId: 'schedule-1',
        },
      });
      expect(prisma.schedule.findUnique).toHaveBeenCalledWith({
        where: { id: 'schedule-1' },
        include: {
          sessions: {
            include: {
              course: {
                select: { id: true, code: true, name: true, type: true, year: true },
              },
              instructor: {
                select: { id: true, name: true },
              },
              classroom: {
                select: { id: true, name: true, capacity: true },
              },
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
          },
        },
      });
      expect(result).toEqual({ ...completeSchedule, totalSessions: 1 });
    });
  });
});
