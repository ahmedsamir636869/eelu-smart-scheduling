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
router.get('/me', isAuthenticated, async (req, res) => {
    try {
        const { getUserById } = require('../services/user.service');
        const user = await getUserById(req.user.id);
        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user profile', error: error.message });
    }
});

// Update own profile
router.patch('/me', isAuthenticated, (req, res, next) => {
    const { updateProfileController } = require('../controllers/user.controller');
    updateProfileController(req, res, next);
});

module.exports = router;