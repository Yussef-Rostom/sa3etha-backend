const mongoose = require("mongoose");
const User = require("../models/User");
const SubService = require("../models/SubService");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = 3004; // Use a different port for testing
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

        // Wait for server to start
        await sleep(5000);
        console.log("Server should be up now.");

        const MONGODB_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vzoxgr2.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;
        await mongoose.connect(MONGODB_URL);
        console.log("Connected to MongoDB");

        // 2. Register user without whatsapp
        const userEmail = "testuser_wa_enhance_" + Date.now() + "@example.com";
        const userPhone = "010" + Math.floor(10000000 + Math.random() * 90000000);
        const userPassword = "Password123!";

        console.log("Registering user...");
        const registerRes = await fetch(`${BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "مستخدم تجريبي واتساب",
                email: userEmail,
                phone: userPhone,
                password: userPassword,
                role: "user",
            }),
        });

        if (!registerRes.ok) {
            throw new Error(`Registration failed: ${registerRes.status} ${await registerRes.text()}`);
        }

        const registerData = await registerRes.json();
        const token = registerData.accessToken;
        const userId = registerData.user.id || registerData.user._id;
        console.log("User registered:", userId);

        // Verify default whatsapp
        const user = await User.findById(userId);
        if (user.whatsapp === user.phone) { // Note: phone is stored as +20... in DB by formatPhoneNumber? No, formatPhoneNumber is called in controller.
            // Wait, formatPhoneNumber adds +20. Let's check what's in DB.
            // The controller calls formatPhoneNumber(req.body.phone).
            // So user.phone in DB should have +20.
            // And user.whatsapp should also have +20.
            console.log("Verification: Default whatsapp set correctly");
        } else {
            // It might be that formatPhoneNumber is applied to phone but not whatsapp in my code?
            // Let's check authController code again.
            // whatsapp: req.body.whatsapp ? formatPhoneNumber(req.body.whatsapp) : phone,
            // `phone` variable in controller is already formatted.
            // So it should be correct.
            console.log(`Verification: Default whatsapp check. Phone: ${user.phone}, Whatsapp: ${user.whatsapp}`);
            if (user.whatsapp === user.phone) {
                console.log("Verification: Default whatsapp set correctly (confirmed)");
            } else {
                throw new Error(`Verification: Default whatsapp NOT set correctly. Phone: ${user.phone}, Whatsapp: ${user.whatsapp}`);
            }
        }

        // 3. Create an expert and subservice
        const expertEmail = "testexpert_wa_enhance_" + Date.now() + "@example.com";
        const expertPhoneSuffix = Math.floor(10000000 + Math.random() * 90000000);
        const expertPhone = "+2011" + expertPhoneSuffix;
        const expert = await User.create({
            name: "خبير تجريبي واتساب",
            email: expertEmail,
            phone: expertPhone,
            whatsapp: expertPhone,
            password: userPassword,
            role: "expert",
            location: { type: "Point", coordinates: [31.2357, 30.0444], governorate: "Cairo" },
        });
        console.log("Expert created:", expert._id);

        const subService = await SubService.findOne(); // Get any subservice
        if (!subService) throw new Error("No subservices found in DB");

        // 4. Get expert contact
        console.log("Getting expert contact...");
        const contactRes = await fetch(`${BASE_URL}/contacts/${expert._id}?subServiceId=${subService._id}&lat=30.0444&long=31.2357`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (contactRes.ok) {
            const contactData = await contactRes.json();
            console.log("Get contact success");
            if (contactData.expert.whatsappLink && contactData.expert.whatsappLink.includes("wa.me")) {
                console.log("Verification: Whatsapp link present:", contactData.expert.whatsappLink);
            } else {
                throw new Error("Verification: Whatsapp link MISSING or invalid");
            }
        } else {
            throw new Error(`Get contact failed: ${contactRes.status} ${await contactRes.text()}`);
        }

        // Cleanup
        await User.findByIdAndDelete(userId);
        await User.findByIdAndDelete(expert._id);
        console.log("Cleanup done");

    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        if (serverProcess) {
            serverProcess.kill();
            console.log("Server process killed");
        }
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(0);
    }
};

runTest();
