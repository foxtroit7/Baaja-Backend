const mongoose = require('mongoose');
const adminSchema = new mongoose.Schema({
    user_id: {type: String},
    email: { type: String },
    password: { type: String },
}, { timestamps: true });
module.exports = mongoose.model('admin', adminSchema);