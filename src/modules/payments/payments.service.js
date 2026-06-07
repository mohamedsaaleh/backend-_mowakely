const config = require('../../config/env');
const { Payment } = require('./payments.model');
const { Invoice } = require('../invoices/invoices.model');
const { Client } = require('../clients/clients.model');
const { AppError } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger');
const constants = require('../../constants');
const {
  authenticatePaymob,
  createPaymobOrder,
  generatePaymentKey,
  verifyTransaction,
  validateWebhookHMAC
} = require('./paymob.client');

const PAYMENT_STATUS = constants.PAYMENT_STATUS;
const PAYMENT_METHOD = constants.PAYMENT_METHOD;
const INVOICE_STATUS = constants.INVOICE_STATUS;
const PAYMENT_TRANSITIONS = {
  [PAYMENT_STATUS.PENDING]: {
    [PAYMENT_STATUS.PAID]: true,
    [PAYMENT_STATUS.FAILED]: true
  },
  [PAYMENT_STATUS.FAILED]: {
    [PAYMENT_STATUS.PAID]: true
  },
  [PAYMENT_STATUS.PAID]: {}
};

class PaymentService {
  async createPaymentSession(invoiceId, userId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    if (invoice.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new AppError('Invoice is already paid', 400);
    }
    if (invoice.status === INVOICE_STATUS.CANCELLED) {
      throw new AppError('Cannot process payment for a cancelled invoice', 400);
    }

    const client = await Client.findOne({ user: userId }).populate('user', 'fullName email');
    if (!client) {
      throw new AppError('Client profile not found', 404);
    }

    const amountCents = Math.round(invoice.value * 100);

    let authToken, order, paymentKey;
    try {
      authToken = await authenticatePaymob();
      order = await createPaymobOrder(authToken, amountCents, invoiceId);
    } catch (err) {
      throw new AppError(`Paymob order creation failed: ${err.message}`, 502);
    }

    const billingData = {
      firstName: client.user?.fullName?.split(' ')[0] || 'N/A',
      lastName: client.user?.fullName?.split(' ').slice(1).join(' ') || 'N/A',
      email: client.user?.email || 'guest@example.com',
      phone: client.phone || '0000000000',
      city: client.city || 'N/A',
      country: client.country || 'EG',
      state: client.governorate || 'N/A'
    };

    try {
      paymentKey = await generatePaymentKey(authToken, order.id, amountCents, billingData);
    } catch (err) {
      throw new AppError(`Paymob payment key generation failed: ${err.message}`, 502);
    }

    if (!paymentKey || !paymentKey.token) {
      throw new AppError('Paymob did not return a payment token', 502);
    }

    return {
      checkoutUrl: `https://accept.paymob.com/api/acceptance/iframes/${config.paymob.iframeId}?payment_token=${paymentKey.token}`,
      amount: invoice.value,
      currency: 'EGP',
      orderId: order.id.toString()
    };
  }

  validateWebhook(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new AppError('Invalid webhook payload', 400);
    }

    if (!config.paymob.hmacSecret) {
      throw new AppError('PAYMOB_HMAC_SECRET not configured', 500);
    }

    const transactionId = payload.id?.toString();
    const invoiceId = payload.order?.merchant_order_id?.toString();
    const integrationId = payload.integration_id?.toString();

    if (!transactionId) {
      throw new AppError('Missing transaction id', 400);
    }

    if (!invoiceId) {
      throw new AppError('Missing invoice id', 400);
    }

    if (typeof payload.success !== 'boolean' || typeof payload.pending !== 'boolean') {
      throw new AppError('Invalid webhook status flags', 400);
    }

    if (!validateWebhookHMAC(payload, config.paymob.hmacSecret)) {
      throw new AppError('Invalid webhook signature', 401);
    }

    if (integrationId && integrationId !== config.paymob.integrationId) {
      throw new AppError('Webhook integration_id mismatch', 400);
    }

    return true;
  }

  parseWebhook(payload) {
    const transactionId = payload?.id?.toString();
    const invoiceId = payload?.order?.merchant_order_id?.toString();

    if (!transactionId || !invoiceId) {
      throw new AppError('Malformed webhook payload', 400);
    }

    return {
      payload,
      transactionId,
      invoiceId,
      orderId: payload?.order?.id?.toString() || null,
      amount: (parseInt(payload?.amount_cents, 10) || 0) / 100,
      currency: payload?.currency || 'EGP',
      paymentMethod: payload?.source_data?.type || null,
      success: payload?.success,
      pending: payload?.pending
    };
  }

  determinePaymentStatus(event) {
    return event.success === true && event.pending === false
      ? PAYMENT_STATUS.PAID
      : PAYMENT_STATUS.FAILED;
  }

  getAllowedTransitions(targetStatus) {
    return Object.keys(PAYMENT_TRANSITIONS).filter((currentStatus) =>
      this.canTransitionTo(currentStatus, targetStatus)
    );
  }

  canTransitionTo(currentStatus, nextStatus) {
    return Boolean(PAYMENT_TRANSITIONS[currentStatus]?.[nextStatus]);
  }

  async createPaymentRecord(event, paymentStatus = this.determinePaymentStatus(event)) {
    const paymentData = {
      invoice: event.invoiceId,
      transactionId: event.transactionId,
      orderId: event.orderId || null,
      amount: event.amount,
      currency: event.currency,
      status: paymentStatus,
      paymentMethod: event.paymentMethod,
      paymobResponse: event.payload,
      processedAt: new Date()
    };

    return Payment.create(paymentData);
  }

  async persistPayment(event, paymentStatus = this.determinePaymentStatus(event)) {
    try {
      await this.createPaymentRecord(event, paymentStatus);
      return { alreadyProcessed: false };
    } catch (err) {
      if (err.code === 11000) {
        logger.info('Webhook idempotent skip: duplicate transactionId', {
          transactionId: event.transactionId
        });
        return { alreadyProcessed: true };
      }

      throw err;
    }
  }

  async updateInvoicePaymentStatus({
    invoiceId,
    paymentStatus,
    transactionId = null,
    paymentMethod = null,
    paidAt = null
  }) {
    if (!invoiceId) {
      throw new AppError('Invoice id is required', 400);
    }

    if (!Object.keys(PAYMENT_TRANSITIONS).includes(paymentStatus)) {
      throw new AppError('Invalid payment status transition', 400);
    }

    const allowedCurrentStatuses = this.getAllowedTransitions(paymentStatus);

    if (allowedCurrentStatuses.length === 0) {
      throw new AppError('Invalid payment status transition', 400);
    }

    const updateSet = { paymentStatus };

    if (transactionId !== null) {
      updateSet.paymentTransactionId = transactionId;
    }

    if (paymentMethod !== null) {
      updateSet.paymentMethod = paymentMethod;
    }

    if (paidAt !== null) {
      updateSet.paid_at = paidAt;
    }

    return Invoice.findOneAndUpdate(
      { _id: invoiceId, paymentStatus: { $in: allowedCurrentStatuses } },
      { $set: updateSet },
      { new: true, runValidators: true }
    );
  }

  async applyInvoiceUpdate(event, paymentStatus = this.determinePaymentStatus(event)) {
    return this.updateInvoicePaymentStatus(
      paymentStatus === PAYMENT_STATUS.PAID
        ? {
            invoiceId: event.invoiceId,
            paymentStatus,
            transactionId: event.transactionId,
            paymentMethod: PAYMENT_METHOD.PAYMOB,
            paidAt: new Date()
          }
        : {
            invoiceId: event.invoiceId,
            paymentStatus
          }
    );
  }

  async processPaymentEvent(event) {
    const { transactionId, invoiceId } = event;
    const paymentStatus = this.determinePaymentStatus(event);

    const persistResult = await this.persistPayment(event, paymentStatus);
    if (persistResult.alreadyProcessed) {
      return { received: true, alreadyProcessed: true };
    }

    const updatedInvoice = await this.applyInvoiceUpdate(event, paymentStatus);

    if (updatedInvoice) {
      logger.info('Invoice payment updated', {
        transactionId,
        invoiceId,
        paymentStatus
      });
    } else {
      logger.info('Invoice payment event ignored because invoice is already settled', {
        invoiceId,
        transactionId,
        paymentStatus
      });
    }

    return { received: true, processed: true };
  }

  async handleWebhook(payload) {
    this.validateWebhook(payload);
    const event = this.parseWebhook(payload);
    return this.processPaymentEvent(event);
  }

  async verifyTransaction(transactionId) {
    let paymobResult;
    try {
      const authToken = await authenticatePaymob();
      paymobResult = await verifyTransaction(authToken, transactionId);
    } catch (err) {
      throw new AppError(`Paymob verification failed: ${err.message}`, 502);
    }

    return {
      transactionId,
      success: paymobResult.success,
      amount: paymobResult.amount_cents
        ? parseInt(paymobResult.amount_cents, 10) / 100
        : null,
      currency: paymobResult.currency,
      status: this.determinePaymentStatus({
        success: paymobResult.success,
        pending: paymobResult.pending ?? false
      }),
      paymentMethod: paymobResult.source_data?.type || null
    };
  }

  async getPaymentByInvoice(invoiceId) {
    return Payment.findOne({ invoice: invoiceId }).sort({ createdAt: -1 });
  }
}

module.exports = new PaymentService();
