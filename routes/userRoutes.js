const express = require('express');
const User = require('../models/userModel');
const { signup,login} = require('../controllers/userControllers');
const {verifyOtp} = require('../services/twilioService')
const { validateSignup } = require('../middlewares/user_validate');
const { verifyToken } = require('../middlewares/userVerifyToken'); // Import the verifyToken middleware

const router = express.Router();

// POST route for user signup
router.post('/user/signup', validateSignup, signup);

// Login Route
router.post('/user/login', login);
router.post("/verify-otp", (req, res) => {
    const { phoneNumber, otpEntered } = req.body;
  
    const result = verifyOtp(phoneNumber, otpEntered);
    if (result.success) {
      return res.status(200).json({ message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ message: result.message });
    }
  });
  
// GET route for getting user data
router.get('/user/signup', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;  // Extract userId from the decoded JWT token
        
        // Fetch the user details from the database
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            name: user.name,
            emailId: user.emailId,
            phoneNumber: user.phoneNumber,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
