const express = require('express');
const Booking = require('../models/bookingModal'); // Import the booking model

const router = express.Router();

/**
 * POST route to create a new booking
 * @route POST /booking
 */
router.post('/booking', async (req, res) => {
    const {
        schedule_date,
        booking_date,
        shift,
        scheduled_time,
        booking_time,
        purpose,
        full_name,
        organization,
        address,
        district,
        pincode,
        state,
        landmark,
        phone_number,
        alternate_number,
        adhaar_number,
        requiredItems,
        add_on
    } = req.body;

    try {
        // Create a new booking instance
        const newBooking = new Booking({
            schedule_date,
            booking_date,
            shift,
            scheduled_time,
            booking_time,
            purpose,
            full_name,
            organization,
            address,
            district,
            pincode,
            state,
            landmark,
            phone_number,
            alternate_number,
            adhaar_number,
            requiredItems,
            add_on
        });

        // Save the booking to the database
        await newBooking.save();
        
        // Respond with the created booking data
        res.status(201).json({
            message: 'Booking created successfully',
            bookingId: newBooking.bookingId,
            newBooking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch a booking by bookingId
 * @route GET /booking/:bookingId
 */
router.get('/booking/:bookingId', async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findOne({ bookingId });
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Respond with the booking data
        res.status(200).json(booking);
    } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
