jest.mock('../../../config/db.js', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    instructor: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tA: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/hash.js', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../../../utils/jwt.js', () => ({
  generateTokens: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../../../utils/mailer.js', () => ({
  sendEmail: jest.fn(),
}));

const { prisma } = require('../../../config/db.js');
const { hashPassword, comparePassword } = require('../../../utils/hash.js');
const { generateTokens, verifyRefreshToken } = require('../../../utils/jwt.js');
const { sendEmail } = require('../../../utils/mailer.js');
const { AuthService } = require('../../../services/auth.service.js');

beforeEach(() => {
  jest.clearAllMocks();
  hashPassword.mockResolvedValue('hashed-password');
  comparePassword.mockResolvedValue(true);
  generateTokens.mockReturnValue({ accessToken: 'access-token', refreshToken: 'refresh-token' });
  verifyRefreshToken.mockReturnValue({ userId: 'user-1' });
  sendEmail.mockResolvedValue(undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.warn.mockRestore();
});

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    test('creates user, links existing instructor and TA records, and sends verification email', async () => {
      const mockUser = { id: 'user-1', email: 'a@test.com', name: 'Ahmed' };
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.instructor.findUnique.mockResolvedValue({ id: 'inst-1', userId: null });
      prisma.tA.findUnique.mockResolvedValue({ id: 'ta-1', userId: null });

      const result = await authService.register('a@test.com', 'plain', 'Ahmed', 'INSTRUCTOR', false);

      expect(hashPassword).toHaveBeenCalledWith('plain');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'a@test.com',
          name: 'Ahmed',
          password: 'hashed-password',
          roles: ['INSTRUCTOR'],
          isExpatriate: false,
          emailVerificationOtp: expect.any(String),
          emailVerificationOtpExpires: expect.any(Date),
        },
      });
      expect(prisma.instructor.update).toHaveBeenCalledWith({
        where: { id: 'inst-1' },
        data: { userId: 'user-1' },
      });
      expect(prisma.tA.update).toHaveBeenCalledWith({
        where: { id: 'ta-1' },
        data: { userId: 'user-1' },
      });
      expect(sendEmail).toHaveBeenCalledWith('a@test.com', 'Email Verification - EELU', 'email-verification.html', {
        userName: 'Ahmed',
        otpCode: expect.any(String),
        expiryMinutes: '10',
      });
      expect(result).toEqual(mockUser);
    });

    test('still returns user when verification email fails', async () => {
      const mockUser = { id: 'user-1', email: 'a@test.com' };
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.instructor.findUnique.mockResolvedValue(null);
      prisma.tA.findUnique.mockResolvedValue(null);
      sendEmail.mockRejectedValue(new Error('SMTP unavailable'));

      const result = await authService.register('a@test.com', 'plain', 'Ahmed', 'TA', true);

      expect(console.warn).toHaveBeenCalledWith('Failed to send verification email:', 'SMTP unavailable');
      expect(result).toEqual(mockUser);
    });
  });

  describe('login', () => {
    test('throws when user is missing or unverified', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login('missing@test.com', 'plain')).rejects.toThrow(
        'Invalid credentials or email not verified'
      );
    });

    test('throws when password does not match', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', emailVerified: true, password: 'hash' });
      comparePassword.mockResolvedValue(false);

      await expect(authService.login('a@test.com', 'wrong')).rejects.toThrow(
        'Invalid credentials or email not verified'
      );
    });

    test('returns tokens and safe user payload', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@test.com',
        password: 'hash',
        roles: ['TA'],
        isExpatriate: false,
        emailVerified: true,
        instructor: null,
        ta: { id: 'ta-1' },
      });

      const result = await authService.login('a@test.com', 'plain');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@test.com' },
        include: {
          instructor: { select: { id: true } },
          ta: { select: { id: true } },
        },
      });
      expect(comparePassword).toHaveBeenCalledWith('plain', 'hash');
      expect(generateTokens).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }));
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'a@test.com',
          roles: ['TA'],
          isExpatriate: false,
          instructor: null,
          ta: { id: 'ta-1' },
        },
      });
    });
  });

  describe('refresh', () => {
    test('throws when refresh token payload user is missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh('refresh-token')).rejects.toThrow('User not found');
    });

    test('returns a new access token', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

      const result = await authService.refresh('refresh-token');

      expect(verifyRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(result).toBe('access-token');
    });
  });

  describe('password reset flow', () => {
    test('requestPasswordReset throws for unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.requestPasswordReset('missing@test.com')).rejects.toThrow(
        'No account is registered with this email'
      );
    });

    test('requestPasswordReset stores OTP and sends email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Ahmed' });

      const result = await authService.requestPasswordReset('a@test.com');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'a@test.com' },
        data: {
          resetPasswordOtp: expect.any(String),
          resetPasswordOtpExpires: expect.any(Date),
        },
      });
      expect(sendEmail).toHaveBeenCalledWith('a@test.com', 'Reset Password - EELU', 'ResetPassowrd.html', {
        userName: 'Ahmed',
        otpCode: expect.any(String),
        expiryMinutes: '10',
      });
      expect(result).toEqual({
        message: 'The verification code has been sent to your email',
        email: 'a@test.com',
      });
    });

    test('verifyOtp clears expired OTP and throws', async () => {
      prisma.user.findUnique.mockResolvedValue({
        resetPasswordOtp: '123456',
        resetPasswordOtpExpires: new Date(Date.now() - 1000),
      });

      await expect(authService.verifyOtp('a@test.com', '123456')).rejects.toThrow(
        'The verification code has expired. Please request a new code'
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'a@test.com' },
        data: { resetPasswordOtp: null, resetPasswordOtpExpires: null },
      });
    });

    test('verifyOtp returns success for valid OTP', async () => {
      prisma.user.findUnique.mockResolvedValue({
        resetPasswordOtp: '123456',
        resetPasswordOtpExpires: new Date(Date.now() + 1000),
      });

      const result = await authService.verifyOtp('a@test.com', '123456');

      expect(result).toEqual({
        message: 'The verification code has been verified successfully',
        email: 'a@test.com',
      });
    });

    test('resetPassword verifies OTP, hashes new password, and clears OTP fields', async () => {
      prisma.user.findUnique.mockResolvedValue({
        resetPasswordOtp: '123456',
        resetPasswordOtpExpires: new Date(Date.now() + 1000),
      });

      const result = await authService.resetPassword('a@test.com', '123456', 'new-password');

      expect(hashPassword).toHaveBeenCalledWith('new-password');
      expect(prisma.user.update).toHaveBeenLastCalledWith({
        where: { email: 'a@test.com' },
        data: {
          password: 'hashed-password',
          resetPasswordOtp: null,
          resetPasswordOtpExpires: null,
        },
      });
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('email verification flow', () => {
    test('verifyEmail throws when already verified', async () => {
      prisma.user.findUnique.mockResolvedValue({ emailVerified: true });

      await expect(authService.verifyEmail('a@test.com', '123456')).rejects.toThrow('Email is already verified');
    });

    test('verifyEmail marks email verified for matching OTP', async () => {
      prisma.user.findUnique.mockResolvedValue({
        emailVerified: false,
        emailVerificationOtp: '123456',
        emailVerificationOtpExpires: new Date(Date.now() + 1000),
      });

      const result = await authService.verifyEmail('a@test.com', '123456');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'a@test.com' },
        data: {
          emailVerified: true,
          emailVerificationOtp: null,
          emailVerificationOtpExpires: null,
        },
      });
      expect(result).toEqual({
        message: 'Email verified successfully. You can now login.',
        email: 'a@test.com',
      });
    });

    test('resendVerificationOtp sends a new OTP for unverified users', async () => {
      prisma.user.findUnique.mockResolvedValue({ name: 'Ahmed', emailVerified: false });

      const result = await authService.resendVerificationOtp('a@test.com');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'a@test.com' },
        data: {
          emailVerificationOtp: expect.any(String),
          emailVerificationOtpExpires: expect.any(Date),
        },
      });
      expect(sendEmail).toHaveBeenCalledWith('a@test.com', 'Email Verification - EELU', 'email-verification.html', {
        userName: 'Ahmed',
        otpCode: expect.any(String),
        expiryMinutes: '10',
      });
      expect(result).toEqual({
        message: 'A new verification code has been sent to your email',
        email: 'a@test.com',
      });
    });
  });
});
