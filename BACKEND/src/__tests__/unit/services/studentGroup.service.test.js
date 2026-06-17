jest.mock('../../../config/db', () => ({
  prisma: {
    department: {
      findUnique: jest.fn(),
    },
    studentGroup: {
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
  createStudentGroup,
  getAllStudentGroups,
  getStudentGroupById,
  updateStudentGroup,
  deleteStudentGroup,
} = require('../../../services/studentGroup.service');

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  console.warn.mockRestore();
});

describe('studentGroup.service', () => {
  describe('createStudentGroup', () => {
    test('throws for invalid name', async () => {
      await expect(createStudentGroup('', 1, 30, 'dept-1')).rejects.toThrow('Student group name is required');
      expect(prisma.studentGroup.create).not.toHaveBeenCalled();
    });

    test('throws when department is not found', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      await expect(createStudentGroup('G1', 1, 30, 'dept-1')).rejects.toThrow('Department with ID dept-1 not found');
      expect(prisma.studentGroup.create).not.toHaveBeenCalled();
    });

    test('creates a validated student group with department relation', async () => {
      prisma.department.findUnique.mockResolvedValue({ id: 'dept-1' });
      const mockGroup = { id: 'group-1', name: 'G1', departmentId: 'dept-1' };
      prisma.studentGroup.create.mockResolvedValue(mockGroup);

      const result = await createStudentGroup(' G1 ', 1, 30, 'dept-1');

      expect(prisma.studentGroup.create).toHaveBeenCalledWith({
        data: { name: 'G1', year: 1, studentCount: 30, departmentId: 'dept-1' },
        include: {
          department: {
            include: { college: true },
          },
        },
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('getAllStudentGroups', () => {
    test('filters out groups missing department relation', async () => {
      const validGroup = { id: 'group-1', department: { id: 'dept-1' } };
      prisma.studentGroup.findMany.mockResolvedValue([validGroup, { id: 'group-2', department: null }]);

      const result = await getAllStudentGroups();

      expect(prisma.studentGroup.findMany).toHaveBeenCalledWith({
        include: {
          department: {
            include: { college: true },
          },
        },
        orderBy: [{ year: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual([validGroup]);
    });
  });

  describe('getStudentGroupById', () => {
    test('throws when id is missing', async () => {
      await expect(getStudentGroupById()).rejects.toThrow('Student group ID is required');
    });

    test('throws when group is not found', async () => {
      prisma.studentGroup.findUnique.mockResolvedValue(null);

      await expect(getStudentGroupById('missing')).rejects.toThrow('Student group with ID missing not found');
    });

    test('returns a group with department and college', async () => {
      const mockGroup = { id: 'group-1', department: { id: 'dept-1', college: {} } };
      prisma.studentGroup.findUnique.mockResolvedValue(mockGroup);

      const result = await getStudentGroupById('group-1');

      expect(prisma.studentGroup.findUnique).toHaveBeenCalledWith({
        where: { id: 'group-1' },
        include: {
          department: {
            include: { college: true },
          },
        },
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('updateStudentGroup', () => {
    test('updates a student group', async () => {
      const mockGroup = { id: 'group-1', name: 'G2' };
      prisma.studentGroup.update.mockResolvedValue(mockGroup);

      const result = await updateStudentGroup('group-1', 'G2', 2, 40);

      expect(prisma.studentGroup.update).toHaveBeenCalledWith({
        where: { id: 'group-1' },
        data: { name: 'G2', year: 2, studentCount: 40 },
      });
      expect(result).toEqual(mockGroup);
    });
  });

  describe('deleteStudentGroup', () => {
    test('deletes a student group', async () => {
      const mockGroup = { id: 'group-1' };
      prisma.studentGroup.delete.mockResolvedValue(mockGroup);

      const result = await deleteStudentGroup('group-1');

      expect(prisma.studentGroup.delete).toHaveBeenCalledWith({
        where: { id: 'group-1' },
      });
      expect(result).toEqual(mockGroup);
    });
  });
});
