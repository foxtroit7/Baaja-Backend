const Booking = require("../models/bookingModal");

// 1️⃣ Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const newBooking = new Booking(req.body);
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

  
  
  
  
  
  
  
  