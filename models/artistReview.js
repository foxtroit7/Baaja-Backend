const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({ 
    user_id: { type: String, required: true }, 
    name: { type: String, required: true }, 
    review: { type: String, required: true } ,
    rating: { type: String, required: true } ,
}, { timestamps: true })

module.exports = mongoose.model('artist_reviews', userSchema);