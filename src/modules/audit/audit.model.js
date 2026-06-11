const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetResource: {
    type: String,
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.Mixed,
  },
  oldData: {
    type: mongoose.Schema.Types.Mixed,
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  }
}, {
  timestamps: { createdAt: 'timestamp', updatedAt: false }
});

// Indexing for faster querying in the dashboard
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ targetResource: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog, auditLogSchema };
