jest.mock('../../../config/db', () => ({
  prisma: {
    schedule: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require('../../../config/db');
const { getScheduleById, getAllSchedules } = require('../../../services/schedule.service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('schedule.service', () => {
  describe('getScheduleById', () => {
    test('fetches schedule with ordered sessions and related records', async () => {
      const mockSchedule = { id: 'schedule-1', sessions: [] };
      prisma.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await getScheduleById('schedule-1');

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
                select: { id: true, name: true },
              },
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
          },
        },
      });
      expect(result).toEqual(mockSchedule);
    });

    test('throws when schedule does not exist', async () => {
      prisma.schedule.findUnique.mockResolvedValue(null);

      await expect(getScheduleById('missing')).rejects.toThrow('Schedule not found');
    });
  });

  describe('getAllSchedules', () => {
    test('fetches schedules ordered by newest first', async () => {
      const mockSchedules = [{ id: 'schedule-2' }, { id: 'schedule-1' }];
      prisma.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await getAllSchedules();

      expect(prisma.schedule.findMany).toHaveBeenCalledWith({
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
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSchedules);
    });
  });
});
