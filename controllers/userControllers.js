const User = require("../models/userModel");
const { generateOtp, } = require("../services/otpService");
const { generateToken } = require('../utils/generateToken');



exports.signUp = async (req, res) => {
  const { name, email, phoneNumber, pin } = req.body;

  // Check for missing fields
  if (!name || !email || !phoneNumber || !pin) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this phone number" });
    }
   const otp='1234'
    // Create and save the new user
    const user = new User({ name, email, phoneNumber, pin, otp });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in sign-up API:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Login API
exports.login = async (req, res) => {
  const { phoneNumber, pin } = req.body;

  if (!phoneNumber || !pin) {
    return res.status(400).json({ error: "Phone and pin are required" });
  }

  try {
    // Use phoneNumber for the query
    const user = await User.findOne({ phoneNumber });

    // Check if user exists and pin matches
    if (!user || user.pin !== pin) {
      return res.status(401).json({ error: "Invalid phone or pin" });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(401).json({ error: "User is not verified" });
    }

    // Generate JWT token
          const token = generateToken(user._id);

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error in login API:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Verify OTP API
exports.verifyOtp = async (req, res) => {
  const { phoneNumber, otp } = req.body;
console.log(req.body);
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required" });
  }

  try {
    const user = await User.findOne({ phoneNumber });
    if (!otp) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null; // Clear OTP after verification
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Generate OTP API (Optional Helper)
exports.generateOtpForUser = async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const otp = generateOtp();
    user.otp = otp;
    await user.save();

    console.log(`Generated OTP: ${otp}`); // Log OTP for testing
    res.json({ message: "OTP generated and sent" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
