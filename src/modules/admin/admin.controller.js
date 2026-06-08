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

  // ==================== USER MANAGEMENT ====================

  async getAllUsers(req, res, next) {
    try {
      const result = await adminService.getAllUsers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await adminService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await adminService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await adminService.deleteUser(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async toggleUserActive(req, res, next) {
    try {
      const { isActive } = req.body;
      const user = await adminService.toggleUserActive(req.params.id, isActive);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async banUser(req, res, next) {
    try {
      const { banned } = req.body;
      const user = await adminService.banUser(req.params.id, banned);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LAWYER MANAGEMENT ====================

  async getAllLawyers(req, res, next) {
    try {
      const result = await adminService.getAllLawyers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getLawyerById(req, res, next) {
    try {
      const lawyer = await adminService.getLawyerById(req.params.id);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async createLawyer(req, res, next) {
    try {
      const lawyer = await adminService.createLawyer(req.body);
      res.status(201).json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async updateLawyer(req, res, next) {
    try {
      const lawyer = await adminService.updateLawyer(req.params.id, req.body);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async deleteLawyer(req, res, next) {
    try {
      const result = await adminService.deleteLawyer(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async verifyLawyer(req, res, next) {
    try {
      const { verified } = req.body;
      const lawyer = await adminService.verifyLawyer(req.params.id, verified);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CASE MANAGEMENT ====================

  async getAllCases(req, res, next) {
    try {
      const result = await adminService.getAllCases(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getCaseById(req, res, next) {
    try {
      const legalCase = await adminService.getCaseById(req.params.id);
      res.json({ success: true, data: legalCase });
    } catch (error) {
      next(error);
    }
  }

  async createCase(req, res, next) {
    try {
      const legalCase = await adminService.createCase(req.body);
      res.status(201).json({ success: true, data: legalCase });
    } catch (error) {
      next(error);
    }
  }

  async updateCase(req, res, next) {
    try {
      const legalCase = await adminService.updateCase(req.params.id, req.body);
      res.json({ success: true, data: legalCase });
    } catch (error) {
      next(error);
    }
  }

  async deleteCase(req, res, next) {
    try {
      const result = await adminService.deleteCase(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================

  async getAllCategories(req, res, next) {
    try {
      const result = await adminService.getAllCategories(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await adminService.getCategoryById(req.params.id);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await adminService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await adminService.updateCategory(req.params.id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const result = await adminService.deleteCategory(req.params.id);
      res.json({ success: true, ...result });
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
