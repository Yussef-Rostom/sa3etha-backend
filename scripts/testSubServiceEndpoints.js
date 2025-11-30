const mongoose = require("mongoose");
const User = require("../models/User");
const SubService = require("../models/SubService");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = 3001; // Use a different port for testing
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

        // 2. Create a dummy expert
        const expertEmail = "testexpert_" + Date.now() + "@example.com";
        const expertPhone = "010" + Math.floor(Math.random() * 100000000);
        const expertPassword = "Password123!";

        const expert = await User.create({
            name: "Test Expert",
            email: expertEmail,
            phone: expertPhone,
            password: expertPassword,
            role: "expert",
            location: {
                type: "Point",
                coordinates: [31.2357, 30.0444],
                governorate: "Cairo",
            },
            expertProfile: {
                serviceTypes: [],
                description: "Test Description",
                averagePricePerHour: 100,
            },
        });
        console.log("Expert created:", expert._id);

        // 3. Login to get token
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: expertEmail,
                password: expertPassword,
            }),
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        console.log("Logged in, token received");

        // 4. Get a subservice ID
        const subService = await SubService.findOne();
        if (!subService) {
            throw new Error("No subservices found in DB");
        }
        const subServiceId = subService._id.toString();
        console.log("Using subservice:", subServiceId);

        // 5. Add subservice to profile
        console.log("Adding subservice...");
        const addRes = await fetch(`${BASE_URL}/experts/sub-services/${subServiceId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (addRes.ok) {
            console.log("Add subservice success:", await addRes.json());
        } else {
            throw new Error(`Add subservice failed: ${addRes.status} ${await addRes.text()}`);
        }

        // Verify it's added
        const updatedExpertAfterAdd = await User.findById(expert._id);
        if (updatedExpertAfterAdd.expertProfile.serviceTypes.includes(subServiceId)) {
            console.log("Verification: Subservice is in profile");
        } else {
            throw new Error("Verification: Subservice NOT in profile");
        }

        // 6. Remove subservice from profile
        console.log("Removing subservice...");
        const removeRes = await fetch(`${BASE_URL}/experts/sub-services/${subServiceId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (removeRes.ok) {
            console.log("Remove subservice success:", await removeRes.json());
        } else {
            throw new Error(`Remove subservice failed: ${removeRes.status} ${await removeRes.text()}`);
        }

        // Verify it's removed
        const updatedExpertAfterRemove = await User.findById(expert._id);
        if (!updatedExpertAfterRemove.expertProfile.serviceTypes.includes(subServiceId)) {
            console.log("Verification: Subservice is NOT in profile");
        } else {
            throw new Error("Verification: Subservice STILL in profile");
        }

        // Cleanup
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
