const express = require("express");
const contactController = require("../controllers/contactController");
const { protect } = require("../middlewares/authMiddleware");
const { validateGetExpertContact, validateExpertResponse, validateCustomerResponse } = require("../middlewares/contactValidation");
const { validateReview } = require("../middlewares/reviewValidation");

const router = express.Router();

router.get("/:expertId", protect, validateGetExpertContact, contactController.getExpertContact);

// Follow-up response routes
router.post("/:id/expert-response", protect, validateExpertResponse, contactController.handleExpertResponse);
router.post("/:id/customer-response", protect, validateCustomerResponse, contactController.handleCustomerResponse);

// Review route
router.post("/:id/review", protect, validateReview, contactController.reviewExpert);

module.exports = router;
