require('dotenv').config();  // Loading environment variables

module.exports = {
    JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,  // Get from .env
};
