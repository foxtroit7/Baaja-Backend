const express = require('express');
const User = require('../models/artistModel');
const { signup,login } = require('../controllers/artistController');
const { validateSignup } = require('../middlewares/artist_validate');
const { verifyToken } = require('../middlewares/verifyToken'); // Import the verifyToken middleware

const router = express.Router();

// POST route for user signup
router.post('/artist/signup', validateSignup, signup);

// Login Route
router.post('/artist/login', login);

// GET route for getting user data
router.get('/artist/signup', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;  // Extract userId from the decoded JWT token
        
        // Fetch the user details from the database
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            name: user.name,
            baajaName: user.baajaName,
            phoneNumber: user.phoneNumber,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
