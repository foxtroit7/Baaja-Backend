const express = require('express');
const ArtistDetails = require('../models/artistDetailsModel'); // Import the artist details model

const router = express.Router();

/**
 * POST route to add artist details
 * @route POST /artist/details
 */
router.post('/artist/details', async (req, res) => {
    const { 
        userId, name, totalBookings, location, categoryType, categoryImage, experience, 
        description, totalmoney, recent_order, status, rating 
    } = req.body;

    try {
        // Check if the artist already has details
        const existingDetails = await ArtistDetails.findOne({ userId });
        if (existingDetails) {
            return res.status(400).json({ message: 'Artist details already exist' });
        }

        // Create new artist details entry
        const newArtistDetails = new ArtistDetails({
            userId, name, totalBookings, location, categoryType, categoryImage, experience, 
            description, totalmoney, recent_order, status, rating
        });

        // Save to the database
        await newArtistDetails.save();
        res.status(201).json({ message: 'Artist details added successfully' });
    } catch (error) {
        console.error('Error adding artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch artist details by userId
 * @route GET /artist/details/:userId
 */
router.get('/artist/details/:userId', async (req, res) => {
    try {
        const { userId } = req.params; // Extract userId from request params

        // Find artist details using the userId
        const artistDetails = await ArtistDetails.findOne({ userId });

        if (!artistDetails) {
            return res.status(404).json({ message: 'Artist not found with the given userId' });
        }

        res.status(200).json(artistDetails); // Send the artist details as response
    } catch (error) {
        console.error('Error fetching artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
