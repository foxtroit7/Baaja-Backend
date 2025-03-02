const express = require("express");
const { createBooking, getAllBookings, getUserBookings, getBookingsByArtist, updateBooking, deleteBooking, getBookingById } = require("../controllers/bookingControllers");

const router = express.Router();

router.post("/create-booking", createBooking);
router.get("/all-bookings", getAllBookings); 
router.get("/bookings/:booking_id", getBookingById); 
router.get("/user-bookings/:user_id", getUserBookings);
router.get("/artist-bookings/:artist_id", getBookingsByArtist); 
router.put("/bookings/update/:booking_id",updateBooking); 
router.delete("/bookings/delete/:booking_id", deleteBooking);
module.exports = router;
