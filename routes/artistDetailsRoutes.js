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
const { sendNotification } = require("../controllers/pushNotificationControllers"); 
const fs = require('fs');
const path = require('path');

router.post('/artist/details', verifyToken, upload.single('photo'), async (req, res) => {
    const { 
         user_id, total_bookings, location,category_id, 
        experience, description, total_price, advance_price, recent_order,  required_sevices
    } = req.body;

    try {
        const existingDetails = await ArtistDetails.findOne({ user_id });
        if (existingDetails) {
            return res.status(400).json({ message: 'Artist details already exist' });
        }
            // ✅ Fetch data from User model
    const user = await Artist.findOne({ user_id });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const owner_name = user.name;
    const profile_name = user.profile_name;
    const category_type = user.category_name;
    const phone_number = user.phone_number;

        const photo = req.file ? req.file.path : null;
    
        // Store the artist data in artist_details with default approval status
        const newArtist = new ArtistDetails({
            user_id, owner_name, photo, profile_name, total_bookings, location, category_type, 
            category_id, experience, description, total_price, advance_price, recent_order, required_sevices,
            phone_number,
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
    // Find artists with status 'waiting', approved_artist: false, and who have logged in
    const pendingArtists = await Artist.find({
      approved_artist: false,
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

    // Find artist pending approval
    const pendingArtist = await Artist.findOne({ user_id, approved_artist: false });

    if (!pendingArtist) {
      return res.status(404).json({ message: 'Artist not found in pending list' });
    }

    // Approve artist
 await Promise.all([
  ArtistDetails.findOneAndUpdate({ user_id }, {
    approved_artist: true,
    approved: true,
    status: 'approved',
    pendingChanges: {}
  }),
  Artist.findOneAndUpdate({ user_id }, {
    approved_artist: true,
    approved: true,
    pendingChanges: {}
  })
]);

    // ✅ Send notification
    try {
      await sendNotification({
        title: "Artist Approved",
        body: `Your profile has been approved. You can now receive bookings.`,
        type: "artist_approved",
        user_id: user_id
      });
    } catch (notifyErr) {
      console.warn("Notification failed:", notifyErr.message);
    }

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

            const rating_count = reviews.length;
let overall_rating = 0;
if (rating_count > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    overall_rating = totalRating / rating_count;
}


                // ✅ Fetch all bookings of this artist
                const bookings = await Booking.find({ artist_id: artist.user_id });

       const total_bookings = await Booking.countDocuments({
  artist_id: artist.user_id,     // ← use the correct field name
  status: "completed"
});

                const upcoming_bookings = bookings.filter(b => b.status === "accepted").length;
                const past_bookings = bookings.filter(b => b.status === "completed").length;
                const total_revenue = bookings
                    .filter(b => b.status === "completed")
                    .reduce((sum, b) => sum + (b.total_price || 0), 0);
             // ✅ Get artist payment data
                const payments = await ArtistPayments.findOne({ user_id: artist.user_id });
                   // ✅ Check for pending update
                const hasPendingUpdate = await PendingArtistUpdate.findOne({
                    user_id: artist.user_id    
                });
                // ✅ Fetch user data for this artist
const artistUser = await Artist.findOne({ user_id: artist.user_id });

let owner_name = null;
let profile_name = null;
let category_type = null;
if (artistUser) {
  owner_name = artistUser.name;
  profile_name = artistUser.profile_name;
  category_type = artistUser.category_name;
}
const pendingUpdates = await PendingArtistUpdate.find({
  user_id: artist.user_id
}).sort({ createdAt: -1 });

const admin_pending_updates = pendingUpdates.length > 0
  ? pendingUpdates.map(update => ({
      _id: update._id,
      user_id: update.user_id,
      update_type: update.update_type,
      original_data: update.original_data,
      updated_data: update.updated_data,
      fields_changed: update.fields_changed,
      status: update.status,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt,
         ...(update.status === 'rejected' && { admin_remarks: update.admin_remarks })
    }))
  : [] ;

                return {
                    ...artist.toObject(),
                    is_favorite: artistIds.includes(artist.user_id),
                    owner_name,
                    profile_name,
                    category_type,
                    overall_rating,
                    total_bookings,
                    upcoming_bookings,
                    past_bookings,
                    total_revenue,
                    payments: payments || null,
                    update_status: !!hasPendingUpdate ,
                    approved_artist: artistUser?.approved_artist,
                    admin_pending_updates,
                    rating_count,
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

    const userRole = req.user.role === 'admin' ? 'admin' : 'user';

    if (userRole === 'admin') {
      // ✅ Direct update for admin
      Object.keys(changedFields).forEach(key => {
        artist[key] = changedFields[key];
      });
      await artist.save();

      return res.status(200).json({
        message: 'Artist details updated successfully by admin.',
        updated_data: changedFields,
      });
    } else {
      // ✅ Submit pending update for regular user
      await PendingArtistUpdate.create({
        user_id,
        update_type: 'details',
        original_data: originalData,
        updated_data: changedFields,
        fields_changed: Object.keys(changedFields),
        timestamp: new Date(),
      });

      return res.status(200).json({
        message: 'Changes submitted for admin approval. Will reflect after approval.',
      });
    }

  } catch (error) {
    console.error('Error saving artist details update:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
    }).sort({ top_baaja_rank: 1 });

    const enhancedArtists = await Promise.all(
      topBaajaArtists.map(async (artist) => {
        const reviews = await Artistreviews.find({ user_id: artist.user_id });
        const rating_count = reviews.length;

        let overall_rating = 0;
        if (rating_count > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          overall_rating = totalRating / rating_count;
        }

        return {
          ...artist._doc,
          rating_count,
          overall_rating: Number(overall_rating.toFixed(1)) // Optional
        };
      })
    );

    res.status(200).json(enhancedArtists);
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
    const userRole = req.user?.role === 'admin' ? 'admin' : 'user';

    const clipData = {
      user_id,
      title: title || '',
      video: video || '',
    };

    if (userRole === 'admin') {
      // ✅ Directly save to ArtistClip if admin
      await ArtistClips.create(clipData);

      return res.status(200).json({
        message: 'Clip uploaded successfully by admin.',
      });
    }

    // ✅ Else submit as pending update
    await PendingArtistUpdate.create({
      user_id,
      update_type: 'clip',
      reference_id: null,
      original_data: {},
      updated_data: clipData,
      fields_changed: Object.keys(clipData),
      timestamp: new Date(),
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
    const { status, user_id, startDate, endDate, update_type } = req.query;

    // Build dynamic query
    const query = {};
    if (status) query.status = status;
    if (user_id) query.user_id = user_id;
    if (update_type) query.update_type = update_type;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full day
        query.createdAt.$lte = end;
      }
    }

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
    } 
    else if (updateDoc.update_type === 'clip') {
      if (!updateDoc.reference_id) {
        // New clip → create a new ArtistClip
        const newClip = new ArtistClips({
          user_id: updateDoc.user_id,
          title: updateDoc.updated_data.title,
          video: updateDoc.updated_data.video,
        });
        await newClip.save();
        updateDoc.reference_id = newClip._id; // Optional: Save ref in case needed later
      } 

      else {
        // Existing clip update
        await ArtistClips.updateOne(
          { _id: updateDoc.reference_id, user_id: updateDoc.user_id },
          { $set: updateDoc.updated_data }
        );
      }
    }
else if (updateDoc.update_type === 'payment') {
  if (!updateDoc.reference_id) {
    // Create new payment record
    const newPayment = new ArtistPayments({
      user_id: updateDoc.user_id,
      ...updateDoc.updated_data,
    });
    await newPayment.save();
    updateDoc.reference_id = newPayment._id;
  } else {
    // Update existing record
    await ArtistPayments.updateOne(
      { _id: updateDoc.reference_id },
      { $set: updateDoc.updated_data }
    );
  }
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
      user_id,
      first_day_booking,
      second_day_booking,
      third_day_booking,
      fourth_day_booking,
      fifth_day_booking,
      sixth_day_booking,
      seventh_day_booking
    };

    let userRole = req.user?.role || 'user';
    if (userRole !== 'admin') {
      userRole = 'user';
    }

    const existingPayment = await ArtistPayments.findOne({ user_id });

    if (userRole === 'admin') {
      // ✅ Admin: Direct update or create
      if (existingPayment) {
        await ArtistPayments.updateOne({ user_id }, newPaymentData);
      } else {
        await ArtistPayments.create(newPaymentData);
      }

      return res.status(200).json({
        message: existingPayment
          ? 'Payment data updated successfully by admin.'
          : 'New payment data created by admin.'
      });
    }

    // ✅ User: Proceed with pending update logic
    let reference_id = null;
    let original_data = {};
    let updated_data = newPaymentData;
    let fields_changed = Object.keys(newPaymentData);

    if (existingPayment) {
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
