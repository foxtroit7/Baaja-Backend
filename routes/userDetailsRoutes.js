const express = require('express');
const UserDetails = require('../models/User'); // Import the user details model

const router = express.Router();

/**
 * POST route to create user details
 * @route POST /user/details
 */
router.post('/user/details', async (req, res) => {
  const {
    full_name,
    emailId,
    phoneNumber,
    address,
    gender,
    adharNumber,
    adharPhoto,
    userPhoto
  } = req.body;

  try {
    // Create a new user entry
    const newUser = new UserDetails({
      full_name,
      emailId,
      phoneNumber,
      address,
      gender,
      adharNumber,
      adharPhoto,
      userPhoto
    });

    // Save to the database
    await newUser.save();

    res.status(201).json({ message: 'User details created successfully', newUser });
  } catch (error) {
    console.error('Error creating user details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

/**
 * GET route to fetch user details by ID
 * @route GET /user/details/:id
 */
router.get('/user/details/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find user details by ID
    const user = await UserDetails.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found with the given ID' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
