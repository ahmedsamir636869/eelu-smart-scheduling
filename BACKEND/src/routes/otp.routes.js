const express = require("express");
const { forgotPasswordController, verifyOtpController, resetPasswordController, resendOtpController } = require("../controllers/otp.controller");
const router = express.Router();


router.post('/forgot-password', forgotPasswordController);
router.post('/verify-otp', verifyOtpController);
router.post('/reset-password', resetPasswordController);
router.post('/resend-otp', resendOtpController);


module.exports = router;

