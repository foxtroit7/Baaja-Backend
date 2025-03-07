const express = require('express');
const UserDetails = require('../models/userDetailsModal'); // Import the model

const router = express.Router();

/**
 * POST route to create a new user detail entry
 * @route POST /user/details
 */
router.post('/user/details', async (req, res) => {
    const { user_id, photo, name, total_bookings, pending_bookings, location, phone_number, experience, description, total_money, recent_order, registration_date, status, favorites } = req.body;

    try {
        // Check if user_id already exists
        const existingUser = await UserDetails.findOne({ user_id });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this user_id already exists' });
        }

        const newUser = new UserDetails({
            user_id,
            photo,
            name,
            total_bookings,
            pending_bookings,
            location,
            phone_number,
            experience,
            description,
            total_money,
            recent_order,
            registration_date,
            status,
            favorites
        });

        await newUser.save();
        res.status(201).json({ message: 'User details created successfully', newUser });
    } catch (error) {
        console.error('Error creating user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch all user details
 * @route GET /user/details
 */
router.get('/user/details', async (req, res) => {
    try {
        const users = await UserDetails.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch user details by user_id
 * @route GET /user/details/:user_id
 */
router.get('/user/details/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        const user = await UserDetails.findOne({ user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.delete('/user/details/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        // Find the user by user_id and delete it
        const deletedUser = await UserDetails.findOneAndDelete({ user_id });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/user/favorites', async (req, res) => {
    try {
        const { user_id, artist_id, name } = req.body;

        if (!user_id || !artist_id || !name) {
            return res.status(400).json({ message: 'User ID, Artist ID, and Artist Name are required' });
        }

        const user = await UserDetails.findOne({ user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the artist is already in favorites
        const alreadyFavorited = user.favorites.some(fav => fav.artist_id.toString() === artist_id);

        if (alreadyFavorited) {
            return res.status(400).json({ message: 'Artist already in favorites' });
        }

        // Add artist to favorites
        user.favorites.push({ artist_id, artist_name });
        await user.save();

        res.status(200).json({ message: 'Artist added to favorites', favorites: user.favorites });
    } catch (error) {
        console.error('Error adding favorite:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.delete('/user/favorites', async (req, res) => {
    try {
        const { user_id, artist_id } = req.body;

        if (!user_id || !artist_id) {
            return res.status(400).json({ message: 'User ID and Artist ID are required' });
        }

        const user = await UserDetails.findOne({ user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Filter out the artist from favorites
        user.favorites = user.favorites.filter(fav => fav.artist_id.toString() !== artist_id);
        await user.save();

        res.status(200).json({ message: 'Artist removed from favorites', favorites: user.favorites });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.get('/user/favorites/:user_id', async (req, res) => {
    try {
        const { user_id } = req.params;

        const user = await UserDetails.findOne({ user_id });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ favorites: user.favorites });
    } catch (error) {
        console.error('Error fetching favorite artists:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;
