const Booking = require("../models/bookingModal");
const Artist = require("../models/artistDetailsModel");
const razorpay = require("../services/razorPay");
const ReviewModel = require('../models/ratingModal');
const crypto = require("crypto");

exports.createBooking = async (req, res) => {
  try {
    const { total_price, advance_price, payment_type, ...otherData } = req.body;

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

    // Create and save booking
    const newBooking = new Booking({
      total_price,
      advance_price,
      pending_price,
      payment_status,
      razorpay_order_id: order.id,
      ...otherData,
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
      order,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking", error });
  }
};


exports.verifyPayment = async (req, res) => {
  try {
    console.log("🔹 Received Payment Verification Data:", req.body);

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_id) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const secret =  "qRRw3gYDo1yNk58IpMD1TvkQ"; // Use environment variable

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("🔹 Expected Signature:", expectedSignature);
    console.log("🔹 Received Signature:", razorpay_signature);

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Payment verification failed! Signature mismatch.");
      return res.status(400).json({ success: false, message: "Payment verification failed. Invalid signature." });
    }

    // Find the booking
    const booking = await Booking.findOne({ booking_id });

    if (!booking) {
      console.error(`❌ Booking not found for ID: ${booking_id}`);
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
    const pendingPrice = parseFloat(booking.pending_price);

    // Update booking status after payment
    booking.payment_status = pendingPrice === 0 ? "completed" : "partial";
    booking.pending_price = pendingPrice === 0 ? 0 : pendingPrice; // Keep pending price intact if not 0
    booking.razorpay_payment_id = razorpay_payment_id;
    booking.razorpay_signature = razorpay_signature;
    await booking.save();

    console.log("✅ Payment verified successfully for Booking ID:", booking_id);

    res.json({ success: true, message: "Payment verified successfully", booking });
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Error verifying payment", error });
  }
};
exports.createPendingPaymentOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;

    // 🔍 Step 1: Find the booking
    const booking = await Booking.findOne({ booking_id });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // 🛑 Step 2: Check if pending payment exists
    if (booking.payment_status === "completed" || booking.pending_price === 0) {
      return res.status(400).json({ success: false, message: "No pending payment or already completed" });
    }

    // 🏦 Step 3: Create Razorpay order for pending amount
    const options = {
      amount: parseInt(booking.pending_price) * 100, // Convert to paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);
    console.log("🎯 Razorpay Order Created for Pending Amount:", order);

    // ✅ Step 4: Update payment status if full payment is completed
    if (booking.pending_price === booking.total_price) {
      booking.payment_status = "completed";
    }

    // 📝 Step 5: Save the booking
    await booking.save();

    // ✅ Step 6: Send response to frontend
    res.json({ success: true, message: "Order created for pending payment", order });

  } catch (error) {
    console.error("❌ Error creating pending order:", error);
    res.status(500).json({ success: false, message: "Error creating order", error });
  }
};

exports.verifyPendingPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    const secret = process.env.RAZORPAY_SECRET;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Signature mismatch" });
    }

    const booking = await Booking.findOne({ booking_id });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // Deduct pending amount
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
    const amountPaid = razorpayOrder.amount / 100;

    booking.pending_price -= amountPaid;

    if (booking.pending_price <= 0) {
      booking.pending_price = 0;
      booking.payment_status = "completed";
    } else {
      booking.payment_status = "partial";
    }

    booking.razorpay_payment_id = razorpay_payment_id;
    booking.razorpay_signature = razorpay_signature;

    await booking.save();

    res.json({ success: true, message: "Pending payment verified", booking });

  } catch (err) {
    console.error("❌ Error verifying pending payment:", err);
    res.status(500).json({ success: false, message: "Server error", err });
  }
};

exports.getVerifiedPayments = async (req, res) => {
  try {
    console.log("🔹 Fetching all verified payments...");

    // Fetch all payments that have a non-empty razorpay_payment_id (indicating a successful transaction)
    const all_verified_payments = await Booking.find({ razorpay_payment_id: { $exists: true, $ne: null } });

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

// 2️⃣ Get all bookings

exports.getAllBookings = async (req, res) => {
  try {
    let bookings = await Booking.find()
      .populate('user_id'); // populate user if needed

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


// 3️⃣ Get all bookings by user_id
exports.getUserBookings = async (req, res) => {
  try {
    const { user_id } = req.params;
    const bookings = await Booking.find({ user_id });

    if (!bookings.length) {
      return res.status(404).json({ message: "No bookings found for this user" });
    }

    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const artistDetails = await Artist.findOne({ user_id: booking.artist_id });

        return {
          ...booking._doc,
          artist_details: artistDetails || null,
        };
      })
    );

    res.status(200).json(enrichedBookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user's bookings", error });
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
  
      res.status(200).json({ message: "Booking updated successfully", booking: updatedBooking });
    } catch (error) {
      res.status(500).json({ message: "Error updating booking", error });
    }
  };
  
 
  exports.cancelBooking = async (req, res) => {
    try {
      const { booking_id, user_id } = req.params; // Extracting from params
  
      // Find the booking
      const booking = await Booking.findOne({ booking_id });
  
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
  
      // Ensure only the user who created the booking can cancel it
      if (booking.user_id !== user_id) {
        return res.status(403).json({ message: "Unauthorized: You can only cancel your own booking." });
      }
  
      // Update the booking status and userRejected flag
      booking.status = "rejected";
      booking.userRejected = true;
  
      await booking.save();
  
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
            return res.status(200).json({ message: rejectionMessage, booking });
        }
  
        return res.status(400).json({ message: "Invalid status update request." });
  
    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Error updating booking status", error });
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
        return res.status(404).json({ message: "No bookings found for this artist" });
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





  
  
  
  
  
  
  