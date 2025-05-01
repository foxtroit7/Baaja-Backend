const Notification = require("../models/pushNotification");
const admin = require("../middlewares/firebase");
const User = require("../models/userModel");

exports.sendNotificationToAll = async (req, res) => {
  const { title = "", body = "", type = "", booking_id = "", artist_id = "" } = req.body;

  try {
    // Find all users with valid FCM token
    const users = await User.find({ fcm_token: { $exists: true, $ne: null } });

    if (!users.length) {
      return res.status(404).json({ error: "No users with FCM token found" });
    }

    const notifications = [];

    // Send and store notification per user
    for (const user of users) {
      const message = {
        token: user.fcm_token,
        notification: {
          title: title || "New Notification",
          body: body || ""
        },
        data: {
          type,
          user_id: user.user_id || "",
          artist_id,
          booking_id
        }
      };

      try {
        await admin.messaging().send(message);
      } catch (err) {
        console.warn(`Failed to send to ${user.user_id}:`, err.message);
        continue;
      }

      notifications.push({
        title,
        body,
        user_id: user.user_id || "",
        artist_id,
        booking_id,
        type
      });
    }

    // Bulk insert notifications
    await Notification.insertMany(notifications);

    res.status(200).json({
      message: "Notification sent to all users with FCM token",
      count: notifications.length
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
};


exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
