const express = require('express');
const Banner = require('../models/artistModel');
const Category = require('../models/artistModel');
const Video = require('../models/artistModel');
const TopBaaja = require('../models/topBaaja');
const {verifyToken } = require('../middlewares/verifyToken');
const router = express.Router();
router.get('/dashboard',verifyToken, async (req, res) => {
    try {
        // Run all queries concurrently using Promise.all
        const [banners, categories, videos,top_baaja] = await Promise.all([
            Banner.find(),          // Fetch banners
            Category.find(),      // Fetch categories
            Video.find(),       // Fetch videos
            TopBaaja.find()
        ]);

        // Return all data in a single response
        res.status(200).json({
            success: true,
            data: {
                banners,
                categories,
                videos,
                top_baaja
            }
        });
    } catch (error) {
        // Handle errors
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});
module.exports = router;