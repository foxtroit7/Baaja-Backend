const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/verifyToken");
const Notification = require("../models/pushNotification");
const User = require("../models/userModel");

router.get("/push-notifications", verifyToken, async (req, res) => {
  try {
    const { user_id } = req.query;

    let filter = {};

    if (user_id) {
      // ✅ Check using string user_id
      const userExists = await User.findOne({ user_id: user_id });

      if (!userExists) {
        return res.status(404).json({ success: false, error: "User not found" });
      }

      // ✅ Filter notifications by user_id if user exists
      filter.user_id = user_id;
    }

    const notifications = await Notification.find(filter).sort({ timestamp: -1 });

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
});

module.exports = router;
