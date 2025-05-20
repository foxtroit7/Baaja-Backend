const express = require('express');
const ArtistDetails = require('../models/artistDetailsModel'); 
const { verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();
const upload = require('../middlewares/upload');
const User = require('../models/userModel')
const Artistreviews = require('../models/artistReview')
const Booking = require('../models/bookingModal')
const ArtistPayments = require('../models/artistPayments');
const PendingArtistUpdate = require('../models/PendingArtistUpdate');
const ArtistClips = require('../models/artistClips');
const Artist = require('../models/artistModel');
const fs = require('fs');
const path = require('path');

router.post('/artist/details', verifyToken, upload.single('photo'), async (req, res) => {
    const { 
        user_id, owner_name, profile_name, total_bookings, location, category_type, category_id, 
        experience, description, total_price, advance_price, recent_order,  required_sevices
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
            status: 'waiting',
            approved: false,    
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
             // ✅ Get artist payment data
                const payments = await ArtistPayments.findOne({ user_id: artist.user_id });
                   // ✅ Check for pending update
                const hasPendingUpdate = await PendingArtistUpdate.findOne({
                    user_id: artist.user_id,
                    status: 'pending'
                });
                return {
                    ...artist.toObject(),
                    is_favorite: artistIds.includes(artist.user_id),
                    overall_rating,
                    total_bookings,
                    upcoming_bookings,
                    past_bookings,
                    total_revenue,
                    payments: payments || null,
                    update_status: !!hasPendingUpdate 
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
  const { user_id } = req.params;
  const updatedFields = req.body;

  try {
    const artist = await ArtistDetails.findOne({ user_id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const originalData = {};
    const changedFields = {};

    Object.keys(updatedFields).forEach(key => {
      if (artist[key] !== updatedFields[key]) {
        originalData[key] = artist[key];
        changedFields[key] = updatedFields[key];
      }
    });

    if (Object.keys(changedFields).length === 0) {
      return res.status(200).json({ message: 'No changes detected.' });
    }

    await PendingArtistUpdate.create({
      user_id,
      update_type: 'details',
      original_data: originalData,
      updated_data: changedFields,
      fields_changed: Object.keys(changedFields),
    });

    res.status(200).json({
      message: 'Changes submitted for admin approval. Will reflect after approval.',
    });

  } catch (error) {
    console.error('Error saving pending update:', error);
    res.status(500).json({ message: 'Internal server error' });
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

router.post('/artist/clips/:user_id', verifyToken, upload.single('video'), async (req, res) => {
  const { user_id } = req.params;
  const { title } = req.body;

  try {
    const artist = await Artist.findOne({ user_id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const video = req.file ? req.file.path : null;

    // Store the clip data as pending update instead of saving directly
    const updatedData = {
      title: title || '',
      video: video || '',
    };

    await PendingArtistUpdate.create({
      user_id,
      update_type: 'clip',
      reference_id: null, // Since it's a new clip, there's no existing ID
      original_data: {}, // No original data because it's a new creation
      updated_data: updatedData,
      fields_changed: Object.keys(updatedData),
    });

    res.status(200).json({
      message: 'New clip submitted for admin approval. Will be added after approval.',
    });

  } catch (error) {
    console.error('Error creating artist clip (pending):', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/admin/pending-updates', async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const updates = await PendingArtistUpdate.find(query).sort({ createdAt: -1 });

    res.status(200).json(updates);
  } catch (error) {
    console.error('Error fetching artist updates:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/admin-pending-updates-approve/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const updateDoc = await PendingArtistUpdate.findById(id);
    if (!updateDoc || updateDoc.status !== 'pending') {
      return res.status(404).json({ message: 'Pending update not found' });
    }

    if (updateDoc.update_type === 'details') {
      await ArtistDetails.updateOne(
        { user_id: updateDoc.user_id },
        { $set: updateDoc.updated_data }
      );
    } else if (updateDoc.update_type === 'clip') {
      await ArtistClips.updateOne(
        { _id: updateDoc.reference_id, user_id: updateDoc.user_id },
        { $set: updateDoc.updated_data }
      );
    }

    updateDoc.status = 'approved';
    await updateDoc.save();

    res.status(200).json({ message: 'Update approved and applied successfully.' });
  } catch (error) {
    console.error('Error approving update:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/admin-pending-updates-reject/:id', async (req, res) => {
  const { id } = req.params;
  const { admin_remarks } = req.body;

  try {
    const updateDoc = await PendingArtistUpdate.findById(id);
    if (!updateDoc || updateDoc.status !== 'pending') {
      return res.status(404).json({ message: 'Pending update not found' });
    }

    // If it's a new clip submission (original_data is empty), delete uploaded video file
    if (
      updateDoc.update_type === 'clip' &&
      updateDoc.original_data &&
      Object.keys(updateDoc.original_data).length === 0 &&
      updateDoc.updated_data &&
      updateDoc.updated_data.video
    ) {
      const videoPath = path.join(__dirname, '..', updateDoc.updated_data.video); // Adjust this if path is relative from project root
      fs.unlink(videoPath, (err) => {
        if (err) {
          console.warn('⚠️ Failed to delete video file:', videoPath, err.message);
        } else {
          console.log('✅ Deleted rejected video file:', videoPath);
        }
      });
    }

    // Mark update as rejected
    updateDoc.status = 'rejected';
    updateDoc.admin_remarks = admin_remarks;
    await updateDoc.save();

    res.status(200).json({ message: 'Update rejected successfully.' });
  } catch (error) {
    console.error('Error rejecting update:', error);
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

router.post('/artist/payment/:user_id', verifyToken, async (req, res) => {
  const { user_id } = req.params;
  const {
    first_day_booking,
    second_day_booking,
    third_day_booking,
    fourth_day_booking,
    fifth_day_booking,
    sixth_day_booking,
    seventh_day_booking
  } = req.body;

  try {
    const artist = await Artist.findOne({ user_id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const newPaymentData = {
      first_day_booking,
      second_day_booking,
      third_day_booking,
      fourth_day_booking,
      fifth_day_booking,
      sixth_day_booking,
      seventh_day_booking
    };

    const existingPayment = await ArtistPayments.findOne({ user_id });

    let reference_id = null;
    let original_data = {};
    let updated_data = newPaymentData;
    let fields_changed = Object.keys(newPaymentData);

    if (existingPayment) {
      // Track only changed fields
      reference_id = existingPayment._id;
      fields_changed = [];
      original_data = {};
      updated_data = {};

      Object.keys(newPaymentData).forEach((key) => {
        if (existingPayment[key] !== newPaymentData[key]) {
          fields_changed.push(key);
          original_data[key] = existingPayment[key];
          updated_data[key] = newPaymentData[key];
        }
      });

      if (fields_changed.length === 0) {
        return res.status(200).json({
          message: 'No changes detected in payment data.'
        });
      }
    }

    // Save in pending updates for admin approval
    await PendingArtistUpdate.create({
      user_id,
      update_type: 'payment',
      reference_id,
      original_data,
      updated_data,
      fields_changed,
      timestamp: new Date()
    });

    res.status(200).json({
      message: existingPayment
        ? 'Artist payment update submitted for admin approval.'
        : 'New artist payment submitted for admin approval.'
    });
  } catch (err) {
    console.error('Error in payment (pending) API:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/artist/payment/:user_id', async (req, res) => {
    const { user_id } = req.params;
  
    try {
      const artistPayments = await ArtistPayments.findOne({ user_id });
      
      if (!artistPayments) {
        return res.status(404).json({ message: 'Artist payments not found' });
      }
  
      res.status(200).json({ artistPayments });
    } catch (err) {
      console.error('Error fetching payments:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;
