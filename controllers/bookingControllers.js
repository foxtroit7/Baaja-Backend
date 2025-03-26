const Booking = require("../models/bookingModal");

// 1️⃣ Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const newBooking = new Booking({ ...req.body, status: "pending" });
    await newBooking.save();
    res.status(201).json({ message: "Booking created successfully", booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: "Error creating booking", error });
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
  
  // 5️⃣ Delete a booking by Booking ID
  exports.deleteBooking = async (req, res) => {
    try {
      const { booking_id } = req.params;
      const deletedBooking = await Booking.findOneAndDelete({ booking_id });
  
      if (!deletedBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }
  
      res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting booking", error });
    }
  };
// 1️⃣ Get all bookings by artist_id
exports.getBookingsByArtist = async (req, res) => {
    try {
      const { artist_id } = req.params;
      const bookings = await Booking.find({ artist_id });
  
      if (!bookings.length) {
        return res.status(404).json({ message: "No bookings found for this artist" });
      }
  
      res.status(200).json({ success: true, bookings });
    } catch (error) {
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
      const userRole = req.user.role;

      console.log("Decoded Token User:", req.user);

      const booking = await Booking.findOne({  booking_id });
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




  
  
  
  
  
  
  