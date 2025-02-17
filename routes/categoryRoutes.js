const express = require('express');
const User = require('../models/categoryModel');
const upload = require('../middlewares/upload'); // Multer middleware for file uploads
const router = express.Router();

// Create a new category
router.post('/category', upload.single('photo'), async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    const photoPath = req.file ? req.file.path : null;

    const newCategory = new User({
      category,
      photo: photoPath, // Save the photo path
    });

    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
router.get('/category', async (req, res) => {
  try {
    const categories = await User.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a category by its ID
router.get('/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await User.findById(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a category by its ID
router.delete('/category/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await User.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a category by its ID
router.put('/category/:id', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;

    const photoPath = req.file ? req.file.path : undefined;

    const updatedData = { category };
    if (photoPath) {
      updatedData.photo = photoPath;
    }

    const updatedCategory = await User.findByIdAndUpdate(id, updatedData, { new: true });

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;