const { check, validationResult } = require("express-validator");

const validateAddService = [
  check("name", "Service name is required").not().isEmpty(),
  check("description", "Service description is required").not().isEmpty(),
  check("image", "Service image is required").not().isEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation errors: " + errors.array()[0].msg,
        errors: errors.array(),
      });
    }
    next();
  },
];

module.exports = {
  validateAddService,
};
