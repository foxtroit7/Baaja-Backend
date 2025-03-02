const express = require('express');
const ArtistDetails = require('../models/artistDetailsModel'); // Import the artist details model
const { verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();
const upload = require('../middlewares/upload');

router.post('/artist/details',verifyToken,upload.single('photo'),async (req, res) => {
    const { 
        user_id, owner_name, profile_name, total_bookings, location, category_type, category_image, experience, 
        description, total_money, recent_order, status, rating
    } = req.body;

    try {
        // Check if the artist already has details
        const existingDetails = await ArtistDetails.findOne({ user_id });
        if (existingDetails) {
            return res.status(400).json({ message: 'Artist details already exist' });
        }
        const photo =  req.file ? req.file.path : null;
        // Create new artist details entry
        const newArtistDetails = new ArtistDetails({
            user_id, owner_name, photo, profile_name, total_bookings, location, category_type, category_image, experience, 
            description, total_money, recent_order, status, rating
        });

        // Save to the database
        await newArtistDetails.save();
        res.status(201).json({ message: 'Artist details added successfully' });
    } catch (error) {
        console.error('Error adding artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.get('/artist/details/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params; // Extract user_id from request params

        // Find artist details using the user_id
        const artistDetails = await ArtistDetails.findOne({ user_id });

        if (!artistDetails) {
            return res.status(404).json({ message: 'Artist not found with the given user_id' });
        }

        res.status(200).json(artistDetails); // Send the artist details as response
    } catch (error) {
        console.error('Error fetching artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.put('/artist/details/:user_id', verifyToken, async (req, res) => {
    const { user_id } = req.params; // Extract user_id from request params
    const {
        owner_name, photo, profile_name, total_bookings, location, category_type, category_image, experience, 
        description, total_money, recent_order, status, rating
    } = req.body;

    try {
        // Check if the artist exists
        const artistDetails = await ArtistDetails.findOne({ user_id });
        if (!artistDetails) {
            return res.status(404).json({ message: 'Artist not found with the given user_id' });
        }

        // Update the artist's details
        artistDetails.owner_name = owner_name ?? artistDetails.owner_name;
        artistDetails.photo = photo ?? artistDetails.photo;
        artistDetails.profile_name = profile_name ?? artistDetails.profile_name;
        artistDetails.total_bookings = total_bookings ?? artistDetails.total_bookings;
        artistDetails.location = location ?? artistDetails.location;
        artistDetails.category_type = category_type ?? artistDetails.category_type;
        artistDetails.category_image = category_image ?? artistDetails.category_image;
        artistDetails.experience = experience ?? artistDetails.experience;
        artistDetails.description = description ?? artistDetails.description;
        artistDetails.total_money = total_money ?? artistDetails.total_money;
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

router.get('/artist/details',verifyToken, async (req, res) => {
    try {
        const allArtists = await ArtistDetails.find(); // Fetch all artists
        res.status(200).json(allArtists); // Return the list
    } catch (error) {
        console.error('Error fetching all artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
module.exports = router;
