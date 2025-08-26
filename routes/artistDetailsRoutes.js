const express = require('express');
const ArtistDetails = require('../models/artistDetailsModel'); 
const { verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();
const upload = require('../middlewares/upload');
const Category = require('../models/categoryModel');
const User = require('../models/userModel');
const ArtistRating = require('../models/ratingModal');
const Booking = require('../models/bookingModal')
const ArtistPayments = require('../models/artistPayments');
const PendingArtistUpdate = require('../models/PendingArtistUpdate');
const ArtistClips = require('../models/artistClips');
const Artist = require('../models/artistModel');
const { sendArtistApprovalNotification } = require("../controllers/pushNotificationControllers"); 
const fs = require('fs');
const path = require('path');
const ArtistSearchHistory = require("../models/ArtistSearchHistory");

router.post('/artist/details', verifyToken, upload.single('photo'), async (req, res) => {
    const { 
         user_id, total_bookings, location,
        experience, description, total_price, advance_price, recent_order,  required_services
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
    const category_id = user.category_id;
        const photo = req.file ? req.file.path : null;
    
        // Store the artist data in artist_details with default approval status
        const newArtist = new ArtistDetails({
            user_id, owner_name, photo, profile_name, total_bookings, location, category_type, 
            category_id, experience, description, total_price, advance_price, recent_order, required_services,
            phone_number,
            status: 'waiting',
            approved: false,    
            top_baaja: false,
            featured: false ,
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
router.get('/pending_artist_by_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "user_id query parameter is required" });
    }

    // Step 1: Find artist
    const artist = await Artist.findOne({
      approved_artist: false,
      user_id: user_id
    });

    if (!artist) {
      return res.status(404).json({ message: "Artist not found" });
    }

    // Step 2: Find location and about from ArtistDetails
    const artistDetails = await ArtistDetails.findOne({ user_id: user_id }, { location: 1, description: 1 });

    // Step 3: Merge details into response
    const responseData = {
      ...artist.toObject(),
      location: artistDetails?.location || null,
      description: artistDetails?.description || null
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching pending artist by ID:", error);
    res.status(500).json({ message: "Internal Server Error" });
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

    // Update Artist & ArtistDetails
    const [updatedArtistDetails, updatedArtist] = await Promise.all([
      ArtistDetails.findOneAndUpdate(
        { user_id },
        { 
          $set: { 
            approved_artist: true, 
            approved: true, 
            status: 'approved', 
            pendingChanges: {} 
          } 
        },
        { new: true, upsert: true } // ✅ upsert ensures record exists
      ),
      Artist.findOneAndUpdate(
        { user_id },
        { 
          $set: { 
            approved_artist: true, 
            approved: true, 
            pendingChanges: {} 
          } 
        },
        { new: true }
      )
    ]);

    if (!updatedArtist) {
      return res.status(404).json({ message: "Artist record not found" });
    }

    // ✅ Send notification
    try {
      await sendArtistApprovalNotification({
        title: "Artist Approved",
        body: `Your profile has been approved. You can now receive bookings.`,
        type: "artist_approved",
        user_id: user_id
      });
    } catch (notifyErr) {
      console.warn("Notification failed:", notifyErr.message);
    }

    res.status(200).json({ 
      message: 'Artist approved successfully',
      updatedArtist,
      updatedArtistDetails
    });

  } catch (error) {
    console.error('Error approving artist:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
// Main get detail API
router.get('/artists_details', verifyToken, async (req, res) => {
    try {
        const { category_id, user_id, artist_id, top_baaja } = req.query;

        let query = { approved: true };

        if (category_id) {
            query.category_id = category_id;
        }

        if (artist_id) {
            query.user_id = artist_id;
        }

        if (top_baaja === 'true') {
            query.top_baaja = true;  
        }

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

    if (artist.category_type) {
      // Match category_type (Artist) with category (Category model)
      const categoryDoc = await Category.findOne({
        category: artist.category_type.trim()  // ✅ both are strings
      }).select("category_id");

      if (categoryDoc) {
        category_id_from_model = categoryDoc.category_id;
      }
    }
// Calculate ratings for this artist
const reviews = await ArtistRating.find({ artist_id: artist.user_id });

let rating_count = reviews.length;
let overall_rating = 0;

if (rating_count > 0) {
    overall_rating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / rating_count;
    overall_rating = parseFloat(overall_rating.toFixed(2)); // optional: round to 2 decimals
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
let category_id = null;
if (artistUser) {
  owner_name = artistUser.name;
  profile_name = artistUser.profile_name;
  category_type = artistUser.category_name;
   category_id = artistUser.category_id;
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
                    category_id,
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
    const artist = await Artist.findOne({ user_id });
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
  // Update Artist
  const updatedArtist = await Artist.findOneAndUpdate(
    { user_id },
    { $set: changedFields },
    { new: true }
  );

  // Update ArtistDetails
  await ArtistDetails.findOneAndUpdate(
    { user_id },
    { $set: changedFields },
    { new: true }
  );

  return res.status(200).json({
    message: 'Artist details updated successfully by admin.',
    updated_data: changedFields,
    updated_artist: updatedArtist, // to verify
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
    const { query, user_id } = req.query;
    const searched_by = user_id || req.user.user_id;
    const trimmedQuery = query.trim();

    // 1. Try category_type match first
    const categoryMatches = await ArtistDetails.find({
      category_type: { $regex: trimmedQuery, $options: 'i' },
    });

    if (categoryMatches.length > 0) {
   return res.status(200).json(categoryMatches);
    }

    // 2. Try profile_name or owner_name match
    const artist = await ArtistDetails.find({
      $or: [
        { profile_name: { $regex: trimmedQuery, $options: 'i' } },
        { owner_name: { $regex: trimmedQuery, $options: 'i' } },
      ],
    });

  if (!artist || artist.length === 0) {
  return res.status(404).json({ message: 'Artist not found' });
}


 // Determine matched field based on the first result
    let searchType = 'owner_name';
    if (
      typeof artist[0].profile_name === 'string' &&
      artist[0].profile_name.toLowerCase().includes(trimmedQuery.toLowerCase())
    ) {
      searchType = 'profile_name';
    }

    // Log the search
    await ArtistSearchHistory.create({
     user_id: artist[0].user_id,
      keyword: trimmedQuery,
      searchType,
      searched_by,
    });

    // Limit to last 6 logs
    const logs = await ArtistSearchHistory.find({ searched_by }).sort({ timestamp: -1 });
    if (logs.length > 6) {
      const idsToDelete = logs.slice(6).map((entry) => entry._id);
      await ArtistSearchHistory.deleteMany({ _id: { $in: idsToDelete } });
    }

    // Return matched artist
    return res.status(200).json(artist);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/artist/my-searches', verifyToken, async (req, res) => {
  try {
    const user_id = req.query.user_id || req.user.user_id;

    // Get all searches for the user, sorted by latest
    const searches = await ArtistSearchHistory.find({ searched_by: user_id }).sort({ timestamp: -1 });

    // ✅ NEW: Ensure uniqueness by user_id (keep only latest for each artist)
    const seen = new Set();
    const uniqueSearches = [];
    for (const search of searches) {
      if (!seen.has(search.user_id)) {
        seen.add(search.user_id);
        uniqueSearches.push(search);
      }
    }

    // ✅ CHANGED: Delete older duplicates beyond latest 6 unique
    const latestSearches = uniqueSearches.slice(0, 6);
    const idsToKeep = new Set(latestSearches.map(entry => entry._id.toString()));
    const idsToDelete = searches
      .filter(entry => !idsToKeep.has(entry._id.toString()))
      .map(entry => entry._id);

    if (idsToDelete.length > 0) {
      await ArtistSearchHistory.deleteMany({ _id: { $in: idsToDelete } });
    }

    // Enrich with artist_details
    const enrichedSearches = await Promise.all(
      latestSearches.map(async (search) => {
        const artistDetails = await ArtistDetails.findOne({ user_id: search.user_id });
        return {
          ...search._doc,
          artist_details: artistDetails || null,
        };
      })
    );

    res.status(200).json(enrichedSearches);
  } catch (error) {
    console.error('Fetch error:', error);
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
   const reviews = await ArtistRating.find({ artist_id: artist.user_id });

let rating_count = 0;
let overall_rating = 0;

if (reviews.length > 0) {
  rating_count = reviews.length; // how many reviews exist for this artist
  const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
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
          try {
    await sendArtistApprovalNotification({
      title: "Congratulations!",
      artist_id: artist.user_id,
      body: `You have added has a featured Artist`,
    });
  } catch (notifyErr) {
    console.warn("Notification failed:", notifyErr.message);
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

  try {
    const artist = await Artist.findOne({ user_id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const video = req.file ? req.file.path : null;
    const userRole = req.user?.role === 'admin' ? 'admin' : 'user';

    const clipData = {
      user_id,
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
        { $set: updateDoc.updated_data },
        { runValidators: true }
      );

      updateDoc.status = 'approved';
      await updateDoc.save();
      return res.status(200).json({ message: 'Details update approved.' });
    }

    if (updateDoc.update_type === 'clip') {
      if (!updateDoc.reference_id) {
        const newClip = new ArtistClips({
          user_id: updateDoc.user_id,
          video: updateDoc.updated_data.video,
        });
        await newClip.save();
        updateDoc.reference_id = newClip._id;
      } else {
        await ArtistClips.updateOne(
          { _id: updateDoc.reference_id, user_id: updateDoc.user_id },
          { $set: updateDoc.updated_data },
          { runValidators: true }
        );
      }

      updateDoc.status = 'approved';
      await updateDoc.save();
         // ✅ Notify user
  
      return res.status(200).json({ message: 'Clip update approved.' });
    }

    if (updateDoc.update_type === 'payment') {
      try {
        // never $set user_id; strip it if present
        const { user_id: ignore, ...fieldsToSet } = updateDoc.updated_data || {};

        if (!updateDoc.reference_id) {
          // First-time payment for this user → upsert by user_id
          const toInsert = { user_id: updateDoc.user_id, ...fieldsToSet };

          const upsertResult = await ArtistPayments.updateOne(
            { user_id: updateDoc.user_id },
            { $set: toInsert },
            { upsert: true, runValidators: true }
          );
          console.log('✅ Upsert payment result:', upsertResult);
        } else {
          const result = await ArtistPayments.updateOne(
            { _id: updateDoc.reference_id, user_id: updateDoc.user_id },
            { $set: fieldsToSet },
            { runValidators: true }
          );

          console.log('🔹 Payment update result:', result);

          if (result.matchedCount === 0) {
            return res.status(404).json({
              message: 'Payment record not found for update',
              user_id: updateDoc.user_id,
              reference_id: updateDoc.reference_id,
            });
          }

          if (result.modifiedCount === 0) {
            return res.status(200).json({
              message: 'No changes applied to payment record (fields may already match).',
            });
          }
        }

        updateDoc.status = 'approved';
        await updateDoc.save();

        return res.status(200).json({ message: 'Payment update approved and applied successfully.' });
      } catch (err) {
        console.error('❌ Error while applying payment update:', err);
        return res.status(500).json({
          message: 'Failed to apply payment update',
          error: err.message,
        });
      }
    }
    // If it was some other type (future-proof)
    return res.status(400).json({ message: 'Unsupported update type.' });
  } catch (error) {
    console.error('Error approving update:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
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
  try {
    await sendArtistApprovalNotification({
      title: "Change Request Requested",
      artist_id: updateDoc.user_id,
      body: `Your ${updateDoc.update_type} data has rejected, Try Again!`,
    });
  } catch (notifyErr) {
    console.warn("Notification failed:", notifyErr.message);
  }
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
  // coerce to numbers (or leave strings and let mongoose cast)
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

    // only the 7 fields (exclude user_id from diff)
    const payload = {
      first_day_booking,
      second_day_booking,
      third_day_booking,
      fourth_day_booking,
      fifth_day_booking,
      sixth_day_booking,
      seventh_day_booking
    };

    let userRole = req.user?.role === 'admin' ? 'admin' : 'user';

    const existingPayment = await ArtistPayments.findOne({ user_id });

    if (userRole === 'admin') {
      // Admin: direct apply with $set
      const result = await ArtistPayments.updateOne(
        { user_id },
        { $set: { user_id, ...payload } },
        { upsert: true, runValidators: true }
      );

      return res.status(200).json({
        message: existingPayment
          ? 'Payment data updated successfully by admin.'
          : 'New payment data created by admin.',
        result
      });
    }

    // User: create pending update
    let reference_id = existingPayment ? existingPayment._id : null;
    let original_data = {};
    let updated_data = {};
    let fields_changed = [];

    const keys = Object.keys(payload); // only 7 fields
    if (existingPayment) {
      keys.forEach((key) => {
        const oldVal =
          existingPayment[key] !== undefined && existingPayment[key] !== null
            ? Number(existingPayment[key])
            : null;
        const newVal =
          payload[key] !== undefined && payload[key] !== null
            ? Number(payload[key])
            : null;

        if (oldVal !== newVal) {
          fields_changed.push(key);
          original_data[key] = existingPayment[key];
          updated_data[key] = payload[key];
        }
      });

      if (fields_changed.length === 0) {
        return res.status(200).json({ message: 'No changes detected in payment data.' });
      }
    } else {
      // first-time: all 7 are "changed"
      updated_data = { ...payload };
      fields_changed = keys;
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

    return res.status(200).json({
      message: existingPayment
        ? 'Artist payment update submitted for admin approval.'
        : 'New artist payment submitted for admin approval.'
    });
  } catch (err) {
    console.error('Error in payment (pending) API:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
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
