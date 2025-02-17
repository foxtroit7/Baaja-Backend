const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../config/jwtConfig'); // Import the secret from the config

// Function to generate JWT Token
exports.generateToken = (userId) => {
    // The payload can contain any data, for example, the userId
    const payload = { userId };
    
    // Generate the token with the payload and secret key
    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '48h' });  // Token will expire in 48 hour

    return token;
};
