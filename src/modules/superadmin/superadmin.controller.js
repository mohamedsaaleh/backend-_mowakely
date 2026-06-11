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
