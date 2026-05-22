const lawyerService = require('./lawyers.service');

class LawyerController {
  async getMyProfile(req, res, next) {
    try {
      const lawyer = await lawyerService.getProfile(req.user._id);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const lawyer = await lawyerService.updateProfile(req.user._id, req.body);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await lawyerService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const lawyer = await lawyerService.getById(req.params.id);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LawyerController();