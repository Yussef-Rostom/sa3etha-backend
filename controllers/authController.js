const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { getGovernorate } = require("../utils/locationHelper");
const {
  getGovernorateNameById,
  getGovernorateIdByName,
} = require("../constants/governorates");
const { sendEmail } = require("../utils/emailService");

const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return `+20${digits}`;
};

const generateTokens = async (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || "7d" }
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
  delete userObject.refreshToken;
  if (userObject.role !== "expert") {
    delete userObject.expertProfile;
  }
  if (userObject.governorate) {
    // userObject.governorate is already the Name stored in DB
  }
  return userObject;
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, coordinates, governorate } = req.body;
    const phone = formatPhoneNumber(req.body.phone);

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }
      if (existingUser.phone === phone) {
        return res
          .status(400)
          .json({ message: "User with this phone number already exists" });
      }
    }

    const user = new User({
      name,
      email,
      password,
      phone,
      whatsapp: req.body.whatsapp
        ? formatPhoneNumber(req.body.whatsapp)
        : phone,
      role,
    });

    if (coordinates || governorate) {
      let calculatedGovernorate;
      if (coordinates) {
        const [lon, lat] = coordinates;
        calculatedGovernorate = getGovernorate(lon, lat);
      }

      user.governorate =
        getGovernorateNameById(governorate) ||
        calculatedGovernorate ||
        undefined;

      if (coordinates) {
        user.location = {
          type: "Point",
          coordinates: coordinates,
        };
      }
    }

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
    const { email, password, role, coordinates, governorate } = req.body;
    const phone = req.body.phone
      ? formatPhoneNumber(String(req.body.phone))
      : null;

    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });

    if (query.length === 0) {
      return res.status(400).json({ message: "Email or Phone is required" });
    }

    const user = await User.findOne({
      $or: query,
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (role && user.role !== role && role === "expert") {
      user.role = role;
    }

    if (coordinates || governorate) {
      let calculatedGovernorate;
      if (coordinates) {
        const [lon, lat] = coordinates;
        calculatedGovernorate = getGovernorate(lon, lat);
      }

      user.governorate =
        getGovernorateNameById(governorate) ||
        calculatedGovernorate ||
        undefined;

      if (coordinates) {
        user.location = {
          type: "Point",
          coordinates: coordinates,
        };
      }
    }

    await user.save();

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
// Refresh token
const refreshToken = async (req, res) => {
  const { refreshToken: incomingRefreshToken } = req.body;
  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== incomingRefreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      user
    );

    res.json({ accessToken, refreshToken: newRefreshToken });
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
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (user && user.refreshToken === refreshToken) {
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
    const { name, location, imageUrl } = req.body;
    const whatsapp = req.body.whatsapp
      ? formatPhoneNumber(req.body.whatsapp)
      : undefined;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name || user.name;
    user.imageUrl = imageUrl || user.imageUrl;
    if (whatsapp) user.whatsapp = whatsapp;

    if (req.body.coordinates || req.body.governorate) {
      let calculatedGovernorate;
      if (req.body.coordinates) {
        const [lon, lat] = req.body.coordinates;
        calculatedGovernorate = getGovernorate(lon, lat);
      }

      const newCoordinates = req.body.coordinates || user.location?.coordinates;
      const newGovernorate =
        getGovernorateNameById(req.body.governorate) ||
        calculatedGovernorate ||
        user.governorate;

      user.governorate = newGovernorate;

      if (newCoordinates && newCoordinates.length === 2) {
        user.location = {
          type: "Point",
          coordinates: newCoordinates,
        };
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
    const user = await User.findOne({ email }).select("+otp +otpExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp != otp || user.otpExpires < Date.now()) {
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

// Disable expert suggestions
const disableSuggestions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.lastSearch = null;
    await user.save();

    res.status(200).json({
      message: "Expert suggestions disabled successfully",
    });
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
  disableSuggestions,
};
