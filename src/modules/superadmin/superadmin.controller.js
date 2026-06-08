const superadminService = require('./superadmin.service');

class SuperadminController {
  async getAllAdmins(req, res, next) {
    try {
      const result = await superadminService.getAllAdmins(req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const admin = await superadminService.createAdmin(req.body);
      res.status(201).json({
        success: true,
        data: admin
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const result = await superadminService.deleteAdmin(req.params.id);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async changeRole(req, res, next) {
    try {
      const { newRole } = req.body;
      const updatedUser = await superadminService.changeRole(req.params.id, newRole, req.user._id);
      res.json({
        success: true,
        data: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperadminController();
