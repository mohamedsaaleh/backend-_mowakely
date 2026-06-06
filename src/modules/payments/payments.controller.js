const paymentService = require('./payments.service');
const { createPaymentSession } = require('./payments.validation');

class PaymentController {
  async create(req, res, next) {
    try {
      const { error, value } = createPaymentSession.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      const result = await paymentService.createPaymentSession(
        value.invoiceId,
        req.user._id
      );
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async verify(req, res, next) {
    try {
      const { transactionId } = req.params;
      if (!transactionId || transactionId.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction ID'
        });
      }
      const result = await paymentService.verifyTransaction(transactionId);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async webhook(req, res, next) {
    try {
      const payload = req.body;
      if (!payload || Object.keys(payload).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Empty webhook payload'
        });
      }
      const result = await paymentService.handleWebhook(payload);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getByInvoice(req, res, next) {
    try {
      const payment = await paymentService.getPaymentByInvoice(req.params.invoiceId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found for this invoice'
        });
      }
      res.json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
