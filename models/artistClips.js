const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
    userId: { type: String, required: true }, 
    title: { type: String, required: true },
    video: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('artist_clips', userSchema);
