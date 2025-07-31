const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ 
    user_id: { type: String, required: true },
    video: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('artist_clips', userSchema);
