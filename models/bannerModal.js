const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  banner_id: { 
  type: String,
    unique: true 
  },
  section: { type: String, enum: ["top", "bottom"]},
  page: { type: String, enum: ["category", "landing"] },
  link: { type: String },
  photo: { type: String },
  connection: { type: String, enum: ["booking", "artist", "category"] },
  background_color: {
    type: String,
    required: function () {
      return this.section === 'top';
    }
  }
}, { timestamps: true });

// Generate 5-digit random banner_id if not provided
bannerSchema.pre('save', async function(next) {
  if (!this.banner_id) {
    this.banner_id = Math.floor(10000 + Math.random() * 90000).toString();
  }

  next();
});

module.exports = mongoose.model('banners', bannerSchema);
