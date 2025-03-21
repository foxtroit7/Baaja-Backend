const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require("../config/jwtConfig");

// Middleware to verify JWT Token
const verifyToken = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", ""); // Extract token
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY); // Verify the token
        req.user = decoded; // Attach decoded user data to request
        next(); // Proceed
    } catch (error) {
        res.status(400).json({ message: "Invalid or expired token" });
    }
};

// Middleware to check if the user is an admin
const verifyAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
};

module.exports = { verifyToken, verifyAdmin };
