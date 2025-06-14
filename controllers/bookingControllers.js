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
      payments: payments
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
      user_id: newBooking.user_id
    });
  } catch (notifyErr) {
    console.warn("Notification failed:", notifyErr.message);
  }
    res.status(201).json({
      message: "Booking created successfully",
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
    user_id
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
          user_id
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
  
      // Find the booking
      const booking = await Booking.findOne({ booking_id });
  
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
  
      // Ensure only the user who created the booking can cancel it
      if (booking.user_id !== user_id) {
        return res.status(403).json({ message: "Unauthorized: You can only cancel your own booking." });
      }
  
      // Update booking status and flag
      booking.status = "rejected";
      booking.userRejected = true;
      await booking.save();
      // ✅ Fetch artist name from User model
    const artistUser = await Artist.findOne({ user_id: booking.artist_id });
    const artistName = artistUser ? artistUser.owner_name : 'Unknown Artist';
    const formattedDate = new Date(booking.schedule_date_start).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric"
});
      // 🔔 Call centralized notification service
      try {
        await sendNotification({
          title: "Booking Cancelled",
          body: `Booking (ID: ${booking_id}) has been cancelled for artist ${artistName}, scheduled on ${formattedDate}`,
          type: "booking_cancelled",
          booking_id,
          user_id
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
  
        // Handle Artist Accepting
        if (status === "accepted" && userRole === "user") {
            booking.status = "accepted";
            await booking.save();
            return res.status(200).json({ message: "Booking accepted successfully.", booking });
        }
  
        // Handle Rejection
        if (status === "rejected") {
            if (userRole === "user") {
                booking.artistRejected = true;
            } else if (userRole === "admin") {
                booking.adminRejected = true;
            } else {
                return res.status(403).json({ message: "Access denied. Only artist or admin can reject." });
            }
            // If admin rejects first or both reject, update status to rejected
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
            // ✅ Fetch artist name from User model
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
                body: `Booking status has been updated Booking (ID: ${booking_id}) for artist ${artistName}, scheduled on ${formattedDate}`,
                type: "booking_status_changed",
                booking_id,
                user_id
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

//All get APIs
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

  // get all bookings
  
 exports.getAllBookings = async (req, res) => {
  try {
    // Fetch bookings sorted by most recent first
    let bookings = await Booking.find()
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
        return {
          ...booking._doc,
          artist_details: artistDetails || null,
        };
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
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        // 🔍 Fetch artist details based on artist_id (which is artist.user_id)
        const artistDetails = await Artist.findOne({ user_id: booking.artist_id });

        return {
          ...booking._doc,
          artist_details: artistDetails || null,
        };
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
      let { status } = req.query;
  
      const artist = await Artist.findOne({ user_id: artist_id });
  
      if (!artist) {
        console.log("Artist not found for user_id:", artist_id);
        return res.status(404).json({ message: "Artist not found" });
      }
  
      let filter = { artist_id: artist_id };
  
      const validStatuses = ["pending", "accepted", "completed", "rejected"];
      if (status && validStatuses.includes(status)) {
        if (status === "pending") {
          filter.$or = [{ status: "pending" }, { status: { $exists: false } }];
        } else {
          filter.status = status;
        }
      }
  
      const bookings = await Booking.find(filter);
  
      if (!bookings.length) {
        return res.status(200).json({
          message: "No bookings found for this artist",
          bookings: [],
        });
      }
      
  
      const enrichedBookings = bookings.map((booking) => ({
        ...booking._doc,
        artist_details: artist, // same artist for all, since artist_id is constant
      }));
  
      res.status(200).json({ success: true, bookings: enrichedBookings });
    } catch (error) {
      console.error("Error fetching artist's bookings:", error);
      res.status(500).json({ message: "Error fetching artist's bookings", error });
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
    const pastBookings = await Booking.find({ 
      user_id, 
      status: { $in: ["completed", "rejected"] } 
    });

    if (!pastBookings.length) {
      return res.status(404).json({ message: "No past bookings found for this user" });
    }

    const enrichedBookings = await Promise.all(
      pastBookings.map(async (booking) => {
        const artistDetails = await Artist.findOne({ user_id: booking.artist_id });
        return {
          ...booking._doc,
          artist_details: artistDetails || null,
        };
      })
    );

    res.status(200).json(enrichedBookings);
  } catch (error) {
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

    const artist = await Artist.findOne({ user_id: artist_id });
    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const bookings = await Booking.find({
      artist_id: artist_id,
      status: { $in: ["pending", "accepted", "completed"] }, // skip rejected/cancelled
    });

    const busyDates = new Set();

    bookings.forEach((booking) => {
      const start = moment(booking.schedule_date_start);
      const end = moment(booking.schedule_date_end);

      for (let m = moment(start); m.diff(end, "days") <= 0; m.add(1, "days")) {
        busyDates.add(m.format("YYYY-MM-DD"));
      }
    });

    res.status(200).json({
      busy_dates: Array.from(busyDates),
      message: "All busy dates retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching busy dates:", error);
    res.status(500).json({ message: "Server error", error });
  }
};






  
  
  
  
  
  
  