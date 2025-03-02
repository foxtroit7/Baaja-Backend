const mongoose = require('mongoose');

// Define the TopBaaja schema
const topBaajaSchema = new mongoose.Schema({
  rating: {
    type: String,
    required: true,
  },
  photo: {
    type: String,
  },
  category_type: {
    type: String,
    required: true,
  },
  profile_name: {
    type: String,
    required: true,
  },
  user_id: {
    type: String,
    unique: true, // Ensure user_id is unique
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Pre-save middleware to automatically generate a unique user_id
topBaajaSchema.pre('save', function (next) {
  if (!this.user_id) { // If user_id is not already set
    this.user_id = `ARIST${Math.floor(100000 + Math.random() * 900000)}`; 
  }
  next();
});

// Create the model
const TopBaaja = mongoose.model('top_baaja', topBaajaSchema);

module.exports = TopBaaja;
