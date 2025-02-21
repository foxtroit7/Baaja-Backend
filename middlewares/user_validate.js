const { body, validationResult } = require('express-validator');

exports.validateSignup = [
    body('name').not().isEmpty().withMessage('Name is required').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
    body('email').not().isEmpty().withMessage('Email Id is required').isLength({ min: 5 }).withMessage('email must be at least 5 characters'),
    body('phoneNumber').isMobilePhone().withMessage('Invalid phone number').isLength({ min: 10, max: 12 }).withMessage('Phone number must be valid'),
    body('pin').isNumeric().withMessage('Pin must be a 4-digit number').isLength({ min: 4, max: 4 }).withMessage('Pin must be exactly 4 digits'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
