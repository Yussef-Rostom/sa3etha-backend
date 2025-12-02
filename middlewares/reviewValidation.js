const { body, param, validationResult } = require("express-validator");

const validateReview = [
    param("id").isMongoId().withMessage("Invalid contact request ID"),
    body("rating")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be an integer between 1 and 5"),
    body("comment")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Comment cannot exceed 500 characters"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

module.exports = { validateReview };
