const express = require("express");
const { createBooking, getAllBookings, getUserBookings, getBookingsByArtist, updateBooking, deleteBooking, getBookingById } = require("../controllers/bookingControllers");
const { verifyToken } = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/create-booking",verifyToken, createBooking);
router.get("/all-bookings",verifyToken, getAllBookings); 
router.get("/bookings/:booking_id",verifyToken, getBookingById); 
router.get("/user-bookings/:user_id",verifyToken, getUserBookings);
router.get("/artist-bookings/:artist_id",verifyToken, getBookingsByArtist); 
router.put("/bookings/update/:booking_id",verifyToken,updateBooking); 
router.delete("/bookings/delete/:booking_id",verifyToken, deleteBooking);
module.exports = router;
