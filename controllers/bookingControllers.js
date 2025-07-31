const Booking = require("../models/bookingModal");
const Artist = require("../models/artistDetailsModel");
const User = require("../models/userModel")
const razorpay = require("../services/razorPay");
const ReviewModel = require('../models/ratingModal');
const crypto = require("crypto");
const Razorpay = require("razorpay");
const moment = require("moment");
const { sendNotification } = require("../controllers/pushNotificationControllers"); 
const ArtistPayments = require('../models/artistPayments');

exports.createBooking = async (req, res) => {
  try {
    const { total_price, advance_price, payment_type,artist_id, ...otherData } = req.body;

    // Calculate pending price and payment status
    const isFullPayment = Number(total_price) === Number(advance_price);
    const pending_price = isFullPayment ? 0 : Number(total_price) - Number(advance_price);
    const payment_status = "pending";
    const amountToPay = isFullPayment ? total_price : advance_price;

    // Razorpay order creation
    const options = {
      amount: parseInt(amountToPay) * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };
    const order = await razorpay.orders.create(options);
    console.log("🎯 Razorpay Order Created:", order);
 // Fetch artist payment info from artist_payments model
    const payments = await ArtistPayments.findOne({ user_id: artist_id });
    // Create and save booking
    const newBooking = new Booking({
      total_price,
      advance_price,
      pending_price,
      payment_status,
      artist_id,
      razorpay_order_id: order.id,
      razorpay_order: order,
      ...otherData,
      payments: payments,
      booking_type: "Online Booking",
    });

    await newBooking.save();
   // 🔔 Call centralized notification service
      // ✅ Fetch artist name from User model
    const artistUser = await Artist.findOne({ user_id: artist_id });
    const artistName = artistUser ? artistUser.owner_name : 'Unknown Artist';
    const formattedDate = new Date(newBooking.schedule_date_start).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric"
});
   try {
    await sendNotification({
      title: "Booking  Created",
      body: `Booking (ID: ${newBooking.booking_id}) has been created for artist ${artistName}, scheduled on ${formattedDate} `,
      type: "booking_created",
      booking_id: newBooking.booking_id,
      user_id: newBooking.user_id,
      artist_id: newBooking.artist_id
    });
  } catch (notifyErr) {
    console.warn("Notification failed:", notifyErr.message);
  }
    res.status(201).json({
      message: "Online Booking created successfully",
      booking: newBooking,
      booking_id: newBooking.booking_id,
      order,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking", error });
  }
};
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "your_key_id",
  key_secret: process.env.RAZORPAY_SECRET || "your_secret",
});
exports.verifyPayment = async (req, res) => {
  try {
    console.log("🔹 Received Payment Verification Data:", req.body);

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const secret = process.env.RAZORPAY_SECRET || "qRRw3gYDo1yNk58IpMD1TvkQ";

    // 🔐 Signature verification
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch. Payment verification failed.");
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    // 🔄 Fetch payment from Razorpay to get paid amount
    const razorpayPayment = await razorpayInstance.payments.fetch(razorpay_payment_id);
    const paidNow = razorpayPayment.amount / 100; // Razorpay returns amount in paise (convert to INR)

    // 🔎 Fetch the booking
    const booking = await Booking.findOne({ booking_id });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    // }
    const pendingPrice = parseFloat(booking.pending_price);

    // Update booking status after payment
    booking.payment_status = pendingPrice === 0 ? "completed" : "partial";
    booking.pending_price = pendingPrice === 0 ? 0 : pendingPrice;

    // 💾 Save Razorpay details (latest payment attempt)
    booking.razorpay_order_id = razorpay_order_id;
    booking.razorpay_payment_id = razorpay_payment_id;
    booking.razorpay_signature = razorpay_signature;
    await booking.save();
// 🔔 Call centralized notification service
try {
  await sendNotification({
    title: "Booking  Payment Initiated",
    body: `Payment initiated boking (ID: ${booking.booking_id}).`,
    type: "payment_initiated",
    booking_id: booking.booking_id,
    user_id,
    artist_id
  });
} catch (notifyErr) {
  console.warn("Notification failed:", notifyErr.message);
}
    console.log("✅ Payment verified and updated for Booking ID:", booking_id);

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      booking,
    });

  } catch (error) {
    console.error("❌ Error in verifyPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.createNewOrder = async (req, res) => {
  try {
    const { amount, booking_id } = req.body;

    if (!amount || !booking_id) {
      return res.status(400).json({ success: false, message: "Amount and Booking ID are required" });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paisa
      currency: "INR",
      receipt: `receipt_${booking_id}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({ success: true, order });
  } catch (err) {
    console.error("Error in createNewOrder:", err);
    res.status(500).json({ success: false, message: "Error creating new order" });
  }
};
// offline booking
exports.createManualBooking = async (req, res) => {
  try {
    const { artist_id, paid = false, ...otherData } = req.body;

    // Create and save booking
    const newBooking = new Booking({
      artist_id,
      booking_type: "Offline Booking", // 👈 Set booking type explicitly
      status: "accepted", // 👈 Set default status as 'accepted'
      paid,
      ...otherData
    });

    await newBooking.save();

    // 🔔 Fetch artist name for notification
    const artistUser = await Artist.findOne({ user_id: artist_id });
    const artistName = artistUser ? artistUser.owner_name : 'Unknown Artist';
    const formattedDate = new Date(newBooking.schedule_date_start).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    // 🔔 Send notification
    try {
      await sendNotification({
        title: "Manual Booking Created",
        body: `Offline booking (ID: ${newBooking.booking_id}) created for ${artistName}, scheduled on ${formattedDate}`,
        type: "booking_created",
        booking_id: newBooking.booking_id,
        user_id: newBooking.user_id,
        artist_id: newBooking.artist_id
      });
    } catch (notifyErr) {
      console.warn("Notification failed:", notifyErr.message);
    }

    res.status(201).json({
      message: "Offline booking created successfully",
      booking: newBooking,
      booking_id: newBooking.booking_id
    });

  } catch (error) {
    console.error("❌ Error creating manual booking:", error);
    res.status(500).json({ message: "Error creating manual booking", error });
  }
};
// 4️⃣ Edit (Update) a booking by Booking ID
exports.updateBooking = async (req, res) => {
    try {
      const { booking_id } = req.params;
      const updatedBooking = await Booking.findOneAndUpdate(
        { booking_id },
        req.body,
        { new: true }
      );
  
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      // 🔔 Call centralized notification service
      try {
        await sendNotification({
          title: "Second Payment Initiated",
          body: `You have successfully cancelled for the booking (ID: ${booking_id}).`,
          type: "booking_updated",
          booking_id,
          user_id,
          artist_id
        });
      } catch (notifyErr) {
        console.warn("Notification failed:", notifyErr.message);
      }
      res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
    } catch (error) {
      res.status(500).json({ message: "Error updating booking", error });
    }
};
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_id, user_id } = req.params;
    const { cancellation_message } = req.body;

    // ✅ Require cancellation message
    if (!cancellation_message || cancellation_message.trim() === null
  ) {
      return res.status(400).json({ message: "Cancellation message is required to cancel the booking." });
    }

    // 🔍 Find the booking
    const booking = await Booking.findOne({ booking_id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🔐 Ensure only the user who created the booking can cancel it
    if (booking.user_id !== user_id) {
      return res.status(403).json({ message: "Unauthorized: You can only cancel your own booking." });
    }

    // ❌ Update booking status and flag
    booking.status = "rejected";
    booking.userRejected = true;
    booking.cancellation_message = cancellation_message || null; // (optional) store message in DB if needed
    await booking.save();

    // 🎨 Fetch artist name
    const artistUser = await Artist.findOne({ user_id: booking.artist_id });
    const artistName = artistUser ? artistUser.owner_name : "Unknown Artist";

    const formattedDate = new Date(booking.schedule_date_start).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // 🔔 Call centralized notification service
    try {
      await sendNotification({
        title: "Booking Cancelled",
        body: `Booking (ID: ${booking_id}) has been cancelled for artist ${artistName}, scheduled on ${formattedDate}`,
        type: "booking_cancelled",
        booking_id,
        user_id,
        artist_id: booking.artist_id,
      });
    } catch (notifyErr) {
      console.warn("Notification failed:", notifyErr.message);
    }

    res.status(200).json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Error cancelling booking", error });
  }
};

exports.artistAdminUpdateBookingStatus = async (req, res) => {
    try {
        const { booking_id } = req.params;
        const { status } = req.body;
        let userRole = req.user.role;

        // Ensure all roles except "admin" are considered as "user"
        if (userRole !== "admin") {
            userRole = "user";
        }

        const booking = await Booking.findOne({ booking_id });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // ✅ Artist Accepting
        if (status === "accepted" && (userRole === "user" || userRole === "admin")) {
            booking.status = "accepted";
            await booking.save();
            return res.status(200).json({ message: "Booking accepted successfully.", booking });
        }

        // ✅ Admin Completing
        if (status === "completed") {
            if (userRole !== "admin") {
                return res.status(403).json({ message: "Only admin can complete a booking." });
            }
            booking.status = "completed";
            await booking.save();
            return res.status(200).json({ message: "Booking marked as completed by admin.", booking });
        }

        // ✅ Rejection
        if (status === "rejected") {
            if (userRole === "user") {
                booking.artistRejected = true;
            } else if (userRole === "admin") {
                booking.adminRejected = true;
            } else {
                return res.status(403).json({ message: "Access denied. Only artist or admin can reject." });
            }

            let rejectionMessage = "";

            // Set final rejection status
            if (booking.adminRejected && !booking.artistRejected) {
                booking.status = "rejected";
                rejectionMessage = "Booking rejected by admin.";
            } else if (booking.artistRejected && booking.adminRejected) {
                booking.status = "rejected";
                rejectionMessage = "Booking rejected by both artist and admin.";
            } else {
                rejectionMessage = "Booking rejection pending approval from admin.";
            }

            await booking.save();

            // 🔔 Send Notification
            const artistUser = await Artist.findOne({ user_id: booking.artist_id });
            const artistName = artistUser ? artistUser.owner_name : 'Unknown Artist';
            const formattedDate = new Date(booking.schedule_date_start).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

            try {
                await sendNotification({
                    title: "Booking Status Updated",
                    body: `Booking status has been updated. Booking (ID: ${booking_id}) for artist ${artistName}, scheduled on ${formattedDate}`,
                    type: "booking_status_changed",
                    booking_id,
                    user_id: booking.user_id,
                    artist_id: booking.artist_id
                });
            } catch (notifyErr) {
                console.warn("Notification failed:", notifyErr.message);
            }

            return res.status(200).json({ message: rejectionMessage, booking });
        }

        return res.status(400).json({ message: "Invalid status update request." });

    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Error updating booking status", error });
    }
};





exports.getVerifiedPayments = async (req, res) => {
  try {
    console.log("🔹 Fetching verified payments...");

    const { user_id } = req.query;

    // Base filter: payment must have a Razorpay ID
    const filter = {
      razorpay_payment_id: { $exists: true, $ne: null }
    };

    // Add user_id filter if provided
    if (user_id) {
      filter.user_id = user_id;
    }

    const all_verified_payments = await Booking.find(filter).sort({ createdAt: -1 });

    // Categorize based on payment_status
    const completed_payments = all_verified_payments.filter(b => b.payment_status === "completed");
    const partial_payments = all_verified_payments.filter(b => b.payment_status === "partial");

    res.json({
      success: true,
      message: "Fetched verified payments successfully",
      all_verified_payments,
      completed_payments,
      partial_payments
    });

  } catch (error) {
    console.error("❌ Error fetching verified payments:", error);
    res.status(500).json({ success: false, message: "Error fetching verified payments", error });
  }
};
exports.startOrEndBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { action } = req.body; // either "start" or "end"

    const booking = await Booking.findOne({ booking_id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (action === "start") {
      // If already started, don't start again
      if (booking.booking_started) {
        return res.status(400).json({ message: "Booking already started" });
      }

      booking.booking_started = true;
      booking.booking_started_time = new Date();
      await booking.save();

      return res.status(200).json({
        message: "Booking has been marked as started",
        booking,
      });

    } else if (action === "end") {
      if (!booking.booking_started) {
        return res.status(400).json({ message: "Booking must be started before ending it" });
      }

      if (booking.booking_ended) {
        return res.status(400).json({ message: "Booking already ended" });
      }

      booking.booking_ended = true;
      booking.booking_ended_time = new Date();
      booking.status = "completed"; // ✅ Mark as completed
      await booking.save();

      return res.status(200).json({
        message: "Booking has been marked as completed",
        booking,
      });

    } else {
      return res.status(400).json({ message: "Invalid action. Use 'start' or 'end'." });
    }

  } catch (error) {
    console.error("❌ Error in start/end booking:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
  // get all bookings 
 exports.getAllBookings = async (req, res) => {
  try {
   const { status, paymentStatus, search, from, to , district,bookingType, schedule_date_start, schedule_date_end} = req.query;

    const query = {};

    // Status filter
    if (status) {
      query.status = status.toLowerCase();
    }
  if (bookingType) {
      query.booking_type = bookingType.toLowerCase();
    }
     // Status filter
 if (district) {
  query.$expr = {
    $eq: [
      { $toLower: "$district" },
      district.toLowerCase()
    ]
  };
}

    // Payment status filter
    if (paymentStatus) {
      query.payment_status = paymentStatus.toLowerCase();
    }

    // Search by booking ID
    if (search) {
      query.booking_id = { $regex: new RegExp(search, "i") }; // case-insensitive partial match
    }

    // Date range filter
    if (from && to) {
      query.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)), // include full day
      };
    }
       // Schedule date range filter
    if (schedule_date_start && schedule_date_end) {
      query.schedule_date_start = {
        $gte: new Date(schedule_date_start),
        $lte: new Date(new Date(schedule_date_end).setHours(23, 59, 59, 999)),
      };
    }
    // Fetch bookings sorted by most recent first
    let bookings = await Booking.find(query)
      .populate('user_id') // populate user if needed
      .sort({ createdAt: -1 });

    const updatedBookings = await Promise.all(
      bookings.map(async (booking) => {
        // 🔍 Fetch artist details based on artist_id (which is artist.user_id)
        const artistDetails = await Artist.findOne({ user_id: booking.artist_id });

        // ✅ Update booking_rating if review exists
        if (!booking.booking_rating) {
          const review = await ReviewModel.findOne({ booking_id: booking.booking_id });
          if (review) {
            booking.booking_rating = true;
            await booking.save();
          }
        }

        // Return the booking with a new artist_details field
        const bookingData = {
          ...booking._doc,
          artist_details: artistDetails || null,
        };

        if (booking.status === "rejected") {
          bookingData.cancellation_message = booking.cancellation_message || null;
        }

        return bookingData;
      })
    );

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully!",
      bookings: updatedBookings
    });
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error });
  }
};
  //get all user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const { user_id } = req.params;

    const bookings = await Booking.find({ user_id });

    if (!bookings.length) {
      return res.status(200).json({ message: "No bookings available." });
    }

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        // 🔍 Fetch artist details based on artist_id (which is artist.user_id)
        const artistDetails = await Artist.findOne({ user_id: booking.artist_id });

        const bookingData = {
          ...booking._doc,
          artist_details: artistDetails || null,
        };

        // 🟡 Add cancellation message only if booking was rejected
        if (booking.status === "rejected") {
          bookingData.cancellation_message = booking.cancellation_message || null;
        }

        return bookingData;
      })
    );

    res.status(200).json(enrichedBookings);
  } catch (error) {
    console.error("Error fetching user's bookings:", error);
    res.status(500).json({ message: "Error fetching user's bookings", error });
  }
};
exports.getBookingsByArtist = async (req, res) => {
  try {
    const { artist_id } = req.params;
    const { status, paymentStatus, search, from, to } = req.query;

    const artist = await Artist.findOne({ user_id: artist_id });

    if (!artist) {
      console.log("Artist not found for user_id:", artist_id);
      return res.status(404).json({ message: "Artist not found" });
    }

    // Build query filters
    const filter = { artist_id };

    if (status) {
      filter.status = status.toLowerCase();
    }

    if (paymentStatus) {
      filter.payment_status = paymentStatus.toLowerCase();
    }

    if (search) {
      filter.booking_id = { $regex: new RegExp(search, "i") };
    }

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(200).json({
        message: "No bookings found for this artist",
        bookings: [],
      });
    }

   const enrichedBookings = bookings.map((booking) => {
      const bookingData = {
        ...booking._doc,
        artist_details: artist,
      };

      if (booking.status === "rejected") {
        bookingData.cancellation_message = booking.cancellation_message || null;
      }

      return bookingData;
    });
    res.status(200).json({
      success: true,
      bookings: enrichedBookings,
    });
  } catch (error) {
    console.error("Error fetching artist's bookings:", error);
    res.status(500).json({
      message: "Error fetching artist's bookings",
      error,
    });
  }
}; 
  // 6️⃣ Get a booking by Booking ID
  exports.getBookingById = async (req, res) => {
    try {
      const { booking_id } = req.params;
      const booking = await Booking.findOne({ booking_id });
  
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
  
      // Fetch artist details using artist_id stored in booking
      const artistDetails = await Artist.findOne({ user_id: booking.artist_id });
  
      res.status(200).json({ 
        success: true, 
        booking: {
          ...booking._doc,
          artist_details: artistDetails || null,
            cancellation_message: booking.cancellation_message || null,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching booking", error });
    }
  };
// 📌 Get PAST bookings (status: "completed" or "rejected")
exports.getUserPastBookings = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { search, from, to, paymentStatus } = req.query;

    const filter = {
      user_id,
      status: { $in: ["completed", "rejected"] },
    };

    if (search) {
      filter.booking_id = { $regex: new RegExp(search, "i") };
    }

    if (from && to) {
      filter.createdAt = {
        $gte: new Date(from),
        $lte: new Date(new Date(to).setHours(23, 59, 59, 999)),
      };
    }

    if (paymentStatus) {
      filter.payment_status = paymentStatus.toLowerCase();
    }

    const pastBookings = await Booking.find(filter).sort({ createdAt: -1 });

    if (!pastBookings.length) {
      return res.status(200).json({ message: "No past bookings found for this user", bookings: [] });
    }

    const enrichedBookings = await Promise.all(
      pastBookings.map(async (booking) => {
        const artistDetails = await Artist.findOne({ user_id: booking.artist_id });
        return {
          ...booking._doc,
          artist_details: artistDetails || null,
            cancellation_message: booking.cancellation_message || null,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Past bookings retrieved successfully",
      bookings: enrichedBookings,
    });
  } catch (error) {
    console.error("Error fetching past bookings:", error);
    res.status(500).json({ message: "Error fetching past bookings", error });
  }
};
// 📌 Get UPCOMING bookings (status: "pending" or "accepted")
exports.getUserUpcomingBookings = async (req, res) => {
  try {
    const { user_id } = req.params;
    const upcomingBookings = await Booking.find({ 
      user_id, 
      status: { $in: ["pending", "accepted"] } 
    });

    if (!upcomingBookings.length) {
      return res.status(404).json({ message: "No upcoming bookings found for this user" });
    }

    const enrichedBookings = await Promise.all(
      upcomingBookings.map(async (booking) => {
        const artistDetails = await Artist.findOne({ user_id: booking.artist_id });
        return {
          ...booking._doc,
          artist_details: artistDetails || null,
        };
      })
    );

    res.status(200).json(enrichedBookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching upcoming bookings", error });
  }
};
exports.getAllBusyDatesForArtist = async (req, res) => {
  try {
    const { artist_id } = req.params;

    // ✅ Validate artist
    const artist = await Artist.findOne({ user_id: artist_id });
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // ✅ Fetch only relevant bookings
    const bookings = await Booking.find({
      artist_id: artist_id,
      status: { $in: ["pending", "accepted", "completed"] }, // Exclude rejected/cancelled
    });

    const busyDates = new Set();

    bookings.forEach((booking) => {
      const start = moment(booking.schedule_date_start);
      const end = booking.schedule_date_end
        ? moment(booking.schedule_date_end)
        : start; // fallback to single-day if no end date

      for (let m = moment(start); m.diff(end, "days") <= 0; m.add(1, "days")) {
        busyDates.add(m.format("YYYY-MM-DD"));
      }
    });

    res.status(200).json({
      success: true,
      busy_dates: Array.from(busyDates),
      message: "All busy dates retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching busy dates:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.getBookingsByBusyDate = async (req, res) => {
  try {
    const { artist_id, date } = req.params;
    const artist = await Artist.findOne({ user_id: artist_id });

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const targetDate = moment(date, "YYYY-MM-DD").startOf("day").toDate();
    const endOfDay = moment(date, "YYYY-MM-DD").endOf("day").toDate();

    const bookings = await Booking.find({
      artist_id,
      status: { $in: ["pending", "accepted", "completed"] },
      $or: [
        // Case 1: booking spans multiple days
        {
          schedule_date_start: { $lte: endOfDay },
          schedule_date_end: { $gte: targetDate },
        },
        // Case 2: booking for a single day only
        {
          schedule_date_start: {
            $gte: targetDate,
            $lte: endOfDay,
          },
          schedule_date_end: { $exists: false },
        },
      ],
    });

    res.status(200).json({
      bookings,
      message: `Bookings on ${date} fetched successfully.`,
    });
  } catch (error) {
    console.error("Error fetching bookings by date:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.getArtistRevenue = async (req, res) => {
  try {
    const { artist_id } = req.params;

    if (!artist_id) {
      return res.status(400).json({ message: "Artist ID is required" });
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed (Jan = 0)
    const startYear = currentYear - 4; // last 5 years including current

    // Fetch all completed bookings from last 5 years
    const bookings = await Booking.find({
      artist_id,
      status: "completed",
      createdAt: {
        $gte: new Date(`${startYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
      }
    });

    if (!bookings.length) {
      return res.status(200).json({
        success: true,
        message: "No completed bookings found for this artist in the last 5 years",
        total_completed_bookings: 0,
        monthly_revenue: {},
        yearly_revenue: {}
      });
    }

    // Initialize monthly revenue (only for current year up to current month)
    const monthlyRevenue = {};
    for (let i = 0; i <= currentMonth; i++) {
      const monthKey = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = 0;
    }

    // Initialize yearly revenue for the last 5 years
    const yearlyRevenue = {};
    for (let y = startYear; y <= currentYear; y++) {
      yearlyRevenue[y] = 0;
    }

    bookings.forEach((booking) => {
      const createdAt = new Date(booking.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth(); // 0-indexed
      const price = Number(booking.total_price) || 0;

      // Update yearly revenue
      if (yearlyRevenue[year] !== undefined) {
        yearlyRevenue[year] += price;
      }

      // Update monthly revenue only if in current year and <= current month
      if (year === currentYear && month <= currentMonth) {
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        if (monthlyRevenue[monthKey] !== undefined) {
          monthlyRevenue[monthKey] += price;
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Revenue data fetched successfully",
      total_completed_bookings: bookings.length,
      monthly_revenue: monthlyRevenue,
      yearly_revenue: yearlyRevenue
    });

  } catch (error) {
    console.error("Error fetching artist revenue:", error);
    res.status(500).json({ message: "Error fetching artist revenue", error });
  }
};







  
  
  
  
  
  
  