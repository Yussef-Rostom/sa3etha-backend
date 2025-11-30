const express = require("express");
const {
  getAvailableExperts,
  updateAvailability,
  updateExpertProfile,
  getNearExperts,
  getExpertProfileById,
  addSubServiceToProfile,
  removeSubServiceFromProfile,
  updateExpertStats,
} = require("../controllers/expertController");
const { protect, optionalAuth } = require("../middlewares/authMiddleware");
const { expert } = require("../middlewares/expertMiddleware");
const {
  validateGetNearExperts,
  validateUpdateExpertProfile,
  validateUpdateAvailability,
  validateGetExpertProfileById,
  validateSubServiceOperation,
  validateUpdateExpertStats,
} = require("../middlewares/expertsValidation");

const router = express.Router();

router.get("/", getAvailableExperts);
router.get("/near", optionalAuth, validateGetNearExperts, getNearExperts);
router.get(
  "/profile/:id",
  protect,
  validateGetExpertProfileById,
  getExpertProfileById,
);
router.put(
  "/availability",
  protect,
  expert,
  validateUpdateAvailability,
  updateAvailability,
);
router.put(
  "/profile",
  protect,
  expert,
  validateUpdateExpertProfile,
  updateExpertProfile,
);

router.post(
  "/sub-services/:subServiceId",
  protect,
  expert,
  validateSubServiceOperation,
  addSubServiceToProfile,
);

router.delete(
  "/sub-services/:subServiceId",
  protect,
  expert,
  validateSubServiceOperation,
  removeSubServiceFromProfile,
);

router.put(
  "/stats",
  protect,
  expert,
  validateUpdateExpertStats,
  updateExpertStats,
);

module.exports = router;
