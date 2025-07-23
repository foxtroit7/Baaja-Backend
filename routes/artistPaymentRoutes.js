const express = require('express');
const router = express.Router();
const Artist = require('../models/artistModel');
const ArtistPayments = require('../models/artistPayments');
const { verifyToken } = require('../middlewares/verifyToken');

router.post('/artist/payment/:user_id', verifyToken, async (req, res) => {
  const { user_id } = req.params;

  // Extract only the valid booking fields that are present in the request
  const allowedFields = [
    'first_day_booking',
    'second_day_booking',
    'third_day_booking',
    'fourth_day_booking',
    'fifth_day_booking',
    'sixth_day_booking',
    'seventh_day_booking'
  ];

  const updateFields = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updateFields[field] = req.body[field];
    }
  });

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: 'No booking data provided' });
  }

  try {
    // Check if artist exists
    const artist = await Artist.findOne({ user_id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Check if payment already exists
    const existingPayment = await ArtistPayments.findOne({ user_id });

    if (existingPayment) {
      // Update only the provided fields
      const updatedPayment = await ArtistPayments.findOneAndUpdate(
        { user_id },
        { $set: updateFields },
        { new: true }
      );

      return res.status(200).json({
        message: 'Artist payment updated successfully',
        payment: updatedPayment
      });
    } else {
      // Create new payment with only provided fields
      const newPayment = new ArtistPayments({
        user_id,
        ...updateFields
      });

      await newPayment.save();

      return res.status(201).json({
        message: 'Artist payment created successfully',
        payment: newPayment
      });
    }
  } catch (err) {
    console.error('Error in payment API:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

  router.get('/artist/payment/:user_id', async (req, res) => {
    const { user_id } = req.params;
  
    try {
      const artistPayments = await ArtistPayments.findOne({ user_id });
      
      // if (!artistPayments) {
      //   return res.status(404).json({ message: 'Artist payments not found' });
      // }
  
      res.status(200).json({ artistPayments });
    } catch (err) {
      console.error('Error fetching payments:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
});
  
  
  module.exports = router;
