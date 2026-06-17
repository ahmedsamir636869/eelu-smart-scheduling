jest.mock('../../../config/db', () => ({
  prisma: {
    campus: {
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
  createCampus,
  getAllCampuses,
  getCampusById,
  updateCampus,
  deleteCampus,
} = require('../../../services/campus.service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('campus.service', () => {
  describe('createCampus', () => {
    test('creates a campus with nested colleges when provided', async () => {
      const mockCampus = { id: 'campus-1', name: 'Main', colleges: [{ id: 'college-1', name: 'CS' }] };
      prisma.campus.create.mockResolvedValue(mockCampus);

      const result = await createCampus('Main', 'Cairo', ['CS']);

      expect(prisma.campus.create).toHaveBeenCalledWith({
        data: {
          name: 'Main',
          city: 'Cairo',
          colleges: { create: [{ name: 'CS' }] },
        },
        include: {
          colleges: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockCampus);
    });

    test('creates a campus without colleges when colleges is not provided', async () => {
      prisma.campus.create.mockResolvedValue({ id: 'campus-1' });

      await createCampus('Main', 'Cairo');

      expect(prisma.campus.create).toHaveBeenCalledWith({
        data: { name: 'Main', city: 'Cairo' },
        include: {
          colleges: { select: { id: true, name: true } },
        },
      });
    });
  });

  describe('getAllCampuses', () => {
    test('fetches campuses with college summaries', async () => {
      const mockCampuses = [{ id: 'campus-1', colleges: [] }];
      prisma.campus.findMany.mockResolvedValue(mockCampuses);

      const result = await getAllCampuses();

      expect(prisma.campus.findMany).toHaveBeenCalledWith({
        include: {
          colleges: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockCampuses);
    });
  });

  describe('getCampusById', () => {
    test('throws when campusId is missing', async () => {
      await expect(getCampusById(undefined)).rejects.toThrow('Campus ID is required');
      expect(prisma.campus.findUnique).not.toHaveBeenCalled();
    });

    test('throws when campus is not found', async () => {
      prisma.campus.findUnique.mockResolvedValue(null);

      await expect(getCampusById('missing')).rejects.toThrow('Campus with ID missing not found');
    });

    test('returns campus with colleges', async () => {
      const mockCampus = { id: 'campus-1', colleges: [] };
      prisma.campus.findUnique.mockResolvedValue(mockCampus);

      const result = await getCampusById('campus-1');

      expect(prisma.campus.findUnique).toHaveBeenCalledWith({
        where: { id: 'campus-1' },
        include: {
          colleges: { select: { id: true, name: true } },
        },
      });
      expect(result).toEqual(mockCampus);
    });
  });

  describe('updateCampus', () => {
    test('updates campus fields', async () => {
      const mockCampus = { id: 'campus-1', name: 'New', city: 'Giza' };
      prisma.campus.update.mockResolvedValue(mockCampus);

      const result = await updateCampus('campus-1', 'New', 'Giza');

      expect(prisma.campus.update).toHaveBeenCalledWith({
        where: { id: 'campus-1' },
        data: { name: 'New', city: 'Giza' },
      });
      expect(result).toEqual(mockCampus);
    });
  });

  describe('deleteCampus', () => {
    test('throws when campus does not exist', async () => {
      prisma.campus.findUnique.mockResolvedValue(null);

      await expect(deleteCampus('missing')).rejects.toThrow('Campus with ID missing not found');
      expect(prisma.campus.delete).not.toHaveBeenCalled();
    });

    test('throws when campus has classrooms', async () => {
      prisma.campus.findUnique.mockResolvedValue({
        id: 'campus-1',
        name: 'Main',
        classrooms: [{ id: 'room-1', name: 'A101' }],
        colleges: [],
      });

      await expect(deleteCampus('campus-1')).rejects.toThrow('Cannot delete campus "Main"');
      expect(prisma.campus.delete).not.toHaveBeenCalled();
    });

    test('deletes campus when it has no blocking classrooms', async () => {
      const mockCampus = { id: 'campus-1', name: 'Main', classrooms: [], colleges: [] };
      prisma.campus.findUnique.mockResolvedValue(mockCampus);
      prisma.campus.delete.mockResolvedValue(mockCampus);

      const result = await deleteCampus('campus-1');

      expect(prisma.campus.delete).toHaveBeenCalledWith({
        where: { id: 'campus-1' },
      });
      expect(result).toEqual(mockCampus);
    });
  });
});
