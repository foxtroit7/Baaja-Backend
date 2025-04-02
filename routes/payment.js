const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");

// Load environment variables (if using dotenv)
require("dotenv").config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,  // Use env variables
    key_secret: process.env.RAZORPAY_SECRET
});

// Create Razorpay Order API
router.post("/create-order", async (req, res) => {
    try {
        const { amount, currency } = req.body;

        const options = {
            amount: amount * 100, // Convert to paise
            currency: currency || "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ message: "Failed to create order", error });
    }
});

module.exports = router;
