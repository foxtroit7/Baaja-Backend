const express = require('express');
const User = require('../models/artistModel');
const { signup, login, logout } = require('../controllers/artistController');
const { validateSignup } = require('../middlewares/artist_validate');
const {verifyToken } = require('../middlewares/verifyToken');

const router = express.Router();

// POST route for user signup
router.post('/artist/signup', validateSignup, signup);

// Login Route
router.post('/artist/login', login);
router.post('/artist/logout', logout);
// GET route to fetch the list of all artists (protected by verifyToken middleware)
router.get('/artist-list', verifyToken, async (req, res) => {
    try {
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
