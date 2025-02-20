const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { JWT_SECRET_KEY } = process.env; 
const { generateToken } = require('../utils/user_generateToken');
const { SECRET_KEY } = process.env; 
const dotenv = require('dotenv');

dotenv.config();
const { generateOTP, encryptOTP, decryptOTP } = require('../services/twilioService');
const crypto = require('crypto');

// Signup API with OTP Generation
exports.signup = async (req, res) => {
  const { name, emailId, phoneNumber, pin } = req.body;

  try {
    // Generate OTP
    const otp = generateOTP(phoneNumber);
    const secretKey = SECRET_KEY; // Get secret key from environment

    // Encrypt OTP before saving it
    const encryptedOtp = encryptOTP(otp, secretKey);

    // Save user and OTP in database
    const user = new User({
      name,
      emailId,
      phoneNumber,
      pin,
      otp: encryptedOtp, // Store encrypted OTP
    });

    await user.save();

    // For now, just log the OTP (you can replace this with email or other delivery methods)
    console.log('OTP:', otp);

    res.status(200).json({ message: 'User registered. OTP has been sent.' });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ message: 'Error signing up' });
  }
};

exports.verifyOtp = async (req, res) => {
    const { phoneNumber, otpEntered } = req.body;
    const secretKey = process.env.SECRET_KEY; // Ensure secret key is correctly set
  
    try {
      const user = await User.findOne({ phoneNumber });
  
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
  
      const decryptedOtp = decryptOTP(user.otp, secretKey);
  
      if (decryptedOtp === otpEntered) {
        user.isVerified = true;  // ✅ Update the field
        await user.save();        // ✅ Ensure saving the updated user
  
        return res.status(200).json({
          message: "OTP verified successfully",
          isVerified: user.isVerified // ✅ Send isVerified in response
        });
      } else {
        return res.status(400).json({ message: "Invalid OTP" });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return res.status(500).json({ message: "Error verifying OTP" });
    }
  };
  
  

// Login Controller
exports.login = async (req, res) => {
    const { phoneNumber, pin } = req.body;

    try {
        const user = await User.findOne({ phoneNumber });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'User is not verified. Please verify OTP first.' });
        }

        if (user.pin !== pin) {
            return res.status(400).json({ message: 'Invalid PIN' });
        }

        const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful',
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
