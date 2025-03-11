const express = require('express');
const Category = require('../models/faqModal'); // Import the FAQ model

const router = express.Router();

/**
 * POST route to create a new FAQ
 * @route POST /faq
 */
router.post('/faq', async (req, res) => {
    const { question, answer} = req.body;

    try {
        const newFAQ = new Category({ question, answer});
        await newFAQ.save();
        res.status(201).json({ message: 'FAQ created successfully', newFAQ });
    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch all FAQs
 * @route GET /faq
 */
router.get('/faq', async (req, res) => {
    try {
        const faqs = await Category.find();
        res.status(200).json(faqs);
    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * GET route to fetch an FAQ by ID
 * @route GET /faq/:id
 */
router.get('/faq/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const faq = await Category.findById(id);
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }
        res.status(200).json(faq);
    } catch (error) {
        console.error('Error fetching FAQ by ID:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * PUT route to update an FAQ
 * @route PUT /faq/:id
 */
router.put('/faq/:id', async (req, res) => {
    const { id } = req.params;
    const { question, answer} = req.body;

    try {
        const faq = await Category.findById(id);
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }

        // Update the fields
        faq.question = question ?? faq.question;
        faq.answer = answer ?? faq.answer;

        await faq.save();
        res.status(200).json({ message: 'FAQ updated successfully', faq });
    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/**
 * DELETE route to delete an FAQ
 * @route DELETE /faq/:id
 */
router.delete('/faq/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const faq = await Category.findById(id);
        if (!faq) {
            return res.status(404).json({ message: 'FAQ not found' });
        }

        await Category.findByIdAndDelete(id);
        res.status(200).json({ message: 'FAQ deleted successfully' });
    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;
