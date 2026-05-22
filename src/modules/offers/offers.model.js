const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  delivery_time: {
    type: Number,
    min: 1
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  applied_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

offerSchema.index({ case: 1 });
offerSchema.index({ lawyer: 1 });
offerSchema.index({ status: 1 });
offerSchema.index({ applied_at: -1 });
offerSchema.index({ case: 1, lawyer: 1 }, { unique: true });

const Offer = mongoose.model('Offer', offerSchema);

module.exports = { Offer, offerSchema };