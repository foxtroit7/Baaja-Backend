const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true},
    photo: {type: String},
    name:{type: String, required: true},
    total_bookings: { type: Number, required: true },
    pending_bookings: { type: Number, required: true },
    location: { type: String, required: true },
    phone_number: { type: String },
    experience: { type: String },
    description: { type: String },
    total_money: { type: String },
    recent_order: { type: String },
    registration_date: {type: String},
    status: { type: String, required: true, enum: ['Active', 'Approval', 'Suspend'] },
    favorites: [
        {
            artist_id: { type: String, ref: 'artistModal' },
            name: { type: String }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('user_details', userSchema);
