const { check, validationResult } = require("express-validator");

const validateRegistration = [
  check("name", "Full name is required").not().isEmpty(),
  check("phone", "Phone number is required").not().isEmpty(),
  check("email", "Please include a valid email").isEmail(),
  check(
    "password",
    "Password must be at least 6 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character"
  ).matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
  ),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
          message: "Validation errors: " + errors.array()[0].msg,
          errors: errors.array(),
        });
    }
    next();
  },
];

const validateLogin = [
  check("email", "Please include a valid email").isEmail(),
  check("password", "Password is required").exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({
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
};
