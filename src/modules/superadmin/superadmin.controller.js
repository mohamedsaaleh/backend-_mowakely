const superadminService = require('./superadmin.service');

class SuperadminController {
  // ==================== DASHBOARD ====================
  async getDashboard(req, res, next) {
    try {
      const stats = await superadminService.getDashboard();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const stats = await superadminService.getStatistics();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async getAnalytics(req, res, next) {
    try {
      const analytics = await superadminService.getAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error) {
      next(error);
    }
  }

  // ==================== USERS ====================
  async getAllUsers(req, res, next) {
    try {
      const result = await superadminService.getAllUsers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await superadminService.getUserById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req, res, next) {
    try {
      const user = await superadminService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await superadminService.updateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await superadminService.deleteUser(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async banUser(req, res, next) {
    try {
      const user = await superadminService.banUser(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req, res, next) {
    try {
      const user = await superadminService.unbanUser(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CLIENTS ====================
  async getAllClients(req, res, next) {
    try {
      const result = await superadminService.getAllClients(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getClientById(req, res, next) {
    try {
      const client = await superadminService.getClientById(req.params.id);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async createClient(req, res, next) {
    try {
      const client = await superadminService.createClient(req.body);
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async updateClient(req, res, next) {
    try {
      const client = await superadminService.updateClient(req.params.id, req.body);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async deleteClient(req, res, next) {
    try {
      const result = await superadminService.deleteClient(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LAWYERS ====================
  async getAllLawyers(req, res, next) {
    try {
      const result = await superadminService.getAllLawyers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getLawyerById(req, res, next) {
    try {
      const lawyer = await superadminService.getLawyerById(req.params.id);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async createLawyer(req, res, next) {
    try {
      const lawyer = await superadminService.createLawyer(req.body);
      res.status(201).json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async updateLawyer(req, res, next) {
    try {
      const lawyer = await superadminService.updateLawyer(req.params.id, req.body);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async deleteLawyer(req, res, next) {
    try {
      const result = await superadminService.deleteLawyer(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async verifyLawyer(req, res, next) {
    try {
      const { verified } = req.body;
      const lawyer = await superadminService.verifyLawyer(req.params.id, verified);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  async unverifyLawyer(req, res, next) {
    try {
      const lawyer = await superadminService.unverifyLawyer(req.params.id);
      res.json({ success: true, data: lawyer });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CASES ====================
  async getAllCases(req, res, next) {
    try {
      const result = await superadminService.getAllCases(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getCaseById(req, res, next) {
    try {
      const legalCase = await superadminService.getCaseById(req.params.id);
      res.json({ success: true, data: legalCase });
    } catch (error) {
      next(error);
    }
  }

  async createCase(req, res, next) {
    try {
      const legalCase = await superadminService.createCase(req.body);
      res.status(201).json({ success: true, data: legalCase });
    } catch (error) {
      next(error);
    }
  }

  async updateCase(req, res, next) {
    try {
      const legalCase = await superadminService.updateCase(req.params.id, req.body);
      res.json({ success: true, data: legalCase });
    } catch (error) {
      next(error);
    }
  }

  async deleteCase(req, res, next) {
    try {
      const result = await superadminService.deleteCase(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async updateCaseStatus(req, res, next) {
    try {
      const { status } = req.body;
      const legalCase = await superadminService.updateCaseStatus(req.params.id, status);
      res.json({ success: true, data: legalCase });
    } catch (error) {
      next(error);
    }
  }

  // ==================== OFFERS ====================
  async getAllOffers(req, res, next) {
    try {
      const result = await superadminService.getAllOffers(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getOfferById(req, res, next) {
    try {
      const offer = await superadminService.getOfferById(req.params.id);
      res.json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }

  async createOffer(req, res, next) {
    try {
      const offer = await superadminService.createOffer(req.body);
      res.status(201).json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }

  async updateOffer(req, res, next) {
    try {
      const offer = await superadminService.updateOffer(req.params.id, req.body);
      res.json({ success: true, data: offer });
    } catch (error) {
      next(error);
    }
  }

  async deleteOffer(req, res, next) {
    try {
      const result = await superadminService.deleteOffer(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== CATEGORIES ====================
  async getAllCategories(req, res, next) {
    try {
      const result = await superadminService.getAllCategories(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await superadminService.getCategoryById(req.params.id);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const category = await superadminService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await superadminService.updateCategory(req.params.id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const result = await superadminService.deleteCategory(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== REVIEWS ====================
  async getAllReviews(req, res, next) {
    try {
      const result = await superadminService.getAllReviews(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async getReviewById(req, res, next) {
    try {
      const review = await superadminService.getReviewById(req.params.id);
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  async hideReview(req, res, next) {
    try {
      const review = await superadminService.hideReview(req.params.id);
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  async publishReview(req, res, next) {
    try {
      const review = await superadminService.publishReview(req.params.id);
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req, res, next) {
    try {
      const result = await superadminService.deleteReview(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // ==================== ADMIN MANAGEMENT ====================
  async getAllAdmins(req, res, next) {
    try {
      const result = await superadminService.getAllAdmins(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async createAdmin(req, res, next) {
    try {
      const admin = await superadminService.createAdmin(req.body);
      res.status(201).json({ success: true, data: admin });
    } catch (error) {
      next(error);
    }
  }

  async deleteAdmin(req, res, next) {
    try {
      const result = await superadminService.deleteAdmin(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async changeRole(req, res, next) {
    try {
      const { newRole } = req.body;
      const updatedUser = await superadminService.changeRole(req.params.id, newRole, req.user._id);
      res.json({ success: true, data: updatedUser });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperadminController();
