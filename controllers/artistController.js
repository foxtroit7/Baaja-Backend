const jwt = require('jsonwebtoken');
const User = require('../models/artistModel');
const { generateToken } = require('../utils/generateToken');
const { JWT_SECRET_KEY } = process.env;

// Signup Controller
exports.signup = async (req, res) => {
    try {
        const { name, categoryName,profile_name, phoneNumber, pin } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ phoneNumber });
        if (userExists) {
            return res.status(400).json({ message: 'User with this phone number already exists' });
        }

        // Create new user
        const user = new User({
            name,
            categoryName,
            profile_name,
            phoneNumber,
        });

        // Save user to DB
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Artist created successfully',
            token,
            userId: user._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// **Login Controller**
exports.login = async (req, res) => {
    const { phoneNumber, pin } = req.body;

    try {
        // Find user by phone number
        const user = await User.findOne({ phoneNumber});

        if (!user) {
            return res.status(404).json({ message: 'Artist not found' });
        }

        // Check if PIN matches
        if (!pin) {
            return res.status(400).json({ message: 'Invalid PIN' });
        }

        // Update status to true (logged in)
        user.status = true;
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful',
            token: token,
            status: user.status
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// **Logout Controller**
exports.logout = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findOne({userId});

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