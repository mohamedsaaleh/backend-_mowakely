const invoiceService = require('./invoices.service');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');

class InvoiceController {
  async create(req, res, next) {
    try {
      const invoice = await invoiceService.createFromCase(req.body.caseId);
      res.status(201).json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const invoice = await invoiceService.getById(
        req.params.id,
        req.user._id,
        req.user.role
      );
      res.json({
        success: true,
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyInvoices(req, res, next) {
    try {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client profile not found'
        });
      }
      const result = await invoiceService.getByClient(client._id, req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async getLawyerInvoices(req, res, next) {
    try {
      const lawyer = await Lawyer.findOne({ user: req.user._id });
      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found'
        });
      }
      const result = await invoiceService.getByLawyer(lawyer._id, req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = new InvoiceController();