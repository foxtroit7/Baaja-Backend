const express = require('express');
const Video = require('../models/videoModel'); 
const upload = require('../middlewares/upload');

const router = express.Router();

// Create a new video
router.post('/video', upload.single('photo'), async (req, res) => {
  try {
    const { video, link } = req.body;
    const photoPath = req.file ? `uploads/${req.file.filename}` : null; // Prepend "uploads/" to filename

    if (!video || !photoPath) {
      return res.status(400).json({ error: "Missing required fields (video name and photo are required)." });
    }

    const newVideo = new Video({
      video,
      link,
      photo: photoPath, 
    });

    await newVideo.save();
    res.status(201).json({ message: 'Video created successfully', video: newVideo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all videos
router.get('/video', async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single video by its ID
router.get('/video/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a video by its ID
router.put('/video/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { video, link } = req.body;
    const photoPath = req.file ? `uploads/${req.file.filename}` : null; // Prepend "uploads/" to filename

    const updateData = { video, link };
    if (photoPath) {
      updateData.photo = photoPath; // Update photo only if a new file is uploaded
    }

    const updatedVideo = await Video.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video updated successfully', video: updatedVideo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a video by its ID
router.delete('/video/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
