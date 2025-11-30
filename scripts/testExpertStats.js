const mongoose = require("mongoose");
const User = require("../models/User");
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
        const expertEmail = "testexpertstats_" + Date.now() + "@example.com";
        const expertPhone = "010" + Math.floor(Math.random() * 100000000);
        const expertPassword = "Password123!";

        const expert = await User.create({
            name: "Test Expert Stats",
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
                yearsExperience: 5,
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

        // 4. Update stats
        console.log("Updating stats...");
        const updateRes = await fetch(`${BASE_URL}/experts/stats`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                averagePricePerHour: 200,
                yearsExperience: 10,
            }),
        });

        if (updateRes.ok) {
            console.log("Update stats success:", await updateRes.json());
        } else {
            throw new Error(`Update stats failed: ${updateRes.status} ${await updateRes.text()}`);
        }

        // Verify updates
        const updatedExpert = await User.findById(expert._id);
        if (updatedExpert.expertProfile.averagePricePerHour === 200 && updatedExpert.expertProfile.yearsExperience === 10) {
            console.log("Verification: Stats updated correctly");
        } else {
            throw new Error(`Verification: Stats NOT updated correctly. Price: ${updatedExpert.expertProfile.averagePricePerHour}, Experience: ${updatedExpert.expertProfile.yearsExperience}`);
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
