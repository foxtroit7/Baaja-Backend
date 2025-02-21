const express = require('express');
const ArtistDetails = require('../models/artistDetailsModel'); // Import the artist details model
const { verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();


router.post('/artist/details', async (req, res) => {
    const { 
        userId, owner_name,profile_picture, profile_name, totalBookings, location, categoryType, categoryImage, experience, 
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
            userId, owner_name,profile_picture, profile_name, totalBookings, location, categoryType, categoryImage, experience, 
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


router.get('/artist/details/:userId', verifyToken, async (req, res) => {
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


router.put('/artist/details/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params; // Extract userId from request params
    const {
        owner_name, profile_picture, profile_name, totalBookings, location, categoryType, categoryImage, experience, 
        description, totalmoney, recent_order, status, rating
    } = req.body;

    try {
        // Check if the artist exists
        const artistDetails = await ArtistDetails.findOne({ userId });
        if (!artistDetails) {
            return res.status(404).json({ message: 'Artist not found with the given userId' });
        }

        // Update the artist's details
        artistDetails.owner_name = owner_name ?? artistDetails.owner_name;
        artistDetails.profile_picture = profile_picture ?? artistDetails.profile_picture;
        artistDetails.profile_name = profile_name ?? artistDetails.profile_name;
        artistDetails.totalBookings = totalBookings ?? artistDetails.totalBookings;
        artistDetails.location = location ?? artistDetails.location;
        artistDetails.categoryType = categoryType ?? artistDetails.categoryType;
        artistDetails.categoryImage = categoryImage ?? artistDetails.categoryImage;
        artistDetails.experience = experience ?? artistDetails.experience;
        artistDetails.description = description ?? artistDetails.description;
        artistDetails.totalmoney = totalmoney ?? artistDetails.totalmoney;
        artistDetails.recent_order = recent_order ?? artistDetails.recent_order;
        artistDetails.status = status ?? artistDetails.status;
        artistDetails.rating = rating ?? artistDetails.rating;

        // Save the updated details
        await artistDetails.save();

        res.status(200).json({ message: 'Artist details updated successfully', artistDetails });
    } catch (error) {
        console.error('Error updating artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



module.exports = router;
