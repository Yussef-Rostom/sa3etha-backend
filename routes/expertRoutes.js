const express = require("express");
const {
  getAvailableExperts,
  updateAvailability,
  updateExpertProfile,
  getNearExperts,
} = require("../controllers/expertController");
const { protect } = require("../middlewares/authMiddleware");
const { expert } = require("../middlewares/expertMiddleware");

const router = express.Router();

router.get("/", getAvailableExperts);
router.get("/near", getNearExperts);
router.put("/availability", protect, expert, updateAvailability);
router.put("/profile", protect, expert, updateExpertProfile);

module.exports = router;
