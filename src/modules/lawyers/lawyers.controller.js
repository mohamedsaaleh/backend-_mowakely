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

  async create(req, res, next) {
    try {
      const lawyer = await lawyerService.create(req.body);
      res.status(201).json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async updateById(req, res, next) {
    try {
      const lawyer = await lawyerService.updateById(req.params.id, req.body);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async deleteById(req, res, next) {
    try {
      await lawyerService.deleteById(req.params.id);
      res.json({ success: true, message: 'Lawyer deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LawyerController();