const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistDetailsControllers');

router.put('/artist-notifications/:userId', artistController.updateArtist); // Update artist (pending changes)
router.get('/artist-notifications/pending/:userId', artistController.getPendingChanges); // Get pending changes
router.get('/notifications/:userId', artistController.getNotifications); // Get notifications by id
router.put('/notifications/approve/:userId', artistController.approveChanges); // Approve changes
router.put('/notifications/reject/:userId', artistController.rejectChanges); // Reject changes
router.get('/all-notifications', artistController.getAllNotifications);  // get all notifications
module.exports = router;
