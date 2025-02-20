const express = require('express');
const Category = require('../models/categoryModel');
const upload = require('../middlewares/upload'); // Multer middleware for file uploads
const router = express.Router();

// Create a new category
router.post('/category', upload.single('photo'), async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    const photoPath = req.file ? `uploads/${req.file.filename}` : null;

    const newCategory = new Category({
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
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a category by categoryId
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findOne({ categoryId });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a category by categoryId
router.delete('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findOneAndDelete({ categoryId });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a category by categoryId
router.put('/category/:categoryId', upload.single('photo'), async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { category } = req.body;

    const photoPath = req.file ? req.file.path : undefined;

    const updatedData = { category };
    if (photoPath) {
      updatedData.photo = photoPath;
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { categoryId },
      updatedData,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
