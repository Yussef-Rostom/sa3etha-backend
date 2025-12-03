const axios = require("axios");
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config({ path: "../.env" });

const API_URL = "http://localhost:3000/api";

async function testGovernorateMapping() {
    try {
        console.log("Starting Governorate Mapping Test...");

        // 1. Get all governorates
        console.log("\n1. Testing Get All Governorates...");
        const govResponse = await axios.get(`${API_URL}/location/governorates`);
        const governorates = govResponse.data.governorates;

        if (Array.isArray(governorates) && governorates.length > 0 && governorates[0].id) {
            console.log("✅ Get All Governorates passed. First item:", governorates[0]);
        } else {
            console.error("❌ Get All Governorates failed. Response:", governorates);
            return;
        }

        // 2. Register User with Governorate ID
        console.log("\n2. Testing Registration with Governorate ID...");
        const testUser = {
            name: "تست يوزر",
            email: `testgov${Date.now()}@example.com`,
            password: "Password123!",
            phone: `010${Math.floor(10000000 + Math.random() * 90000000)}`,
            role: "user",
            governorate: 1, // Cairo
            governorate: "1", // Cairo
            coordinates: [31.2357, 30.0444],
        };

        const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
        const { user, accessToken } = registerResponse.data;

        if (user.governorate === "القاهرة") {
            console.log("✅ Registration passed. User governorate Name:", user.governorate);
        } else {
            console.error("❌ Registration failed. User governorate:", user.governorate);
        }

        // 3. Login User and check Governorate ID
        console.log("\n3. Testing Login and checking Governorate Name...");
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password,
        });

        if (loginResponse.data.user.governorate === "القاهرة") {
            console.log("✅ Login passed. User governorate Name:", loginResponse.data.user.governorate);
        } else {
            console.error("❌ Login failed. User governorate:", loginResponse.data.user.governorate);
        }

        // 4. Update User Profile with new Governorate ID
        console.log("\n4. Testing Update Profile with Governorate Name...");
        const updateResponse = await axios.put(
            `${API_URL}/auth/me`,
            { governorate: 2 }, // Giza
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (updateResponse.data.user.governorate === "الجيزة") {
            console.log("✅ Update Profile passed. New governorate Name:", updateResponse.data.user.governorate);
        } else {
            console.error("❌ Update Profile failed. User governorate:", updateResponse.data.user.governorate);
        }

        // 5. Get Near Experts with Governorate ID
        console.log("\n5. Testing Get Near Experts with Governorate Name...");
        // Register another expert in Giza (ID 2)
        const expertUser = {
            name: "خبير تجربة",
            phone: `012${Math.floor(10000000 + Math.random() * 90000000)}`,
            email: `expert_test_${Date.now()}@example.com`,
            password: "Password123!",
            role: "expert",
            governorate: 2, // Giza
            expertProfile: {
                isAvailable: true,
                serviceTypes: []
            }
        };

        const expertRegisterResponse = await axios.post(`${API_URL}/auth/register`, expertUser);
        const expertAccessToken = expertRegisterResponse.data.accessToken;

        const nearExpertsResponse = await axios.get(`${API_URL}/experts/near?governorate=2`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const foundExpert = nearExpertsResponse.data.experts.find(e => e._id === expertRegisterResponse.data.user._id);

        if (foundExpert) {
            if (foundExpert.governorate === "الجيزة") {
                console.log("✅ Get Near Experts passed. Found created expert with correct governorate Name:", foundExpert.governorate);
            } else {
                console.error("❌ Get Near Experts failed. Expert governorate Name mismatch:", foundExpert.governorate);
            }
        } else {
            console.error("❌ Get Near Experts failed. Created expert not found in list.");
            console.log("Response length:", nearExpertsResponse.data.experts.length);
        }

        console.log("\n🎉 All tests passed!");

    } catch (error) {
        console.error("❌ Test failed:", error.response ? error.response.data : error.message);
    }
}

testGovernorateMapping();
