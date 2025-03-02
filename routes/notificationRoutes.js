const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistDetailsControllers');

router.put('/artist-notifications/:user_id', artistController.updateArtist); // Update artist (pending changes)
router.get('/artist-notifications/pending/:user_id', artistController.getPendingChanges); // Get pending changes
router.get('/notifications/:user_id', artistController.getNotifications); // Get notifications by id
router.put('/notifications/approve/:user_id', artistController.approveChanges); // Approve changes
router.put('/notifications/reject/:user_id', artistController.rejectChanges); // Reject changes
router.get('/all-notifications', artistController.getAllNotifications);  // get all notifications
module.exports = router;
