// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    unique: true, // Ensure the user_id is unique
},
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone_number: { type: String, required: true},
  pin: { type: String, required: true },
  otp: { type: String}, 
  is_verified: { type: Boolean, default: false },
    status: {
        type: Boolean,
        default: false, // Default to false (logged out)
    }
});
// Pre-save middleware to automatically generate a unique user_id
userSchema.pre('save', function (next) {
  if (!this.user_id) { // If user_id is not already set
      this.user_id = `USER${Math.floor(100000 + Math.random() * 900000)}`; 
  }
  next();
});
const User = module.exports = mongoose.model('services', userSchema);
module.exports = User;