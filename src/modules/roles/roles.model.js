const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  permissions: [{
    type: String,
  }],
  isSystemRole: {
    type: Boolean,
    default: false,
    description: 'System roles cannot be deleted or renamed'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Role = mongoose.model('Role', roleSchema);

module.exports = { Role, roleSchema };
