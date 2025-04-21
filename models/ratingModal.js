const mongoose = require('mongoose');
const { stringify } = require('uuid');

const userSchema = new mongoose.Schema({ 
    user_id: { type: String},
    user_name: { type: String },
    rating: { type: Number},
    review: {type: String},
    file: [{type: String}],
    artist_id: {type: String},
    booking_id: {type: String},
    avg_rating: {type: String},
    total_review: {type: String},
    avg_five_star_rating: {type: String},
    avg_one_star_rating: {type: String},
    avg_two_star_rating: {type: String},
    avg_three_star_rating: {type: String},
    avg_four_star_rating:{type: String}
}, { timestamps: true });

module.exports = mongoose.model('rating', userSchema);
