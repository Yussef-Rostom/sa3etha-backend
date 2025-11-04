const express = require("express");
const {
  getExpertContact,
} = require("../controllers/contactController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:expertId", protect, getExpertContact);

module.exports = router;
