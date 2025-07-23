const express = require('express');
const Video = require('../models/videoModel');
const upload = require('../middlewares/upload');
const router = express.Router();

// Create a new video
router.post('/video', upload.single('photo'), async (req, res) => {
  try {
    const { title, link, position } = req.body;
    const photoPath = req.file ? req.file.path : null;

    if (!title || !link || !position) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if position already exists
    const positionExists = await Video.findOne({ position: parseInt(position) });
    if (positionExists) {
      return res.status(409).json({ error: `Position ${position} already exists. Choose a different one.` });
    }

    const newVideo = new Video({
      title,
      link,
      photo: photoPath,
      position: parseInt(position)
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

// Get a video by video_id
router.get('/video/:video_id', async (req, res) => {
  try {
    const { video_id } = req.params;
    const video = await Video.findOne({ video_id });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a video by video_id
router.put('/video/:video_id', upload.single('photo'), async (req, res) => {
  try {
    const { video_id } = req.params;
    const { title, link, position } = req.body;
    const photoPath = req.file ? req.file.path : null;

    // Check if the new position is already taken by another video
    if (position !== undefined) {
      const existingVideo = await Video.findOne({ position: parseInt(position) });

      // If found and it's not the same video we're updating, block it
      if (existingVideo && existingVideo._id.toString() !== video_id) {
        return res.status(409).json({ error: `Position ${position} is already taken by another video.` });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (link) updateData.link = link;
    if (position !== undefined) updateData.position = parseInt(position);
    if (photoPath) updateData.photo = photoPath;

    const updatedVideo = await Video.findByIdAndUpdate(video_id, updateData, { new: true });

    if (!updatedVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video updated successfully', video: updatedVideo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete a video by video_id
router.delete('/video/:video_id', async (req, res) => {
  try {
    const { video_id } = req.params;
    const video = await Video.findOneAndDelete({ video_id });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
