const admin = require("../configs/firebase");

async function sendNotification(
  userFcmToken,
  title = "New Notification",
  body = "You have a new message.",
  imageUrl = "https://placehold.jp/ffffff/000000/150x150.png?text=placeholder&css=%7B%22padding%22%3A%22%2010px%22%2C%22border-radius%22%3A%22%2015px%22%2C%22%2F*%20Fallback%20for%20very%20old%20browsers%20*%2Fbackground-color%22%3A%22%20%23666666%22%2C%22%2F*%20Modern%2C%20standard%20syntax%20*%2Fbackground%22%3A%22%20linear-gradient(to%20bottom%2C%20%23666666%2C%20%23cccccc)%22%7D",
  data = {}
) {
  if (!userFcmToken) {
    return console.log("Error: Invalid FCM Token");
  }

  const message = {
    notification: {
      title,
      body,
      imageUrl,
    },
    data,
    token: userFcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.log("Error sending message:", error);
  }
}

module.exports = { sendNotification };
