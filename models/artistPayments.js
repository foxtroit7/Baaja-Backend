const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
  user_id: { type: String},
  first_day_booking: { type: Number },
  second_day_booking: { type: Number },
  third_day_booking: { type: Number },
  fourth_day_booking: { type: Number },
  fifth_day_booking: { type: Number },
  sixth_day_booking: { type: Number },
  seventh_day_booking: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('artist_payments', userSchema);
