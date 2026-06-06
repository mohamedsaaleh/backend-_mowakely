const { Invoice } = require('./invoices.model');
const { Case } = require('../cases/cases.model');
const { AppError } = require('../../middlewares/error.middleware');

class InvoiceService {
  async create(invoiceData) {
    const invoice = await Invoice.create(invoiceData);
    return invoice;
  }

  async getById(invoiceId, userId, role) {
    const invoice = await Invoice.findById(invoiceId)
      .populate('case', 'title status')
      .populate('lawyer', 'rate');

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  }

  async getByLawyer(lawyerId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = { lawyer: lawyerId };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate('case', 'title')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await Invoice.countDocuments(filter);

    return {
      invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async cancel(invoiceId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    invoice.status = 'cancelled';
    await invoice.save();

    return invoice;
  }
}

module.exports = new InvoiceService();