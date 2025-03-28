const express = require('express');
const Category = require('../models/helpCenter'); // Import the help model

const router = express.Router();

/**
 * POST route to create a new help
 * @route POST /help
 */
router.post('/help', async (req, res) => {
    const { question, answer} = req.body;

    try {
        const newhelp = new Category({ question, answer});
        await newhelp.save();
        res.status(201).json({ message: 'help created successfully', newhelp });
    } catch (error) {
        console.error('Error creating help:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch all helps
 * @route GET /help
 */
router.get('/help', async (req, res) => {
    try {
        const helps = await Category.find();
        res.status(200).json(helps);
    } catch (error) {
        console.error('Error fetching helps:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch an help by ID
 * @route GET /help/:id
 */
router.get('/help/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const help = await Category.findById(id);
        if (!help) {
            return res.status(404).json({ message: 'help not found' });
        }
        res.status(200).json(help);
    } catch (error) {
        console.error('Error fetching help by ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * PUT route to update an help
 * @route PUT /help/:id
 */
router.put('/help/:id', async (req, res) => {
    const { id } = req.params;
    const { question, answer} = req.body;

    try {
        const help = await Category.findById(id);
        if (!help) {
            return res.status(404).json({ message: 'help not found' });
        }

        // Update the fields
        help.question = question ?? help.question;
        help.answer = answer ?? help.answer;

        await help.save();
        res.status(200).json({ message: 'help updated successfully', help });
    } catch (error) {
        console.error('Error updating help:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * DELETE route to delete an help
 * @route DELETE /help/:id
 */
router.delete('/help/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const help = await Category.findById(id);
        if (!help) {
            return res.status(404).json({ message: 'help not found' });
        }

        await Category.findByIdAndDelete(id);
        res.status(200).json({ message: 'help deleted successfully' });
    } catch (error) {
        console.error('Error deleting help:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
