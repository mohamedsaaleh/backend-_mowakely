const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    default: null
  },
  accepted_offer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    default: null
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Case title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Case description is required'],
    maxlength: 5000
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  budget: {
    type: Number,
    min: 2000
  },
  offers_count: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

caseSchema.index({ status: 1 });
caseSchema.index({ category: 1 });
caseSchema.index({ client: 1 });
caseSchema.index({ lawyer: 1 });
caseSchema.index({ created_at: -1 });
caseSchema.index({ title: 'text', description: 'text' });

const Case = mongoose.model('Case', caseSchema);

module.exports = { Case, caseSchema };