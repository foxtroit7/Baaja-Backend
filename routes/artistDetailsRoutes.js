const express = require('express');
const ArtistDetails = require('../models/artistDetailsModel'); 
const { verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();
const upload = require('../middlewares/upload');
const User = require('../models/userModel')
const Artistreviews = require('../models/artistReview')
const Booking = require('../models/bookingModal')
router.post('/artist/details', verifyToken, upload.single('photo'), async (req, res) => {
    const { 
        user_id, owner_name, profile_name, total_bookings, location, category_type, category_id, 
        experience, description, total_price, advance_price, recent_order, featured, required_sevices
    } = req.body;

    try {
        const existingDetails = await ArtistDetails.findOne({ user_id });
        if (existingDetails) {
            return res.status(400).json({ message: 'Artist details already exist' });
        }

        const photo = req.file ? req.file.path : null;

        // Store the artist data in artist_details with default approval status
        const newArtist = new ArtistDetails({
            user_id, owner_name, photo, profile_name, total_bookings, location, category_type, 
            category_id, experience, description, total_price, advance_price, recent_order, required_sevices,
            status: 'waiting',  // Default status
            approved: false,    // Default approval status
            top_baaja: false,
            featured: false  
        });

        await newArtist.save();
        res.status(201).json({ message: 'Artist details submitted for approval', newArtist });

    } catch (error) {
        console.error('Error adding artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.put('/artist/poster/:user_id', verifyToken, upload.single('poster'), async (req, res) => {
    try {
      const { user_id } = req.params;
      const userRole = req.user.role;
  
      if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Only admin can update poster' });
      }
  
      const artist = await ArtistDetails.findOne({ user_id });
      if (!artist) {
        return res.status(404).json({ message: 'Artist not found' });
      }
  
      const poster = req.file ? req.file.path : null;
  
      if (!poster) {
        return res.status(400).json({ message: 'No poster file uploaded' });
      }
  
      artist.poster = poster;
      await artist.save();
  
      res.status(200).json({
        message: 'Poster updated successfully by admin',
        artist,
      });
    } catch (error) {
      console.error('Error updating poster:', error);
      res.status(500).json({ message: 'Internal Server Error', error });
    }
});
// pending waithing for appoval artist api
router.get('/pending_artists_details', verifyToken, async (req, res) => {
    try {
        const pendingArtists = await ArtistDetails.find({
            approved: false,
            status: { $in: ['waiting'] }  // Include both "waiting" and "rejected" statuses
        });

        res.status(200).json(pendingArtists);
    } catch (error) {
        console.error('Error fetching pending artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.put('/artist/approve/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params;

        // Find artist with pending status
        const pendingArtist = await ArtistDetails.findOne({ user_id, approved: false });

        if (!pendingArtist) {
            return res.status(404).json({ message: 'Artist not found in pending list' });
        }

        // Approve artist
        await ArtistDetails.findOneAndUpdate(
            { user_id },
            { approved: true, status: 'approved', pendingChanges: {} }
        );

        res.status(200).json({ message: 'Artist approved successfully' });

    } catch (error) {
        console.error('Error approving artist:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Main get detail API
router.get('/artists_details', verifyToken, async (req, res) => {
    try {
        const { category_id, user_id, artist_id, top_baaja } = req.query;

        let query = { approved: true }; // ✅ Only fetch approved artists

        if (category_id) {
            query.category_id = category_id;
        }

        if (artist_id) {
            query.user_id = artist_id;
        }

        if (top_baaja === 'true') {
            query.top_baaja = true;  // ✅ Only fetch artists with top_baaja = true
        }

        // ✅ Fetch artists based on the query
        const artists = await ArtistDetails.find(query);

        let artistIds = [];
        if (user_id) {
            const user = await User.findOne({ user_id });

            if (user) {
                artistIds = user.favorites.map(fav => fav.artist_id);
            }
        }

        // ✅ Fetch bookings for each artist and calculate stats
        const artistWithStats = await Promise.all(
            artists.map(async (artist) => {
                const reviews = await Artistreviews.find({ user_id: artist.user_id });

                let overall_rating = 0;
                if (reviews.length > 0) {
                    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
                    overall_rating = totalRating / reviews.length;
                }

                // ✅ Fetch all bookings of this artist
                const bookings = await Booking.find({ artist_id: artist.user_id });

                const total_bookings = bookings.length;
                const upcoming_bookings = bookings.filter(b => b.status === "accepted").length;
                const past_bookings = bookings.filter(b => b.status === "completed").length;
                const total_revenue = bookings
                    .filter(b => b.status === "completed")
                    .reduce((sum, b) => sum + (b.total_price || 0), 0);

                return {
                    ...artist.toObject(),
                    is_favorite: artistIds.includes(artist.user_id),
                    overall_rating,
                    total_bookings,
                    upcoming_bookings,
                    past_bookings,
                    total_revenue
                };
            })
        );

        // ✅ Return all artists if no `top_baaja=true` is passed
        if (!top_baaja) {
            return res.status(200).json(artistWithStats);
        }

        // ✅ If `top_baaja=true`, return only those artists
        const topBaajaArtists = artistWithStats.filter(artist => artist.top_baaja === true);

        res.status(200).json(topBaajaArtists);

    } catch (error) {
        console.error('Error fetching artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/artist/details/:user_id', verifyToken, async (req, res) => {
    const { user_id } = req.params; // Extract user_id from request params
    const {
        owner_name, photo, profile_name, total_bookings, location, category_type, experience, 
        description, total_price, advance_price, recent_order, status, overall_rating, required_services
    } = req.body;

    try {
        // Check if the artist exists
        const artistDetails = await ArtistDetails.findOne({ user_id });
        if (!artistDetails) {
            return res.status(404).json({ message: 'Artist not found with the given user_id' });
        }

        // Update the artist's details
        artistDetails.owner_name = owner_name ?? artistDetails.owner_name;
        artistDetails.photo = photo ?? artistDetails.photo;
        artistDetails.profile_name = profile_name ?? artistDetails.profile_name;
        artistDetails.total_bookings = total_bookings ?? artistDetails.total_bookings;
        artistDetails.location = location ?? artistDetails.location;
        artistDetails.category_type = category_type ?? artistDetails.category_type;
        artistDetails.photo = photo ?? artistDetails.photo;
        artistDetails.experience = experience ?? artistDetails.experience;
        artistDetails.description = description ?? artistDetails.description;
        artistDetails.total_price = total_price ?? artistDetails.total_price;
        artistDetails.advance_price = advance_price ?? artistDetails.advance_price;
        artistDetails.recent_order = recent_order ?? artistDetails.recent_order;
        artistDetails.status = status ?? artistDetails.status;
        artistDetails.overall_rating = overall_rating ?? artistDetails.overall_rating;
        artistDetails.required_services = required_services ?? artistDetails.required_services
        // Save the updated details
        await artistDetails.save();

        res.status(200).json({ message: 'Artist details updated successfully', artistDetails });
    } catch (error) {
        console.error('Error updating artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
// SEARCH ARTISTS BY PROFILE NAME
router.get('/artist/search', verifyToken, async (req, res) => {
    try {
        let { profile_name } = req.query;

        if (!profile_name || typeof profile_name !== 'string') {
            return res.status(400).json({ message: 'profile_name query parameter is required and must be a string' });
        }

        // Trim and escape special characters for regex
        profile_name = profile_name.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

        console.log("Searching for profile_name:", profile_name);

        const artists = await ArtistDetails.find({
            profile_name: { $regex: profile_name, $options: 'i' }
        });

      

        if (!artists.length) {
            return res.status(404).json({ message: 'No artists found with the given profile name' });
        }

        res.status(200).json(artists);
    } catch (error) {
        console.error('Error searching artist details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/artist/top_baaja/approve/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        const { top_baaja_rank } = req.body;

        if (!top_baaja_rank) {
            return res.status(400).json({ message: 'top_baaja_rank is required' });
        }
        // Check for existing rank
        const rankAlreadyAssigned = await ArtistDetails.findOne({
            top_baaja: true,
            top_baaja_rank
        });

        if (rankAlreadyAssigned) {
            return res.status(400).json({ message: `Rank ${top_baaja_rank} is already assigned.` });
        }

        // ✅ Update artist
        const artist = await ArtistDetails.findOneAndUpdate(
            { user_id },
            {
                top_baaja: true,
                top_baaja_rank: top_baaja_rank
            },
            { new: true }
        );

        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }
        res.status(200).json({
            message: 'Artist approved as Top Baaja',
            artist
        });

    } catch (error) {
        console.error('Error approving artist:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/artist/top_baaja/reject/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params;

        const artist = await ArtistDetails.findOne({ user_id });
        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        artist.top_baaja = false;
        artist.top_baaja_rank = null; // 🧹 Clear the rank
        await artist.save();

        res.status(200).json({ message: 'Artist removed from Top Baaja list', artist });

    } catch (error) {
        console.error('Error rejecting artist:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/top_baaja/list', verifyToken, async (req, res) => {
    try {
        const topBaajaArtists = await ArtistDetails.find({ 
            top_baaja: true, 
            top_baaja_rank: { $ne: null } 
        })
        .sort({ top_baaja_rank: 1 }); // ⬆️ Sort by rank ascending

        res.status(200).json(topBaajaArtists);
    } catch (error) {
        console.error('Error fetching top baaja list:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.put('/artist/feautured/approve/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        const { featured_rank } = req.body;

        if (!featured_rank) {
            return res.status(400).json({ message: 'featured_rank is required' });
        }
        // Check for existing rank
        const rankAlreadyAssigned = await ArtistDetails.findOne({
            featured: true,
            featured_rank
        });

        if (rankAlreadyAssigned) {
            return res.status(400).json({ message: `Rank ${featured_rank} is already assigned.` });
        }

        // ✅ Update artist
        const artist = await ArtistDetails.findOneAndUpdate(
            { user_id },
            {
                featured: true,
                featured_rank: featured_rank
            },
            { new: true }
        );

        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }
        res.status(200).json({
            message: 'Artist approved as feautred',
            artist
        });

    } catch (error) {
        console.error('Error approving artist:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/feautured/list', verifyToken, async (req, res) => {
    try {
        const topBaajaArtists = await ArtistDetails.find({ 
            featured: true, 
            featured_rank: { $ne: null } 
        })
        .sort({ featured_rank: 1 }); // ⬆️ Sort by rank ascending

        res.status(200).json(topBaajaArtists);
    } catch (error) {
        console.error('Error fetching feautured list:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.put('/artist/feautured/remove/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params;

        const artist = await ArtistDetails.findOneAndUpdate(
            { user_id },
            {
                featured: false,
                featured_rank: null
            },
            { new: true }
        );

        if (!artist) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        res.status(200).json({
            message: 'Artist removed from featured list',
            artist
        });
    } catch (error) {
        console.error('Error removing artist from featured list:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
