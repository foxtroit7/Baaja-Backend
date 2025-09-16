const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
  user_id: { type: String },

  // Normal weekly pricing
  first_day_booking: { type: Number },
  second_day_booking: { type: Number },
  third_day_booking: { type: Number },
  fourth_day_booking: { type: Number },
  fifth_day_booking: { type: Number },
  sixth_day_booking: { type: Number },
  seventh_day_booking: { type: Number },

  // Hot selling days (special custom dates with different pricing)
  hot_selling_days: [
    {
      date: { type: Date, required: true },   // Exact date (e.g. 2025-08-15)
      price: { type: Number, required: true }, // Special price for that day
      note: { type: String }                   // Optional description (e.g. "Independence Day special")
    }
  ]

}, { timestamps: true });

// Format date output
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.hot_selling_days) {
      ret.hot_selling_days = ret.hot_selling_days.map(day => ({
        ...day,
        date: day.date.toISOString().split('T')[0]  // → "2025-08-15"
      }));
    }
    return ret;
  }

module.exports = mongoose.model('artist_payments', userSchema);