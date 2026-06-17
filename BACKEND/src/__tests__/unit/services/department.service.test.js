jest.mock('../../../config/db.js', () => ({
  prisma: {
    department: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../config/db.js');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
} = require('../../../services/department.service.js');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('department.service', () => {
  describe('createDepartment', () => {
    test('creates a department with name, code, and collegeId', async () => {
      const mockDepartment = { id: 'dept-1', name: 'Computer Science', code: 'CS', collegeId: 'college-1' };
      prisma.department.create.mockResolvedValue(mockDepartment);

      const result = await createDepartment('Computer Science', 'CS', 'college-1');

      expect(prisma.department.create).toHaveBeenCalledWith({
        data: { name: 'Computer Science', code: 'CS', collegeId: 'college-1' },
      });
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('getAllDepartments', () => {
    test('fetches departments for a college', async () => {
      const mockDepartments = [{ id: 'dept-1', collegeId: 'college-1' }];
      prisma.department.findMany.mockResolvedValue(mockDepartments);

      const result = await getAllDepartments('college-1');

      expect(prisma.department.findMany).toHaveBeenCalledWith({
        where: { collegeId: 'college-1' },
      });
      expect(result).toEqual(mockDepartments);
    });
  });

  describe('getDepartmentById', () => {
    test('fetches a department by id', async () => {
      const mockDepartment = { id: 'dept-1', name: 'Computer Science' };
      prisma.department.findUnique.mockResolvedValue(mockDepartment);

      const result = await getDepartmentById('dept-1');

      expect(prisma.department.findUnique).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
      });
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('updateDepartment', () => {
    test('updates only fields that are provided', async () => {
      const mockDepartment = { id: 'dept-1', name: 'Software Engineering' };
      prisma.department.update.mockResolvedValue(mockDepartment);

      const result = await updateDepartment('dept-1', 'Software Engineering', undefined, undefined);

      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        data: { name: 'Software Engineering' },
      });
      expect(result).toEqual(mockDepartment);
    });

    test('includes empty string when explicitly provided', async () => {
      prisma.department.update.mockResolvedValue({ id: 'dept-1', code: '' });

      await updateDepartment('dept-1', undefined, '', 'college-2');

      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
        data: { code: '', collegeId: 'college-2' },
      });
    });
  });

  describe('deleteDepartment', () => {
    test('deletes a department by id', async () => {
      const mockDepartment = { id: 'dept-1' };
      prisma.department.delete.mockResolvedValue(mockDepartment);

      const result = await deleteDepartment('dept-1');

      expect(prisma.department.delete).toHaveBeenCalledWith({
        where: { id: 'dept-1' },
      });
      expect(result).toEqual(mockDepartment);
    });
  });
});
