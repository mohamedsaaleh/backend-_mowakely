const { Payout } = require('./payouts.model');
const { Invoice } = require('../invoices/invoices.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const config = require('../../config/env');
const { AppError } = require('../../middlewares/error.middleware');

class PayoutService {
  async requestPayout(payoutData, userId) {
    const lawyer = await Lawyer.findOne({ user: userId });
    if (!lawyer) {
      throw new AppError('Lawyer profile not found', 400);
    }

    const invoice = await Invoice.findById(payoutData.invoice);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (invoice.lawyer.toString() !== lawyer._id.toString()) {
      throw new AppError('This invoice does not belong to you', 403);
    }

    if (invoice.paymentStatus !== 'paid') {
      throw new AppError('Payment not confirmed. Invoice must be paid before requesting payout.', 400);
    }

    const existingPayout = await Payout.findOne({ invoice: payoutData.invoice, status: { $in: ['pending', 'processing'] } });
    if (existingPayout) {
      throw new AppError('Payout already requested for this invoice', 400);
    }

    const amount = invoice.offerPrice - invoice.platformFee;

    const payout = await Payout.create({
      invoice: payoutData.invoice,
      lawyer: lawyer._id,
      amount,
      method: payoutData.method || 'bank_transfer'
    });

    return payout;
  }

  async getByLawyer(lawyerId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = { lawyer: lawyerId };
    if (status) filter.status = status;

    const payouts = await Payout.find(filter)
      .populate('invoice', 'case total paidAt')
      .populate('invoice.case', 'title')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Payout.countDocuments(filter);

    return {
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAll(query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = {};
    if (status) filter.status = status;

    const payouts = await Payout.find(filter)
      .populate('lawyer', 'rating')
      .populate('lawyer.user', 'fullName email')
      .populate('invoice', 'case total')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Payout.countDocuments(filter);

    return {
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateStatus(payoutId, status, providerRef) {
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      throw new AppError('Payout not found', 404);
    }

    payout.status = status;
    if (providerRef) payout.providerRef = providerRef;
    if (status === 'completed') payout.settledAt = new Date();

    await payout.save();
    return payout;
  }
}

module.exports = new PayoutService();