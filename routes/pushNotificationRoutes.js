const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/verifyToken");
const Notification = require("../models/pushNotification");


router.get("/push-notifications",verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ timestamp: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});


router.post('/faq', async (req, res) => {
    const { question, answer} = req.body;

    try {
        const newFAQ = new Category({ question, answer});
        await newFAQ.save();
        res.status(201).json({ message: 'FAQ created successfully', newFAQ });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;
