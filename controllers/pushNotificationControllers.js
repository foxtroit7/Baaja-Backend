const Notification = require("../models/pushNotification");
const admin = require("../middlewares/firebase");
const User = require("../models/userModel");

const sendNotification = async ({ title = "", body = "", type = "", booking_id = "", artist_id = "", user_id = "" }) => {
  try {
    // Fetch the user with valid FCM token
    const user = await User.findOne({
      user_id,
      fcm_token: { $exists: true, $ne: null }
    });

    if (!user) return { message: "User with valid FCM token not found", count: 0 };

    const message = {
      token: user.fcm_token,
      notification: {
        title: title || "Notification",
        body: body || ""
      },
      data: {
        type,
        user_id,
        artist_id,
        booking_id
      }
    };

    // Send via Firebase
    await admin.messaging().send(message);

    // Store in Notification DB
    await Notification.create({
      title,
      body,
      user_id,
      artist_id,
      booking_id,
      type
    });

    return { message: "Notification sent", count: 1 };
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
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
module.exports = { sendNotification };
