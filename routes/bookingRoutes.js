const express = require("express");
const { createBooking, getAllBookings, getUserBookings, getBookingsByArtist,startOrEndBooking, updateBooking,createManualBooking, getBookingById, artistAdminUpdateBookingStatus, getUserPastBookings, getUserUpcomingBookings, cancelBooking, verifyPayment, getVerifiedPayments, getAllBusyDatesForArtist, createNewOrder, getBookingsByBusyDate,getArtistRevenue } = require("../controllers/bookingControllers");
const { verifyToken } = require("../middlewares/verifyToken");
const router = express.Router();
router.post("/create-booking",verifyToken, createBooking);
router.post("/manual-booking",verifyToken, createManualBooking );
router.post("/verify-booking",verifyToken, verifyPayment);
router.post("/create-order", createNewOrder);
router.get("/all-bookings",verifyToken, getAllBookings);
router.get("/payments", verifyToken, getVerifiedPayments);
//router.get("/bookings/:booking_id",verifyToken, getBookingById); 
router.get("/bookings/:booking_id", getBookingById); 
router.patch("/bookings/start-end/:booking_id",verifyToken, startOrEndBooking)
router.get("/user-bookings/:user_id",verifyToken, getUserBookings);
router.get("/artist-bookings/:artist_id",verifyToken, getBookingsByArtist); 
router.put("/bookings/update/:booking_id",verifyToken,updateBooking);
router.put("/booking/update-status/:booking_id", verifyToken, artistAdminUpdateBookingStatus);
router.get("/past-bookings/:user_id", verifyToken, getUserPastBookings);
router.get("/upcoming-bookings/:user_id", verifyToken, getUserUpcomingBookings);
router.put("/cancel-booking/:booking_id/:user_id", verifyToken,cancelBooking );
router.get("/artist/:artist_id/busy-dates", verifyToken, getAllBusyDatesForArtist);
router.get("/busy-date/:artist_id/:date",verifyToken, getBookingsByBusyDate);
router.get('/artist-revenue/:artist_id',verifyToken, getArtistRevenue);

module.exports = router;