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
    // Check if the session already exists
    let session = await CategoryArtistRank.findOne({ session_name });

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

    if (session) {
      // Filter out already existing artist-category combos
      const newEntries = categoryRankModel.filter(newEntry =>
        !session.categoryRankModel.some(
          existingEntry =>
            existingEntry.artist_id === newEntry.artist_id &&
            existingEntry.category_id === newEntry.category_id
        )
      );

      // Add only new unique entries
      session.categoryRankModel.push(...newEntries);
      session.updatedAt = new Date();

      await session.save();

      return res.status(200).json({
        message: 'Existing session updated with new artist rankings.',
        data: session
      });
    } else {
      // Check for duplicate session_rank in a different session
      const duplicateRankSession = await CategoryArtistRank.findOne({
        session_rank,
        session_name: { $ne: session_name }
      });

      if (duplicateRankSession) {
        return res.status(400).json({
          message: `Session rank ${session_rank} is already assigned to "${duplicateRankSession.session_name}".`
        });
      }

      // Create a new session
      const newSession = new CategoryArtistRank({
        session_name,
        session_rank,
        categoryRankModel
      });

      await newSession.save();

      return res.status(201).json({
        message: 'New session rank created successfully.',
        data: newSession
      });
    }
  } catch (err) {
    console.error('Error handling session rank:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /session-rank
router.get('/session-rank', async (req, res) => {
  try {
    // Sort sessions by session_rank in ascending order
    const sessions = await CategoryArtistRank.find().sort({ session_rank: 1 });

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

// PUT /session-rank/:id - update session rank with swap if needed
router.put('/session-rank/:session_name', async (req, res) => {
  const { session_name } = req.params;
  const { session_rank: newRank } = req.body;

  if (newRank === undefined) {
    return res.status(400).json({ message: 'New session rank is required.' });
  }

  try {
    // Find the session by session_name
    const currentSession = await CategoryArtistRank.findOne({ session_name });
    if (!currentSession) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    // Check if the new rank is already taken by another session
    const existingSession = await CategoryArtistRank.findOne({
      session_name: { $ne: session_name },
      session_rank: newRank
    });

    if (existingSession) {
      // Swap the ranks
      const oldRank = currentSession.session_rank;
      currentSession.session_rank = newRank;
      existingSession.session_rank = oldRank;

      await currentSession.save();
      await existingSession.save();

      return res.status(200).json({
        message: `Session rank swapped. "${currentSession.session_name}" is now rank ${newRank}, and "${existingSession.session_name}" is now rank ${oldRank}.`,
        updatedSession: currentSession,
        swappedWith: existingSession
      });
    } else {
      // No conflict, just update the rank
      currentSession.session_rank = newRank;
      await currentSession.save();

      return res.status(200).json({
        message: `Session rank updated successfully to ${newRank}.`,
        updatedSession: currentSession
      });
    }
  } catch (error) {
    console.error('Error updating session rank with swap:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// DELETE /session-rank/:session_name
router.delete('/delete-session-rank/:session_name', async (req, res) => {
  const { session_name } = req.params;

  try {
    const deletedSession = await CategoryArtistRank.findOneAndDelete({ session_name });

    if (!deletedSession) {
      return res.status(404).json({ message: `No session found with name "${session_name}".` });
    }

    return res.status(200).json({
      message: `Session "${session_name}" deleted successfully.`,
      deletedSession
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /session-rank/update-artist-rank/:session_name/:artist_id
router.put('/update-artist-rank/:session_name/:artist_id', async (req, res) => {
  const { session_name, artist_id } = req.params;
  const { artist_rank } = req.body;

  if (artist_rank === undefined) {
    return res.status(400).json({ message: 'artist_rank is required.' });
  }

  const incomingRank = Number(artist_rank);
  if (isNaN(incomingRank)) {
    return res.status(400).json({ message: 'artist_rank must be a valid number.' });
  }

  try {
    const session = await CategoryArtistRank.findOne({ session_name });

    if (!session) {
      return res.status(404).json({ message: `Session "${session_name}" not found.` });
    }

    // ✅ Ensure no other artist has this rank
    const isConflict = session.categoryRankModel.some(
      entry => Number(entry.artist_rank) === incomingRank && entry.artist_id !== artist_id
    );

    if (isConflict) {
      return res.status(400).json({
        message: `Artist rank ${incomingRank} is already assigned to another artist in this session.`,
      });
    }

    // ✅ Find or add/update artist entry
    let artistEntry = session.categoryRankModel.find(
      entry => entry.artist_id === artist_id
    );

    if (!artistEntry) {
      // Add new artist with given rank
      session.categoryRankModel.push({ artist_id, artist_rank: incomingRank });
    } else {
      if (Number(artistEntry.artist_rank) === incomingRank) {
        return res.status(200).json({
          message: `No changes made. Artist already has rank ${incomingRank}.`
        });
      }

      artistEntry.artist_rank = incomingRank;
    }

    await session.save();

    return res.status(200).json({
      message: `Artist rank updated successfully.`,
      updatedSession: session
    });

  } catch (error) {
    console.error('Error updating artist rank:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



// DELETE /session-rank/:session_name/artist/:artist_id
router.delete('/artist-rank/:session_name/:artist_id', async (req, res) => {
  const { session_name, artist_id } = req.params;

  try {
    const session = await CategoryArtistRank.findOne({ session_name });

    if (!session) {
      return res.status(404).json({ message: `Session "${session_name}" not found.` });
    }

    // Find if the artist exists in the session's categoryRankModel
    const artistIndex = session.categoryRankModel.findIndex(entry => entry.artist_id === artist_id);

    if (artistIndex === -1) {
      return res.status(404).json({ message: `Artist with ID "${artist_id}" not found in session "${session_name}".` });
    }

    // Remove the artist from the array
    session.categoryRankModel.splice(artistIndex, 1);

    // Save the updated session
    await session.save();

    return res.status(200).json({
      message: `Artist with ID "${artist_id}" removed from session "${session_name}" successfully.`,
      updatedSession: session
    });

  } catch (error) {
    console.error('Error removing artist from session:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;