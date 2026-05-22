const adminService = require('./admin.service');

class AdminController {
  async verifyLawyer(req, res, next) {
    try {
      const { status } = req.body;
      const lawyer = await adminService.verifyLawyer(req.params.id, status);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async banUser(req, res, next) {
    try {
      const { isBanned } = req.body;
      const user = await adminService.banUser(req.params.id, isBanned);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const result = await adminService.getAllUsers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getAllLawyers(req, res, next) {
    try {
      const result = await adminService.getAllLawyers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();