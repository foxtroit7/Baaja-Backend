const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const Artist = require('../models/artistDetailsModel');
const Booking = require('../models/bookingModal');
const { verifyToken } = require('../middlewares/verifyToken');

// GET /api/dashboard-stats
router.get('/dashboard-stats', verifyToken, async (req, res) => {
    try {
      const { range, startDate, endDate } = req.query;
  
      let dateFilter = {};
      const now = new Date();
  
      if (range === 'today') {
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
      } else if (range === 'week') {
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: endOfWeek } };
      } else if (range === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
      } else if (range === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full end day
        dateFilter = { createdAt: { $gte: start, $lte: end } };
      }
  
      const [totalUsers, totalArtists, cancelledBookings, activeBookings, pendingBookings] = await Promise.all([
        User.countDocuments(dateFilter),
        Artist.countDocuments(dateFilter),
        Booking.countDocuments({ status: 'rejected', ...dateFilter }),
        Booking.countDocuments({ status: 'accepted', ...dateFilter }),
        Booking.countDocuments({ status: 'pending', ...dateFilter }),
      ]);
  
      const revenueResult = await Booking.aggregate([
        { $match: { payment_status: 'paid', ...dateFilter } },
        { $group: { _id: null, totalRevenue: { $sum: '$total_price' } } }
      ]);
  
      const totalRevenue = revenueResult[0]?.totalRevenue || 0;
  
      res.json({
        totalUsers,
        totalArtists,
        cancelledBookings,
        activeBookings,
        pendingBookings,
        totalRevenue: `₹${totalRevenue}`
      });
  
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
  });
  

module.exports = router;
