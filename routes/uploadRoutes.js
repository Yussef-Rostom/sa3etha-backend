const express = require("express");
const { uploadImage } = require("../controllers/uploadController");
const {
  uploadProfileImage,
  uploadServiceImage,
} = require("../middlewares/uploadMiddleware");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/profile-image",
  protect,
  uploadProfileImage.single("image"),
  uploadImage,
);
router.post(
  "/service-image",
  protect,
  uploadServiceImage.single("image"),
  uploadImage,
);

module.exports = router;
