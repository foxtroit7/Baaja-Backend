const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema({
  user_id: { type: String},
  artist_id: { type: String},
  artist_details: { type: Object },
  booking_id: { type: String, unique: true },
  schedule_date_start: { type: Date },
  schedule_date_end: {type: Date},
  booking_date: { type: Date, default: Date.now },
  shift: { type: String },
  scheduled_time: { type: String },
  booking_time: { type: String },
  custom_booking_time: {type: String},
  purpose: { type: String},
  full_name: { type: String },
  organization: { type: String },
  address: { type: String },
  district: { type: String },
  pincode: { type: String },
  state: { type: String },
  landmark: { type: String },
  phone_number: { type: Number },
  alternate_number: { type: Number },
  adhaar_number: { type: String },
  advance_price: {type: Number},
  total_price: {type: Number},
  advance_price: {type: Number},
  pending_price: { type: Number },
  booking_rating: {type: Boolean, default: false},
  payment_status: { type: String, enum: ["pending", "partial", "completed"], default: "pending" },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  required_items: { type: [String]},
  status: { type: String, enum: ["pending", "accepted", "completed", "rejected"], default: "pending" },
  artistRejected: { type: Boolean, default: false },
  adminRejected: { type: Boolean, default: false },
  userRejected: {type: Boolean, default: false},
  razorpay_order: { type: Object},
  payments: {type: Object}
}, { timestamps: true });

// Pre-save middleware to automatically generate a unique booking_id
bookingSchema.pre('save', function (next) {
  if (!this.booking_id) {
    this.booking_id = `BOOK${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

module.exports = mongoose.model('bookings', bookingSchema);
