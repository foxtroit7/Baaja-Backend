// models/PendingArtistUpdate.js
const mongoose = require('mongoose');

const pendingUpdateSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  update_type: { type: String, enum: ['details', 'clip'], required: true },
  original_data: { type: mongoose.Schema.Types.Mixed, required: true },
  updated_data: { type: mongoose.Schema.Types.Mixed, required: true },
  fields_changed: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  admin_remarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('PendingArtistUpdate', pendingUpdateSchema);
