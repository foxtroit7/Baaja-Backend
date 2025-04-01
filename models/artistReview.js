const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({ 
    user_id: { type: String}, 
    name: { type: String, required: true }, 
    review: { type: String, required: true } ,
    rating: { type: String} ,
}, { timestamps: true })

module.exports = mongoose.model('artist_reviews', userSchema);