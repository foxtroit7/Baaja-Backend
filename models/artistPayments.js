const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
  user_id: { type: String},
  first_day_booking: { type: Number, default: 0 },
  second_day_booking: { type: Number, default: 0 },
  third_day_booking: { type: Number, default: 0 },
  fourth_day_booking: { type: Number, default: 0 },
  fifth_day_booking: { type: Number, default: 0 },
  sixth_day_booking: { type: Number, default: 0 },
  seventh_day_booking: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('artist_payments', userSchema);
