const expert = (req, res, next) => {
  if (req.user && req.user.role === "expert") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an expert" });
  }
};

module.exports = { expert };
