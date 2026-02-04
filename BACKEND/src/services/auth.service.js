const { prisma } = require('../config/db.js');
const crypto = require('crypto');

const { hashPassword, comparePassword } = require('../utils/hash.js');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt.js');
const { sendEmail } = require('../utils/mailer.js');

class AuthService {
  async register(email, password, name, role) {
    const hashedPassword = await hashPassword(password);
    
    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        roles: [role], 
        emailVerificationOtp: emailOtp,
        emailVerificationOtpExpires: otpExpiry,
      },
    });

    try {
      await sendEmail(email, 'Email Verification - EELU', 'email-verification.html', {
        userName: name,
        otpCode: emailOtp,
        expiryMinutes: '10',
      });
    } catch (emailError) {
      console.warn('Failed to send verification email:', emailError.message);
    }

    return user;
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.emailVerified) {
      throw new Error('Invalid credentials or email not verified');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials or email not verified');
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, roles: user.roles }, 
    };
  }

  async refresh(refreshToken) {
    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const { accessToken } = generateTokens(user);

    return accessToken;
  }

  /**
   * Request password reset - Generate OTP and send to email
   */
  async requestPasswordReset(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('No account is registered with this email');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordOtp: otp,
        resetPasswordOtpExpires: otpExpiry,
      },
    });

    await sendEmail(
      email,
      'Reset Password - EELU',
      'ResetPassowrd.html',
      {
        userName: user.name,
        otpCode: otp,
        expiryMinutes: '10',
      }
    );

    return {
      message: 'The verification code has been sent to your email',
      email: email,
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(email, otp) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('No account is registered with this email');
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      throw new Error('Password reset was not requested. Please request a new code');
    }

    if (new Date() > user.resetPasswordOtpExpires) {
      await prisma.user.update({
        where: { email },
        data: {
          resetPasswordOtp: null,
          resetPasswordOtpExpires: null,
        },
      });
      throw new Error('The verification code has expired. Please request a new code');
    }

    if (user.resetPasswordOtp !== otp) {
      throw new Error('The verification code is incorrect');
    }

    return {
      message: 'The verification code has been verified successfully',
      email: email,
    };
  }

  /**
   * Reset password after OTP verification
   */
  async resetPassword(email, otp, newPassword) {
    await this.verifyOtp(email, otp);

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordOtp: null,
        resetPasswordOtpExpires: null,
      },
    });

    return {
      message: 'Password reset successfully',
    };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(email, otp) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('No account is registered with this email');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
      throw new Error('Email verification was not requested. Please register again or request a new code');
    }

    if (new Date() > user.emailVerificationOtpExpires) {
      await prisma.user.update({
        where: { email },
        data: {
          emailVerificationOtp: null,
          emailVerificationOtpExpires: null,
        },
      });
      throw new Error('The verification code has expired. Please request a new code');
    }

    if (user.emailVerificationOtp !== otp) {
      throw new Error('The verification code is incorrect');
    }

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        emailVerificationOtp: null,
        emailVerificationOtpExpires: null,
      },
    });

    return {
      message: 'Email verified successfully. You can now login.',
      email: email,
    };
  }

  /**
   * Resend email verification OTP
   */
  async resendVerificationOtp(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      throw new Error('No account is registered with this email');
    }

    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }

    const emailOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        emailVerificationOtp: emailOtp,
        emailVerificationOtpExpires: otpExpiry,
      },
    });

    await sendEmail(email, 'Email Verification - EELU', 'email-verification.html', {
      userName: user.name,
      otpCode: emailOtp,
      expiryMinutes: '10',
    });

    return {
      message: 'A new verification code has been sent to your email',
      email: email,
    };
  }

}

module.exports = { AuthService };