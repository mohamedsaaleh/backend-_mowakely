const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    default: null
  },
  file_url: {
    type: String,
    required: [true, 'File URL is required']
  },
  file_type: {
    type: String,
    required: [true, 'File type is required']
  },
  related_type: {
    type: String,
    enum: ['case', 'verification', 'profile'],
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

fileSchema.index({ uploaded_by: 1 });
fileSchema.index({ case: 1 });
fileSchema.index({ related_type: 1 });

const File = mongoose.model('File', fileSchema);

module.exports = { File, fileSchema };