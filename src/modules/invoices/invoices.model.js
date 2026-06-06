const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'cancelled', 'completed'],
    default: 'pending'
  },
  value: {
    type: Number,
    required: [true, 'Value is required'],
    min: 0
  },
  paid_at: {
    type: Date,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['manual', 'paymob'],
    default: 'manual'
  },
  paymentTransactionId: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentOverrides: [
    {
      type: {
        type: String,
        enum: ['manual_admin_override'],
        required: true
      },
      adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      reason: {
        type: String,
        required: true,
        trim: true
      }
    }
  ]
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

invoiceSchema.index({ lawyer: 1 });
invoiceSchema.index({ case: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ paymentStatus: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = { Invoice, invoiceSchema };
