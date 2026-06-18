jest.mock('../../../config/db', () => ({
  prisma: {
    college: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    department: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    studentGroup: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    campus: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    classroom: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    instructor: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    instructorAvailability: {
      upsert: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-default-password'),
}));

const XLSX = require('xlsx');
const { prisma } = require('../../../config/db');
const {
  parseExcelToJSON,
  importStudentGroups,
  importPhysicalResources,
  importInstructors,
  importCourses,
  importAllData,
} = require('../../../services/import.service');

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

describe('import.service', () => {
  describe('parseExcelToJSON', () => {
    test('parses all workbook sheets and adds sheet names', () => {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Name: 'G1' }]), 'Divisions');
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([{ Name: 'A101' }]), 'Rooms');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = parseExcelToJSON(buffer);

      expect(result).toEqual([
        { Name: 'G1', _sheetName: 'Divisions' },
        { Name: 'A101', _sheetName: 'Rooms' },
      ]);
    });

    test('wraps parser failures with a readable error', () => {
      expect(() => parseExcelToJSON(null)).toThrow('Failed to parse Excel file:');
    });
  });

  describe('importStudentGroups', () => {
    test('records an error when name is missing', async () => {
      const rows = [{ Year: '1', StudentCount: '30', Department: 'CS' }];

      const result = await importStudentGroups(rows);

      expect(result).toEqual({
        success: [],
        errors: [{ row: rows[0], error: 'Missing required field: Name or Num_ID' }],
        total: 1,
      });
    });

    test('creates a student group when no existing group matches', async () => {
      const department = { id: 'dept-1', name: 'CS', collegeId: 'college-1', college: { name: 'Computing' } };
      prisma.department.findFirst.mockResolvedValue(department);
      prisma.studentGroup.findFirst.mockResolvedValue(null);
      const mockGroup = { id: 'group-1', name: 'G1' };
      prisma.studentGroup.create.mockResolvedValue(mockGroup);

      const result = await importStudentGroups([{ Name: 'G1', Year: '2', StudentCount: '35', Department: 'CS' }]);

      expect(prisma.studentGroup.create).toHaveBeenCalledWith({
        data: {
          name: 'G1',
          year: 2,
          studentCount: 35,
          departmentId: 'dept-1',
        },
      });
      expect(result.success).toEqual([{ action: 'created', group: mockGroup }]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('importPhysicalResources', () => {
    test('requires a campus when none can be inferred', async () => {
      prisma.campus.findMany.mockResolvedValue([]);
      const row = { Name: 'A101', Capacity: '40' };

      const result = await importPhysicalResources([row]);

      expect(result.success).toEqual([]);
      expect(result.errors[0]).toEqual({
        row,
        error: 'Campus ID is required for importing physical resources. Please provide campusId in the request or create a campus first.',
      });
    });

    test('creates a classroom for valid physical resource data', async () => {
      prisma.campus.findUnique.mockResolvedValue({ id: 'campus-1' });
      prisma.classroom.findFirst.mockResolvedValue(null);
      const mockClassroom = { id: 'room-1', name: 'A101' };
      prisma.classroom.create.mockResolvedValue(mockClassroom);

      const result = await importPhysicalResources([{ Name: 'A101', Capacity: '40', Type: 'Lab' }], 'campus-1');

      expect(prisma.classroom.create).toHaveBeenCalledWith({
        data: {
          name: 'A101',
          capacity: 40,
          type: 'LAB',
          campusId: 'campus-1',
        },
      });
      expect(result.success).toEqual([{ action: 'created', classroom: mockClassroom }]);
      expect(result.errors).toEqual([]);
    });
  });

  describe('importInstructors', () => {
    test('records an error when instructor identity is missing', async () => {
      const row = { Department: 'CS' };

      const result = await importInstructors([row]);

      expect(result.success).toEqual([]);
      expect(result.errors).toEqual([{ row, error: 'Missing required field: Name or Instructor_ID' }]);
    });

    test('creates instructor (by email) and records APPROVED availability', async () => {
      const department = { id: 'dept-1', name: 'CS', college: { name: 'Computing' } };
      prisma.department.findFirst.mockResolvedValue(department);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.instructor.findUnique.mockResolvedValue(null);
      const mockInstructor = { id: 'inst-1', name: 'Dr Ahmed' };
      prisma.instructor.create.mockResolvedValue(mockInstructor);
      prisma.instructorAvailability.upsert.mockResolvedValue({ id: 'avail-1' });

      const result = await importInstructors([
        {
          Name: 'Dr Ahmed',
          Email: 'dr@test.com',
          Department: 'CS',
          Day: 'Monday',
          Start_Time: '8:00 AM',
          End_Time: '10:00 AM',
        },
      ]);

      expect(prisma.instructor.create).toHaveBeenCalledWith({
        data: {
          name: 'Dr Ahmed',
          email: 'dr@test.com',
          userId: 'user-1',
          departmentId: 'dept-1',
        },
      });
      expect(prisma.instructorAvailability.upsert).toHaveBeenCalledWith({
        where: { instructorId_day: { instructorId: 'inst-1', day: 'MONDAY' } },
        update: { startTime: expect.any(Date), endTime: expect.any(Date), status: 'APPROVED' },
        create: {
          instructorId: 'inst-1',
          day: 'MONDAY',
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          status: 'APPROVED',
        },
      });
      expect(result.success[0]).toEqual({
        action: 'created',
        instructor: {
          id: 'inst-1',
          name: 'Dr Ahmed',
          department: 'CS',
          day: 'MONDAY',
          startTime: '8:00 AM',
          endTime: '10:00 AM',
        },
      });
    });

    test('reuses an existing user instead of creating a duplicate email', async () => {
      const department = { id: 'dept-1', name: 'CS', college: { name: 'Computing' } };
      prisma.department.findFirst.mockResolvedValue(department);
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
      prisma.instructor.findUnique.mockResolvedValue({ id: 'inst-1', userId: 'user-1' });
      prisma.instructor.update.mockResolvedValue({ id: 'inst-1', name: 'Dr Ahmed' });
      prisma.instructorAvailability.upsert.mockResolvedValue({ id: 'avail-1' });

      const result = await importInstructors([
        { Name: 'Dr Ahmed', Department: 'CS', Day: 'Tuesday', Start_Time: '9:00 AM', End_Time: '11:00 AM' },
      ]);

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.instructor.create).not.toHaveBeenCalled();
      expect(prisma.instructor.update).toHaveBeenCalled();
      expect(result.success[0].action).toBe('updated');
    });
  });

  describe('importCourses', () => {
    test('records an error when code or name is missing', async () => {
      const row = { Code: 'CS101' };

      const result = await importCourses([row]);

      expect(result.success).toEqual([]);
      expect(result.errors).toEqual([{ row, error: 'Missing required fields: Code and Name' }]);
    });

    test('creates a course and resolves instructor from the provided id map', async () => {
      const department = { id: 'dept-1', code: 'CS', collegeId: 'college-1', college: { name: 'Computing' } };
      prisma.department.findFirst.mockResolvedValue(department);
      prisma.instructor.findMany.mockResolvedValue([{ id: 'inst-1', name: 'Dr Ahmed' }]);
      prisma.course.findUnique.mockResolvedValue(null);
      const mockCourse = { id: 'course-1', code: 'CS101' };
      prisma.course.create.mockResolvedValue(mockCourse);

      const result = await importCourses(
        [
          {
            Course_ID: 'CS101',
            Course_Name: 'Algorithms',
            Type: 'Lecture',
            Days: '2',
            Hours_per_day: '2',
            Year: '2',
            Department: 'CS',
            Instructor_ID: 'I1',
          },
        ],
        undefined,
        new Map([['I1', 'Dr Ahmed']])
      );

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: {
          code: 'CS101',
          name: 'Algorithms',
          type: 'THEORETICAL',
          days: 2,
          hoursPerDay: 2,
          year: 2,
          departmentId: 'dept-1',
          collegeId: 'college-1',
          instructorId: 'inst-1',
        },
      });
      expect(result.success).toEqual([{ action: 'created', course: mockCourse }]);
    });
  });

  describe('importAllData', () => {
    test('classifies unknown rows and summarizes totals', async () => {
      const result = await importAllData([{ Foo: 'bar' }]);

      expect(result.unknown).toEqual([{ Foo: 'bar' }]);
      expect(result.summary).toEqual({
        total: 1,
        successful: 0,
        errors: 0,
        unknown: 1,
        breakdown: {
          students: { total: 0, successful: 0, errors: 0 },
          physical: { total: 0, successful: 0, errors: 0 },
          instructors: { total: 0, successful: 0, errors: 0 },
          courses: { total: 0, successful: 0, errors: 0 },
        },
      });
    });
  });
});
