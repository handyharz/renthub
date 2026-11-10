import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import axios from "axios";

async function testAnchorSandbox() {
    console.log("==================================================");
    console.log("       ANCHOR BAAS SANDBOX CONNECTIVITY TEST      ");
    console.log("==================================================");

    const baseUrl = process.env.ANCHOR_BASE_URL || "https://api.sandbox.getanchor.co/api/v1";
    const apiKey = process.env.ANCHOR_API_KEY;
    const fboId = process.env.ANCHOR_ESCROW_POOL_ID;
    const revenueId = process.env.ANCHOR_REVENUE_LEDGER_ID;

    console.log(`Base URL:      ${baseUrl}`);
    console.log(`API Key:       ${apiKey ? apiKey.slice(0, 10) + "..." : "MISSING"}`);
    console.log(`FBO Ledger:    ${fboId || "MISSING"}`);
    console.log(`Rev Ledger:    ${revenueId || "MISSING"}`);
    console.log("--------------------------------------------------\n");

    if (!apiKey) {
        console.error("❌ ANCHOR_API_KEY is missing from .env");
        process.exit(1);
    }

    const headers = {
        "x-anchor-key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    // 1. Test fetching accounts list
    try {
        console.log("📡 1. Querying /accounts...");
        const accountsRes = await axios.get(`${baseUrl}/accounts`, { headers });
        console.log("✅ Successfully connected to Anchor Sandbox!");
        console.log("Full Response:", JSON.stringify(accountsRes.data, null, 2));
    } catch (error: any) {
        console.error("⚠️ Failed to list /accounts:", error.response?.status, error.response?.data || error.message);
    }

    // 2. Test FBO account balance
    if (fboId) {
        try {
            console.log(`\n📡 2. Querying FBO Escrow Pool (${fboId}) balance...`);
            const fboRes = await axios.get(`${baseUrl}/accounts/balance/${fboId}`, { headers });
            console.log(`✅ FBO Account Balance:`, JSON.stringify(fboRes.data, null, 2));
        } catch (error: any) {
            console.error(`⚠️ Failed to fetch FBO balance:`, error.response?.status, error.response?.data || error.message);
        }
    }

    // 3. Test Revenue account balance
    if (revenueId) {
        try {
            console.log(`\n📡 3. Querying Revenue (${revenueId}) balance...`);
            const revRes = await axios.get(`${baseUrl}/accounts/balance/${revenueId}`, { headers });
            console.log(`✅ Revenue Account Balance:`, JSON.stringify(revRes.data, null, 2));
        } catch (error: any) {
            console.error(`⚠️ Failed to fetch Revenue balance:`, error.response?.status, error.response?.data || error.message);
        }
    }

    console.log("\n==================================================");
    console.log("             TEST EXECUTION COMPLETED             ");
    console.log("==================================================");
}

testAnchorSandbox().catch(console.error);
