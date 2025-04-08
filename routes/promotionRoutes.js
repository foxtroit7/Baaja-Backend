const express = require('express');
const router = express.Router();
const Promotion = require('../models/promotionModal');
const upload = require('../middlewares/upload');
const { verifyToken } = require("../middlewares/verifyToken");
// Create a promotion
router.post('/add-promotions', upload.single('photo'),verifyToken, async (req, res) => {
    try {
      const { type, category, description, link, start_time, end_time, position, background_color, text_color } = req.body;
  
      if (!type || !category) {
        return res.status(400).json({ message: 'Type and category are required.' });
      }
  
      if (position === 'top') {
        const topExists = await Promotion.findOne({ position: 'top' });
        if (topExists) {
          return res.status(400).json({ message: 'A top-positioned promotion already exists.' });
        }
      }
  
      const photo = req.file ? req.file.path : null;
  
      const newPromotion = new Promotion({
        type,
        category,
        description,
        link,
        photo,
        start_time,
        end_time,
        position,
        background_color,
        text_color
      });
  
      const savedPromotion = await newPromotion.save();
      res.status(201).json({ message: 'Promotion added successfully', promotion: savedPromotion });
    } catch (error) {
      console.error('Error adding promotion:', error);
      res.status(500).json({ message: error.message });
    }
  });

// GET /get-promotions or /get-promotions?promotion_id=PROMO123456
router.get('/get-promotions',verifyToken, async (req, res) => {
    try {
      const { promotion_id, position } = req.query;
  
      if (promotion_id) {
        const promotion = await Promotion.findOne({ promotion_id });
        if (!promotion) {
          return res.status(404).json({ message: 'Promotion not found' });
        }
        return res.status(200).json(promotion);
      }
  
      const filter = {};
      if (position) {
        filter.position = position;
      }
  
      const promotions = await Promotion.find(filter);
      res.status(200).json(promotions);
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  
// PUT /api/promotions/edit/:promotion_id
router.put('/edit-promotions/:promotion_id', verifyToken, async (req, res) => {
    try {
      const { promotion_id } = req.params;
  
      const updated = await Promotion.findOneAndUpdate(
        { promotion_id },
        req.body,
        { new: true }
      );
  
      if (!updated) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
  
      res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating promotion:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  

// Delete a promotion
router.delete('/delete-promotions/:promotion_id',verifyToken, async (req, res) => {
    const { promotion_id } = req.params;
  
    try {
      const deleted = await Promotion.findOneAndDelete({ promotion_id });
      if (!deleted) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
  
      res.status(200).json({ message: 'Promotion deleted successfully' });
    } catch (error) {
      console.error('Error deleting promotion:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

module.exports = router;
