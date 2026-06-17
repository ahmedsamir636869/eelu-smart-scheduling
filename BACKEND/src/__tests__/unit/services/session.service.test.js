jest.mock('../../../config/db', () => ({
  prisma: {
    session: {
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
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
} = require('../../../services/session.service');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('session.service', () => {
  describe('createSession', () => {
    test('creates a session', async () => {
      const mockSession = { id: 'session-1', name: 'Lecture 1', courseId: 'course-1', type: 'LECTURE' };
      prisma.session.create.mockResolvedValue(mockSession);

      const result = await createSession('Lecture 1', 'course-1', 'LECTURE');

      expect(prisma.session.create).toHaveBeenCalledWith({
        data: { name: 'Lecture 1', courseId: 'course-1', type: 'LECTURE' },
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('getAllSessions', () => {
    test('fetches all sessions', async () => {
      const mockSessions = [{ id: 'session-1' }];
      prisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await getAllSessions();

      expect(prisma.session.findMany).toHaveBeenCalledWith();
      expect(result).toEqual(mockSessions);
    });
  });

  describe('getSessionById', () => {
    test('fetches a session by id', async () => {
      const mockSession = { id: 'session-1' };
      prisma.session.findUnique.mockResolvedValue(mockSession);

      const result = await getSessionById('session-1');

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('updateSession', () => {
    test('updates a session', async () => {
      const mockSession = { id: 'session-1', name: 'Updated', courseId: 'course-2', type: 'LAB' };
      prisma.session.update.mockResolvedValue(mockSession);

      const result = await updateSession('session-1', 'Updated', 'course-2', 'LAB');

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { name: 'Updated', courseId: 'course-2', type: 'LAB' },
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('deleteSession', () => {
    test('deletes a session by id', async () => {
      const mockSession = { id: 'session-1' };
      prisma.session.delete.mockResolvedValue(mockSession);

      const result = await deleteSession('session-1');

      expect(prisma.session.delete).toHaveBeenCalledWith({
        where: { id: 'session-1' },
      });
      expect(result).toEqual(mockSession);
    });
  });
});
