jest.mock('crypto', () => ({
  randomInt: jest.fn(),
}));

jest.mock('../../../config/db.js', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/hash.js', () => ({
  hashPassword: jest.fn(),
}));

jest.mock('../../../utils/mailer.js', () => ({
  sendEmail: jest.fn(),
}));

const crypto = require('crypto');
const { prisma } = require('../../../config/db.js');
const { hashPassword } = require('../../../utils/hash.js');
const { sendEmail } = require('../../../utils/mailer.js');
const {
  generateOTP,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  resendOtp,
} = require('../../../services/otp.service.js');

beforeEach(() => {
  jest.clearAllMocks();
  crypto.randomInt.mockReturnValue(123456);
  hashPassword.mockResolvedValue('hashed-password');
});

describe('otp.service', () => {
  describe('generateOTP', () => {
    test('generates a six digit OTP using crypto randomInt', () => {
      const result = generateOTP();

      expect(crypto.randomInt).toHaveBeenCalledWith(100000, 1000000);
      expect(result).toBe('123456');
    });
  });

  describe('forgotPassword', () => {
    test('throws when user is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(forgotPassword('missing@test.com')).rejects.toThrow('User not found');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    test('stores OTP and sends reset email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Ahmed', email: 'a@test.com' });

      const result = await forgotPassword('a@test.com');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'a@test.com' },
        data: {
          resetPasswordOtp: '123456',
          resetPasswordOtpExpires: expect.any(Date),
        },
      });
      expect(sendEmail).toHaveBeenCalledWith('a@test.com', 'رمز إعادة تعيين كلمة السر - EELU', 'ResetPassowrd.html', {
        userName: 'Ahmed',
        otpCode: '123456',
        expiryMinutes: '10',
      });
      expect(result).toEqual({ message: 'OTP sent to email successfully' });
    });
  });

  describe('verifyResetOtp', () => {
    test('throws for missing user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(verifyResetOtp('111111')).rejects.toThrow('Invalid OTP. Please check the code and try again.');
    });

    test('clears expired OTP and throws', async () => {
      prisma.user.findFirst.mockResolvedValue({
        resetPasswordOtp: '111111',
        resetPasswordOtpExpires: new Date(Date.now() - 1000),
      });

      await expect(verifyResetOtp('111111')).rejects.toThrow('OTP has expired. Please request a new one.');
      expect(prisma.user.updateMany).toHaveBeenCalledWith({
        where: { resetPasswordOtp: '111111' },
        data: {
          resetPasswordOtp: null,
          resetPasswordOtpExpires: null,
        },
      });
    });

    test('returns verified true for a valid OTP', async () => {
      prisma.user.findFirst.mockResolvedValue({
        resetPasswordOtp: '111111',
        resetPasswordOtpExpires: new Date(Date.now() + 1000),
      });

      const result = await verifyResetOtp('111111');

      expect(result).toEqual({ verified: true });
    });
  });

  describe('resetPassword', () => {
    test('verifies OTP, hashes password, and clears reset fields', async () => {
      prisma.user.findFirst.mockResolvedValue({
        resetPasswordOtp: '111111',
        resetPasswordOtpExpires: new Date(Date.now() + 1000),
      });

      const result = await resetPassword('111111', 'new-password');

      expect(hashPassword).toHaveBeenCalledWith('new-password');
      expect(prisma.user.updateMany).toHaveBeenLastCalledWith({
        where: { resetPasswordOtp: '111111' },
        data: {
          password: 'hashed-password',
          resetPasswordOtp: null,
          resetPasswordOtpExpires: null,
        },
      });
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('resendOtp', () => {
    test('delegates to forgotPassword', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Ahmed' });

      const result = await resendOtp('a@test.com');

      expect(sendEmail).toHaveBeenCalled();
      expect(result).toEqual({ message: 'OTP sent to email successfully' });
    });
  });
});
