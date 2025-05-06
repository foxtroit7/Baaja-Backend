const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: String,
  body: String,
  user_id: String,
  artist_id: String,
  booking_id: String,
  type: {
    type: String,
    enum: [
      "booking_cancelled",
      "booking_created",
      "booking_updated",
      "booking_status_changed"
    ]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
