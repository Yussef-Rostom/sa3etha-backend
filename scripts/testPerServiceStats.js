const mongoose = require("mongoose");
const User = require("../models/User");
const SubService = require("../models/SubService");
const Service = require("../models/Service");
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

        // Find a sub-service
        let subService = await SubService.findOne();
        if (!subService) {
            console.log("No sub-service found, creating one...");
            let service = await Service.findOne();
            if (!service) {
                service = await Service.create({
                    name: "Test Service",
                    description: "Test Desc",
                    image: "http://example.com/image.jpg"
                });
            }
            subService = await SubService.create({
                name: "Test SubService",
                service: service._id,
                image: "http://example.com/sub.jpg",
                price: 100
            });
        }
        console.log("Using SubService:", subService._id);

        // 2. Create a dummy expert
        const expertEmail = "testperservice_" + Date.now() + "@example.com";
        const expertPhone = "010" + Math.floor(Math.random() * 100000000);
        const expertPassword = "Password123!";

        const expert = await User.create({
            name: "Test Expert Per Service",
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

        // 4. Add Sub-Service
        console.log("Adding sub-service...");
        const addServiceRes = await fetch(`${BASE_URL}/experts/sub-services/${subService._id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!addServiceRes.ok) {
            throw new Error(`Add sub-service failed: ${addServiceRes.status} ${await addServiceRes.text()}`);
        }
        console.log("Sub-service added");

        // 5. Update stats for that sub-service
        console.log("Updating stats for sub-service...");
        const updateRes = await fetch(`${BASE_URL}/experts/stats`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                subServiceId: subService._id,
                averagePricePerHour: 250,
                yearsExperience: 7,
            }),
        });

        if (updateRes.ok) {
            console.log("Update stats success:", await updateRes.json());
        } else {
            throw new Error(`Update stats failed: ${updateRes.status} ${await updateRes.text()}`);
        }

        // Verify updates
        const updatedExpert = await User.findById(expert._id);
        const serviceStats = updatedExpert.expertProfile.serviceTypes.find(s => s.subServiceId.toString() === subService._id.toString());

        if (serviceStats && serviceStats.averagePricePerHour === 250 && serviceStats.yearsExperience === 7) {
            console.log("Verification: Stats updated correctly for sub-service");
        } else {
            throw new Error(`Verification: Stats NOT updated correctly. Found: ${JSON.stringify(serviceStats)}`);
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
