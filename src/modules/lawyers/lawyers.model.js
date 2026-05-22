const mongoose = require('mongoose');

const lawyerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  years_of_experience: {
    type: Number,
    default: 0,
    min: 0
  },
  office_address: {
    type: String,
    trim: true
  },
  availability_status: {
    type: Boolean,
    default: true
  },
  rate: {
    type: Number,
    default: 0,
    min: 0
  },
  total_reviews: {
    type: Number,
    default: 0,
    min: 0
  },
  offers_count: {
    type: Number,
    default: 0,
    min: 0
  },
  subscription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

lawyerSchema.index({ availability_status: 1 });
lawyerSchema.index({ specialization: 1 });
lawyerSchema.index({ rate: -1 });
lawyerSchema.index({ total_reviews: -1 });

const Lawyer = mongoose.model('Lawyer', lawyerSchema);

module.exports = { Lawyer, lawyerSchema };