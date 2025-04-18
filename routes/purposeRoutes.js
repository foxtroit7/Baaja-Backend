const express = require('express');
const router = express.Router();
const Purpose = require('../models/purposeModal');

// 👉 Add a new purpose
router.post('/purpose', async (req, res) => {
  try {
    const { purpose } = req.body;
    const newPurpose = new Purpose({ purpose });
    await newPurpose.save();
    res.status(201).json({ message: 'Purpose added successfully', data: newPurpose });
  } catch (err) {
    res.status(500).json({ message: 'Error adding purpose', error: err.message });
  }
});

// 👉 Get all purposes
router.get('/purpose', async (req, res) => {
  try {
    const purposes = await Purpose.find().sort({ createdAt: -1 });
    res.status(200).json(purposes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching purposes', error: err.message });
  }
});

// 👉 Update a purpose by ID
router.put('/purpose/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { purpose } = req.body;
    const updatedPurpose = await Purpose.findByIdAndUpdate(id, { purpose }, { new: true });
    if (!updatedPurpose) return res.status(404).json({ message: 'Purpose not found' });
    res.status(200).json({ message: 'Purpose updated', data: updatedPurpose });
  } catch (err) {
    res.status(500).json({ message: 'Error updating purpose', error: err.message });
  }
});

// 👉 Delete a purpose by ID
router.delete('/purpose/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPurpose = await Purpose.findByIdAndDelete(id);
    if (!deletedPurpose) return res.status(404).json({ message: 'Purpose not found' });
    res.status(200).json({ message: 'Purpose deleted', data: deletedPurpose });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting purpose', error: err.message });
  }
});

module.exports = router;
