const { User } = require('../users/users.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Client } = require('../clients/clients.model');
const { Case } = require('../cases/cases.model');
const { Category } = require('../categories/categories.model');
const { Invoice } = require('../invoices/invoices.model');
const { Payout } = require('../payouts/payouts.model');
const { Notification } = require('../notifications/notifications.model');
const { AppError } = require('../../middlewares/error.middleware');
const { escapeRegex } = require('../../utils/escapeRegex');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

const lawyersService = require('../lawyers/lawyers.service');
const categoriesService = require('../categories/categories.service');

class AdminService {
  // ==================== DASHBOARD ====================

  async getDashboardStats() {
    const totalUsers = await User.countDocuments();
    const totalLawyers = await Lawyer.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalCases = await Case.countDocuments();
    const openCases = await Case.countDocuments({ status: 'open' });
    const completedCases = await Case.countDocuments({ status: 'completed' });

    const totalRevenue = await Invoice.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$value' } } }
    ]);

    const pendingPayouts = await Payout.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      users: { total: totalUsers, lawyers: totalLawyers, clients: totalClients },
      cases: { total: totalCases, open: openCases, completed: completedCases },
      revenue: { total: totalRevenue[0]?.total || 0 },
      payouts: { pending: pendingPayouts[0]?.total || 0 }
    };
  }

  // ==================== ADMIN CREATION ====================

  async createAdminUser(adminData) {
    const existingUser = await User.findOne({ email: adminData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const hashedPassword = await bcrypt.hash(adminData.password, 12);

    const user = await User.create({
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

    return user.toJSON();
  }

  async markAsPaidOnly(invoiceId, adminId, reason = 'Manual admin override') {
    logger.warn('DEPRECATED: manual payment override used via admin.markAsPaidOnly');

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    if (invoice.paymentStatus === 'paid') {
      throw new AppError('Invoice already paid', 400);
    }

    const updatedInvoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, paymentStatus: { $ne: 'paid' } },
      {
        $set: {
          paymentStatus: 'paid',
          paymentMethod: 'manual',
          paymentTransactionId: null,
          paid_at: new Date()
        },
        $push: {
          paymentOverrides: {
            type: 'manual_admin_override',
            adminId,
            timestamp: new Date(),
            reason
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      throw new AppError('Invoice already paid', 400);
    }

    return updatedInvoice;
  }
}

module.exports = new AdminService();
