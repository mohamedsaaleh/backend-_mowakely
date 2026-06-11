const { User } = require('../users/users.model');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Case } = require('../cases/cases.model');
const { Offer } = require('../offers/offers.model');
const { Category } = require('../categories/categories.model');
const { Review } = require('../reviews/reviews.model');
const { Invoice } = require('../invoices/invoices.model');
const { Payout } = require('../payouts/payouts.model');
const { AppError } = require('../../middlewares/error.middleware');
const bcrypt = require('bcryptjs');
const { escapeRegex } = require('../../utils/escapeRegex');
const QueryBuilder = require('../../utils/queryBuilder');

const usersService = require('../users/users.service');
const clientsService = require('../clients/clients.service');
const lawyersService = require('../lawyers/lawyers.service');
const casesService = require('../cases/cases.service');
const offersService = require('../offers/offers.service');
const categoriesService = require('../categories/categories.service');
const adminService = require('../admin/admin.service');

class SuperadminService {
  // ==================== DASHBOARD & STATISTICS ====================

  async getDashboard() {
    const stats = await adminService.getDashboardStats();
    return stats;
  }

  async getStatistics() {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalSuperadmins = await User.countDocuments({ role: 'superadmin' });
    const totalCases = await Case.countDocuments();
    const totalOffers = await Offer.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const totalPayouts = await Payout.countDocuments();

    const openCases = await Case.countDocuments({ status: 'open' });
    const inProgressCases = await Case.countDocuments({ status: 'in_progress' });
    const completedCases = await Case.countDocuments({ status: 'completed' });
    const pendingOffers = await Offer.countDocuments({ status: 'pending' });
    const acceptedOffers = await Offer.countDocuments({ status: 'accepted' });

    return {
      users: { total: totalUsers, clients: totalClients, lawyers: totalLawyers, admins: totalAdmins, superadmins: totalSuperadmins },
      cases: { total: totalCases, open: openCases, inProgress: inProgressCases, completed: completedCases },
      offers: { total: totalOffers, pending: pendingOffers, accepted: acceptedOffers },
      categories: { total: totalCategories },
      reviews: { total: totalReviews },
      invoices: { total: totalInvoices },
      payouts: { total: totalPayouts }
    };
  }

  async getAnalytics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const newUsersLast30Days = await User.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const newUsersLast7Days = await User.countDocuments({ created_at: { $gte: sevenDaysAgo } });
    const newCasesLast30Days = await Case.countDocuments({ created_at: { $gte: thirtyDaysAgo } });
    const newOffersLast30Days = await Offer.countDocuments({ applied_at: { $gte: thirtyDaysAgo } });

    const casesByStatus = await Case.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    return {
      period: '30 days',
      users: {
        newLast30Days: newUsersLast30Days,
        newLast7Days: newUsersLast7Days,
        byRole: usersByRole
      },
      cases: {
        newLast30Days: newCasesLast30Days,
        byStatus: casesByStatus
      },
      offers: {
        newLast30Days: newOffersLast30Days
      }
    };
  }

  // ==================== REVIEW MANAGEMENT ====================

  async getAllReviews(query = {}) {
    const reviews = await Review.find(query)
      .populate('lawyer', 'specialization rate')
      .populate('lawyer.user', 'full_name profile_photo')
      .populate('client', 'user')
      .populate('client.user', 'full_name')
      .populate('case', 'title')
      .sort({ created_at: -1 });

    return { reviews };
  }

  async getReviewById(id) {
    const review = await Review.findById(id)
      .populate('lawyer', 'specialization rate')
      .populate('lawyer.user', 'full_name profile_photo')
      .populate('client', 'user')
      .populate('client.user', 'full_name')
      .populate('case', 'title');

    if (!review) {
      throw new AppError('Review not found', 404);
    }
    return review;
  }

  async hideReview(id) {
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    review.status = 'hidden';
    await review.save();

    return review;
  }

  async publishReview(id) {
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    review.status = 'published';
    await review.save();

    return review;
  }

  async deleteReview(id) {
    const review = await Review.findById(id);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    await Review.findByIdAndDelete(id);
    return { message: 'Review deleted successfully' };
  }

  // ==================== ADMIN MANAGEMENT ====================

  async getAllAdmins(query = {}) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const filter = { role: 'admin' };
    if (search) {
      const searchValue = escapeRegex(search);
      filter.$or = [
        { full_name: { $regex: searchValue, $options: 'i' } },
        { email: { $regex: searchValue, $options: 'i' } },
        { phone: { $regex: searchValue, $options: 'i' } }
      ];
    }

    const admins = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    return {
      admins,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    };
  }

  async createAdmin(adminData) {
    const existingUser = await User.findOne({ email: adminData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const admin = await User.create({
      email: adminData.email.toLowerCase(),
      password: hashedPassword,
      role: 'admin',
      full_name: adminData.full_name,
      phone: adminData.phone,
      city: adminData.city || '',
      address: adminData.address || '',
      bio: adminData.bio || '',
      profile_photo: adminData.profile_photo || null,
      is_verified: true
    });

    return admin.toJSON();
  }

  async deleteAdmin(id) {
    const admin = await User.findById(id);
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    if (admin.role !== 'admin') {
      throw new AppError('User is not an admin', 400);
    }

    await User.findByIdAndDelete(id);
    return { message: 'Admin deleted successfully' };
  }

  async changeRole(targetUserId, newRole, requesterId) {
    if (targetUserId.toString() === requesterId.toString()) {
      throw new AppError('Cannot change your own role', 400);
    }

    const allowedRoles = ['client', 'lawyer', 'admin'];
    if (!allowedRoles.includes(newRole)) {
      throw new AppError('Invalid role specified', 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('User not found', 404);
    }

    if (targetUser.role === 'superadmin') {
      throw new AppError('Cannot modify superadmin role', 403);
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { role: newRole },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken -passwordResetExpires');

    return updatedUser.toJSON();
  }
}

module.exports = new SuperadminService();
