const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true},
    photo: {type: String},
    name:{type: String, required: true},
    totalBookings: { type: Number, required: true },
    pendingBookings: { type: Number, required: true },
    location: { type: String, required: true },
    phoneNumber: { type: String },
    experience: { type: String },
    description: { type: String },
    totalmoney: { type: String },
    recent_order: { type: String },
    registration_date: {type: String},
    status: { type: String, required: true, enum: ['Active', 'Approval', 'Suspend'] },
}, { timestamps: true });

module.exports = mongoose.model('user_details', userSchema);
