// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  emailId: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  gender: { type: String, required: true }, 
  adharNumber: { type: String },
  adharPhoto: {type: String},
  userPhoto: {type: String}
});

module.exports = mongoose.model('user_details', userSchema);
