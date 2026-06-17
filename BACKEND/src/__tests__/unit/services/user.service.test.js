jest.mock('../../../config/db', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/hash.js', () => ({
  hashPassword: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  UserRole: {
    ADMIN: 'ADMIN',
    INSTRUCTOR: 'INSTRUCTOR',
    TA: 'TA',
    STUDENT: 'STUDENT',
  },
}));

const { prisma } = require('../../../config/db');
const { hashPassword } = require('../../../utils/hash.js');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
} = require('../../../services/user.service');

beforeEach(() => {
  jest.clearAllMocks();
  hashPassword.mockResolvedValue('hashed-password');
});

describe('user.service', () => {
  describe('createUser', () => {
    test('throws for invalid role', async () => {
      await expect(createUser('A', 'B', 'a@test.com', 'pass', 'INVALID')).rejects.toThrow(
        'Invalid or missing role provided: INVALID'
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    test('hashes password and creates a user', async () => {
      const mockUser = { id: 'user-1', email: 'a@test.com' };
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await createUser('Ahmed', 'Ali', 'a@test.com', 'plain', 'ADMIN', 'emp-1');

      expect(hashPassword).toHaveBeenCalledWith('plain');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'a@test.com',
          password: 'hashed-password',
          name: 'Ahmed Ali',
          roles: ['ADMIN'],
          employeeId: 'emp-1',
        },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllUsers', () => {
    test('fetches all users', async () => {
      const mockUsers = [{ id: 'user-1' }];
      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await getAllUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    test('fetches user by id', async () => {
      const mockUser = { id: 'user-1' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    test('throws for invalid role before updating', async () => {
      await expect(updateUser('user-1', undefined, undefined, undefined, undefined, 'INVALID')).rejects.toThrow(
        'Invalid role type provided: INVALID'
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    test('updates password, role, employeeId, and merged name', async () => {
      prisma.user.findUnique.mockResolvedValue({ name: 'Old Name' });
      const mockUser = { id: 'user-1', name: 'New Name' };
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await updateUser('user-1', 'New', undefined, 'new@test.com', 'new-pass', 'TA', 'emp-2');

      expect(hashPassword).toHaveBeenCalledWith('new-pass');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          email: 'new@test.com',
          password: 'hashed-password',
          roles: ['TA'],
          employeeId: 'emp-2',
          name: 'New Name',
        },
      });
      expect(result).toEqual(mockUser);
    });

    test('throws when updating name for missing user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(updateUser('missing', 'New')).rejects.toThrow('User not found to update name');
    });
  });

  describe('deleteUser', () => {
    test('deletes user by id', async () => {
      const mockUser = { id: 'user-1' };
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await deleteUser('user-1');

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    test('throws when email belongs to another user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'other-user' });

      await expect(updateProfile('user-1', { email: 'taken@test.com' })).rejects.toThrow(
        'Email is already in use by another user'
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    test('throws for short password', async () => {
      await expect(updateProfile('user-1', { password: '123' })).rejects.toThrow(
        'Password must be at least 6 characters'
      );
    });

    test('updates allowed profile fields and selects safe fields', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const mockUser = { id: 'user-1', name: 'Ahmed', emailVerified: false };
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await updateProfile('user-1', {
        name: 'Ahmed',
        email: 'new@test.com',
        password: 'secret1',
        isExpatriate: false,
      });

      expect(hashPassword).toHaveBeenCalledWith('secret1');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          name: 'Ahmed',
          email: 'new@test.com',
          emailVerified: false,
          password: 'hashed-password',
          isExpatriate: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          isExpatriate: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
