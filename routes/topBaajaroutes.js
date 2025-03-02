const express = require('express');
const topBaaja = require('../models/topBaaja'); // Updated model
const upload = require('../middlewares/upload'); // Multer middleware for file uploads
const { verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();

// Create a new TopBaaja record
router.post('/create/top-baaja', upload.single('photo'), async (req, res) => {
  try {
    const { rating, category_type, profile_name, user_id } = req.body;

    // Validate required fields
    if (!rating || !category_type || !profile_name || !user_id) {
      return res.status(400).json({ error: 'Rating, Category Type, and Profile Name are required' });
    }

    // Check if a photo was uploaded
    const photoPath = req.file ? `uploads/${req.file.filename}` : null;

    if (!photoPath) {
      return res.status(400).json({ error: 'Photo is required' });
    }

    // Create a new TopBaaja instance
    const newTopBaaja = new topBaaja({
      rating,
      photo: photoPath, // Save the photo path
      category_type,
      profile_name,
      user_id
    });

    // Save the record to the database
    await newTopBaaja.save();

    res.status(201).json({
      message: 'TopBaaja record created successfully',
      topBaaja: newTopBaaja,
    });
  } catch (error) {
    console.error('Error creating TopBaaja record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all TopBaaja records
router.get('/get/top-baaja', verifyToken, async (req, res) => {
  try {
    const topBaajaRecords = await topBaaja.find();

    if (!topBaajaRecords.length) {
      return res.status(404).json({ message: 'No TopBaaja records found' });
    }

    res.status(200).json({
      message: 'TopBaaja records fetched successfully',
      records: topBaajaRecords,
    });
  } catch (error) {
    console.error('Error fetching TopBaaja records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
