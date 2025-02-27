const mongoose = require('mongoose');
const adminSchema = new mongoose.Schema({
    userId: {type: String},
    email: { type: String },
    password: { type: String },
}, { timestamps: true });
module.exports = mongoose.model('admin', adminSchema);