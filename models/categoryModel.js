const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category: { 
        type: String,  
        required: true,  
        enum: ['Gitar', 'Sitar', 'Band', 'Tabla', 'Flute'], 
        message: '{VALUE} is not a valid baajaName', 
    },
    photo: { type: String },
    category_id: { 
        type: String, 
        unique: true, 
    }
}, { timestamps: true });

// Middleware to generate a random 5-digit category_id before saving
categorySchema.pre('save', async function (next) {
    if (!this.category_id) {
        this.category_id = Math.floor(10000 + Math.random() * 90000).toString(); // Generate a 5-digit random number
    }
    next();
});

module.exports = mongoose.model('Category', categorySchema);
