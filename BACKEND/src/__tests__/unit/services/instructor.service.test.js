jest.mock('../../../config/db.js', () => ({
  prisma: {
    instructor: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    instructorAvailability: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../config/db.js');
const {
  createInstructor,
  getAllInstructors,
  getInstructorById,
  getInstructorByUserId,
  updateInstructor,
  deleteInstructor,
  submitAvailability,
  getMyAvailability,
  reviewAvailability,
} = require('../../../services/instructor.service.js');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('instructor.service', () => {
  describe('createInstructor', () => {
    test('creates an instructor', async () => {
      const mockInstructor = { id: 'inst-1', name: 'Dr Ahmed' };
      prisma.instructor.create.mockResolvedValue(mockInstructor);

      const result = await createInstructor('Dr Ahmed', 'ahmed@test.com', 'dept-1', 'PART_TIME');

      expect(prisma.instructor.create).toHaveBeenCalledWith({
        data: {
          name: 'Dr Ahmed',
          email: 'ahmed@test.com',
          departmentId: 'dept-1',
          employmentType: 'PART_TIME',
        },
      });
      expect(result).toEqual(mockInstructor);
    });
  });

  describe('getAllInstructors', () => {
    test('fetches instructors with courses and availability', async () => {
      const mockInstructors = [{ id: 'inst-1', assignedCourses: [], availability: [] }];
      prisma.instructor.findMany.mockResolvedValue(mockInstructors);

      const result = await getAllInstructors();

      expect(prisma.instructor.findMany).toHaveBeenCalledWith({
        include: {
          assignedCourses: {
            select: { id: true, name: true, code: true },
          },
          availability: true,
        },
      });
      expect(result).toEqual(mockInstructors);
    });
  });

  describe('getInstructorById', () => {
    test('fetches instructor with courses and availability', async () => {
      const mockInstructor = { id: 'inst-1', assignedCourses: [], availability: [] };
      prisma.instructor.findUnique.mockResolvedValue(mockInstructor);

      const result = await getInstructorById('inst-1');

      expect(prisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { id: 'inst-1' },
        include: {
          assignedCourses: {
            select: { id: true, name: true, code: true },
          },
          availability: true,
        },
      });
      expect(result).toEqual(mockInstructor);
    });
  });

  describe('getInstructorByUserId', () => {
    test('fetches instructor by userId', async () => {
      const mockInstructor = { id: 'inst-1', userId: 'user-1' };
      prisma.instructor.findUnique.mockResolvedValue(mockInstructor);

      const result = await getInstructorByUserId('user-1');

      expect(prisma.instructor.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toEqual(mockInstructor);
    });
  });

  describe('updateInstructor', () => {
    test('updates only truthy fields', async () => {
      const mockInstructor = { id: 'inst-1', name: 'Dr Sara' };
      prisma.instructor.update.mockResolvedValue(mockInstructor);

      const result = await updateInstructor('inst-1', 'Dr Sara', undefined, undefined);

      expect(prisma.instructor.update).toHaveBeenCalledWith({
        where: { id: 'inst-1' },
        data: { name: 'Dr Sara' },
      });
      expect(result).toEqual(mockInstructor);
    });
  });

  describe('deleteInstructor', () => {
    test('deletes instructor by id', async () => {
      const mockInstructor = { id: 'inst-1' };
      prisma.instructor.delete.mockResolvedValue(mockInstructor);

      const result = await deleteInstructor('inst-1');

      expect(prisma.instructor.delete).toHaveBeenCalledWith({
        where: { id: 'inst-1' },
      });
      expect(result).toEqual(mockInstructor);
    });
  });

  describe('submitAvailability', () => {
    test('throws when instructor is not found', async () => {
      prisma.instructor.findUnique.mockResolvedValue(null);

      await expect(submitAvailability('missing', [])).rejects.toThrow('Instructor not found');
      expect(prisma.instructorAvailability.upsert).not.toHaveBeenCalled();
    });

    test('throws for full-time instructors', async () => {
      prisma.instructor.findUnique.mockResolvedValue({ id: 'inst-1', employmentType: 'FULL_TIME' });

      await expect(submitAvailability('inst-1', [])).rejects.toThrow('Full-time instructors are not required to submit availability');
      expect(prisma.instructorAvailability.upsert).not.toHaveBeenCalled();
    });

    test('upserts availability slots as pending', async () => {
      prisma.instructor.findUnique.mockResolvedValue({ id: 'inst-1', employmentType: 'PART_TIME' });
      const slot = {
        day: 'MONDAY',
        startTime: '2026-06-17T08:00:00.000Z',
        endTime: '2026-06-17T10:00:00.000Z',
      };
      const mockAvailability = { id: 'avail-1', day: 'MONDAY' };
      prisma.instructorAvailability.upsert.mockResolvedValue(mockAvailability);

      const result = await submitAvailability('inst-1', [slot]);

      expect(prisma.instructorAvailability.upsert).toHaveBeenCalledWith({
        where: { instructorId_day: { instructorId: 'inst-1', day: 'MONDAY' } },
        update: {
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          status: 'PENDING',
        },
        create: {
          instructorId: 'inst-1',
          day: 'MONDAY',
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
          status: 'PENDING',
        },
      });
      expect(result).toEqual([mockAvailability]);
    });
  });

  describe('getMyAvailability', () => {
    test('fetches availability ordered by day', async () => {
      const mockSlots = [{ id: 'avail-1' }];
      prisma.instructorAvailability.findMany.mockResolvedValue(mockSlots);

      const result = await getMyAvailability('inst-1');

      expect(prisma.instructorAvailability.findMany).toHaveBeenCalledWith({
        where: { instructorId: 'inst-1' },
        orderBy: { day: 'asc' },
      });
      expect(result).toEqual(mockSlots);
    });
  });

  describe('reviewAvailability', () => {
    test('updates availability status', async () => {
      const mockAvailability = { id: 'avail-1', status: 'APPROVED' };
      prisma.instructorAvailability.update.mockResolvedValue(mockAvailability);

      const result = await reviewAvailability('avail-1', 'APPROVED');

      expect(prisma.instructorAvailability.update).toHaveBeenCalledWith({
        where: { id: 'avail-1' },
        data: { status: 'APPROVED' },
      });
      expect(result).toEqual(mockAvailability);
    });
  });
});
