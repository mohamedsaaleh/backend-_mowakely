const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['offer_received', 'offer_accepted', 'new_message', 'review_added', 'admin_message'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

notificationSchema.index({ user: 1, is_read: 1 });
notificationSchema.index({ created_at: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification, notificationSchema };