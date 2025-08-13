const mongoose = require('mongoose');

const  YoutubeSchema = new mongoose.Schema({
  video_id: {
    type: String,
    required: true,
    trim: true
  },
  video_url: {
    type: String,
    trim: true
  }
});
module.exports = mongoose.model("youtube", YoutubeSchema);
