const express = require('express');
const router = express.Router();
const ReviewModel = require('../models/ratingModal');
const UserModel = require('../models/userModel');
const ArtistModel = require('../models/artistDetailsModel'); 
const upload = require('../middlewares/upload');
const bookingModal = require('../models/bookingModal');
const ArtistDetails = require('../models/artistDetailsModel');
// POST /api/review
router.post('/review', upload.array('file'), async (req, res) => {
  try {
    const { rating, review, booking_id } = req.body;

    // Find booking by booking_id
    const booking = await bookingModal.findOne({ booking_id });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Review can only be submitted for completed bookings' });
    }

    // ✅ Check if review already exists for this booking
    const existingReview = await ReviewModel.findOne({ booking_id });
    if (existingReview) {
      return res.status(400).json({ message: 'Review already submitted for this booking' });
    }

    // Get artist_id and user_id from booking
    const user = await UserModel.findOne({ user_id: booking.user_id });
    const artist = await ArtistModel.findOne({ user_id: booking.artist_id });

    if (!user || !artist) {
      return res.status(404).json({ message: 'User or artist not found' });
    }

  const files = req.files && req.files.length > 0 ? req.files.map(file => file.path) : [];


 const newReview = new ReviewModel({
  user_id: booking.user_id,
  artist_id: booking.artist_id,
  booking_id: booking.booking_id,
  rating: rating || null,   
  review: review || null,   
  file: files,              
});

    await newReview.save();
    
    // ✅ Recalculate overall rating and rating count
  const reviews = await ReviewModel.find({ artist_id: booking.artist_id });
const ratingReviews = reviews.filter(r => r.rating !== null && r.rating !== undefined);

const rating_count = ratingReviews.length;
const overall_rating =
  rating_count > 0
    ? parseFloat(
        (
          ratingReviews.reduce((sum, r) => sum + r.rating, 0) / rating_count
        ).toFixed(2)
      )
    : 0;
    // ✅ Update ArtistDetails with numbers
    await ArtistDetails.updateOne(
      { user_id: booking.artist_id },
      { $set: { overall_rating, rating_count } }
    );
    res.status(201).json({
      message: 'Review submitted successfully',
      data: newReview
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting review' });
  }
});

router.get('/reviews/:artist_id', async (req, res) => {
  try {
    const { artist_id } = req.params;

    // ✅ Parse pagination query only if provided
    const offset = req.query.offset ? parseInt(req.query.offset) : null;
    const count = req.query.count ? parseInt(req.query.count) : null;

    // ✅ Get all reviews for the artist
    const reviews = await ReviewModel.find({ artist_id });

    if (!reviews.length) {
      return res.status(404).json({ message: 'No reviews found for this artist' });
    }

    let totalRating = 0;
    let validRatingCount = 0;

    let countByStars = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    // ✅ Update booking_rating = true if needed
    await Promise.all(
      reviews.map(async (review) => {
        const booking = await bookingModal.findOne({ booking_id: review.booking_id });
        if (booking && !booking.booking_rating) {
          booking.booking_rating = true;
          await booking.save();
        }
      })
    );

    // ✅ Compute rating statistics
    for (let review of reviews) {
      const r = parseInt(review.rating);
      if (!isNaN(r) && r >= 1 && r <= 5) {
        totalRating += r;
        countByStars[r]++;
        validRatingCount++;
      }
    }

    const avgRating = validRatingCount > 0 ? (totalRating / validRatingCount).toFixed(2) : '0.00';

    // ✅ Apply pagination only if both offset and count are provided
    let paginatedReviews = reviews;
    if (offset !== null && count !== null) {
      paginatedReviews = reviews.slice(offset, offset + count);
    }

    // ✅ Populate user_name only for paginated reviews
    const populatedReviews = await Promise.all(
      paginatedReviews.map(async (review) => {
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
      total_review: reviews.length.toString(),
      avg_one_star_rating: countByStars[1].toString(),
      avg_two_star_rating: countByStars[2].toString(),
      avg_three_star_rating: countByStars[3].toString(),
      avg_four_star_rating: countByStars[4].toString(),
      avg_five_star_rating: countByStars[5].toString(),
      reviews: populatedReviews,
      pagination: offset !== null && count !== null ? {
        offset,
        count,
        total_reviews: reviews.length
      } : null
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
