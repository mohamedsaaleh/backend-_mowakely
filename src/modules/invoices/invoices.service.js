const { Invoice } = require('./invoices.model');
const { Case } = require('../cases/cases.model');
const { AppError } = require('../../middlewares/error.middleware');

class InvoiceService {
  async create(invoiceData) {
    const invoice = await Invoice.create(invoiceData);
    return invoice;
  }

  async createFromCase(caseId) {
    const legalCase = await Case.findById(caseId)
      .populate('client')
      .populate('lawyer');

    if (!legalCase) {
      throw new AppError('Case not found', 404);
    }

    if (!legalCase.lawyer) {
      throw new AppError('Case has no assigned lawyer', 400);
    }

    const existingInvoice = await Invoice.findOne({ case: caseId });
    if (existingInvoice) {
      throw new AppError('Invoice already exists for this case', 400);
    }

    const invoice = await Invoice.create({
      case: caseId,
      client: legalCase.client._id,
      lawyer: legalCase.lawyer._id,
      amount: legalCase.budget,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    return invoice;
  }

  async getAll(query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = {};
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate('case', 'title status')
      .populate('lawyer', 'rate')
      .populate('client', 'user')
      .populate('client.user', 'full_name')
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

  async getByClient(clientId, query = {}) {
    const { page = 1, limit = 20, status } = query;
    const filter = { client: clientId };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate('case', 'title')
      .populate('lawyer', 'rate')
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

  async getById(invoiceId, userId, role) {
    const invoice = await Invoice.findById(invoiceId)
      .populate('case', 'title status')
      .populate('lawyer', 'rate')
      .populate('client', 'user');

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    if (role !== 'admin') {
      const Client = require('../clients/clients.model').Client;
      const Lawyer = require('../lawyers/lawyers.model').Lawyer;

      const client = await Client.findOne({ user: userId });
      const lawyer = await Lawyer.findOne({ user: userId });

      const hasAccess = (client && invoice.client && invoice.client.toString() === client._id.toString()) ||
        (lawyer && invoice.lawyer && invoice.lawyer.toString() === lawyer._id.toString());

      if (!hasAccess) {
        throw new AppError('You do not have access to this invoice', 403);
      }
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