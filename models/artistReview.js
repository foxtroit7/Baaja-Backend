const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({ 
    userId: { type: String, required: true }, 
    name: { type: String, required: true }, 
    review: { type: String, required: true } 
}, { timestamps: true })

module.exports = mongoose.model('artist_reviews', userSchema);