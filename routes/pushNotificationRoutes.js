const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/verifyToken");
const Notification = require("../models/pushNotification");
const User = require("../models/userModel");
const Artist = require("../models/artistModel")

router.get("/push-notifications", verifyToken, async (req, res) => {
  try {
    const { user_id, artist_id } = req.query;

    let filter = {};

    if (user_id) {
      // Check in User model
      const userExists = await User.findOne({ user_id });

      if (!userExists) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      filter.user_id = user_id; // For notifications
    }

    if (artist_id) {
      // Check in Artist model where field is user_id
      const artistExists = await Artist.findOne({ user_id: artist_id });

      if (!artistExists) {
        return res.status(404).json({ success: false, error: "Artist not found" });
      }

      filter.artist_id = artist_id; // For notifications
    }

    const notifications = await Notification.find(filter).sort({ timestamp: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});


module.exports = router;
