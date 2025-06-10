const jwt = require('jsonwebtoken');
const User = require('../models/artistModel');
const { generateToken } = require('../utils/generateToken');
const { JWT_SECRET_KEY } = process.env;
const ArtistDetails = require('../models/artistDetailsModel');
const PendingArtistUpdate = require('../models/PendingArtistUpdate');
const CategoryModel = require('../models/categoryModel')
// Signup Controller
exports.signup = async (req, res) => {
    try {
        const { name, category_name,profile_name, phone_number} = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ phone_number });
        if (userExists) {
            return res.status(400).json({ message: 'User with this phone number already exists' });
        }

        // Create new user
        const user = new User({
            name,
            category_name,
            profile_name,
            phone_number,
        });

        // Save user to DB
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Artist created successfully',
            token,
            user_id: user.user_id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// **Login Controller**
exports.login = async (req, res) => {
    const { phone_number, pin, fcm_token } = req.body;

    try {
        // Find user by phone number
        const user = await User.findOne({ phone_number });

        if (!user) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        // Check if PIN is provided
        if (!pin) {
            return res.status(400).json({ message: 'Invalid PIN' });
        }

        // Update status to true (logged in)
        user.status = true;
        if (fcm_token) {
            user.fcm_token = fcm_token;
        }
        await user.save();

        // Defaults
        let update_status = false;
        let approved_artist = false;
        let profilePhoto = null;

       const pendingUpdate = await PendingArtistUpdate.findOne({ user_id: user.user_id });

if (pendingUpdate) {
    update_status = true;
}
    // Check for approved artist with status 'approved'
const artist = await ArtistDetails.findOne({ 
    user_id: user.user_id, 
    status: 'approved' 
});

if (artist) {
    approved_artist = true;
    profilePhoto = artist.photo;
}


        // Validate category_name from CategoryModel
        const category = await CategoryModel.findOne({ category: user.category_name });

        if (!category) {
            return res.status(400).json({ message: 'Invalid category' });
        }

        // Generate JWT token
        const token = jwt.sign({ user_id: user._id }, JWT_SECRET_KEY, { expiresIn: '48h' });

        res.status(200).json({
            message: 'Login successful',
            token,
            status: user.status,
            fcm_token: user.fcm_token || null,
            user_id: user.user_id,
            profile: {
                name: user.name,
                profile_name: user.profile_name,
                category_name: category.category
            },
            photo: profilePhoto,
            update_status,
            approved_artist
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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

        res.status(200).json({ message: 'Logout successful', status: user.status});
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};