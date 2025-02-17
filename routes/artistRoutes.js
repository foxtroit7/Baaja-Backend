const express = require('express');
const User = require('../models/artistModel');
const { signup, login } = require('../controllers/artistController');
const { validateSignup } = require('../middlewares/artist_validate');
// Removed verifyToken for this route

const router = express.Router();

// POST route for user signup
router.post('/artist/signup', validateSignup, signup);

// Login Route
router.post('/artist/login', login);

// GET route to fetch the list of all artists
router.get('/artist/signup', async (req, res) => {
    try {
        // Fetch all artists from the database
        const users = await User.find();

        if (users.length === 0) {
            return res.status(404).json({ message: 'No artists found' });
        }

        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
