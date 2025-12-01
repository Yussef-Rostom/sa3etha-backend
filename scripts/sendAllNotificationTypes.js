const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../configs/db");
const { sendNotification } = require("../utils/sendNotification");
const User = require("../models/User");

const sendAllNotifications = async () => {
    try {
        await connectDB();

        const email = "test@test.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        console.log(`Found user: ${user.email} (${user._id})`);
        console.log(`FCM Token: ${user.fcmToken ? "Present" : "Missing"}`);

        if (!user.fcmToken) {
            console.log("Warning: User has no FCM token. Notifications will only be saved to DB.");
        }

        const fcmToken = user.fcmToken;
        const userId = user._id;

        // 1. General Notification
        console.log("Sending General Notification...");
        await sendNotification(
            fcmToken,
            "New Notification",
            "You have a new message.",
            undefined,
            { type: "general_notification" },
            userId
        );

        // 2. Expert Suggestions
        console.log("Sending Expert Suggestions Notification...");
        await sendNotification(
            fcmToken,
            "خبراء متاحين في منطقتك! 🔧",
            "وجدنا لك 5 خبراء متخصصين في سباكة. اضغط لمشاهدة التفاصيل.",
            undefined,
            {
                type: "expert_suggestions",
                serviceId: new mongoose.Types.ObjectId().toString(),
                subServiceId: new mongoose.Types.ObjectId().toString(),
                expertIds: JSON.stringify([new mongoose.Types.ObjectId().toString()]),
            },
            userId
        );

        // 3. Expert Follow-up
        console.log("Sending Expert Follow-up Notification...");
        await sendNotification(
            fcmToken,
            "متابعة الطلب 📋",
            "هل تم الاتفاق مع العميل؟",
            undefined,
            {
                type: "expert_followup",
                contactId: new mongoose.Types.ObjectId().toString(),
                action: "confirm_deal",
            },
            userId
        );

        // 4. Customer Follow-up (Deal Confirmed)
        console.log("Sending Customer Follow-up (Deal Confirmed) Notification...");
        await sendNotification(
            fcmToken,
            "تأكيد الاتفاق ✅",
            "أكد الخبير أحمد محمد الاتفاق. متى موعد التنفيذ؟",
            undefined,
            {
                type: "customer_followup",
                contactId: new mongoose.Types.ObjectId().toString(),
                action: "provide_date",
            },
            userId
        );

        // 5. Customer Follow-up (No Deal)
        console.log("Sending Customer Follow-up (No Deal) Notification...");
        await sendNotification(
            fcmToken,
            "متابعة الطلب ❓",
            "أفاد الخبير أحمد محمد بعدم الاتفاق. هل هذا صحيح؟",
            undefined,
            {
                type: "customer_followup",
                contactId: new mongoose.Types.ObjectId().toString(),
                action: "confirm_no_deal",
            },
            userId
        );

        console.log("All notifications sent successfully.");

    } catch (error) {
        console.error("Error sending notifications:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

sendAllNotifications();
