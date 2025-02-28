// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true, // Ensure the userId is unique
},
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true},
  pin: { type: String, required: true },
  otp: { type: String}, 
  isVerified: { type: Boolean, default: false },
    status: {
        type: Boolean,
        default: false, // Default to false (logged out)
    }
});
// Pre-save middleware to automatically generate a unique userId
userSchema.pre('save', function (next) {
  if (!this.userId) { // If userId is not already set
      this.userId = `USER${Math.floor(100000 + Math.random() * 900000)}`; 
  }
  next();
});
const User = module.exports = mongoose.model('services', userSchema);
module.exports = User;