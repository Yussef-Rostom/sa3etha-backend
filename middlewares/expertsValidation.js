const {
  check,
  query,
  validationResult,
  param,
} = require("express-validator");
const User = require("../models/User");
const { governorateNames } = require("../utils/locationHelper");

const validateUpdateExpertProfile = [
  check("name", "Full name must be a string").optional().isString(),
  check("phone")
    .optional()
    .isString()
    .withMessage("Phone number must be a string")
    .matches(/^(?:\+20|0)?1[0-2,5]{1}[0-9]{8}$/)
    .withMessage("Invalid Egyptian phone number")
    .custom(async (value, { req }) => {
      if (value) {
        const existingUser = await User.findOne({ phone: value });
        if (existingUser && existingUser._id.toString() !== req.user.id) {
          return Promise.reject("Phone number already in use");
        }
      }
    }),
  check("imageUrl", "Image URL must be a valid URL").optional().isURL(),
  check("coordinates")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Coordinates must be an array of two numbers")
    .custom((value) => {
      if (!Array.isArray(value) || value.length !== 2) {
        return false;
      }
      const [lon, lat] = value;
      if (typeof lon !== "number" || typeof lat !== "number") {
        return false;
      }
      if (lon < -180 || lon > 180) {
        return false;
      }
      if (lat < -90 || lat > 90) {
        return false;
      }
      return true;
    })
    .withMessage(
      "Coordinates must be a valid array of two numbers [longitude, latitude]",
    ),
  check("governorate")
    .optional()
    .isString()
    .withMessage("Governorate must be a string")
    .isIn(governorateNames)
    .withMessage("Invalid governorate"),
  check("expertProfile.serviceTypes")
    .optional()
    .isArray()
    .withMessage("Service types must be an array of sub-service IDs"),
  check("expertProfile.description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  check("expertProfile.averagePricePerHour")
    .optional()
    .isNumeric()
    .withMessage("Average price per hour must be a number"),
  check("expertProfile.yearsExperience")
    .optional()
    .isNumeric()
    .withMessage("Years of experience must be a number"),
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

const validateGetNearExperts = [
  query("serviceId", "Invalid service ID").optional().isMongoId(),
  query("subServiceId", "Invalid sub-service ID").optional().isMongoId(),
  query("coordinates", "Coordinates must be an array of two floats")
    .optional()
    .isArray({ min: 2, max: 2 })
    .custom((value) => {
      if (!Array.isArray(value) || value.length !== 2) return false;
      const [lon, lat] = value.map((v) => parseFloat(v));
      if (isNaN(lon) || isNaN(lat)) return false;
      if (lon < -180 || lon > 180) return false;
      if (lat < -90 || lat > 90) return false;
      return true;
    }),
  query(
    "governorate",
    `Governorate must be one of [${governorateNames.join(", ")}]`,
  )
    .optional()
    .isString()
    .isIn(governorateNames),
  query("range", "Range must be a valid positive integer")
    .optional()
    .isInt({ min: 1 }),
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

const validateUpdateAvailability = [
  check("isAvailable", "Availability must be a boolean").isBoolean(),
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

const validateGetExpertProfileById = [
  param("id", "Invalid expert ID").isMongoId(),
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

const validateSubServiceOperation = [
  param("subServiceId", "Invalid sub-service ID").isMongoId(),
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

const validateUpdateExpertStats = [
  check("subServiceId", "Sub-service ID is required and must be a valid ID")
    .notEmpty()
    .isMongoId(),
  check("averagePricePerHour")
    .optional()
    .isNumeric()
    .withMessage("Average price per hour must be a number"),
  check("yearsExperience")
    .optional()
    .isNumeric()
    .withMessage("Years of experience must be a number"),
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
  validateUpdateExpertProfile,
  validateGetNearExperts,
  validateUpdateAvailability,
  validateGetExpertProfileById,
  validateSubServiceOperation,
  validateUpdateExpertStats,
};
