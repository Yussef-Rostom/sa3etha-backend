const Notification = require("../models/Notification");

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: req.user.id });

    return res.status(200).json({
      notifications,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getNotifications,
};
