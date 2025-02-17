const mongoose = require('mongoose');

// Define the user schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    baajaName: {
        type: String,
        required: true,
        enum: ['Gitar', 'Sitar', 'Band', 'Tabla', 'Flute'], 
        message: '{VALUE} is not a valid baajaName' 
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    pin: {
        type: String,
        required: true
    }
});

// Create the User model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
