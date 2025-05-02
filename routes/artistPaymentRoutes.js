const express = require('express');
const router = express.Router();
const Artist = require('../models/artistModel');
const ArtistPayments = require('../models/artistPayments');
const { verifyToken } = require('../middlewares/verifyToken');

router.post('/artist/payment/:user_id', verifyToken, async (req, res) => {
  const { user_id } = req.params;
  const {
    first_day_booking,
    second_day_booking,
    third_day_booking,
    fourth_day_booking,
    fifth_day_booking,
    sixth_day_booking,
    seventh_day_booking
  } = req.body;

  try {
    // Check if the artist exists
    const artist = await Artist.findOne({ user_id });
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Check if the payment record already exists for this artist
    const existingPayment = await ArtistPayments.findOne({ user_id });
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment data already exists for this artist' });
    }

    // Create the new payment record
    const newPayment = new ArtistPayments({
      user_id,
      first_day_booking,
      second_day_booking,
      third_day_booking,
      fourth_day_booking,
      fifth_day_booking,
      sixth_day_booking,
      seventh_day_booking
    });

    // Save the new payment data
    await newPayment.save();

    // Return success response
    res.status(201).json({ message: 'Artist payment created', newPayment });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.put('/artist/payment/:user_id', verifyToken, async (req, res) => {
    const { user_id } = req.params;
    const updateData = req.body; // only include fields you want to update
  
    try {
      const updatedPayment = await ArtistPayments.findOneAndUpdate(
        { user_id: user_id },
        { $set: updateData },
        { new: true }
      );
  
      if (!updatedPayment) {
        return res.status(404).json({ message: 'Artist payment not found' });
      }
  
      res.status(200).json({ message: 'Artist payment updated', updatedPayment });
    } catch (err) {
      console.error('Error updating payment:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  router.get('/artist/payment/:user_id', async (req, res) => {
    const { user_id } = req.params;
  
    try {
      const artistPayments = await ArtistPayments.findOne({ user_id });
      
      if (!artistPayments) {
        return res.status(404).json({ message: 'Artist payments not found' });
      }
  
      res.status(200).json({ artistPayments });
    } catch (err) {
      console.error('Error fetching payments:', err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  
  module.exports = router;
