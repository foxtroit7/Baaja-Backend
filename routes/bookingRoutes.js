const express = require("express");
const { createBooking, getAllBookings, getUserBookings, getBookingsByArtist, updateBooking, deleteBooking, getBookingById } = require("../controllers/bookingControllers");

const router = express.Router();

router.post("/create-booking", createBooking);
router.get("/all-bookings", getAllBookings); 
router.get("/bookings/:bookingId", getBookingById); 
router.get("/user-bookings/:userId", getUserBookings);
router.get("/artist-bookings/:artistId", getBookingsByArtist); 
router.put("/bookings/update/:bookingId",updateBooking); 
router.delete("/bookings/delete/:bookingId", deleteBooking);
module.exports = router;
