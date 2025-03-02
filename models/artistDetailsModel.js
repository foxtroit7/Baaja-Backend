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
    category_image: { type: String },
    experience: { type: String },
    description: { type: String },
    total_money: { type: String },
    recent_order: { type: String },
    status: { type: String, required: true, enum: ['Active', 'Approval', 'Suspend'] },
    rating: { type: Number, min: 0, max: 5 },


     // New fields for tracking changes
  approved: { type: Boolean, default: true }, // If false, means changes are pending
  pendingChanges: { type: Object, default: {} }, // Stores only changed fields

  notifications: [{ 
    message: String, 
    timestamp: { type: Date, default: Date.now }, 
    approved: { type: Boolean, default: false }, 
    changedFields: Object 
  }]
}, { timestamps: true });

module.exports = mongoose.model('artist_details', userSchema);
