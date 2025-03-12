const express = require("express");
const router = express.Router();
const { validateSignup } = require('../middlewares/user_validate');
const { signUp, login, verifyOtp, generateOtpForUser, logout, getLoggedInUsers, getUserById, updateUserById, deleteUserById, addFavourites, deleteFavorites, getListFavorites } = require("../controllers/userControllers");

// Routes
router.post("/users/sign-up",validateSignup, signUp); // Sign Up API
router.post("/user/login", login);            // Login API
router.post("/user/verify-otp", verifyOtp); 
router.post("/user/generate-otp", generateOtpForUser); 
router.post('/user/logout', logout);
router.get("/user/details",getLoggedInUsers);
router.get('/user/details/:user_id', getUserById);
router.put('/user/details/:user_id', updateUserById);
router.delete('/user/details/:user_id', deleteUserById);
router.post('/user/favorites', addFavourites);
router.delete('/user/favorites/:user_id/:artist_id', deleteFavorites);
router.get('/user/favorites/:user_id', getListFavorites);
module.exports = router;
