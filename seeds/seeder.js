const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const MONGODB_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vzoxgr2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

const getAllUsers = async () => {
  try {
    const users = await User.find();
    console.log(users);
    process.exit(0);
  } catch (error) {
    console.error("Error getting users:", error.message);
    process.exit(1);
  }
};

const removeAllUsers = async () => {
  try {
    await User.deleteMany();
    console.log("All users removed");
    process.exit(0);
  } catch (error) {
    console.error("Error removing users:", error.message);
    process.exit(1);
  }
};

const run = async () => {
  await connectToDatabase();

  // await getAllUsers();
  await removeAllUsers();
};

run();
