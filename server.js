require("dotenv").config();
const cors = require("cors");
const express = require("express");
const connectDB = require("./configs/db");
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const expertRoutes = require("./routes/expertRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const contactRoutes = require("./routes/contactRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const initScheduledJobs = require("./services/scheduledTasks");
// const bookingRoutes = require('./routes/bookingRoutes');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/experts", expertRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/notifications", notificationRoutes);
// app.use("/api/bookings", bookingRoutes);

app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  initScheduledJobs();
});
