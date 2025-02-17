const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category: { type: String,  required: true ,    enum: ['Gitar', 'Sitar', 'Band', 'Tabla', 'Flute'], 
        message: '{VALUE} is not a valid baajaName', },
    photo: {type: String}
  
  }, { timestamps: true });

module.exports = mongoose.model('category', categorySchema);
