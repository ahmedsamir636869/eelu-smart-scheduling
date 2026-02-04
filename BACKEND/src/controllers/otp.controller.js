const { forgotPassword, verifyResetOtp, resetPassword, resendOtp } = require('../services/otp.service');


async function forgotPasswordController(req, res, next) {
    try {
        const { email } = req.body;
        const result = await forgotPassword(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function verifyOtpController(req, res, next) {
    try {
        const { otp } = req.body;
        const result = await verifyResetOtp(otp);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function resetPasswordController(req, res, next) {
    try {
        const { otp, newPassword } = req.body;
        const result = await resetPassword(otp, newPassword);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function resendOtpController(req, res, next) {
    try {
        const { email } = req.body;
        const result = await resendOtp(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    forgotPasswordController,
    verifyOtpController,
    resetPasswordController,
    resendOtpController,
};