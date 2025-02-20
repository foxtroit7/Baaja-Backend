const express = require('express');
const ArtistReview = require('../models/artistReview'); // Import the artist reviews model

const router = express.Router();

/**
 * POST route to create a new review
 * @route POST /artist/reviews
 */
router.post('/artist/reviews', async (req, res) => {
    const { userId, photo, name, review } = req.body;

    // Ensure required fields are provided
    if (!userId || !name || !review) {
        return res.status(400).json({ message: 'userId, name, and review are required to create a review' });
    }

    try {
        // Create and save the new review
        const newReview = new ArtistReview({ userId, photo, name, review });
        await newReview.save();

        res.status(201).json({ message: 'Review added successfully', newReview });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch all reviews
 * @route GET /artist/reviews
 */
router.get('/artist/reviews', async (req, res) => {
    try {
        const reviews = await ArtistReview.find();
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch reviews by userId
 * @route GET /artist/reviews/:userId
 */
router.get('/artist/reviews/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const reviews = await ArtistReview.find({ userId });
        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for the given userId' });
        }
        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews by userId:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * PUT route to update a review by userId and review ID
 * @route PUT /artist/reviews/:id
 */
router.put('/artist/reviews/:id', async (req, res) => {
    const { id } = req.params; // Review ID
    const { userId, photo, name, review } = req.body;

    try {
        const existingReview = await ArtistReview.findById(id);
        if (!existingReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Ensure the userId matches
        if (existingReview.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized: userId mismatch' });
        }

        // Update review details
        existingReview.photo = photo ?? existingReview.photo;
        existingReview.name = name ?? existingReview.name;
        existingReview.review = review ?? existingReview.review;

        await existingReview.save();
        res.status(200).json({ message: 'Review updated successfully', existingReview });
    } catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * DELETE route to delete a review by userId and review ID
 * @route DELETE /artist/reviews/:id
 */
router.delete('/artist/reviews/:id', async (req, res) => {
    const { id } = req.params; // Review ID
    const { userId } = req.body; // UserId sent in the request body

    try {
        const existingReview = await ArtistReview.findById(id);
        if (!existingReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Ensure the userId matches
        if (existingReview.userId !== userId) {
            return res.status(403).json({ message: 'Unauthorized: userId mismatch' });
        }

        await ArtistReview.findByIdAndDelete(id);
        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
