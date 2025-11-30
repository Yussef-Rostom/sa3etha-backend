async function testLocationRoutes() {
    const baseUrl = "http://localhost:3000/api/location";

    try {
        console.log("Testing GET /governorates...");
        const response = await fetch(`${baseUrl}/governorates`);

        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.governorates)) {
                console.log("✅ GET /governorates passed");
                console.log(`Found ${data.governorates.length} governorates`);
            } else {
                console.error("❌ GET /governorates failed: Response is not an array");
                console.log(data);
            }
        } else {
            console.error("❌ GET /governorates failed");
            console.error("Status:", response.status);
            const text = await response.text();
            console.error("Response:", text);
        }
    } catch (error) {
        console.error("❌ GET /governorates failed with error:", error.message);
    }
}

testLocationRoutes();
