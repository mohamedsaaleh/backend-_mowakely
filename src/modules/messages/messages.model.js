const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 5000
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

messageSchema.index({ case_id: 1, created_at: -1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ receiver_id: 1 });
messageSchema.index({ sender_id: 1, receiver_id: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = { Message, messageSchema };