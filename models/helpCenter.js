const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    question: {type: String, required: true},
    answer: {type: String, required: true}
  
  }, { timestamps: true });

module.exports = mongoose.model('help_center', categorySchema);
