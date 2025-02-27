const express = require('express');
const Artistreviews = require('../models/artistReview');
const Artist = require('../models/artistModel');
const router = express.Router();
const upload = require('../middlewares/upload');


router.post('/artist/reviews/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name,review } = req.body;

    try {
        const artist = await Artist.findOne({ userId });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const newreview = new Artistreviews({ userId, name, review });
        await newreview.save();

        res.status(201).json({ message: 'Artist review created successfully', newreview });
    } catch (error) {
        console.error('Error creating artist review:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/artist/reviews/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const artist = await Artist.findOne({ userId });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const reviews = await Artistreviews.find({ userId });
        if (!reviews.length) {
            return res.status(404).json({ message: 'No reviews found for the given userId' });
        }

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews by userId:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.put('/artist/reviews/:userId/:id', async (req, res) => {
    const { userId, id } = req.params;
    const { name, review } = req.body;

    try {
        const artist = await Artist.findOne({ userId });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const reviews = await Artistreviews.findOne({ _id: id, userId });
        if (!review) {
            return res.status(404).json({ message: 'review not found or unauthorized access' });
        }

        reviews.name = name ?? reviews.name;
        reviews.review = review ?? reviews.review;

        await reviews.save();
        res.status(200).json({ message: 'Artist review updated successfully', review });
    } catch (error) {
        console.error('Error updating artist review:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * DELETE route to delete an artist review by userId and review ID
 * @route DELETE /artist/reviews/:userId/:id
 */
router.delete('/artist/reviews/:userId/:id', async (req, res) => {
    const { userId, id } = req.params;

    try {
        const artist = await Artist.findOne({ userId });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        const review = await Artistreviews.findOne({ _id: id, userId });
        if (!review) {
            return res.status(404).json({ message: 'review not found or unauthorized access' });
        }

        await Artistreviews.findByIdAndDelete(id);
        res.status(200).json({ message: 'Artist review deleted successfully' });
    } catch (error) {
        console.error('Error deleting artist review:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
