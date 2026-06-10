const authService = require('./auth.service');
const { validate } = require('../../middlewares/validate.middleware');
const { refreshTokenSchema } = require('./auth.validation');

class AuthController {
  async register(req, res, next) {
    try {
      const userAgent = req.get('user-agent') || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const result = await authService.register(req.body, userAgent, ipAddress);
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const userAgent = req.get('user-agent') || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const result = await authService.login(req.body.email, req.body.password, userAgent, ipAddress);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userAgent = req.get('user-agent') || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const result = await authService.refreshToken(refreshToken, userAgent, ipAddress);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.logout(req.user._id, refreshToken);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const result = await authService.verifyEmail(req.params.token);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.params.token, req.body.password);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async devLogin(req, res, next) {
    try {
      const userAgent = req.get('user-agent') || 'unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const result = await authService.login(req.body.email, req.body.password, userAgent, ipAddress);
      res.json({
        success: true,
        message: 'Development login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const result = await authService.getMe(req.user._id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();