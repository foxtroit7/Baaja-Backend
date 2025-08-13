const express = require('express');
const Youtube = require("../models/YoutubeModel"); 
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');

// Add Video
router.post("/youtube", async (req, res) => {
   try {
    const { video_id } = req.body;

    // Save only video_id in DB
    const newVideo = new Youtube({ video_id });
    await newVideo.save();

    // Send response with both video_id and generated video_url
    res.status(201).json({
      message: "Video saved",
      video: {
        video_id: newVideo.video_id,
        video_url: `https://www.youtube.com/watch?v=${newVideo.video_id}`,
        _id: newVideo._id,
        __v: newVideo.__v
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Error saving video", error: err.message });
  }
});

// Get All Videos
router.get("/youtube", async (req, res) => {
  try {
    const videos = await Youtube.find();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Video by ID
router.delete("/youtube/:id", async (req, res) => {
  try {
    const deleted = await Youtube.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Video not found" });
    res.json({ message: "Video deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
