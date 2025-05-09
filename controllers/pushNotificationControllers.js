const Notification = require("../models/pushNotification");
const admin = require("../middlewares/firebase");
const User = require("../models/userModel");
const Artist = require("../models/artistModel")


const sendNotification = async ({ title = "", body = "", type = "", booking_id = "", artist_id = "", user_id = "" }) => {
  try {
    let targetToken = null;

    // ✅ Check if user_id is provided – send to user
    if (user_id) {
      const user = await User.findOne({
        user_id,
        fcm_token: { $exists: true, $ne: null }
      });
      if (!user) return { message: "User with valid FCM token not found", count: 0 };
      targetToken = user.fcm_token;
    }

    // ✅ Else if artist_id is provided – send to artist
    else if (artist_id) {
      const artist = await Artist.findOne({
        user_id: artist_id, // assuming artist's unique ID is stored as `user_id` in artist model
        fcm_token: { $exists: true, $ne: null }
      });
      if (!artist) return { message: "Artist with valid FCM token not found", count: 0 };
      targetToken = artist.fcm_token;
    }

    // If no token found
    if (!targetToken) return { message: "No valid FCM token found", count: 0 };

    // ✅ Build Firebase message
    const message = {
      token: targetToken,
      notification: {
        title: title || "Notification",
        body: body || ""
      },
      data: {
        type,
        user_id: user_id || "",
        artist_id: artist_id || "",
        booking_id: booking_id || ""
      }
    };

    // ✅ Send and store notification
    await admin.messaging().send(message);

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