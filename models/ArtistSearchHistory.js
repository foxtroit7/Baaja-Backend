const mongoose = require('mongoose');

const ArtistSearchHistorySchema = new mongoose.Schema({
  user_id: {
    type: String, // Artist's user_id
    required: true,
  },
  keyword: String, // searched string (optional)
  searchType: String, // profile_name or owner_name (optional)
  searched_by: {
    type: String, // ID of the user who searched
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ArtistSearchHistory', ArtistSearchHistorySchema);
