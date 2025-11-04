const express = require("express");

const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateUser,
  requestEmailUpdate,
  updateEmail,
  updateFcmToken,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  validateRegistration,
  validateLogin,
} = require("../middlewares/validation");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", validateRegistration, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);
router.put("/me", protect, updateUser);
router.put("/fcm-token", protect, updateFcmToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
