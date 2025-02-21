const express = require("express");
const router = express.Router();
const { validateSignup } = require('../middlewares/user_validate');
const { signUp, login, verifyOtp, generateOtpForUser } = require("../controllers/userControllers");

// Routes
router.post("/users/sign-up",validateSignup, signUp, );          // Sign Up API
router.post("/user/login", login);            // Login API
router.post("/user/verify-otp", verifyOtp);   // Verify OTP API
router.post("/user/generate-otp", generateOtpForUser); // Optional OTP Generation

module.exports = router;
