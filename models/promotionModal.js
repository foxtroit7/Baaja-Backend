const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  promotion_id: { 
    type: String, 
    unique: true 
  }, // Unique 5-digit ID
  type: { type: String},
  category: { 
    type: String,  
  },
  description: { type: String},
  link: { type: String },
  photo: { type: String },
  start_time: { type: Date },
  end_time: { type: Date },
  background_color: {type: String},
  text_color: {type: String},
  position: {type: String, enum: ['top', 'middle'], 
    message: '{VALUE} is not a valid position'}
}, { timestamps: true });

// Middleware to generate a 5-digit random promotion_id
userSchema.pre('save', function(next) {
  if (!this.promotion_id) {
    this.promotion_id = `PROMO${Math.floor(100000 + Math.random() * 900000)}`; // Generate 5-digit number
  }
  next();
});

module.exports = mongoose.model('promotions', userSchema);
