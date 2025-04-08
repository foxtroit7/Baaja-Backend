const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  banner_id: { 
    type: String, 
    unique: true 
  }, // Unique 5-digit ID
  type: { type: String, required: true },
  category: { 
    type: String,  
    required: true,   
  },
  description: { type: String},
  socialMediaLink: { type: String },
  photo: { type: String },
  startTime: { type: Date },
  endTime: { type: Date }
}, { timestamps: true });

// Middleware to generate a 5-digit random banner_id
userSchema.pre('save', function(next) {
  if (!this.banner_id) {
    this.banner_id = Math.floor(10000 + Math.random() * 90000).toString(); // Generate 5-digit number
  }
  next();
});

module.exports = mongoose.model('banners', userSchema);
