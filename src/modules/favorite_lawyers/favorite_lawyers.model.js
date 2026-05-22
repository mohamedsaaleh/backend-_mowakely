const mongoose = require('mongoose');

const favoriteLawyerSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lawyer',
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

favoriteLawyerSchema.index({ client: 1 });
favoriteLawyerSchema.index({ lawyer: 1 });
favoriteLawyerSchema.index({ client: 1, lawyer: 1 }, { unique: true });

const FavoriteLawyer = mongoose.model('FavoriteLawyer', favoriteLawyerSchema);

module.exports = { FavoriteLawyer, favoriteLawyerSchema };