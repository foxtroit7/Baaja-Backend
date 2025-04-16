const mongoose = require('mongoose');

const CategoryRankSchema = new mongoose.Schema({
  category_id: {
    type: String,
    required: true
  },
  artist_id: {
    type: String,
    required: true
  },
  artist_rank: {
    type: Number,
    required: true
  }
}, { _id: true });

const SessionRankSchema = new mongoose.Schema({
  session_name: {
    type: String,
    required: true
  },
  session_rank: {
    type: Number,
    required: true
  },
  categoryRankModel: {
    type: [CategoryRankSchema], // <-- Make this an array
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SessionRank', SessionRankSchema);
