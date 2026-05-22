const mongoose = require('mongoose');

const lawyerVerificationSchema = new mongoose.Schema({
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  national_id_photo: {
    type: String,
    required: [true, 'National ID photo is required']
  },
  lawyer_license_photo: {
    type: String,
    required: [true, 'Lawyer license photo is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  reviewed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

lawyerVerificationSchema.index({ lawyer: 1 });
lawyerVerificationSchema.index({ status: 1 });
lawyerVerificationSchema.index({ lawyer: 1 }, { unique: true });

const LawyerVerification = mongoose.model('LawyerVerification', lawyerVerificationSchema);

module.exports = { LawyerVerification, lawyerVerificationSchema };