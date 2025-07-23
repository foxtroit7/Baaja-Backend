const express = require('express');
const Video = require('../models/videoModel');
const upload = require('../middlewares/upload');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
// Create a new video
router.post('/video',verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { title, link } = req.body;
    const photoPath = req.file ? req.file.path : null;

    if (!title || !link) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newVideo = new Video({
      title,
      link,
      photo: photoPath
    });

    await newVideo.save();
    res.status(201).json({ message: 'Video created successfully', video: newVideo });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all videos
router.get('/video',verifyToken, async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a video by video_id
router.get('/video/:video_id',verifyToken, async (req, res) => {
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
router.put('/video/:video_id', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { video_id } = req.params;
    const { title, link } = req.body;
    const photoPath = req.file ? req.file.path : null;

    const updateData = {};
    if (title) updateData.title = title;
    if (link) updateData.link = link;
    if (photoPath) updateData.photo = photoPath;

    const updatedVideo = await Video.findOneAndUpdate(
      { video_id },
      { $set: updateData },
      { new: true } // returns the updated document
    );

    if (!updatedVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ message: 'Video updated successfully', video: updatedVideo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Delete a video by video_id
router.delete('/video/:video_id',verifyToken, async (req, res) => {
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
