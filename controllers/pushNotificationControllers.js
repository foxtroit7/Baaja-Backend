const Notification = require("../models/pushNotification");
const admin = require("../middlewares/firebase");
const User = require("../models/userModel");
const Artist = require("../models/artistModel")
const ArtistDetails = require("../models/artistDetailsModel")
const Booking = require("../models/bookingModal")
const sendNotification = async ({
  title = "",
  body = "",
  type = "",
  booking_id = "",
  artist_id = "",
  user_id = "",
  imageUrl = "" // ✅ Add imageUrl support
}) => {
  try {
    let targetToken = null;

    if (user_id) {
      const user = await User.findOne({
        user_id,
        fcm_token: { $exists: true, $ne: null }
      });
      if (!user) return { message: "User with valid FCM token not found", count: 0 };
      targetToken = user.fcm_token;
    } 
     else if (artist_id) {
  const artist = await Artist.findOne({
    user_id: artist_id, // ✅ fix here
    fcm_token: { $exists: true, $ne: null }
  });
  if (!artist) return { message: "Artist with valid FCM token not found", count: 0 };
  targetToken = artist.fcm_token;
}

    if (!targetToken) return { message: "No valid FCM token found", count: 0 };

    // ✅ Build Firebase message with optional image
    const message = {
      token: targetToken,
      notification: {
        title: title || "Notification",
        body: body || "",
        ...(imageUrl && { imageUrl }) // ✅ Image in standard field
      },
      data: {
        type,
        user_id: user_id || "",
        artist_id: artist_id || "",
        booking_id: booking_id || ""
      },
      ...(imageUrl && {
        android: {
          notification: {
            imageUrl
          }
        },
        apns: {
          payload: {
            aps: {
              "mutable-content": 1
            }
          },
          fcm_options: {
            image: imageUrl
          }
        }
      })
    };

    await admin.messaging().send(message);

    // ✅ Save to database
    await Notification.create({
      title,
      body,
      user_id,
      artist_id,
      booking_id,
      type,
      imageUrl
    });

    return { message: "Notification sent", count: 1 };
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
  }
};
// const sendArtistApprovalNotification = async (userId) => {
//   try {
//     // ✅ Search ArtistDetails using user_id
//     const artist = await ArtistDetails.findOne({ user_id: userId })
//       .populate("user_id", "fcm_token name");

//     if (!artist) {
//       return { message: "Artist not found", count: 0 };
//     }

//     if (!artist.user_id || !artist.user_id.fcm_token) {
//       return { message: "No valid FCM token for this artist", count: 0 };
//     }

//     const title = "Approved 🎉";
//     const body = `Congratulations ${artist.profile_name}! Your request has been approved.`;

//     return await sendNotification({
//       title,
//       body,
//       type: "artist_approved",
//       user_id: artist.user_id 
//     });
//   } catch (error) {
//     console.error("Approval Notification Error:", error);
//     throw error;
//   }
// };

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};
module.exports = { sendNotification};