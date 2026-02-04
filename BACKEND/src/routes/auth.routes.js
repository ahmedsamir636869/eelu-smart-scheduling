const express = require("express");
const { 
  registerController, 
  loginController, 
  refreshController, 
  logoutController,
  requestPasswordResetController,
  verifyOtpController,
  resetPasswordController,
  verifyEmailController,
  resendVerificationOtpController
} = require("../controllers/auth.controller");
const { isAuthenticated } = require("../middleware/auth.middleware.js"); 
const router = express.Router();

// Authentication routes
router.post('/register', registerController);
router.post('/login', loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

// Password reset routes
router.post('/forgot-password', requestPasswordResetController);
router.post('/verify-otp', verifyOtpController);
router.post('/reset-password', resetPasswordController);

// Email verification routes
router.post('/verify-email', verifyEmailController);
router.post('/resend-verification-otp', resendVerificationOtpController);

// Protected routes
router.get('/me', isAuthenticated, (req, res) => { 
    res.json(req.user);
});

module.exports = router;