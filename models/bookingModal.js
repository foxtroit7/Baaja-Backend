const mongoose = require('mongoose');
const addOnSchema = new mongoose.Schema({
 is_legal: {type: Boolean, default: false},
 is_food: {type: Boolean, default: false},
 is_legal_price: {type: String},
 is_food_price: {type: String}
})
const userSchema = new mongoose.Schema({
   user_id: { type: String, ref: "userModel", required: true },
   artist_id: { type: String, ref: "artistModel", required: true },
   booking_id: { type: String, unique: true },
   schedule_date: {type: Date},
   booking_date: {type: Date},
   shift: {type:String},
   scheduled_time: {type: String},
   booking_time: {type: String},
   purpose: {type: String},
   full_name: {type: String},
   organization: {type: String},
   address: {type: String},
   district: {type: String},    
   pincode: {type: String},
   state: {type: String},
   landmark: {type: String},
   phone_number: {type: String},
   alternate_number: {type: String},
   adhaar_number: {type: String},
   required_items: { type: [String], required: true },
   add_on: [addOnSchema]
  }, { timestamps: true });
// Pre-save middleware to automatically generate a unique user_id
userSchema.pre('save', function (next) {
    if (!this.booking_id) { 
        this.booking_id = `BOOK${Math.floor(100000 + Math.random() * 900000)}`;
    }
    next();
});
module.exports = mongoose.model('bookings', userSchema);
