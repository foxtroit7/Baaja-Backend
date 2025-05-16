

const express = require("express");
const router = express.Router();
const admin = require("../middlewares/firebase"); // Firebase Admin SDK
const Notification = require("../models/adminNotification"); // Model for saving logs
const User = require("../models/userModel"); // Model for user data (contains FCM tokens)
const Artist = require("../models/artistModel"); // Model for artist data (contains FCM tokens)

router.post("/admin-notifications", async (req, res) => {
  const { title, body, imageUrl, recipientType } = req.body;

  try {
    let tokens = [];

    // Collect tokens for users if the recipientType is 'users' or 'both'
    if (recipientType === "users" || recipientType === "both") {
      const users = await User.find({ fcm_token: { $exists: true, $ne: null } });
      tokens.push(...users.map(u => u.fcm_token));
    }

    // Collect tokens for artists if the recipientType is 'artists' or 'both'
    if (recipientType === "artists" || recipientType === "both") {
      const artists = await Artist.find({ fcm_token: { $exists: true, $ne: null } });
      tokens.push(...artists.map(a => a.fcm_token));
    }

    // If no tokens are found, return an error
    if (tokens.length === 0) {
      return res.status(400).json({ success: false, error: "No valid tokens found" });
    }

    // Prepare the message for the notification
    const message = {
      notification: { title, body },
      ...(imageUrl && { android: { notification: { imageUrl } } }), // Add image if provided
    };

    let successCount = 0;
    let failureCount = 0;

    // Send notification to each token individually
    for (const token of tokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
      } catch (error) {
        console.error("Failed to send notification to token:", token, error);
        failureCount++;
      }
    }

    // Save the notification log in the database (optional)
    await Notification.create({ title, body, imageUrl, recipientType, sentTo: tokens.length });

    // Respond with success details
    res.status(200).json({ success: true, sent: successCount, failed: failureCount });
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({ success: false, error: "Failed to send notification" });
  }
});

module.exports = router;

// GET /api/notifications
router.get("/admin-notifications", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ sentAt: -1 }); // most recent first
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});
module.exports = router;