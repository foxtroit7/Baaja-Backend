const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../config/jwtConfig');

// Middleware to verify JWT Token
exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Extract token from header
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY);  // Verify the token
        req.user = decoded;  // Attach the decoded user data to the request
        next();  // Proceed to the next middleware or route handler
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};
