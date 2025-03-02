const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../config/jwtConfig'); // Import the secret from the config

// Function to generate JWT Token
exports.generateToken = (user_id) => {
    // The payload can contain any data, for example, the user_id
    const payload = { user_id };
    
    // Generate the token with the payload and secret key
    const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: '48h' });  // Token will expire in 48 hour

    return token;
};
