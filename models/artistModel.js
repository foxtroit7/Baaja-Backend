const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true, // Ensure the userId is unique
    },
    name: {
        type: String,
        required: true,
    },
    baajaName: {
        type: String,
        required: true,
        enum: ['Gitar', 'Sitar', 'Band', 'Tabla', 'Flute'], 
        message: '{VALUE} is not a valid baajaName',
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    pin: {
        type: String,
        required: true,
    },
});

// Pre-save middleware to automatically generate a unique userId
userSchema.pre('save', function (next) {
    if (!this.userId) { // If userId is not already set
        this.userId = `ARIST${Math.floor(100000 + Math.random() * 900000)}`; 
    }
    next();
});

// Create the User model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
