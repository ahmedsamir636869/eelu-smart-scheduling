jest.mock('../../../config/db', () => ({
  prisma: {
    campus: {
      findUnique: jest.fn(),
    },
    classroom: {
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
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
} = require('../../../services/classroom.service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('classroom.service', () => {
  describe('createClassroom', () => {
    test('throws when campus is not found', async () => {
      prisma.campus.findUnique.mockResolvedValue(null);

      await expect(createClassroom('A101', 40, 'LECTURE_HALL', 'Main')).rejects.toThrow('Campus "Main" not found');
      expect(prisma.classroom.create).not.toHaveBeenCalled();
    });

    test('creates a classroom for the resolved campus', async () => {
      prisma.campus.findUnique.mockResolvedValue({ id: 'campus-1', name: 'Main' });
      const mockClassroom = { id: 'room-1', name: 'A101', campusId: 'campus-1' };
      prisma.classroom.create.mockResolvedValue(mockClassroom);

      const result = await createClassroom('A101', 40, 'LECTURE_HALL', 'Main');

      expect(prisma.campus.findUnique).toHaveBeenCalledWith({ where: { name: 'Main' } });
      expect(prisma.classroom.create).toHaveBeenCalledWith({
        data: { name: 'A101', capacity: 40, type: 'LECTURE_HALL', campusId: 'campus-1' },
      });
      expect(result).toEqual(mockClassroom);
    });
  });

  describe('getAllClassrooms', () => {
    test('throws when campus name is missing', async () => {
      await expect(getAllClassrooms()).rejects.toThrow('Campus name is required to fetch classrooms');
    });

    test('fetches classrooms for the resolved campus', async () => {
      prisma.campus.findUnique.mockResolvedValue({ id: 'campus-1', name: 'Main' });
      const mockClassrooms = [{ id: 'room-1' }];
      prisma.classroom.findMany.mockResolvedValue(mockClassrooms);

      const result = await getAllClassrooms('Main');

      expect(prisma.classroom.findMany).toHaveBeenCalledWith({
        where: { campusId: 'campus-1' },
      });
      expect(result).toEqual(mockClassrooms);
    });
  });

  describe('getClassroomById', () => {
    test('fetches a classroom by id', async () => {
      const mockClassroom = { id: 'room-1' };
      prisma.classroom.findUnique.mockResolvedValue(mockClassroom);

      const result = await getClassroomById('room-1');

      expect(prisma.classroom.findUnique).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
      expect(result).toEqual(mockClassroom);
    });
  });

  describe('updateClassroom', () => {
    test('throws when target classroom does not exist', async () => {
      prisma.classroom.findUnique.mockResolvedValue(null);

      await expect(updateClassroom('missing', 'A102')).rejects.toThrow('Classroom with ID missing not found');
      expect(prisma.classroom.update).not.toHaveBeenCalled();
    });

    test('resolves campus name and updates provided fields', async () => {
      prisma.campus.findUnique.mockResolvedValue({ id: 'campus-2', name: 'New Campus' });
      prisma.classroom.findUnique.mockResolvedValue({ id: 'room-1' });
      const mockClassroom = { id: 'room-1', name: 'A102', campusId: 'campus-2' };
      prisma.classroom.update.mockResolvedValue(mockClassroom);

      const result = await updateClassroom('room-1', 'A102', 50, 'LAB', 'New Campus');

      expect(prisma.classroom.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: { name: 'A102', capacity: 50, type: 'LAB', campusId: 'campus-2' },
      });
      expect(result).toEqual(mockClassroom);
    });
  });

  describe('deleteClassroom', () => {
    test('throws when classroom does not exist', async () => {
      prisma.classroom.findUnique.mockResolvedValue(null);

      await expect(deleteClassroom('missing')).rejects.toThrow('Classroom with ID missing not found');
      expect(prisma.classroom.delete).not.toHaveBeenCalled();
    });

    test('deletes an existing classroom', async () => {
      const mockClassroom = { id: 'room-1' };
      prisma.classroom.findUnique.mockResolvedValue(mockClassroom);
      prisma.classroom.delete.mockResolvedValue(mockClassroom);

      const result = await deleteClassroom('room-1');

      expect(prisma.classroom.delete).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
      expect(result).toEqual(mockClassroom);
    });
  });
});
