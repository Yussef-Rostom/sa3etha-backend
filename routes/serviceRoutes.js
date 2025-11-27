const express = require("express");
const {
  getAllServices,
  addService,
  getSubServices,
  getSubServicesByServiceId,
} = require("../controllers/serviceController");
const { protect } = require("../middlewares/authMiddleware");
const { admin } = require("../middlewares/adminMiddleware");
const { validateAddService } = require("../middlewares/validation");

const router = express.Router();

router.get("/", getAllServices);
router.post("/", protect, admin, validateAddService, addService);
router.get("/sub-services", getSubServices);
router.get("/sub-services/:serviceId", getSubServicesByServiceId);

module.exports = router;
