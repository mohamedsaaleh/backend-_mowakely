const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  method: {
    type: String,
    enum: ['paypal', 'bank_transfer', 'stripe'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  providerRef: {
    type: String
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  settledAt: {
    type: Date
  },
  failureReason: {
    type: String
  }
}, {
  timestamps: true
});

payoutSchema.index({ lawyer: 1 });
payoutSchema.index({ invoice: 1 });
payoutSchema.index({ status: 1 });

const Payout = mongoose.model('Payout', payoutSchema);

module.exports = { Payout, payoutSchema };