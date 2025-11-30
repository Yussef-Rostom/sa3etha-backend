const { check, validationResult } = require("express-validator");
const { governorateNames } = require("../utils/locationHelper");

const validateRegistration = [
  check("name", "Full name is required")
    .not()
    .isEmpty()
    .matches(/^[\u0600-\u06FF\s]+$/)
    .withMessage("Name must contain only Arabic characters and spaces"),
  check("phone", "Phone number is required")
    .not()
    .isEmpty()
    .matches(/^(?:\+20|0)?1[0-2,5]{1}[0-9]{8}$/)
    .withMessage("Phone must be a valid Egyptian number."),
  check(
    "password",
    "Password must be at least 6 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character",
  ).matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
  ),
  check("role")
    .optional()
    .isIn(["user", "expert"])
    .withMessage("Role must be one of: user, expert"),
  check("governorate")
    .optional()
    .isString()
    .withMessage("Governorate must be a string")
    .isIn(governorateNames)
    .withMessage("Invalid governorate"),
  check("coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of two numbers"),
  check("coordinates.*")
    .optional()
    .isFloat()
    .withMessage("Coordinates must contain only numbers"),
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

const validateLogin = [
  check("email")
    .optional()
    .isEmail()
    .withMessage("Please include a valid email"),
  check("phone")
    .optional()
    .matches(/^(?:\+20|0)?1[0-2,5]{1}[0-9]{8}$/)
    .withMessage("Phone must be a valid Egyptian number."),
  check("password", "Password is required").exists(),
  check("role")
    .optional()
    .isIn(["user", "expert"])
    .withMessage("Role must be one of: user, expert"),
  check("governorate")
    .optional()
    .isString()
    .withMessage("Governorate must be a string")
    .isIn(governorateNames)
    .withMessage("Invalid governorate"),
  check("coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of two numbers"),
  check("coordinates.*")
    .optional()
    .isFloat()
    .withMessage("Coordinates must contain only numbers"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation errors: " + errors.array()[0].msg,
        errors: errors.array(),
      });
    }
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({
        message: "Validation errors: Email or Phone is required",
      });
    }
    next();
  },
];

const validateUpdateUser = [
  check("name", "Full name must be a string")
    .optional()
    .isString()
    .matches(/^[\u0600-\u06FF\s]+$/)
    .withMessage("Name must contain only Arabic characters and spaces"),
  check("phone", "Please enter a valid Egyptian phone number")
    .optional()
    .matches(/^(?:\+20|0)?1[0-2,5]{1}[0-9]{8}$/)
    .withMessage("Phone must be a valid Egyptian number."),
  check("whatsapp", "Please enter a valid Egyptian phone number")
    .optional()
    .matches(/^(?:\+20|0)?1[0-2,5]{1}[0-9]{8}$/)
    .withMessage("Whatsapp must be a valid Egyptian number."),
  check("governorate")
    .optional()
    .isString()
    .withMessage("Governorate must be a string")
    .isIn(governorateNames)
    .withMessage("Invalid governorate"),
  check("coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of two numbers"),
  check("coordinates.*")
    .optional()
    .isFloat()
    .withMessage("Coordinates must contain only numbers"),
  check("imageUrl", "Image URL must be a string").optional().isString(),
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

const validateResetPassword = [
  check("email", "Please include a valid email").isEmail(),
  check("otp", "OTP must be a 6-digit number")
    .isLength({ min: 6, max: 6 })
    .isNumeric(),
  check(
    "password",
    "Password must be at least 6 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character",
  ).matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
  ),
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

const validateForgotPassword = [
  check("email", "Please include a valid email").isEmail(),
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

const validateUpdateFcmToken = [
  check("fcmToken", "FCM token is required").not().isEmpty().isString(),
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

const validateRefreshToken = [
  check("refreshToken", "Refresh token is required").not().isEmpty(),
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
  validateRegistration,
  validateLogin,
  validateUpdateUser,
  validateResetPassword,
  validateForgotPassword,
  validateUpdateFcmToken,
  validateRefreshToken,
};
