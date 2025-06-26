

const express = require("express");
const router = express.Router();
const admin = require("../middlewares/firebase"); 
const Notification = require("../models/adminNotification"); 
const User = require("../models/userModel"); 
const Artist = require("../models/artistModel"); 
const upload = require("../middlewares/upload"); 
// Use 'upload.single' to handle image upload
router.post("/admin-notifications", upload.single("image"), async (req, res) => {
  const { title, body, recipientType } = req.body;
  const imagePath = req.file ? req.file.path : null;
  const imageUrl = imagePath ? `http://localhost:5000/${imagePath}` : null; // Adjust this base URL

  try {
    let tokens = [];

    if (recipientType === "users" || recipientType === "both") {
      const users = await User.find({ fcm_token: { $exists: true, $ne: null } });
      tokens.push(...users.map(u => u.fcm_token));
    }

    if (recipientType === "artists" || recipientType === "both") {
      const artists = await Artist.find({ fcm_token: { $exists: true, $ne: null } });
      tokens.push(...artists.map(a => a.fcm_token));
    }

    if (tokens.length === 0) {
      return res.status(400).json({ success: false, error: "No valid tokens found" });
    }

    const baseMessage = {
      notification: { title, body },
      ...(imageUrl && {
        android: { notification: { imageUrl } },
        apns: {
          payload: { aps: { "mutable-content": 1 } },
          fcm_options: { image: imageUrl }
        }
      })
    };

    let successCount = 0;
    let failureCount = 0;

    for (const token of tokens) {
      try {
        await admin.messaging().send({ ...baseMessage, token });
        successCount++;
      } catch (err) {
        console.error("Failed to send to:", token, err);
        failureCount++;
      }
    }

    await Notification.create({ title, body, imageUrl, recipientType, sentTo: tokens.length });

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