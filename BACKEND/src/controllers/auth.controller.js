const { AuthService } = require('../services/auth.service');

const authService = new AuthService();

class AuthController {
  async registerController(req, res, next) {
    try {
      const { email, password, name, role, isExpatriate } = req.body;
      const user = await authService.register(email, password, name, role, isExpatriate);
      res.status(201).json({ message: 'User registered. Please check your email to verify.', user });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ 
          message: 'Email already exists. Please use a different email or login.' 
        });
      }
      next(error); 
    }
  }

  async loginController(req, res, next) {
    try {
      const { email, password, role, isExpatriate } = req.body;
      const { accessToken, refreshToken, user } = await authService.login(email, password, role, isExpatriate);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      res.status(200).json({ accessToken, user });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
  
  async refreshController(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
      }
      
      const newAccessToken = await authService.refresh(refreshToken);
      res.status(200).json({ accessToken: newAccessToken });
      
    } catch (error) {
      res.status(403).json({ message: error.message });
    }
  }
  
  async logoutController(req, res, next) {
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      });
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

 
  async requestPasswordResetController(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'email is required' });
      }

      const result = await authService.requestPasswordReset(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async verifyOtpController(req, res, next) {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: 'email and otp are required' });
      }

      const result = await authService.verifyOtp(email, otp);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async resetPasswordController(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;
      
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ 
          message: 'email, otp, and new password are required' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: 'password must be at least 6 characters' 
        });
      }

      const result = await authService.resetPassword(email, otp, newPassword);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async verifyEmailController(req, res, next) {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
      }

      const result = await authService.verifyEmail(email, otp);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async resendVerificationOtpController(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const result = await authService.resendVerificationOtp(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
  
}

const controllerInstance = new AuthController();

module.exports = {
  registerController: (req, res, next) => controllerInstance.registerController(req, res, next),
  loginController: (req, res, next) => controllerInstance.loginController(req, res, next),
  refreshController: (req, res, next) => controllerInstance.refreshController(req, res, next),
  logoutController: (req, res, next) => controllerInstance.logoutController(req, res, next),
  requestPasswordResetController: (req, res, next) => controllerInstance.requestPasswordResetController(req, res, next),
  verifyOtpController: (req, res, next) => controllerInstance.verifyOtpController(req, res, next),
  resetPasswordController: (req, res, next) => controllerInstance.resetPasswordController(req, res, next),
  verifyEmailController: (req, res, next) => controllerInstance.verifyEmailController(req, res, next),
  resendVerificationOtpController: (req, res, next) => controllerInstance.resendVerificationOtpController(req, res, next),
};