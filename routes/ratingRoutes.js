const express = require('express');
const router = express.Router();
const ReviewModel = require('../models/ratingModal');
const UserModel = require('../models/userModel');
const ArtistModel = require('../models/artistDetailsModel'); // assumes artist_id is also user_id
const upload = require('../middlewares/upload');

// POST /api/review
router.post('/review', upload.array('file'), async (req, res) => {
    try {
      const { user_id, artist_id, rating, review } = req.body;
  
      const user = await UserModel.findOne({ user_id: user_id });
      const artist = await ArtistModel.findOne({ user_id: artist_id });
  
      if (!user || !artist) {
        return res.status(404).json({ message: 'User or artist not found' });
      }
  
      const files = req.files ? req.files.map(file => file.path) : [];
  
      const newReview = new ReviewModel({
        user_id: user.user_id,
        artist_id: artist.user_id,
        rating,
        review,
        file: files,
      });
  
      await newReview.save();
      res.status(201).json({ message: 'Review submitted successfully', data: newReview });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error submitting review' });
    }
  });
  
  router.get('/reviews/:artist_id', async (req, res) => {
    try {
      const { artist_id } = req.params;
  
      const reviews = await ReviewModel.find({ artist_id });
  
      if (!reviews.length) {
        return res.status(404).json({ message: 'No reviews found for this artist' });
      }
  
      let totalRating = 0;
      let validRatingCount = 0; // ✅ Declare this
  
      let countByStars = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };
  
      for (let review of reviews) {
        const r = parseInt(review.rating);
        if (!isNaN(r) && r >= 1 && r <= 5) {
          totalRating += r;
          countByStars[r]++;
          validRatingCount++;
        }
      }
  
      const avgRating = validRatingCount > 0 ? (totalRating / validRatingCount).toFixed(2) : '0.00';
  
      const populatedReviews = await Promise.all(
        reviews.map(async (review) => {
          const user = await UserModel.findOne({ user_id: review.user_id });
          return {
            ...review._doc,
            user_name: user?.name || 'Unknown'
          };
        })
      );
  
      return res.json({
        artist_id,
        avg_rating: avgRating,
        total_review: reviews.length.toString(), // or use validRatingCount.toString() if you want only valid rating count
        avg_one_star_rating: countByStars[1].toString(),
        avg_two_star_rating: countByStars[2].toString(),
        avg_three_star_rating: countByStars[3].toString(),
        avg_four_star_rating: countByStars[4].toString(),
        avg_five_star_rating: countByStars[5].toString(),
        reviews: populatedReviews,
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

  module.exports = router;
