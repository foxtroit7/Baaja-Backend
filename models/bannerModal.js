const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    type: { type: String,  required: true  },
    category: { type: String,  required: true ,   enum: ['Gitar', 'Sitar', 'Band', 'Tabla', 'Flute'], 
        message: '{VALUE} is not a valid baajaName', },
    description: { type: String,  required: true  },
    socialMediaLink: { type: String ,  required: true },
    photo: {type: String},
    startTime: { type: String},
    endTime: { type: String}
  }, { timestamps: true });

module.exports = mongoose.model('banners', userSchema);
