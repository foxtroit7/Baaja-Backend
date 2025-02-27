const express = require("express");
const { generateToken } = require("../utils/generateToken"); // Import token generator
const router = express.Router();

const HARD_CODED_EMAIL = "admin@example.com";
const HARD_CODED_PASSWORD = "Admin@123";

// Admin Login Route
router.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password match the hardcoded values
        if (email !== HARD_CODED_EMAIL || password !== HARD_CODED_PASSWORD) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT Token
        const token = generateToken(email);

        res.json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
