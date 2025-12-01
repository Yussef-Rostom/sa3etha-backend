const mongoose = require("mongoose");
const User = require("../models/User");
const ContactRequest = require("../models/ContactRequest");
const Notification = require("../models/Notification");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = 3003;
const BASE_URL = `http://localhost:${PORT}/api`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTest = async () => {
    let serverProcess;
    try {
        // 1. Start Server
        console.log("Starting server...");
        serverProcess = spawn("node", ["server.js"], {
            cwd: path.join(__dirname, ".."),
            env: { ...process.env, PORT: PORT },
        });

        serverProcess.stdout.on("data", (data) => {
            // console.log(`Server stdout: ${data}`);
        });

        serverProcess.stderr.on("data", (data) => {
            console.error(`Server stderr: ${data}`);
        });

        await sleep(5000);
        console.log("Server should be up now.");

        const MONGODB_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vzoxgr2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB");

        // 2. Create Expert and Customer
        const expertEmail = "testexpertnotif_" + Date.now() + "@example.com";
        const customerEmail = "testcustomernotif_" + Date.now() + "@example.com";
        const password = "Password123!";

        // Helper to generate valid Egyptian phone
        const generatePhone = (prefix) => {
            const randomPart = Math.floor(10000000 + Math.random() * 90000000); // 8 digits
            return `${prefix}${randomPart}`;
        };

        const expert = await User.create({
            name: "Expert Name Test",
            email: expertEmail,
            phone: generatePhone("010"),
            password: password,
            role: "expert",
            fcmToken: "expert_fcm_token_" + Date.now(),
            location: { type: "Point", coordinates: [31.2357, 30.0444], governorate: "Cairo" },
            expertProfile: { serviceTypes: [], description: "Test", averagePricePerHour: 100, yearsExperience: 5 },
        });

        const customer = await User.create({
            name: "Customer Name Test",
            email: customerEmail,
            phone: generatePhone("011"),
            password: password,
            role: "user",
            fcmToken: "customer_fcm_token_" + Date.now(),
            location: { type: "Point", coordinates: [31.2357, 30.0444], governorate: "Cairo" },
        });

        console.log("Users created");

        // 3. Login
        const login = async (email) => {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            return data.accessToken;
        };

        const expertToken = await login(expertEmail);
        const customerToken = await login(customerEmail);

        // 4. Create Contact Request
        const contact = await ContactRequest.create({
            customer: customer._id,
            expert: expert._id,
            service: new mongoose.Types.ObjectId(), // Mock ID
            location: { type: "Point", coordinates: [31.2357, 30.0444] },
            status: "initiated",
        });
        console.log("Contact created:", contact._id);

        // 5. Create Notification for Expert (Mock Follow-up)
        const expertNotif = await Notification.create({
            recipient: expert._id,
            title: "متابعة الطلب",
            body: "هل تم الاتفاق؟",
            data: { type: "expert_followup", contactId: contact._id.toString(), action: "confirm_deal" },
        });
        console.log("Expert notification created:", expertNotif._id);

        // 6. Expert Responds (Deal)
        console.log("Expert responding...");
        const expertRes = await fetch(`${BASE_URL}/contacts/${contact._id}/expert-response`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${expertToken}` },
            body: JSON.stringify({ hasDeal: true }),
        });

        if (!expertRes.ok) throw new Error(`Expert response failed: ${await expertRes.text()}`);
        console.log("Expert responded");

        // 7. Verify Expert Notification Deleted
        const expertNotifCheck = await Notification.findById(expertNotif._id);
        if (expertNotifCheck) {
            console.error("FAIL: Expert notification was NOT deleted");
        } else {
            console.log("PASS: Expert notification deleted");
        }

        // 8. Verify Customer Notification Created with Expert Name
        // We need to wait a bit for async notification sending if it's async, but here it's awaited in controller
        const customerNotifs = await Notification.find({ recipient: customer._id }).sort({ createdAt: -1 });
        const lastNotif = customerNotifs[0];
        if (lastNotif && lastNotif.body.includes(expert.name)) {
            console.log("PASS: Customer notification contains expert name:", lastNotif.body);
        } else {
            console.error("FAIL: Customer notification does NOT contain expert name. Body:", lastNotif ? lastNotif.body : "No notification");
        }

        // 9. Create Notification for Customer (Mock Follow-up)
        // Note: The previous step actually created a notification, we can use that if it has the right type/data
        // But let's create a specific one to be sure we are testing deletion logic
        const customerNotif = await Notification.create({
            recipient: customer._id,
            title: "متابعة",
            body: "test",
            data: { type: "customer_followup", contactId: contact._id.toString(), action: "provide_date" },
        });
        console.log("Customer notification created:", customerNotif._id);

        // 10. Customer Responds
        console.log("Customer responding...");
        const customerRes = await fetch(`${BASE_URL}/contacts/${contact._id}/customer-response`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${customerToken}` },
            body: JSON.stringify({ dealDate: new Date().toISOString() }),
        });

        if (!customerRes.ok) throw new Error(`Customer response failed: ${await customerRes.text()}`);
        console.log("Customer responded");

        // 11. Verify Customer Notification Deleted
        const customerNotifCheck = await Notification.findById(customerNotif._id);
        if (customerNotifCheck) {
            console.error("FAIL: Customer notification was NOT deleted");
        } else {
            console.log("PASS: Customer notification deleted");
        }

        // Cleanup
        await User.deleteMany({ _id: { $in: [expert._id, customer._id] } });
        await ContactRequest.deleteMany({ _id: contact._id });
        await Notification.deleteMany({ recipient: { $in: [expert._id, customer._id] } });

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        if (serverProcess) serverProcess.kill();
        await mongoose.disconnect();
        process.exit(0);
    }
};

runTest();
