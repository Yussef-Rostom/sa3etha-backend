const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../configs/db");
const { sendNotification } = require("../utils/sendNotification");
const User = require("../models/User");

const testNotification = async () => {
  try {
    await connectDB();

    // Find a user to send notification to
    // You might want to change this to a specific user ID or email for your testing
    // const user = await User.findOne();

    // if (!user) {
    //   console.log("No users found to test notification.");
    //   process.exit(1);
    // }

    // console.log(`Sending notification to user: ${user.email} (${user._id})`);

    // Only attempt to send FCM if the user has a token, but always try to save to DB
    // const fcmToken = user.fcmToken; 
    
    // await sendNotification(
    //   fcmToken,
    //   "Test Notification",
    //   "This is a test notification from the script.",
    //   undefined, // use default image
    //   { type: "test_type", customData: "123" },
    //   user._id
    // );


    const token = "enuJS1YhvFGylNJS-uPNnU:APA91bHxK1K7N5DeYsiYqDXnq4-tBoFMorXPyxOkdHL5f-lR_w2ScI9YGOojUWcUc4cU9Q0rKgYvnoj-d_SKdE8MZp01dOaGg4vMDJzK2fzVZrw4eTfkkVQ";
    await sendNotification(token);

    console.log("Notification test completed.");  
  } catch (error) {
    console.error("Error running test:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testNotification();
