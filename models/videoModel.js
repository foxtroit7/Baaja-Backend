const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    video: { type: String,  required: true  },
    link: {type: String, require: true},
    photo: {type: String}
  
  }, { timestamps: true });

module.exports = mongoose.model('videos', categorySchema);
