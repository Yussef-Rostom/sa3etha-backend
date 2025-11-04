const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { getGovernorate } = require("../utils/locationHelper");
const { sendEmail } = require("../utils/emailService");

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

const prepareUser = (user) => {
  if (!user) {
    return null;
  }
  const userObject = user.toObject({ getters: true, virtuals: false });
  delete userObject.password;
  delete userObject.__v;
  if (userObject.role !== "expert") {
    delete userObject.expertProfile;
  }
  return userObject;
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, phone, email, password, role, location } = req.body;
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ message: "Phone number already in use" });
    }
    user = new User({ name, phone, email, password, role, location });
    await user.save();

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: prepareUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password, role, location } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (role === "expert" && user.role !== "expert") {
      user.role = "expert";
      await user.save();
    }

    if (location && location.coordinates && location.coordinates.length === 2) {
      user.location.coordinates = location.coordinates;
      await user.save();
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.status(200).json({
      message: "User logged in successfully",
      accessToken,
      refreshToken,
      user: prepareUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Logout user
const logoutUser = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.sendStatus(204); // No content
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (user) {
      user.refreshToken = null;
      await user.save();
    }
  } catch (error) {
    // Ignore errors
  }

  res.sendStatus(204);
};

// Get current user
const getMe = async (req, res) => {
  const user = prepareUser(req.user);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({ user });
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, phone, fcmToken, location, imageUrl } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ message: "Phone number already in use" });
      }
      user.phone = phone;
    }
    user.fcmToken = fcmToken || user.fcmToken;
    user.imageUrl = imageUrl || user.imageUrl;
    if (location && location.coordinates) {
      const [lon, lat] = location.coordinates;
      const governorate = getGovernorate(lon, lat);
      user.location.coordinates = location.coordinates;
      if (governorate) {
        user.location.governorate = governorate;
      }
    }

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: prepareUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Update FCM token
const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fcmToken = fcmToken;
    await user.save();

    res.status(200).json({
      message: "FCM token updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    await sendEmail(
      user.email,
      "Password Reset OTP",
      `Your OTP for password reset is: ${otp}`
    );

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = password;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error: " + error.message, error });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateUser,
  updateFcmToken,
  forgotPassword,
  resetPassword,
};
