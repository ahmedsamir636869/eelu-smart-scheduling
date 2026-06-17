jest.mock('../../../config/db', () => ({
  prisma: {
    course: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../config/db');
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../../../services/course.service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('course.service', () => {
  const courseData = {
    name: 'Algorithms',
    code: 'CS201',
    type: 'THEORETICAL',
    days: 2,
    hoursPerDay: 2,
    year: 2,
    departmentId: 'dept-1',
    collegeId: 'college-1',
    instructorId: 'inst-1',
  };

  describe('createCourse', () => {
    test('creates a course with provided instructorId', async () => {
      const mockCourse = { id: 'course-1', ...courseData };
      prisma.course.create.mockResolvedValue(mockCourse);

      const result = await createCourse(courseData);

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: courseData,
      });
      expect(result).toEqual(mockCourse);
    });

    test('uses null instructorId when one is not provided', async () => {
      prisma.course.create.mockResolvedValue({ id: 'course-1' });
      const dataWithoutInstructor = { ...courseData, instructorId: undefined };

      await createCourse(dataWithoutInstructor);

      expect(prisma.course.create).toHaveBeenCalledWith({
        data: { ...dataWithoutInstructor, instructorId: null },
      });
    });
  });

  describe('getAllCourses', () => {
    test('fetches all courses when collegeId is not provided', async () => {
      const mockCourses = [{ id: 'course-1' }];
      prisma.course.findMany.mockResolvedValue(mockCourses);

      const result = await getAllCourses();

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: undefined,
        include: {
          department: true,
          college: true,
          instructor: true,
        },
      });
      expect(result).toEqual(mockCourses);
    });

    test('filters courses by collegeId when provided', async () => {
      prisma.course.findMany.mockResolvedValue([]);

      await getAllCourses('college-1');

      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: { collegeId: 'college-1' },
        include: {
          department: true,
          college: true,
          instructor: true,
        },
      });
    });
  });

  describe('getCourseById', () => {
    test('fetches a course with relations', async () => {
      const mockCourse = { id: 'course-1', department: {}, college: {}, instructor: {} };
      prisma.course.findUnique.mockResolvedValue(mockCourse);

      const result = await getCourseById('course-1');

      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        include: {
          department: true,
          college: true,
          instructor: true,
        },
      });
      expect(result).toEqual(mockCourse);
    });
  });

  describe('updateCourse', () => {
    test('updates course fields', async () => {
      const mockCourse = { id: 'course-1', ...courseData };
      prisma.course.update.mockResolvedValue(mockCourse);

      const result = await updateCourse('course-1', courseData);

      expect(prisma.course.update).toHaveBeenCalledWith({
        where: { id: 'course-1' },
        data: courseData,
      });
      expect(result).toEqual(mockCourse);
    });
  });

  describe('deleteCourse', () => {
    test('deletes a course by id', async () => {
      const mockCourse = { id: 'course-1' };
      prisma.course.delete.mockResolvedValue(mockCourse);

      const result = await deleteCourse('course-1');

      expect(prisma.course.delete).toHaveBeenCalledWith({
        where: { id: 'course-1' },
      });
      expect(result).toEqual(mockCourse);
    });
  });
});
