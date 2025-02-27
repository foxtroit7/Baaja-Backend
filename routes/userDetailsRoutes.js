const express = require('express');
const UserDetails = require('../models/userDetailsModal'); // Import the model

const router = express.Router();

/**
 * POST route to create a new user detail entry
 * @route POST /user/details
 */
router.post('/user/details', async (req, res) => {
    const { userId, photo, name, totalBookings, pendingBookings, location, phoneNumber, experience, description, totalmoney, recent_order, registration_date, status } = req.body;

    try {
        // Check if userId already exists
        const existingUser = await UserDetails.findOne({ userId });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this userId already exists' });
        }

        const newUser = new UserDetails({
            userId,
            photo,
            name,
            totalBookings,
            pendingBookings,
            location,
            phoneNumber,
            experience,
            description,
            totalmoney,
            recent_order,
            registration_date,
            status
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
 * GET route to fetch user details by userId
 * @route GET /user/details/:userId
 */
router.get('/user/details/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await UserDetails.findOne({ userId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.delete('/user/details/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Find the user by userId and delete it
        const deletedUser = await UserDetails.findOneAndDelete({ userId });

        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully', deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
module.exports = router;
