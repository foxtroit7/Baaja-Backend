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
  categoryType: {
    type: String,
    required: true,
  },
  profileName: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    unique: true, // Ensure userId is unique
  },
}, {
  timestamps: true, // Automatically add createdAt and updatedAt fields
});

// Pre-save middleware to automatically generate a unique userId
topBaajaSchema.pre('save', function (next) {
  if (!this.userId) { // If userId is not already set
    this.userId = `ARIST${Math.floor(100000 + Math.random() * 900000)}`; 
  }
  next();
});

// Create the model
const TopBaaja = mongoose.model('top_baaja', topBaajaSchema);

module.exports = TopBaaja;
