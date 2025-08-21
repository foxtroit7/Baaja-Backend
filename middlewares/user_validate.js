const { body, validationResult } = require('express-validator');

exports.validateSignup = [
    body('name')
        .not().isEmpty().withMessage('Name is required'),

    body('email')
        .not().isEmpty().withMessage('Email Id is required'),

    body('phone_number')
        .isMobilePhone().withMessage('Invalid phone number'),

    body('pin')
        .isNumeric().withMessage('Pin must be a number'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
