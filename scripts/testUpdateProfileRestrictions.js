const API_URL = "http://localhost:3000/api/auth";

const testUpdateProfileRestrictions = async () => {
    try {
        // 1. Register a new user
        const uniqueId = Date.now();
        const userData = {
            name: "مستخدم تجريبي",
            email: `test${uniqueId}@example.com`,
            password: "Password123!",
            phone: `010${String(uniqueId).slice(-8)}`,
            role: "user",
        };

        console.log("Registering user...", userData);
        const registerResponse = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (!registerResponse.ok) {
            const errorText = await registerResponse.text();
            throw new Error(`Registration failed: ${registerResponse.status} ${errorText}`);
        }

        const registerData = await registerResponse.json();
        const { user } = registerData;
        const accessToken = registerData.accessToken;

        console.log("User registered:", user);

        // 2. Attempt to update phone and email
        const newPhone = `011${String(uniqueId).slice(-8)}`;
        const newEmail = `updated${uniqueId}@example.com`;
        const newName = "اسم محدث";

        console.log("Attempting to update profile with:", {
            phone: newPhone,
            email: newEmail,
            name: newName,
        });

        const updateResponse = await fetch(`${API_URL}/me`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                phone: newPhone,
                email: newEmail,
                name: newName,
            }),
        });

        if (!updateResponse.ok) {
            console.log("Update request failed (expected if validation blocked it, or unexpected error):", updateResponse.status);
            // If it's a 400 validation error about phone/email not being allowed (if we had strict validation), that's fine.
            // But we just removed the validation, so it should succeed but ignore the fields.
        } else {
            console.log("Update request completed successfully.");
        }

        // 3. Fetch user profile to verify changes
        console.log("Fetching user profile...");
        const meResponse = await fetch(`${API_URL}/me`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });

        if (!meResponse.ok) {
            throw new Error(`Get Me failed: ${meResponse.status}`);
        }

        const meData = await meResponse.json();
        const updatedUser = meData.user;
        console.log("Updated user:", updatedUser);

        // 4. Verify results
        let success = true;

        if (updatedUser.phone !== user.phone) {
            console.error("❌ FAILURE: Phone number was updated!");
            success = false;
        } else {
            console.log("✅ SUCCESS: Phone number was NOT updated.");
        }

        if (updatedUser.email !== user.email) {
            console.error("❌ FAILURE: Email was updated!");
            success = false;
        } else {
            console.log("✅ SUCCESS: Email was NOT updated.");
        }

        if (updatedUser.name !== newName) {
            console.error("❌ FAILURE: Name was NOT updated!");
            success = false;
        } else {
            console.log("✅ SUCCESS: Name was updated.");
        }

        if (success) {
            console.log("\n🎉 All tests passed!");
        } else {
            console.error("\n💥 Some tests failed.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Test failed with error:", error);
        process.exit(1);
    }
};

testUpdateProfileRestrictions();
