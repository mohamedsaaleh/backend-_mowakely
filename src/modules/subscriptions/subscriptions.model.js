const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  subscription_status: {
    type: String,
    enum: ['subscribed', 'expired', 'cancelled'],
    default: 'subscribed'
  },
  subscription_expires_at: {
    type: Date,
    default: null
  },
  paid_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

subscriptionSchema.index({ lawyer: 1 });
subscriptionSchema.index({ subscription_status: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = { Subscription, subscriptionSchema };