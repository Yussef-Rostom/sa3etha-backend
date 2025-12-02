const mongoose = require("mongoose");
const User = require("../models/User");
const SubService = require("../models/SubService");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = 3002; // Use a different port for testing
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
        const expertEmail = "testexpert_details_" + Date.now() + "@example.com";
        const expertPhone = "010" + Math.floor(Math.random() * 100000000);
        const expertPassword = "Password123!";

        const expert = await User.create({
            name: "Test Expert Details",
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

        // 5. Add subservice to profile with details
        console.log("Adding subservice with details...");
        const addRes = await fetch(`${BASE_URL}/experts/sub-services/${subServiceId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                averagePricePerHour: 150,
                yearsExperience: 5,
            }),
        });

        if (addRes.ok) {
            console.log("Add subservice success:", await addRes.json());
        } else {
            throw new Error(`Add subservice failed: ${addRes.status} ${await addRes.text()}`);
        }

        // Verify it's added with correct details
        const updatedExpert = await User.findById(expert._id);
        const addedService = updatedExpert.expertProfile.serviceTypes.find(
            (s) => s.subServiceId.toString() === subServiceId
        );

        if (addedService) {
            console.log("Verification: Subservice is in profile");
            if (addedService.averagePricePerHour === 150 && addedService.yearsExperience === 5) {
                console.log("Verification: Details match (Price: 150, Experience: 5)");
            } else {
                throw new Error(`Verification: Details mismatch. Got Price: ${addedService.averagePricePerHour}, Experience: ${addedService.yearsExperience}`);
            }
        } else {
            throw new Error("Verification: Subservice NOT in profile");
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
