const express = require('express');
const User = require('../models/userModel');
const { signup, login } = require('../controllers/userControllers');
const { verifyOtp } = require('../services/twilioService');
const { validateSignup } = require('../middlewares/user_validate');
const {verifyToken } = require('../middlewares/verifyToken');
// Removed verifyToken middleware for this route

const router = express.Router();

// POST route for user signup
router.post('/user/signup', validateSignup, signup);

// Login Route
router.post('/user/login', login);

// OTP Verification Route
router.post('/verify-otp', (req, res) => {
    const { phoneNumber, otpEntered } = req.body;

    const result = verifyOtp(phoneNumber, otpEntered);
    if (result.success) {
        return res.status(200).json({ message: 'OTP verified successfully' });
    } else {
        return res.status(400).json({ message: result.message });
    }
});

// GET route to fetch all users
router.get('/user-list',async (req, res) => {
    try {
        // Fetch all users from the database
        const users = await User.find();

        if (users.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
