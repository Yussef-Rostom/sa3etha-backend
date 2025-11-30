const mongoose = require("mongoose");
const User = require("../models/User");
const { spawn } = require("child_process");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const PORT = 3003; // Use a different port for testing
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

        // 2. Create a dummy user
        const userEmail = "testuser_whatsapp_" + Date.now() + "@example.com";
        const userPhone = "010" + Math.floor(Math.random() * 100000000);
        const userPassword = "Password123!";

        const user = await User.create({
            name: "Test User Whatsapp",
            email: userEmail,
            phone: userPhone,
            password: userPassword,
            role: "user",
        });
        console.log("User created:", user._id);

        // 3. Login to get token
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: userEmail,
                password: userPassword,
            }),
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.accessToken;
        console.log("Logged in, token received");

        // 4. Update whatsapp
        console.log("Updating whatsapp...");
        const whatsappNumber = "01234567890";
        const updateRes = await fetch(`${BASE_URL}/auth/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                whatsapp: whatsappNumber,
            }),
        });

        if (updateRes.ok) {
            console.log("Update whatsapp success:", await updateRes.json());
        } else {
            throw new Error(`Update whatsapp failed: ${updateRes.status} ${await updateRes.text()}`);
        }

        // Verify updates
        const updatedUser = await User.findById(user._id);
        if (updatedUser.whatsapp === "+201234567890") {
            console.log("Verification: Whatsapp updated correctly");
        } else {
            throw new Error(`Verification: Whatsapp NOT updated correctly. Got: ${updatedUser.whatsapp}`);
        }

        // 5. Try invalid whatsapp
        console.log("Testing invalid whatsapp...");
        const invalidUpdateRes = await fetch(`${BASE_URL}/auth/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                whatsapp: "invalid",
            }),
        });

        if (invalidUpdateRes.status === 400) {
            console.log("Invalid whatsapp rejected correctly");
        } else {
            throw new Error(`Invalid whatsapp NOT rejected. Status: ${invalidUpdateRes.status}`);
        }

        // Cleanup
        await User.findByIdAndDelete(user._id);
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
