const Booking = require("../models/bookingModal");
const Artist = require("../models/artistDetailsModel");
const razorpay = require("../services/razorPay");
// 1️⃣ Create a new booking
// exports.createBooking = async (req, res) => {
//   try {
//     const newBooking = new Booking({ ...req.body, status: "pending" });
//     await newBooking.save();
//     res.status(201).json({ message: "Booking created successfully", booking: newBooking });
//   } catch (error) {
//     res.status(500).json({ message: "Error creating booking", error });
//   }
// };
exports.createBooking = async (req, res) => {
  try {
    const { total_price, advance_price, payment_type, ...otherData  } = req.body;

    // Calculate pending amount
    const pending_price = payment_type === "full" ? "0" : (total_price - advance_price).toString();
    const payment_status = payment_type === "full" ? "completed" : "partial";

    // Create Razorpay Order (for either full or advance payment)
    const amountToPay = payment_type === "full" ? total_price : advance_price;

    const options = {
      amount: parseInt(amountToPay) * 100, // Convert INR to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);

    // Save Booking with Order ID
    const newBooking = new Booking({
      ...otherData,
      total_price,
      advance_price,
      pending_price,
      payment_status,
      razorpay_order_id: order.id,
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating booking", error });
  }
};
const crypto = require("crypto");

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_id } = req.body;

    const secret = "qRRw3gYDo1yNk58IpMD1TvkQ";
    const hash = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (hash !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update booking status after payment
    const booking = await Booking.findByOne({booking_id});
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // If this was a pending payment, set it as completed
    booking.payment_status = "completed";
    booking.pending_price = "0";
    booking.razorpay_payment_id = razorpay_payment_id;

    await booking.save();

    res.json({ success: true, message: "Payment verified successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Error verifying payment", error });
  }
};

// 2️⃣ Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find(); // Populating user details
    res.status(200).json({
        success: true,
        message: "Bookings retrieved successfully!",
        bookings
      });
  } catch (error) {
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

    res.status(200).json(bookings);
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
  

  exports.getBookingsByArtist = async (req, res) => {
    try {
      const { artist_id } = req.params; // artist_id from URL
      let { status } = req.query; // status filter
  
    
  
      // Find artist using user_id (since in the Artist model it's stored as user_id)
      const artist = await Artist.findOne({ user_id: artist_id });
  
      if (!artist) {
        console.log("Artist not found for user_id:", artist_id);
        return res.status(404).json({ message: "Artist not found" });
      }
  
    
  
      // Now, fetch bookings using artist_id from the Booking model
      let filter = { artist_id: artist_id }; // Booking model has artist_id
  
      const validStatuses = ["pending", "accepted", "completed", "rejected"];
  
      if (status && validStatuses.includes(status)) {
        if (status === "pending") {
          // Include both "pending" status and bookings where status does not exist
          filter.$or = [{ status: "pending" }, { status: { $exists: false } }];
        } else {
          filter.status = status; // Normal status filter
        }
      }
  
  
      // Fetch bookings from Booking model
      const bookings = await Booking.find(filter);
  
      if (!bookings.length) {
        return res.status(404).json({ message: "No bookings found for this artist" });
      }
  
      res.status(200).json({ success: true, bookings });
    } catch (error) {
      console.error("Error fetching artist's bookings:", error);
      res.status(500).json({ message: "Error fetching artist's bookings", error });
    }
  };
  
  // 6️⃣ Get a booking by Booking ID
exports.getBookingById = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const booking = await Booking.findOne({booking_id});

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: "Error fetching booking", error });
  }
};



exports.artistAdminUpdateBookingStatus = async (req, res) => {
  try {
      const { booking_id } = req.params;
      const { status } = req.body;
      let userRole = req.user.role;

      console.log("Decoded Token User:", req.user);

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

          // Update Status
          let rejectionMessage = "Booking rejection pending approval from both artist and admin.";
          if (booking.artistRejected && !booking.adminRejected) {
              rejectionMessage = "Admin rejection approval pending.";
          } else if (!booking.artistRejected && booking.adminRejected) {
              rejectionMessage = "Artist rejection approval pending.";
          } else if (booking.artistRejected && booking.adminRejected) {
              booking.status = "rejected";
              rejectionMessage = "Booking rejection updated. Current status: rejected";
          } else {
              booking.status = "pending";
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

    res.status(200).json(pastBookings);
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

    res.status(200).json(upcomingBookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching upcoming bookings", error });
  }
};




  
  
  
  
  
  
  