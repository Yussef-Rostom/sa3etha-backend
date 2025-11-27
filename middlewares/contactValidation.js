const { param, query, body, validationResult } = require("express-validator");

const validateGetExpertContact = [
  param("expertId")
    .notEmpty()
    .withMessage("Expert ID is required")
    .isMongoId()
    .withMessage("Expert ID must be a valid MongoDB ObjectId"),
  query("subServiceId")
    .notEmpty()
    .withMessage("Sub-service ID is required")
    .isMongoId()
    .withMessage("Sub-service ID must be a valid MongoDB ObjectId"),
  query("lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be a number between -90 and 90"),
  query("long")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be a number between -180 and 180"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation errors: " + errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    // If one coordinate is provided, both must be provided
    const { lat, long } = req.query;
    if ((lat && !long) || (!lat && long)) {
      return res.status(400).json({
        message: "Validation errors: Both latitude and longitude must be provided together",
      });
    }

    next();
  },
];

const validateExpertResponse = [
  param("id").isMongoId().withMessage("Invalid contact ID"),
  body("hasDeal").isBoolean().withMessage("hasDeal must be a boolean"),
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

const validateCustomerResponse = [
  param("id").isMongoId().withMessage("Invalid contact ID"),
  body("dealDate").optional().isISO8601().withMessage("Invalid date format"),
  body("confirmNoDeal").optional().isBoolean().withMessage("confirmNoDeal must be a boolean"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation errors: " + errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { dealDate, confirmNoDeal } = req.body;
    if (!dealDate && !confirmNoDeal) {
      return res.status(400).json({
        message: "Validation errors: Either dealDate or confirmNoDeal must be provided",
      });
    }

    next();
  },
];

module.exports = {
  validateGetExpertContact,
  validateExpertResponse,
  validateCustomerResponse,
};
