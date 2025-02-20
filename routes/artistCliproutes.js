const express = require('express');
const ArtistClips = require('../models/artistClips'); // Import the artist clips model

const router = express.Router();

/**
 * GET route to fetch all artist clips
 * @route GET /artist/clips
 */
/**
 * POST route to create a new artist clip
 * @route POST /artist/clips
 */
router.post('/artist/clips', async (req, res) => {
    const { userId, title, video } = req.body;

    // Ensure userId is provided
    if (!userId) {
        return res.status(400).json({ message: 'userId is required to create a clip' });
    }

    try {
        // Create and save the new clip
        const newClip = new ArtistClips({ userId, title, video });
        await newClip.save();

        res.status(201).json({ message: 'Artist clip created successfully', newClip });
    } catch (error) {
        console.error('Error creating artist clip:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


/**
 * GET route to fetch artist clips by userId
 * @route GET /artist/clips/:userId
 */
router.get('/artist/clips/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const clips = await ArtistClips.find({ userId });
        if (!clips || clips.length === 0) {
            return res.status(404).json({ message: 'No clips found for the given userId' });
        }
        res.status(200).json(clips);
    } catch (error) {
        console.error('Error fetching clips by userId:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



/**
 * PUT route to update an artist clip by userId and clip ID
 * @route PUT /artist/clips/:id
 */
router.put('/artist/clips/:id', async (req, res) => {
    const { id } = req.params; // Clip ID
    const { userId, title, video } = req.body;

    try {
        const clip = await ArtistClips.findById(id);
        if (!clip) {
            return res.status(404).json({ message: 'Clip not found' });
        }

        // Ensure the userId matches
        if (clip.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized: userId mismatch' });
        }

        // Update clip details
        clip.title = title ?? clip.title;
        clip.video = video ?? clip.video;

        await clip.save();
        res.status(200).json({ message: 'Artist clip updated successfully', clip });
    } catch (error) {
        console.error('Error updating artist clip:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * DELETE route to delete an artist clip by userId and clip ID
 * @route DELETE /artist/clips/:id
 */
router.delete('/artist/clips/:id', async (req, res) => {
    const { id } = req.params; // Clip ID
    const { userId } = req.body; // UserId sent in the request body

    try {
        const clip = await ArtistClips.findById(id);
        if (!clip) {
            return res.status(404).json({ message: 'Clip not found' });
        }

        // Ensure the userId matches
        if (clip.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized: userId mismatch' });
        }

        await ArtistClips.findByIdAndDelete(id);
        res.status(200).json({ message: 'Artist clip deleted successfully' });
    } catch (error) {
        console.error('Error deleting artist clip:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
