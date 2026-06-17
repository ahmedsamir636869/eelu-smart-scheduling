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
    ta: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
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
        include: { department: true, availability: true },
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

    test('fetchAssistants fetches TAs through department college campus relation', async () => {
      prisma.ta.findMany.mockResolvedValue([{ id: 'ta-1' }]);

      await service.fetchAssistants('campus-1');

      expect(prisma.ta.findMany).toHaveBeenCalledWith({
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
          availability: [
            { day: 'MONDAY', startTime, endTime, status: 'APPROVED' },
          ],
        })
      ).toEqual([
        {
          Instructor_ID: 'inst-1',
          Instructor_Name: 'Dr Ahmed',
          Department: 'CS',
          Day: 'Monday',
          Start_Time: expect.stringMatching(/^\d{2}:30$/),
          End_Time: expect.stringMatching(/^\d{2}:00$/),
        },
      ]);
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

    test('transformInstructorToAI emits one row per approved availability and ignores non-approved', () => {
      const startTime = new Date('2026-06-17T08:00:00.000Z');
      const endTime = new Date('2026-06-17T12:00:00.000Z');

      const rows = service.transformInstructorToAI({
        id: 'inst-2',
        name: 'Dr Sara',
        department: { code: 'IT' },
        availability: [
          { day: 'SUNDAY', startTime, endTime, status: 'APPROVED' },
          { day: 'TUESDAY', startTime, endTime, status: 'APPROVED' },
          { day: 'MONDAY', startTime, endTime, status: 'PENDING' },
        ],
      });

      expect(rows).toHaveLength(2);
      expect(rows.map(r => r.Day)).toEqual(['Sunday', 'Tuesday']);
      expect(rows.every(r => r.Instructor_ID === 'inst-2' && r.Department === 'IT')).toBe(true);
    });

    test('transformInstructorToAI falls back to all working days when no approved availability', () => {
      const rows = service.transformInstructorToAI({
        id: 'inst-3',
        name: 'Dr Omar',
        department: { code: 'CS' },
        availability: [],
      });

      expect(rows.map(r => r.Day)).toEqual([
        'Saturday',
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
      ]);
      expect(rows.every(r => r.Start_Time === '09:00' && r.End_Time === '17:00')).toBe(true);
    });

    test('transformAssistantToAI maps TA to assistant shape', () => {
      expect(service.transformAssistantToAI({ id: 'ta-1', name: 'Eng Mona' })).toEqual({
        Assistant_ID: 'ta-1',
        Assistant_Name: 'Eng Mona',
      });
    });

    test('parseTime supports 12-hour and 24-hour inputs', () => {
      expect(service.parseTime('2:15 PM').getHours()).toBe(14);
      expect(service.parseTime('09:30').getHours()).toBe(9);
      expect(service.parseTime('09:30').getMinutes()).toBe(30);
    });
  });

  describe('section derivation', () => {
    test('getSectionSize uses min capacity of the given classroom type', () => {
      const classrooms = [
        { type: 'LAB', capacity: 30 },
        { type: 'LAB', capacity: 20 },
        { type: 'LECTURE_HALL', capacity: 200 },
      ];

      expect(service.getSectionSize(classrooms, 'LAB')).toBe(20);
      expect(service.getSectionSize(classrooms, 'LECTURE_HALL')).toBe(200);
    });

    test('getSectionSize falls back to default when no rooms of the type exist', () => {
      expect(service.getSectionSize([{ type: 'LAB', capacity: 30 }], 'LECTURE_HALL')).toBe(25);
    });

    test('buildSectionDefinitions splits groups by capacity and matches department + year', () => {
      const courses = [
        { name: 'Physics Lab', departmentId: 'dep-1', year: 1, department: { code: 'PHY' } },
        { name: 'Other Dept', departmentId: 'dep-2', year: 1, department: { code: 'CS' } },
      ];
      const divisions = [
        { name: 'G1', departmentId: 'dep-1', year: 1, studentCount: 45, department: { code: 'PHY' } },
        { name: 'G2', departmentId: 'dep-1', year: 2, studentCount: 20, department: { code: 'PHY' } },
      ];

      const sections = service.buildSectionDefinitions(courses, divisions, 20);

      // Only G1 matches dep-1 + year 1; 45/20 -> ceil = 3 sections
      expect(sections).toEqual([
        { Course_Name: 'Physics Lab', Major: 'PHY', Division: 'G1', Section: 'S-01', Instructor_Name: '' },
        { Course_Name: 'Physics Lab', Major: 'PHY', Division: 'G1', Section: 'S-02', Instructor_Name: '' },
        { Course_Name: 'Physics Lab', Major: 'PHY', Division: 'G1', Section: 'S-03', Instructor_Name: '' },
      ]);
    });

    test('buildSectionDefinitions always emits at least one section per matching group', () => {
      const courses = [{ name: 'Seminar', departmentId: 'dep-1', year: 1, department: { code: 'CS' } }];
      const divisions = [
        { name: 'G1', departmentId: 'dep-1', year: 1, studentCount: 0, department: { code: 'CS' } },
      ];

      const sections = service.buildSectionDefinitions(courses, divisions, 25);

      expect(sections).toHaveLength(1);
      expect(sections[0].Section).toBe('S-01');
    });

    test('mapCpRowToSectionInput converts lowercase CP row to capitalized section input', () => {
      expect(
        service.mapCpRowToSectionInput({
          day: 'Sunday',
          course_name: 'Math',
          start_time: '9:00 AM',
          end_time: '11:00 AM',
          instructor_name: 'Dr X',
          students: 100,
          room: 'Hall 1',
          major: 'CS',
        })
      ).toEqual({
        Day: 'Sunday',
        Course_Name: 'Math',
        Start_Time: '9:00 AM',
        End_Time: '11:00 AM',
        Instructor_Name: 'Dr X',
        Assistant_Name: '',
        Students: 100,
        Room: 'Hall 1',
        Major: 'CS',
      });
    });
  });

  describe('generateSections', () => {
    const makeSources = () => ({
      rooms: [
        { id: 'lab-1', name: 'Lab 1', capacity: 20, type: 'LAB' },
        { id: 'hall-1', name: 'Hall 1', capacity: 100, type: 'LECTURE_HALL' },
      ],
      courses: [
        {
          code: 'CS1', name: 'Prog Lab', department: { code: 'CS' }, departmentId: 'dep-1',
          days: 1, hoursPerDay: 2, instructorId: null, year: 1, type: 'PRACTICAL',
        },
        {
          code: 'CS2', name: 'Math', department: { code: 'CS' }, departmentId: 'dep-1',
          days: 1, hoursPerDay: 2, instructorId: null, year: 1, type: 'THEORETICAL',
        },
      ],
      divisions: [
        { name: 'G1', departmentId: 'dep-1', year: 1, studentCount: 20, department: { code: 'CS' } },
      ],
      instructors: [],
      assistants: [{ id: 'ta-1', name: 'Eng A' }],
    });

    test('makes one call per non-empty course-type bucket and merges section rows', async () => {
      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ sections_schedule: [{ course_name: 'Prog Lab', room: 'Lab 1' }] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ sections_schedule: [{ course_name: 'Math', room: 'Hall 1' }] }) });

      const rows = await service.generateSections([], makeSources());

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenCalledWith('http://ai.test/sections/generate', expect.objectContaining({ method: 'POST' }));
      expect(rows).toEqual([
        { course_name: 'Prog Lab', room: 'Lab 1' },
        { course_name: 'Math', room: 'Hall 1' },
      ]);
    });

    test('skips a bucket with no sections', async () => {
      const sources = makeSources();
      sources.courses = sources.courses.filter(c => c.type === 'PRACTICAL'); // no theoretical
      fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sections_schedule: [{ course_name: 'Prog Lab' }] }) });

      const rows = await service.generateSections([], sources);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(rows).toEqual([{ course_name: 'Prog Lab' }]);
    });

    test('throws when the section endpoint returns an error', async () => {
      fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });

      await expect(service.generateSections([], makeSources())).rejects.toThrow('AI Section Service Error: 500 - boom');
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
      expect(fetch).not.toHaveBeenCalledWith('http://ai.test/cp/generate', expect.any(Object));
    });
  });

  describe('generateSchedule scheduleType orchestration', () => {
    const stubData = () => {
      jest.spyOn(service, 'checkHealth').mockResolvedValue(true);
      jest.spyOn(service, 'fetchRooms').mockResolvedValue([{ id: 'r', type: 'LAB', capacity: 20 }]);
      jest.spyOn(service, 'fetchCourses').mockResolvedValue([
        { code: 'c', name: 'C', department: { code: 'CS' }, departmentId: 'd', days: 1, hoursPerDay: 1, instructorId: null, year: 1, type: 'PRACTICAL' },
      ]);
      jest.spyOn(service, 'fetchInstructors').mockResolvedValue([
        { id: 'i', name: 'Dr', department: { code: 'CS' }, availability: [] },
      ]);
      jest.spyOn(service, 'fetchDivisions').mockResolvedValue([
        { name: 'G1', departmentId: 'd', year: 1, studentCount: 20, department: { code: 'CS' } },
      ]);
      jest.spyOn(service, 'fetchAssistants').mockResolvedValue([]);
      prisma.schedule.create.mockResolvedValue({ id: 'sch-1' });
      prisma.schedule.findUnique.mockResolvedValue({ id: 'sch-1', sessions: [] });
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          total_assignments: 1,
          schedule: [
            { day: 'Monday', course_name: 'C', instructor_name: 'Dr', room: 'r', start_time: '9:00 AM', end_time: '10:00 AM', students: 10, major: 'CS' },
          ],
        }),
      });
    };

    test('lectures: saves lectures and skips sections', async () => {
      stubData();
      const saveLec = jest.spyOn(service, 'saveLectureSessions').mockResolvedValue([]);
      const genSec = jest.spyOn(service, 'generateSections').mockResolvedValue([]);
      const saveSec = jest.spyOn(service, 'saveSectionsToDatabase').mockResolvedValue([]);

      await service.generateSchedule('campus-1', 'Fall', 'lectures');

      expect(saveLec).toHaveBeenCalled();
      expect(genSec).not.toHaveBeenCalled();
      expect(saveSec).not.toHaveBeenCalled();
    });

    test('sections: skips lectures and generates + saves sections', async () => {
      stubData();
      const saveLec = jest.spyOn(service, 'saveLectureSessions').mockResolvedValue([]);
      const genSec = jest.spyOn(service, 'generateSections').mockResolvedValue([{ course_name: 'C' }]);
      const saveSec = jest.spyOn(service, 'saveSectionsToDatabase').mockResolvedValue([{ id: 's' }]);

      await service.generateSchedule('campus-1', 'Fall', 'sections');

      expect(saveLec).not.toHaveBeenCalled();
      expect(genSec).toHaveBeenCalled();
      expect(saveSec).toHaveBeenCalledWith([{ course_name: 'C' }], { id: 'sch-1' }, 'campus-1');
    });

    test('all (default): saves lectures and sections under one schedule', async () => {
      stubData();
      const saveLec = jest.spyOn(service, 'saveLectureSessions').mockResolvedValue([{ id: 'l' }]);
      const genSec = jest.spyOn(service, 'generateSections').mockResolvedValue([{ course_name: 'C' }]);
      const saveSec = jest.spyOn(service, 'saveSectionsToDatabase').mockResolvedValue([{ id: 's' }]);

      await service.generateSchedule('campus-1', 'Fall');

      expect(prisma.schedule.create).toHaveBeenCalledTimes(1);
      expect(saveLec).toHaveBeenCalled();
      expect(genSec).toHaveBeenCalled();
      expect(saveSec).toHaveBeenCalled();
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
          generatedBy: 'AI-CP',
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

  describe('saveSectionsToDatabase', () => {
    test('creates SECTION sessions linking the TA user and classroom', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'course-1' });
      prisma.ta.findFirst.mockResolvedValue({ id: 'ta-1', name: 'Eng Mona', userId: 'user-9' });
      prisma.classroom.findFirst.mockResolvedValue({ id: 'lab-1' });
      prisma.session.create.mockResolvedValue({ id: 'sec-1' });

      const rows = [
        {
          day: 'Monday',
          course_name: 'Prog Lab',
          assistant_name: 'Eng Mona',
          instructor_name: 'Dr Ahmed',
          students: 20,
          room: 'Lab 1',
          start_time: '10:00 AM',
          end_time: '12:00 PM',
        },
      ];

      const result = await service.saveSectionsToDatabase(rows, { id: 'schedule-1' }, 'campus-1');

      expect(prisma.ta.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: 'Eng Mona', mode: 'insensitive' },
          department: { college: { campusId: 'campus-1' } },
        },
      });
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          name: 'Prog Lab - Eng Mona',
          type: 'SECTION',
          day: 'MONDAY',
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          studentCount: 20,
          courseId: 'course-1',
          instructorId: 'user-9',
          classroomId: 'lab-1',
          scheduleId: 'schedule-1',
        },
      });
      expect(result).toEqual([{ id: 'sec-1' }]);
    });

    test('handles UNASSIGNED rows with null day/time and missing TA user', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'course-2' });
      prisma.ta.findFirst.mockResolvedValue({ id: 'ta-2', name: 'Eng Sara', userId: null });
      prisma.classroom.findFirst.mockResolvedValue(null);
      prisma.session.create.mockResolvedValue({ id: 'sec-2' });

      const rows = [
        {
          day: 'UNASSIGNED',
          course_name: 'Physics Lab',
          assistant_name: 'Eng Sara',
          students: '',
          room: '',
          start_time: '',
          end_time: '',
        },
      ];

      await service.saveSectionsToDatabase(rows, { id: 'schedule-1' }, 'campus-1');

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          name: 'Physics Lab - Eng Sara',
          type: 'SECTION',
          day: null,
          startTime: null,
          endTime: null,
          studentCount: 0,
          courseId: 'course-2',
          instructorId: undefined,
          classroomId: undefined,
          scheduleId: 'schedule-1',
        },
      });
    });

    test('skips rows whose course cannot be found', async () => {
      prisma.course.findFirst.mockResolvedValue(null);

      const result = await service.saveSectionsToDatabase(
        [{ day: 'Monday', course_name: 'Unknown', assistant_name: 'X' }],
        { id: 'schedule-1' },
        'campus-1'
      );

      expect(prisma.session.create).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
