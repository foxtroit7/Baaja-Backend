const express = require("express");
const router = express.Router();
const Artist = require('../models/artistDetailsModel');
const CategoryArtistRank = require('../models/CategoryArtistRank')
// POST /session-rank
router.post('/session-rank', async (req, res) => {
  const { session_name, session_rank, categoryRankModel } = req.body;

  if (!session_name || session_rank === undefined || !Array.isArray(categoryRankModel) || categoryRankModel.length === 0) {
    return res.status(400).json({ message: 'Session name, session rank, and category rank data are required.' });
  }

  try {
    // Check if same rank is already assigned to a different session
    const existingSessionWithRank = await CategoryArtistRank.findOne({
      session_rank,
      session_name: { $ne: session_name }
    });

    if (existingSessionWithRank) {
      return res.status(400).json({
        message: `Session rank ${session_rank} is already assigned to session "${existingSessionWithRank.session_name}".`
      });
    }

    // Validate categoryRankModel entries
    for (const entry of categoryRankModel) {
      const { category_id, artist_id, artist_rank } = entry;

      if (!category_id || !artist_id || artist_rank === undefined) {
        return res.status(400).json({ message: 'Each rank entry must have category_id, artist_id, and artist_rank.' });
      }

      const artist = await Artist.findOne({ user_id: artist_id });
      if (!artist) {
        return res.status(404).json({ message: `Artist with ID ${artist_id} not found.` });
      }

      if (artist.category_id !== category_id) {
        return res.status(400).json({ message: `Artist ${artist_id} does not belong to category ${category_id}.` });
      }
    }

    // If session already exists with this name, delete it first
    await CategoryArtistRank.deleteOne({ session_name });

    // Save the new session with updated rank model
    const newSessionRank = new CategoryArtistRank({
      session_name,
      session_rank,
      categoryRankModel
    });

    await newSessionRank.save();

    res.status(201).json({ message: 'Session rank created or updated successfully', data: newSessionRank });
  } catch (err) {
    console.error('Error saving session rank:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


  // GET /session-rank
  router.get('/session-rank', async (req, res) => {
    try {
      const sessions = await CategoryArtistRank.find();
  
      const enrichedSessions = await Promise.all(
        sessions.map(async (session) => {
          const enrichedCategoryRanks = await Promise.all(
            session.categoryRankModel.map(async (rankEntry) => {
              const artist = await Artist.findOne({ user_id: rankEntry.artist_id });
  
              return {
                ...rankEntry.toObject(),
                artistDetails: artist ? artist.toObject() : null,
              };
            })
          );
  
          return {
            session_name: session.session_name,
            session_rank: session.session_rank,
            categoryRankModel: enrichedCategoryRanks,
          };
        })
      );
  
      res.status(200).json(enrichedSessions);
    } catch (err) {
      console.error('Error fetching session ranks:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
// GET /session-rank/by-session-name?name=Wedding Season 1
router.get('/session-rank/by-session-name', async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ message: 'Session name is required.' });
  }

  try {
    const session = await CategoryArtistRank.findOne({ session_name: name });

    if (!session) {
      return res.status(404).json({ message: 'No session found with this name.' });
    }

    const enrichedCategoryRanks = await Promise.all(
      session.categoryRankModel.map(async (rankEntry) => {
        const artist = await Artist.findOne({ user_id: rankEntry.artist_id });

        return {
          ...rankEntry.toObject(),
          artistDetails: artist ? artist.toObject() : null,
        };
      })
    );

    res.status(200).json({
      session_name: session.session_name,
      session_rank: session.session_rank,
      categoryRankModel: enrichedCategoryRanks,
    });
  } catch (error) {
    console.error('Error fetching session rank by name:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  
  router.put('/session-rank', async (req, res) => {
    const { session_name, session_rank, categoryRankModel_id, artist_id, category_id, artist_rank } = req.body;
  
    if (!session_name) {
      return res.status(400).json({ message: 'Session name is required.' });
    }
  
    try {
      const updateFields = {};
  
      if (session_rank !== undefined) {
        const duplicateSession = await CategoryArtistRank.findOne({
          session_rank,
          session_name: { $ne: session_name }
        });
  
        if (duplicateSession) {
          return res.status(400).json({
            message: `Session rank ${session_rank} is already used by session "${duplicateSession.session_name}".`
          });
        }
  
        updateFields.session_rank = session_rank;
      }
  
      const updateQuery = {};
      if (Object.keys(updateFields).length > 0) {
        updateQuery.$set = updateFields;
      }
  
      const arrayFilters = [];
  
      if (categoryRankModel_id && artist_id && category_id && artist_rank !== undefined) {
        const conflictingRank = await CategoryArtistRank.findOne({
          session_name: { $ne: session_name },
          categoryRankModel: {
            $elemMatch: {
              category_id,
              artist_rank
            }
          }
        });
  
        if (conflictingRank) {
          return res.status(400).json({
            message: `Artist rank ${artist_rank} already exists in category ${category_id}.`
          });
        }
  
        updateQuery.$set = {
          ...updateQuery.$set,
          'categoryRankModel.$[elem].artist_id': artist_id,
          'categoryRankModel.$[elem].category_id': category_id,
          'categoryRankModel.$[elem].artist_rank': artist_rank
        };
  
        const mongoose = require('mongoose');
        arrayFilters.push({ 'elem._id': new mongoose.Types.ObjectId(categoryRankModel_id) });
      }
  
      const options = {
        new: true,
        arrayFilters,
        strict: false
      };
  
      const updatedSession = await CategoryArtistRank.findOneAndUpdate(
        { session_name },
        updateQuery,
        options
      );
  
      if (!updatedSession) {
        return res.status(404).json({ message: 'Session not found.' });
      }
  
      res.status(200).json({ message: 'Session updated successfully.', data: updatedSession });
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});
  
  
  module.exports = router;