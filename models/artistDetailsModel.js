const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');  
const userSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true,   default: () => uuidv4() },
    userId: { type: String, required: true},
    owner_name: { type: String, required: true },
    photo: {type: String},
    profile_name:{type: String, required: true},
    totalBookings: { type: Number, required: true },
    location: { type: String, required: true },
    categoryType: { type: String, required: true, enum: ['Sitar', 'Tabla', 'Band', 'HandTaal', 'Manjira', 'Flute'] },
    categoryImage: { type: String },
    experience: { type: String },
    description: { type: String },
    totalmoney: { type: String },
    recent_order: { type: String },
    status: { type: String, required: true, enum: ['Active', 'Approval', 'Suspend'] },
    rating: { type: Number, min: 0, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model('artist_details', userSchema);
