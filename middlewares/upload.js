const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename file with timestamp
    }
});

// File Filter: Accept only videos and images
const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith('video/') && !file.mimetype.startsWith('image/')) {
        return cb(new Error('Only video and image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB file size limit
    fileFilter: fileFilter
});
module.exports = upload;
