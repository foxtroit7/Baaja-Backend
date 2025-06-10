const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    user_id: {
        type: String,
        unique: true, // Ensure the user_id is unique
    },
    name: {
        type: String,
        required: true,
    },
    category_name: {
        type: String,
        required: true,
    },
    profile_name: {
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
        unique: true,
    },
    pin: {
        type: String
    },
    status: {
        type: Boolean,
        default: false, // Default to false (logged out)
    },
    fcm_token: { type: String },
    approved_artist: {
    type: Boolean,
    default: false
},

});

// Pre-save middleware to automatically generate a unique user_id
userSchema.pre('save', function (next) {
    if (!this.user_id) { // If user_id is not already set
        this.user_id = `ARTIST${Math.floor(100000 + Math.random() * 900000)}`; 
    }
    next();
});

// Create the User model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
