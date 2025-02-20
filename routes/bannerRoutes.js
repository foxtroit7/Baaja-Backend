const express = require('express');
const User = require('../models/bannerModal');
const router = express.Router();
const upload = require('../middlewares/upload'); // Multer middleware for file uploads

router.post('/banners', upload.single('photo'), async (req, res) => {
  try {
    const { type, category, description, socialMediaLink, startTime, endTime } = req.body;

    if (!type || !category || !description || !socialMediaLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const photo = req.file ? `uploads/${req.file.filename}` : null;

    const banner = new User({
      type,
      category,
      description,
      photo,
      socialMediaLink,
      startTime,
      endTime,
    });

    await banner.save();
    res.status(201).json({ message: 'Banner created successfully', banner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/banners', async (req, res) => {
  try {
    const banners = await User.find();
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/banners/:bannerId', async (req, res) => {
  try {
    const { bannerId } = req.params;
    const banner = await User.findOne({ bannerId });

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/banners/:bannerId', async (req, res) => {
  try {
    const { bannerId } = req.params;
    const banner = await User.findOneAndDelete({ bannerId });

    if (!banner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.put('/banners/:bannerId', upload.single('photo'), async (req, res) => {
  try {
    const { bannerId } = req.params;
    const { type, category, description, socialMediaLink, startTime, endTime } = req.body;

    const photo = req.file ? `uploads/${req.file.filename}` : null;

    const updatedFields = {
      type,
      category,
      description,
      socialMediaLink,
      startTime,
      endTime,
      ...(photo && { photo }),
    };

    const updatedBanner = await User.findOneAndUpdate(
      { bannerId },
      updatedFields,
      { new: true, runValidators: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.status(200).json({ message: 'Banner updated successfully', banner: updatedBanner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
