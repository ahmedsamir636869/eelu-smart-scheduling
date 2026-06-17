jest.mock('../../../config/db.js', () => ({
    prisma: {
      tA: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      tAReport: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      tAOffDay: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
    },
  }));



const { prisma } = require('../../../config/db.js');
const {
    createTA,
    getAllTAs,
    getTAById,
    getTAByUserId,
    updateTA,
    deleteTA,
    submitReport,
    getMyReports,
    getAllReports,
    markReportRead,
    setOffDays,
    getOffDays,
} = require('../../../services/ta.service.js');

beforeEach(() => {
    jest.clearAllMocks();
});

describe('createTA', () => {
    test('calls prisma.tA.create with correct data and returns result', async () => {
    const mockTA = { id: 1, name: 'Ahmed', email: 'ahmed@test.com', departmentId: 2, isExpatriate: false };
    prisma.tA.create.mockResolvedValue(mockTA);

    const result = await createTA('Ahmed', 'ahmed@test.com', 2, false);

    expect(prisma.tA.create).toHaveBeenCalledWith({
        data: { name: 'Ahmed', email: 'ahmed@test.com', departmentId: 2, isExpatriate: false },
    });
    expect(result).toEqual(mockTA);
    });
});

describe('getTAById', () => {
    test('returns null when TA does not exist', async () => {
    prisma.tA.findUnique.mockResolvedValue(null);

      const result = await getTAById(999);
  
      expect(result).toBeNull();
    });
  
    test('fetches TA with department and courses included', async () => {
      const mockTA = { id: 1, name: 'Ahmed', department: { id: 2, name: 'CS' }, courses: [] };
      prisma.tA.findUnique.mockResolvedValue(mockTA);
  
      const result = await getTAById(1);
  
      expect(prisma.tA.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          department: { select: { id: true, name: true } },
          courses: { select: { id: true, name: true, code: true } },
        },
      });
      expect(result).toEqual(mockTA);
    });
  });
  
  describe('deleteTA', () => {
    test('deletes TA by id', async () => {
      const mockDeleted = { id: 5, name: 'Sara' };
      prisma.tA.delete.mockResolvedValue(mockDeleted);
  
      const result = await deleteTA(5);
  
      expect(prisma.tA.delete).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('updateTA', () => {
    test('updates all fields when all are provided', async () => {
      prisma.tA.update.mockResolvedValue({ id: 1, name: 'New Name', email: 'new@test.com', isExpatriate: true });
  
      await updateTA(1, 'New Name', 'new@test.com', true);
  
      expect(prisma.tA.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name', email: 'new@test.com', isExpatriate: true },
      });
    });
  
    test('only includes name when only name is provided', async () => {
      prisma.tA.update.mockResolvedValue({ id: 1, name: 'New Name' });
  
      await updateTA(1, 'New Name', undefined, undefined);
  
      expect(prisma.tA.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
    });
  
    test('includes isExpatriate when explicitly set to false', async () => {
      prisma.tA.update.mockResolvedValue({ id: 1, isExpatriate: false });
  
      await updateTA(1, undefined, undefined, false);
  
      expect(prisma.tA.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isExpatriate: false },
      });
    });
  
    test('sends empty data object when nothing is provided', async () => {
      prisma.tA.update.mockResolvedValue({ id: 1 });
  
      await updateTA(1, undefined, undefined, undefined);
  
      expect(prisma.tA.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {},
      });
    });
  });

  describe('getAllTAs', () => {
    test('fetches all TAs with department and courses included', async () => {
      const mockTAs = [
        { id: 1, name: 'Ahmed', department: { id: 2, name: 'CS' }, courses: [] },
        { id: 2, name: 'Sara', department: { id: 3, name: 'IT' }, courses: [] },
      ];
      prisma.tA.findMany.mockResolvedValue(mockTAs);
  
      const result = await getAllTAs();
  
      expect(prisma.tA.findMany).toHaveBeenCalledWith({
        include: {
          department: { select: { id: true, name: true } },
          courses: { select: { id: true, name: true, code: true } },
        },
      });
      expect(result).toEqual(mockTAs);
    });
  
    test('returns an empty array when there are no TAs', async () => {
      prisma.tA.findMany.mockResolvedValue([]);
  
      const result = await getAllTAs();
  
      expect(result).toEqual([]);
    });
  });
  
  describe('getTAByUserId', () => {
    test('returns the TA matching the given userId', async () => {
      const mockTA = { id: 1, userId: 42, name: 'Ahmed' };
      prisma.tA.findUnique.mockResolvedValue(mockTA);
  
      const result = await getTAByUserId(42);
  
      expect(prisma.tA.findUnique).toHaveBeenCalledWith({ where: { userId: 42 } });
      expect(result).toEqual(mockTA);
    });
  
    test('returns null when no TA matches the userId', async () => {
      prisma.tA.findUnique.mockResolvedValue(null);
  
      const result = await getTAByUserId(999);
  
      expect(result).toBeNull();
    });
  });
  
  describe('submitReport', () => {
    test('creates a report with the given taId, title, and content', async () => {
      const mockReport = { id: 1, taId: 5, title: 'Weekly Update', content: 'All good', status: 'UNREAD' };
      prisma.tAReport.create.mockResolvedValue(mockReport);
  
      const result = await submitReport(5, 'Weekly Update', 'All good');
  
      expect(prisma.tAReport.create).toHaveBeenCalledWith({
        data: { taId: 5, title: 'Weekly Update', content: 'All good' },
      });
      expect(result).toEqual(mockReport);
    });
  });
  
  describe('getMyReports', () => {
    test('fetches reports for a given taId ordered by most recent first', async () => {
      const mockReports = [
        { id: 2, taId: 5, title: 'Report B', createdAt: '2026-06-10' },
        { id: 1, taId: 5, title: 'Report A', createdAt: '2026-06-01' },
      ];
      prisma.tAReport.findMany.mockResolvedValue(mockReports);
  
      const result = await getMyReports(5);
  
      expect(prisma.tAReport.findMany).toHaveBeenCalledWith({
        where: { taId: 5 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockReports);
    });
  
    test('returns an empty array when the TA has no reports', async () => {
      prisma.tAReport.findMany.mockResolvedValue([]);
  
      const result = await getMyReports(5);
  
      expect(result).toEqual([]);
    });
  });
  
  describe('getAllReports', () => {
    test('fetches all reports including TA info, ordered by most recent first', async () => {
      const mockReports = [
        { id: 1, title: 'Report A', ta: { id: 5, name: 'Ahmed', email: 'ahmed@test.com' } },
      ];
      prisma.tAReport.findMany.mockResolvedValue(mockReports);
  
      const result = await getAllReports();
  
      expect(prisma.tAReport.findMany).toHaveBeenCalledWith({
        include: {
          ta: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockReports);
    });
  });
  
  describe('markReportRead', () => {
    test('updates the report status to READ', async () => {
      const mockUpdated = { id: 1, status: 'READ' };
      prisma.tAReport.update.mockResolvedValue(mockUpdated);
  
      const result = await markReportRead(1);
  
      expect(prisma.tAReport.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'READ' },
      });
      expect(result).toEqual(mockUpdated);
    });
  });
  
  describe('setOffDays', () => {
    test('throws an error when the TA does not exist', async () => {
      prisma.tA.findUnique.mockResolvedValue(null);
  
      await expect(setOffDays(999, ['MONDAY'])).rejects.toThrow('TA not found');
  
      expect(prisma.tAOffDay.deleteMany).not.toHaveBeenCalled();
      expect(prisma.tAOffDay.createMany).not.toHaveBeenCalled();
    });
  
    test('deletes existing off days and returns an empty array when days list is empty', async () => {
      prisma.tA.findUnique.mockResolvedValue({ id: 1 });
      prisma.tAOffDay.deleteMany.mockResolvedValue({ count: 2 });
  
      const result = await setOffDays(1, []);
  
      expect(prisma.tAOffDay.deleteMany).toHaveBeenCalledWith({ where: { taId: 1 } });
      expect(prisma.tAOffDay.createMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  
    test('replaces existing off days with the new set', async () => {
      prisma.tA.findUnique.mockResolvedValue({ id: 1 });
      prisma.tAOffDay.deleteMany.mockResolvedValue({ count: 1 });
      prisma.tAOffDay.createMany.mockResolvedValue({ count: 2 });
      const mockFinal = [
        { id: 1, taId: 1, day: 'MONDAY' },
        { id: 2, taId: 1, day: 'TUESDAY' },
      ];
      prisma.tAOffDay.findMany.mockResolvedValue(mockFinal);
  
      const result = await setOffDays(1, ['MONDAY', 'TUESDAY']);
  
      expect(prisma.tAOffDay.deleteMany).toHaveBeenCalledWith({ where: { taId: 1 } });
      expect(prisma.tAOffDay.createMany).toHaveBeenCalledWith({
        data: [
          { taId: 1, day: 'MONDAY' },
          { taId: 1, day: 'TUESDAY' },
        ],
      });
      expect(prisma.tAOffDay.findMany).toHaveBeenCalledWith({ where: { taId: 1 } });
      expect(result).toEqual(mockFinal);
    });
  });
  
  describe('getOffDays', () => {
    test('fetches off days for a TA ordered by day ascending', async () => {
      const mockDays = [
        { id: 1, taId: 1, day: 'MONDAY' },
        { id: 2, taId: 1, day: 'TUESDAY' },
      ];
      prisma.tAOffDay.findMany.mockResolvedValue(mockDays);
  
      const result = await getOffDays(1);
  
      expect(prisma.tAOffDay.findMany).toHaveBeenCalledWith({
        where: { taId: 1 },
        orderBy: { day: 'asc' },
      });
      expect(result).toEqual(mockDays);
    });
  
    test('returns an empty array when the TA has no off days set', async () => {
      prisma.tAOffDay.findMany.mockResolvedValue([]);
  
      const result = await getOffDays(1);
  
      expect(result).toEqual([]);
    });
  });