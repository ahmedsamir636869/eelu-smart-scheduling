const { prisma } = require('../config/db.js');
const crypto = require('crypto');
const { hashPassword } = require('../utils/hash.js');
const { sendEmail } = require('../utils/mailer.js');

function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

async function forgotPassword(email) {
    const user = await prisma.user.findUnique({
        where: { email: email }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
        where: { email: email },
        data: {
            resetPasswordOtp: otp,
            resetPasswordOtpExpires: otpExpires,
        },
    });

    // Send OTP email using template
    await sendEmail(email, 'رمز إعادة تعيين كلمة السر - EELU', 'ResetPassowrd.html', {
        userName: user.name,
        otpCode: otp,
        expiryMinutes: '10'
    });

    return { message: 'OTP sent to email successfully' };
}

async function verifyResetOtp(otp) {
    const user = await prisma.user.findUnique({ 
        where: { resetPasswordOtp: otp } 
    });

    if (!user) {
        throw new Error('Invalid OTP. Please check the code and try again.');
    }

    if (!user.resetPasswordOtp) {
        throw new Error('No OTP request found. Please request a new one.');
    }

    if (new Date() > new Date(user.resetPasswordOtpExpires)) {
        await prisma.user.update({
            where: { resetPasswordOtp: otp },
            data: {
                resetPasswordOtp: null,
                resetPasswordOtpExpires: null,
            },
        });
        throw new Error('OTP has expired. Please request a new one.');
    }

    if (user.resetPasswordOtp !== otp.toString()) {
        throw new Error('Invalid OTP');
    }

    return { verified: true };
}

async function resetPassword(otp, newPassword) {
    // Verify OTP first
    const verifyResult = await verifyResetOtp(otp);
    
    if (!verifyResult.verified) {
        throw new Error('OTP verification failed');
    }

    const hashedPassword = await hashPassword(newPassword);

    // Find and update user by OTP
    await prisma.user.update({
        where: { resetPasswordOtp: otp.toString() },
        data: {
            password: hashedPassword,
            resetPasswordOtp: null,
            resetPasswordOtpExpires: null,
        },
    });

    return { message: 'Password reset successfully' };
}

async function resendOtp(email) {
    return await forgotPassword(email);
}

module.exports = {
    generateOTP,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    resendOtp,
};
