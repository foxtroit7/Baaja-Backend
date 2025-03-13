const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');  
const userSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true,   default: () => uuidv4() },
    user_id: { type: String, required: true},
    owner_name: { type: String, required: true },
    photo: {type: String},
    profile_name:{type: String, required: true},
    total_bookings: { type: Number, required: true },
    location: { type: String, required: true },
    category_type: { type: String, required: true, enum: ['Sitar', 'Tabla', 'Band', 'HandTaal', 'Manjira', 'Flute'] },
    category_id: {type: String},
    experience: { type: String },
    description: { type: String },
    total_price: { type: String },
    advance_price: { type: String },
    recent_order: { type: String },
    status: { type: String },
    approved: { type: Boolean, default: true }, 
    top_baaja: { type: Boolean, default: false }, 
    pendingChanges: { type: Object, default: {} },
  notifications: [{ 
    message: String, 
    timestamp: { type: Date, default: Date.now }, 
    approved: { type: Boolean, default: false }, 
    changedFields: Object 
  }]
}, { timestamps: true });

module.exports = mongoose.model('artist_details', userSchema);
