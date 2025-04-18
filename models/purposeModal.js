const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    purpose: {type: String, required: true}
  
  }, { timestamps: true });

module.exports = mongoose.model('purpose', categorySchema);
