const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  lawyer_reviewed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Rating is required']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

reviewSchema.index({ reviewer: 1, case: 1 }, { unique: true });
reviewSchema.index({ lawyer_reviewed: 1 });
reviewSchema.index({ case: 1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = { Review, reviewSchema };