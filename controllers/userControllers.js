const User = require("../models/userModel");
const { generateOtp, } = require("../services/otpService");
const { generateToken } = require('../utils/generateToken');
const ArtistDetails = require("../models/artistDetailsModel");
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

    // Generate JWT token
          const token = generateToken(user._id);
// Update status to true (logged in)
user.status = true;
await user.save();
    res.status(200).json({ message: "Login successful", token, status: user.status, name: user.name, user_id: user.user_id ,  photo: user.photo, total_bookings: user.total_bookings || null,
      pending_bookings: user.pending_bookings || null,
      location: user.location || null,
      experience: user.experience || null,
      description: user.description || null,
      total_money: user.total_money || null,
      recent_order: user.recent_order || null,
      registration_date: user.registration_date || null,
      activity_status: user.activity_status || null,
      favorites: user.favorites || null
    });
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

// Get Logged-in Users API
exports.getLoggedInUsers = async (req, res) => {
  try {
    // Find all users with status true (logged in)
    const loggedInUsers = await User.find({ status: true }, 'name email phone_number user_id status photo total_bookings pending_bookings location experience description total_money recent_order registration_date activity_status favorites');

    if (!loggedInUsers.length) {
      return res.status(404).json({ message: "No users are currently logged in" });
    }

    const response = loggedInUsers.map(user => ({
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      user_id: user.user_id,
      status: user.status,
      photo: user.photo,
      total_bookings: user.total_bookings || null,
      pending_bookings: user.pending_bookings || null,
      location: user.location || null,
      experience: user.experience || null,
      description: user.description || null,
      total_money: user.total_money || null,
      recent_order: user.recent_order || null,
      registration_date: user.registration_date || null,
      activity_status: user.activity_status || null,
      favorites: user.favorites || null
    }));

    res.status(200).json({ loggedInUsers: response });
  } catch (error) {
    console.error("Error fetching logged-in users:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const user = await User.findOne({ user_id }, 
      'name email phone_number user_id status photo total_bookings pending_bookings location experience description total_money recent_order registration_date activity_status favorites'
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Formatting the response to match `getLoggedInUsers`
    const response = {
      name: user.name,
      email: user.email,
      phone_number: user.phone_number,
      user_id: user.user_id,
      status: user.status,
      photo: user.photo,
      total_bookings: user.total_bookings || null,
      pending_bookings: user.pending_bookings || null,
      location: user.location || null,
      experience: user.experience || null,
      description: user.description || null,
      total_money: user.total_money || null,
      recent_order: user.recent_order || null,
      registration_date: user.registration_date || null,
      activity_status: user.activity_status || null,
      favorites: user.favorites || null
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Update User Details by user_id API
exports.updateUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    const updates = req.body;

    // Prevent updating restricted fields
    const restrictedFields = ['name', 'email', 'phone_number', 'user_id', 'status'];
    restrictedFields.forEach(field => delete updates[field]);

    const updatedUser = await User.findOneAndUpdate({ user_id }, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ error: "Server error" });
  }
};
// Delete User by user_id API
exports.deleteUserById = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Find and delete the user
    const deletedUser = await User.findOneAndDelete({ user_id });
    
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.addFavourites = async (req, res) => {
      try {
          const { user_id, artist_id, name } = req.body;
  
          if (!user_id || !artist_id || !name) {
              return res.status(400).json({ message: 'User ID, Artist ID, and Artist Name are required' });
          }
  
          // Find user by user_id
          const user = await User.findOne({ user_id });
  
          // Check if user exists
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }
  
          // Check if artist is already in favorites
          const alreadyFavorited = user.favorites.some(fav => fav.artist_id.toString() === artist_id);
  
          if (alreadyFavorited) {
              return res.status(400).json({ message: 'Artist already in favorites' });
          }
  
          // Create a new favorite object
          const newFavorite = { artist_id, name };
  
          // Add to favorites
          user.favorites.push(newFavorite);
          await user.save();
  
          res.status(200).json({ message: 'Artist added to favorites', favorite: newFavorite });
      } catch (error) {
          console.error('Error adding favorite:', error);
          res.status(500).json({ message: 'Internal Server Error' });
      }
}
exports.deleteFavorites = async (req, res) => {
    try {
          const { user_id, artist_id } = req.body;
  
          if (!user_id || !artist_id) {
              return res.status(400).json({ message: 'User ID and Artist ID are required' });
          }
  
          const user = await User.findOne({ user_id });
  
          // Filter out the artist from favorites
          user.favorites = user.favorites.filter(fav => fav.artist_id.toString() !== artist_id);
          await user.save();
  
          res.status(200).json({ message: 'Artist removed from favorites'});
      } catch (error) {
          console.error('Error removing favorite:', error);
          res.status(500).json({ message: 'Internal Server Error' });
      }
}
exports.getListFavorites = async (req, res) => {
   try {
          const { user_id } = req.params;
  
          // Find user by user_id
          const user = await User.findOne({ user_id });
  
          // Extract artist IDs from the user's favorites
          const artistIds = user.favorites.map(fav => fav.artist_id);
  
          // Find all artist details where user_id matches the artist_id from favorites
          const artists = await ArtistDetails.find({ user_id: { $in: artistIds } });
  
          // Add is_favorite boolean to each artist
          const artistsWithFavorites = artists.map(artist => ({
              ...artist.toObject(),
              is_favorite: artistIds.includes(artist.user_id)
          }));
  
          res.status(200).json({ favorites: artistsWithFavorites });
      } catch (error) {
          console.error('Error fetching favorite artists:', error);
          res.status(500).json({ message: 'Internal Server Error' });
      }
}
