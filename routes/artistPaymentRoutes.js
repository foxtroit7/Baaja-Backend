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
  
// ✅ Add or Update Hot Selling Day
router.post('/artist/payment/:user_id/hot-day', verifyToken, async (req, res) => {
  const { user_id } = req.params;
  const { date, price, note } = req.body;

  if (!date || !price) {
    return res.status(400).json({ message: 'Date and price are required' });
  }

  try {
    const artistPayments = await ArtistPayments.findOne({ user_id });
    if (!artistPayments) {
      return res.status(404).json({ message: 'Artist payments not found' });
    }

    // Check if date already exists
    const existingDay = artistPayments.hot_selling_days.find(
      d => d.date.toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]
    );

    if (existingDay) {
      // Update
      existingDay.price = price;
      if (note !== undefined) existingDay.note = note;
    } else {
      // Add new
      artistPayments.hot_selling_days.push({ date, price, note });
    }

    await artistPayments.save();
    res.status(200).json({
      message: existingDay ? 'Hot selling day updated successfully' : 'Hot selling day added successfully',
      hot_selling_days: artistPayments.hot_selling_days
    });
  } catch (err) {
    console.error('Error adding/updating hot selling day:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// ✅ Remove Hot Selling Day
router.delete('/artist/payment/:user_id/hot-day/:day_id', verifyToken, async (req, res) => {
  const { user_id, day_id } = req.params;

  try {
    const artistPayments = await ArtistPayments.findOneAndUpdate(
      { user_id },
      { $pull: { hot_selling_days: { _id: day_id } } },
      { new: true }
    );

    if (!artistPayments) {
      return res.status(404).json({ message: 'Artist payments not found' });
    }

    res.status(200).json({
      message: 'Hot selling day removed successfully',
      hot_selling_days: artistPayments.hot_selling_days
    });
  } catch (err) {
    console.error('Error removing hot selling day:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// ✅ List Hot Selling Days
router.get('/artist/payment/:user_id/hot-days', async (req, res) => {
  const { user_id } = req.params;

  try {
    const artistPayments = await ArtistPayments.findOne({ user_id }, 'hot_selling_days');
    if (!artistPayments) {
      return res.status(404).json({ message: 'Artist payments not found' });
    }

    res.status(200).json({ hot_selling_days: artistPayments.hot_selling_days });
  } catch (err) {
    console.error('Error fetching hot selling days:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;
