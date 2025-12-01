const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../configs/db");
const User = require("../models/User");
const ContactRequest = require("../models/ContactRequest");
const Notification = require("../models/Notification");
const SubService = require("../models/SubService");
const Service = require("../models/Service");
const checkContactFollowups = require("../tasks/checkContactFollowups");

const runTest = async () => {
    try {
        await connectDB();

        // 1. Create a dummy expert without FCM token
        const expert = await User.create({
            name: "Test Expert No FCM",
            email: `testexpert${Date.now()}@example.com`,
            phone: `+2010${Math.floor(Math.random() * 100000000)}`,
            password: "password123",
            role: "expert",
            // fcmToken is undefined
        });
        console.log("Created expert:", expert._id);

        // 2. Create a dummy customer
        const customer = await User.create({
            name: "Test Customer",
            email: `testcustomer${Date.now()}@example.com`,
            phone: `+2011${Math.floor(Math.random() * 100000000)}`,
            password: "password123",
            role: "user",
        });

        // 3. Get or create a SubService
        let subService = await SubService.findOne();
        if (!subService) {
            let service = await Service.findOne();
            if (!service) {
                service = await Service.create({ name: "Test Service Parent" });
            }
            subService = await SubService.create({
                name: "Test SubService " + Date.now(),
                service: service._id
            });
        }

        // 4. Create a ContactRequest
        // Needs to be > 1 second old (based on my hack in checkContactFollowups.js)
        const twoSecondsAgo = new Date(Date.now() - 2000);

        const contact = await ContactRequest.create({
            customer: customer._id,
            expert: expert._id,
            service: subService._id,
            status: "initiated",
            createdAt: twoSecondsAgo
        });
        console.log("Created contact:", contact._id);

        // 5. Run checkContactFollowups
        await checkContactFollowups();

        // 6. Check if Notification was created for expert
        const notification = await Notification.findOne({
            recipient: expert._id,
            "data.type": "expert_followup",
            "data.contactId": contact._id.toString()
        });

        if (notification) {
            console.log("SUCCESS: Notification created for expert without FCM token.");
            console.log(notification);
        } else {
            console.log("FAILURE: Notification NOT found for expert.");
        }

        // Cleanup
        await ContactRequest.deleteOne({ _id: contact._id });
        await User.deleteOne({ _id: expert._id });
        await User.deleteOne({ _id: customer._id });
        if (notification) await Notification.deleteOne({ _id: notification._id });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

runTest();
