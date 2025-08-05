const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    trim: true
  },
  description: {
    type: String,
  },
  discount: {
    type: Number,
    min: 0
  },
  applicableOn: {
    type: String,
    enum: ["full", "half", "both"], 
  },
}, {
  timestamps: true
});

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
