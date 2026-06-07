const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['pending', 'processing', 'paid', 'failed'];

const paymentSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  transactionId: {
    type: String,
    default: null,
    sparse: true,
    unique: true
  },
  orderId: {
    type: String,
    default: null
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EGP'
  },
  status: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    default: null
  },
  paymobResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  processedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

paymentSchema.index({ invoice: 1 });
paymentSchema.index({ orderId: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Payment, paymentSchema, PAYMENT_STATUSES };
