const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    video: { type: String},
    link: { type: String},
    photo: { type: String },
    video_id: { type: String, unique: true} 
}, { timestamps: true });

// Middleware to generate a random 5-digit video_id before saving
videoSchema.pre('save', async function (next) {
    if (!this.video_id) {
        this.video_id = Math.floor(10000 + Math.random() * 90000).toString(); // Generate 5-digit random number
    }
    next();
});

module.exports = mongoose.model('Video', videoSchema);
