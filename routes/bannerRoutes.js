const express = require('express');
const User = require('../models/bannerModal');
const router = express.Router();
const upload = require('../middlewares/upload'); // Multer middleware for file uploads

// Create a new banner
router.post('/banners', upload.single('photo'), async (req, res) => {
  try {
    const { type, category, description, socialMediaLink, startTime, endTime } = req.body;

    if (!type || !category || !description || !socialMediaLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const photo = req.file ? req.file.path : null; // Get the file path if an image is uploaded

    const user = new User({
      type,
      category,
      description,
      photo,
      socialMediaLink,
      startTime,
      endTime
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all banners
router.get('/banners', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a banner by its ID
router.get('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await User.findById(id);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a banner by its ID
router.delete('/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await User.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update (Edit) a banner by ID
router.put('/banners/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category, description, socialMediaLink, startTime, endTime } = req.body;

    const photo = req.file ? req.file.path : null; // Get the file path if a new image is uploaded

    const updatedFields = {
      type,
      category,
      description,
      socialMediaLink,
      startTime,
      endTime,
      ...(photo && { photo }) // Update photo only if a new image is uploaded
    };

    const updatedBanner = await User.findByIdAndUpdate(
      id,
      updatedFields,
      { new: true, runValidators: true } // Return updated document & validate input
    );

    if (!updatedBanner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json(updatedBanner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
