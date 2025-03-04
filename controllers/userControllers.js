const User = require("../models/userModel");
const { generateOtp, } = require("../services/otpService");
const { generateToken } = require('../utils/generateToken');
const UserDetails = require('../models/userDetailsModal');


exports.signUp = async (req, res) => {
  const { name, email, phone_number, pin } = req.body;

  // Check for missing fields
  if (!name || !email || !phone_number || !pin) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ phone_number });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this phone number" });
    }
   const otp='1234'
    // Create and save the new user
    const user = new User({ name, email, phone_number, pin, otp });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in sign-up API:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Login API
exports.login = async (req, res) => {
  const { phone_number, pin } = req.body;

  if (!phone_number || !pin) {
    return res.status(400).json({ error: "Phone and pin are required" });
  }

  try {
    // Use phone_number for the query
    const user = await User.findOne({ phone_number });

    // Check if user exists and pin matches
    if (!user || user.pin !== pin) {
      return res.status(401).json({ error: "Invalid phone or pin" });
    }

    // Check if the user is verified
    if (!user.is_verified) {
      return res.status(401).json({ error: "User is not verified" });
    }
const user_photo = await UserDetails.findOne({ user_id: user.user_id });
        const profilePhoto = user_photo ? user.photo : null; 
    // Generate JWT token
          const token = generateToken(user._id);
// Update status to true (logged in)
user.status = true;
await user.save();
    res.status(200).json({ message: "Login successful", token, status: user.status, name: user.name, user_id: user.user_id ,  photo: profilePhoto,});
  } catch (error) {
    console.error("Error in login API:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// Verify OTP API
exports.verifyOtp = async (req, res) => {
  const { phone_number, otp } = req.body;
console.log(req.body);
  if (!phone_number || !otp) {
    return res.status(400).json({ error: "Phone and OTP are required" });
  }

  try {
    const user = await User.findOne({ phone_number });
    if (!otp) {
      return res.status(401).json({ error: "Invalid OTP" });
    }

    user.is_verified = true;
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
// **Logout Controller**
exports.logout = async (req, res) => {
  const { user_id } = req.body;

  try {
      const user = await User.findOne({user_id});

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Update status to false (logged out)
      user.status = false;
      await user.save();

      res.status(200).json({ message: 'Logout successful', status: user.status });
  } catch (error) {
      console.error('Error during logout:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};