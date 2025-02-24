// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true},
  pin: { type: String, required: true },
  otp: { type: String}, 
  isVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model('services', userSchema);
