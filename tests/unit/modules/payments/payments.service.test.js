jest.mock('../../../../src/modules/payments/paymob.client', () => ({
  authenticatePaymob: jest.fn(),
  createPaymobOrder: jest.fn(),
  generatePaymentKey: jest.fn(),
  verifyTransaction: jest.fn(),
  validateWebhookHMAC: jest.fn()
}));

jest.mock('../../../../src/config/env', () => ({
  paymob: {
    hmacSecret: 'test-hmac-secret',
    integrationId: '999',
    iframeId: 123
  }
}));

jest.mock('../../../../src/modules/payments/payments.model', () => ({
  Payment: {
    create: jest.fn(),
    findOne: jest.fn()
  }
}));

jest.mock('../../../../src/modules/invoices/invoices.model', () => ({
  Invoice: {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn()
  }
}));

jest.mock('../../../../src/modules/clients/clients.model', () => ({
  Client: {
    findOne: jest.fn()
  }
}));

jest.mock('../../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

const constants = require('../../../../src/constants');
const paymentService = require('../../../../src/modules/payments/payments.service');
const { Payment } = require('../../../../src/modules/payments/payments.model');
const { Invoice } = require('../../../../src/modules/invoices/invoices.model');
const { Client } = require('../../../../src/modules/clients/clients.model');
const { authenticatePaymob, createPaymobOrder, generatePaymentKey, verifyTransaction, validateWebhookHMAC } = require('../../../../src/modules/payments/paymob.client');
const logger = require('../../../../src/utils/logger');
const { AppError } = require('../../../../src/middlewares/error.middleware');

describe('PaymentService', () => {
  const buildPayload = (overrides = {}) => ({
    id: 'trx-12345',
    amount_cents: 450000,
    currency: 'EGP',
    success: true,
    pending: false,
    integration_id: 999,
    order: {
      id: 'order-123',
      merchant_order_id: 'invoice-123'
    },
    source_data: {
      type: 'card'
    },
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
    validateWebhookHMAC.mockReturnValue(true);
    Payment.create.mockResolvedValue({ _id: 'payment-1' });
    Payment.findOne.mockResolvedValue(null);
    Invoice.findOneAndUpdate.mockResolvedValue({ _id: 'invoice-1' });
    Invoice.findById.mockResolvedValue({
      _id: 'invoice-1',
      value: 4500,
      paymentStatus: constants.PAYMENT_STATUS.PENDING,
      status: constants.INVOICE_STATUS.PENDING
    });
    Client.findOne.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        user: { fullName: 'Test Client', email: 'client@example.com' },
        phone: '0100000000',
        city: 'Cairo',
        country: 'EG',
        governorate: 'Cairo'
      })
    });
    authenticatePaymob.mockResolvedValue('auth-token');
    createPaymobOrder.mockResolvedValue({ id: 'order-123' });
    generatePaymentKey.mockResolvedValue({ token: 'payment-token' });
    verifyTransaction.mockResolvedValue({
      success: true,
      amount_cents: 450000,
      currency: 'EGP',
      source_data: { type: 'card' }
    });
  });

  test('valid webhook success', async () => {
    const payload = buildPayload();

    const result = await paymentService.handleWebhook(payload);

    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
      transactionId: 'trx-12345',
      invoice: 'invoice-123',
      status: constants.PAYMENT_STATUS.PAID
    }));
    expect(Invoice.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'invoice-123',
        paymentStatus: { $in: [constants.PAYMENT_STATUS.PENDING, constants.PAYMENT_STATUS.FAILED] }
      },
      {
        $set: expect.objectContaining({
          paymentStatus: constants.PAYMENT_STATUS.PAID,
          paymentTransactionId: 'trx-12345',
          paymentMethod: constants.PAYMENT_METHOD.PAYMOB
        })
      },
      expect.objectContaining({ new: true, runValidators: true })
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Invoice payment updated',
      expect.objectContaining({
        transactionId: 'trx-12345',
        invoiceId: 'invoice-123',
        paymentStatus: constants.PAYMENT_STATUS.PAID
      })
    );
  });

  test('valid webhook failed payment', async () => {
    const payload = buildPayload({ success: false, pending: false, id: 'trx-222' });

    const result = await paymentService.handleWebhook(payload);

    expect(result).toEqual({ received: true, processed: true });
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
      transactionId: 'trx-222',
      status: constants.PAYMENT_STATUS.FAILED
    }));
    expect(Invoice.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'invoice-123',
        paymentStatus: { $in: [constants.PAYMENT_STATUS.PENDING] }
      },
      {
        $set: expect.objectContaining({
          paymentStatus: constants.PAYMENT_STATUS.FAILED
        })
      },
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  test('duplicate transaction idempotency', async () => {
    Payment.create.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 11000 }));

    const payload = buildPayload({ id: 'trx-dup' });
    const result = await paymentService.handleWebhook(payload);

    expect(result).toEqual({ received: true, alreadyProcessed: true });
    expect(Invoice.findOneAndUpdate).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'Webhook idempotent skip: duplicate transactionId',
      expect.objectContaining({ transactionId: 'trx-dup' })
    );
  });

  test('invalid HMAC', async () => {
    validateWebhookHMAC.mockReturnValue(false);

    await expect(paymentService.handleWebhook(buildPayload())).rejects.toThrow(AppError);
    expect(Payment.create).not.toHaveBeenCalled();
    expect(Invoice.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('integration_id mismatch', async () => {
    const payload = buildPayload({ integration_id: 123 });

    await expect(paymentService.handleWebhook(payload)).rejects.toThrow('Webhook integration_id mismatch');
    expect(Payment.create).not.toHaveBeenCalled();
    expect(Invoice.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('malformed webhook payload', () => {
    expect(() => paymentService.parseWebhook({})).toThrow('Malformed webhook payload');
  });

  test('invalid invoice id', async () => {
    const payload = buildPayload({
      order: { id: 'order-123' }
    });

    await expect(paymentService.handleWebhook(payload)).rejects.toThrow('Missing invoice id');
    expect(Payment.create).not.toHaveBeenCalled();
  });

  test('missing transaction id', async () => {
    const payload = buildPayload({ id: undefined });

    await expect(paymentService.handleWebhook(payload)).rejects.toThrow('Missing transaction id');
    expect(Payment.create).not.toHaveBeenCalled();
    expect(Invoice.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('invoice already paid transition is blocked', async () => {
    await paymentService.updateInvoicePaymentStatus({
      invoiceId: 'invoice-999',
      paymentStatus: constants.PAYMENT_STATUS.PAID,
      transactionId: 'trx-paid',
      paymentMethod: constants.PAYMENT_METHOD.PAYMOB,
      paidAt: new Date('2026-01-01T00:00:00.000Z')
    });

    expect(Invoice.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: 'invoice-999',
        paymentStatus: { $in: [constants.PAYMENT_STATUS.PENDING, constants.PAYMENT_STATUS.FAILED] }
      },
      {
        $set: expect.objectContaining({
          paymentStatus: constants.PAYMENT_STATUS.PAID,
          paymentTransactionId: 'trx-paid',
          paymentMethod: constants.PAYMENT_METHOD.PAYMOB
        })
      },
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  test('invalid payment status transition', async () => {
    await expect(paymentService.updateInvoicePaymentStatus({
      invoiceId: 'invoice-999',
      paymentStatus: constants.PAYMENT_STATUS.PENDING
    })).rejects.toThrow('Invalid payment status transition');
  });

  test('verifyTransaction success', async () => {
    verifyTransaction.mockResolvedValueOnce({
      success: true,
      pending: false,
      amount_cents: 450000,
      currency: 'EGP',
      source_data: { type: 'card' }
    });

    const result = await paymentService.verifyTransaction('trx-success');

    expect(result).toEqual(expect.objectContaining({
      transactionId: 'trx-success',
      success: true,
      status: constants.PAYMENT_STATUS.PAID,
      paymentMethod: 'card'
    }));
  });

  test('verifyTransaction failure', async () => {
    verifyTransaction.mockResolvedValueOnce({
      success: false,
      pending: true,
      amount_cents: 450000,
      currency: 'EGP',
      source_data: { type: 'card' }
    });

    const result = await paymentService.verifyTransaction('trx-failed');

    expect(result).toEqual(expect.objectContaining({
      transactionId: 'trx-failed',
      success: false,
      status: constants.PAYMENT_STATUS.FAILED,
      paymentMethod: 'card'
    }));
  });

  test('state transition rules', () => {
    expect(paymentService.determinePaymentStatus({ success: true, pending: false }))
      .toBe(constants.PAYMENT_STATUS.PAID);
    expect(paymentService.determinePaymentStatus({ success: false, pending: false }))
      .toBe(constants.PAYMENT_STATUS.FAILED);

    expect(paymentService.canTransitionTo(constants.PAYMENT_STATUS.PENDING, constants.PAYMENT_STATUS.PAID)).toBe(true);
    expect(paymentService.canTransitionTo(constants.PAYMENT_STATUS.PENDING, constants.PAYMENT_STATUS.FAILED)).toBe(true);
    expect(paymentService.canTransitionTo(constants.PAYMENT_STATUS.FAILED, constants.PAYMENT_STATUS.PAID)).toBe(true);
    expect(paymentService.canTransitionTo(constants.PAYMENT_STATUS.PAID, constants.PAYMENT_STATUS.FAILED)).toBe(false);
    expect(paymentService.canTransitionTo(constants.PAYMENT_STATUS.PAID, constants.PAYMENT_STATUS.PENDING)).toBe(false);
    expect(paymentService.canTransitionTo(constants.PAYMENT_STATUS.PAID, constants.PAYMENT_STATUS.PAID)).toBe(false);
  });
});
