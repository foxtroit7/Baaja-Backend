const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  bannerId: { 
    type: String, 
    unique: true 
  }, // Unique 5-digit ID
  type: { type: String, required: true },
  category: { 
    type: String,  
    required: true,   
    enum: ['Gitar', 'Sitar', 'Band', 'Tabla', 'Flute'], 
    message: '{VALUE} is not a valid baajaName',
  },
  description: { type: String, required: true },
  socialMediaLink: { type: String, required: true },
  photo: { type: String },
  startTime: { type: Date },
  endTime: { type: Date }
}, { timestamps: true });

// Middleware to generate a 5-digit random bannerId
userSchema.pre('save', function(next) {
  if (!this.bannerId) {
    this.bannerId = Math.floor(10000 + Math.random() * 90000).toString(); // Generate 5-digit number
  }
  next();
});

module.exports = mongoose.model('banners', userSchema);
