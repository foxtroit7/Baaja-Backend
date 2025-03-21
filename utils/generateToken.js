const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require("../config/jwtConfig");

// Function to generate JWT Token (default role is 'user')
exports.generateToken = (user_id, isAdmin = false) => {
    const role = isAdmin ? "admin" : "user";  // Set role dynamically
    const payload = { user_id, role };

    // Generate token with 48-hour expiration
    return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: "48h" });
};
