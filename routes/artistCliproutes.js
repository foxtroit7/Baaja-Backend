const express = require('express');
const ArtistClips = require('../models/artistClips');
const Artist = require('../models/artistModel');
const router = express.Router();
const upload = require('../middlewares/upload');
const { verifyToken } = require('../middlewares/verifyToken');


router.post('/artist/clips/:user_id',verifyToken, upload.single('video'), async (req, res) => {
    const { user_id } = req.params;
    const { title } = req.body;

    try {
        const artist = await Artist.findOne({ user_id });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const video = req.file ? req.file.path : null;
        const newClip = new ArtistClips({ user_id, title, video });
        await newClip.save();

        res.status(201).json({ message: 'Artist clip created successfully', newClip });
    } catch (error) {
        console.error('Error creating artist clip:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/artist/clips/:user_id',verifyToken, async (req, res) => {
    const { user_id } = req.params;

    try {
        const artist = await Artist.findOne({ user_id });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const clips = await ArtistClips.find({ user_id });

        

        res.status(200).json(clips);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/artist/clips/:user_id/:id',verifyToken, async (req, res) => {
    const { user_id, id } = req.params;
    const { title, video } = req.body;

    try {
        const artist = await Artist.findOne({ user_id });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const clip = await ArtistClips.findOne({ _id: id, user_id });
        if (!clip) {
            return res.status(404).json({ message: 'Clip not found or unauthorized access' });
        }

        clip.title = title ?? clip.title;
        clip.video = video ?? clip.video;

        await clip.save();
        res.status(200).json({ message: 'Artist clip updated successfully', clip });
    } catch (error) {
        console.error('Error updating artist clip:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/artist/clips/:user_id/:id',verifyToken, async (req, res) => {
    const { user_id, id } = req.params;

    try {
        const artist = await Artist.findOne({ user_id });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const clip = await ArtistClips.findOne({ _id: id, user_id });
        if (!clip) {
            return res.status(404).json({ message: 'Clip not found or unauthorized access' });
        }

        await ArtistClips.findByIdAndDelete(id);
        res.status(200).json({ message: 'Artist clip deleted successfully' });
    } catch (error) {
        console.error('Error deleting artist clip:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
