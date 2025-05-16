const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: String,
  body: String,
  imageUrl: String,
  recipientType: { type: String, enum: ["users", "artists", "both"], default: "both" },
  sentTo: Number,
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Admin Notification", notificationSchema);
