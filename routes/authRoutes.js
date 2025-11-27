const express = require("express");

const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateUser,
  updateFcmToken,
  forgotPassword,
  resetPassword,
  disableSuggestions,
} = require("../controllers/authController");
const {
  validateRegistration,
  validateLogin,
  validateUpdateUser,
  validateResetPassword,
  validateForgotPassword,
  validateUpdateFcmToken,
  validateRefreshToken,
} = require("../middlewares/authValidation");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", validateRegistration, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/refresh-token", validateRefreshToken, refreshToken);
router.post("/logout", validateRefreshToken, logoutUser);
router.get("/me", protect, getMe);
router.put("/me", protect, validateUpdateUser, updateUser);
router.put("/fcm-token", protect, validateUpdateFcmToken, updateFcmToken);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/disable-suggestions", protect, disableSuggestions);

module.exports = router;
