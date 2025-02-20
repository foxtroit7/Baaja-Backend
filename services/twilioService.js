// services/otpService.js
const crypto = require('crypto');
const otpStore = new Map(); 
const User = require('../models/userModel');
// Generate OTP
const generateOTP = (phoneNumber) => {
    const otp = "1234" // Generate 4-digit OTP
    const expiresAt = Date.now() + 15 * 60 * 1000; // Expires in 15 minutes
  
    otpStore.set(phoneNumber, { otp, expiresAt });  
    return otp;
  }

  function encryptOTP(otp, secretKey) {
    const iv = crypto.randomBytes(16); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(otp, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Include IV with encrypted OTP
}


function decryptOTP(encryptedOtp, secretKey) {
  const [iv, encrypted] = encryptedOtp.split(':'); // Separate IV and encrypted data
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
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
