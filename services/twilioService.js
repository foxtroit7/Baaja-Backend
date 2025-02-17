// services/otpService.js
const crypto = require('crypto');
const otpStore = new Map(); 
const User = require('../models/userModel');
// Generate OTP
const generateOTP = (phoneNumber) => {
    const otp = crypto.randomInt(1000, 9999).toString(); // Generate 4-digit OTP
    const expiresAt = Date.now() + 15 * 60 * 1000; // Expires in 15 minutes
  
    otpStore.set(phoneNumber, { otp, expiresAt });
    console.log(`OTP for ${phoneNumber}: ${otp}`); // Debugging
  
    return otp;
  }

// Encrypt OTP using AES-256
function encryptOTP(otp, secretKey) {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(otp, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt OTP using AES-256
function decryptOTP(encryptedOtp, secretKey) {
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
  let decrypted = decipher.update(encryptedOtp, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
// Verify OTP
const verifyOtp = async (phoneNumber, otpEntered) => {
    const otpData = otpStore.get(phoneNumber);
  
    if (!otpData) {
      return { success: false, message: "No OTP found for this number" };
    }
  
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(phoneNumber);
      return { success: false, message: "OTP expired" };
    }
  
    if (otpData.otp !== otpEntered) {
      return { success: false, message: "Invalid OTP" };
    }
    try {
        // ✅ Update isVerified to true in the database
        await User.updateOne({ phoneNumber }, { $set: { isVerified: true } });

        return { success: true, message: "OTP verified successfully" };
    } catch (error) {
        console.error("Error updating verification status:", error);
        return { success: false, message: "Database update failed" };
    }
  };

module.exports = { generateOTP, encryptOTP, decryptOTP, verifyOtp };
