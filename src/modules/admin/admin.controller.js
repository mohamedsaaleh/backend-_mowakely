const adminService = require('./admin.service');

class AdminController {
  // ==================== DASHBOARD ====================

  async getDashboardStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }



  // ==================== INVOICES ====================

  async markAsPaidOnly(req, res, next) {
    try {
      const invoice = await adminService.markAsPaidOnly(
        req.params.id,
        req.user._id,
        req.body?.reason || 'Manual admin override'
      );
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ADMIN CREATION ====================

  async createAdmin(req, res, next) {
    try {
      const admin = await adminService.createAdminUser(req.body);
      res.status(201).json({ success: true, data: admin });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
