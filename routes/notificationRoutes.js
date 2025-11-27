const express = require("express");
const notificationController = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, notificationController.getNotifications);

module.exports = router;
