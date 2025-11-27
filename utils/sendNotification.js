const admin = require("../configs/firebase");
const Notification = require("../models/Notification");

async function sendNotification(
  userFcmToken,
  title = "New Notification",
  body = "You have a new message.",
  imageUrl = "https://placehold.jp/ffffff/000000/150x150.png?text=placeholder&css=%7B%22padding%22%3A%22%2010px%22%2C%22border-radius%22%3A%22%2015px%22%2C%22%2F*%20Fallback%20for%20very%20old%20browsers%20*%2Fbackground-color%22%3A%22%20%23666666%22%2C%22%2F*%20Modern%2C%20standard%20syntax%20*%2Fbackground%22%3A%22%20linear-gradient(to%20bottom%2C%20%23666666%2C%20%23cccccc)%22%7D",
  data = {},
  userId = null // Add userId parameter
) {
  if (!userFcmToken && !userId) {
    return console.log("Error: Both FCM Token and User ID are missing");
  }

  const message = {
    notification: {
      title,
      body,
      imageUrl,
    },
    data: {
      ...data,
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      screen: "notifications", // Common pattern for routing
      type: data.type || "general_notification", // Ensure type exists
    },
    token: userFcmToken,
  };

  try {
    if (userFcmToken) {
      const response = await admin.messaging().send(message);
      console.log("Successfully sent message:", response);
    } else {
      console.log("Skipping FCM send: No token provided");
    }
  } catch (error) {
    console.log("Error sending message:", error);
  }

  // Save to database if userId is provided (regardless of FCM success)
  if (userId) {
    try {
      await Notification.create({
        recipient: userId,
        title,
        body,
        imageUrl,
        data: message.data,
      });
      console.log(`Saved notification for user ${userId}`);
    } catch (dbError) {
      console.error("Error saving notification to DB:", dbError);
    }
  }
}

module.exports = { sendNotification };
