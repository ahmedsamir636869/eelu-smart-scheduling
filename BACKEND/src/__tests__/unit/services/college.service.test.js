jest.mock('../../../config/db', () => ({
  prisma: {
    college: {
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
  createCollege,
  getAllColleges,
  getCollegeById,
  updateCollege,
  deleteCollege,
} = require('../../../services/college.service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('college.service', () => {
  describe('createCollege', () => {
    test('creates a college with name and campusId', async () => {
      const mockCollege = { id: 'college-1', name: 'Computing', campusId: 'campus-1' };
      prisma.college.create.mockResolvedValue(mockCollege);

      const result = await createCollege('Computing', 'campus-1');

      expect(prisma.college.create).toHaveBeenCalledWith({
        data: { name: 'Computing', campusId: 'campus-1' },
      });
      expect(result).toEqual(mockCollege);
    });
  });

  describe('getAllColleges', () => {
    test('fetches colleges for a campus', async () => {
      const mockColleges = [{ id: 'college-1', campusId: 'campus-1' }];
      prisma.college.findMany.mockResolvedValue(mockColleges);

      const result = await getAllColleges('campus-1');

      expect(prisma.college.findMany).toHaveBeenCalledWith({
        where: { campusId: 'campus-1' },
      });
      expect(result).toEqual(mockColleges);
    });
  });

  describe('getCollegeById', () => {
    test('fetches a college by id', async () => {
      const mockCollege = { id: 'college-1', name: 'Computing' };
      prisma.college.findUnique.mockResolvedValue(mockCollege);

      const result = await getCollegeById('college-1');

      expect(prisma.college.findUnique).toHaveBeenCalledWith({
        where: { id: 'college-1' },
      });
      expect(result).toEqual(mockCollege);
    });
  });

  describe('updateCollege', () => {
    test('updates college fields', async () => {
      const mockCollege = { id: 'college-1', name: 'Engineering', campusId: 'campus-2' };
      prisma.college.update.mockResolvedValue(mockCollege);

      const result = await updateCollege('college-1', 'Engineering', 'campus-2');

      expect(prisma.college.update).toHaveBeenCalledWith({
        where: { id: 'college-1' },
        data: { name: 'Engineering', campusId: 'campus-2' },
      });
      expect(result).toEqual(mockCollege);
    });
  });

  describe('deleteCollege', () => {
    test('deletes a college by id', async () => {
      const mockCollege = { id: 'college-1' };
      prisma.college.delete.mockResolvedValue(mockCollege);

      const result = await deleteCollege('college-1');

      expect(prisma.college.delete).toHaveBeenCalledWith({
        where: { id: 'college-1' },
      });
      expect(result).toEqual(mockCollege);
    });
  });
});
