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

    // 3. Test creating a dynamic Virtual NUBAN linked to the FBO Escrow Pool
    if (fboId) {
        try {
            console.log(`\n📡 3. Creating Virtual NUBAN linked to FBO Escrow Pool (${fboId})...`);
            const testRef = `rh_test_${Date.now()}`;
            const virtualNubanPayload = {
                data: {
                    type: "VirtualNuban",
                    attributes: {
                        virtualAccountDetail: {
                            name: "RentHub Escrow Test",
                            bvn: "22222222226",
                            reference: testRef,
                            email: "harun@nexgentech.dev",
                            description: "RentHub Escrow Sandbox Test Account",
                            permanent: false,
                        },
                    },
                    relationships: {
                        settlementAccount: {
                            data: {
                                type: "DepositAccount",
                                id: fboId,
                            },
                        },
                    },
                },
            };

            const vRes = await axios.post(`${baseUrl}/virtual-nubans`, virtualNubanPayload, { headers });
            console.log("🎉 Virtual NUBAN Created Successfully!");
            console.log("Full Virtual NUBAN Response:\n", JSON.stringify(vRes.data, null, 2));

            const vData = vRes.data?.data;
            const nuban = vData?.attributes?.accountNumber || vData?.attributes?.virtualAccountDetail?.accountNumber || vData?.id;
            const bank = vData?.attributes?.bankName || "Providus Bank / Anchor";
            const accountName = vData?.attributes?.accountName || vData?.attributes?.virtualAccountDetail?.name;
            console.log("\n--------------------------------------------------");
            console.log(`🏦 BANK NAME:      ${bank}`);
            console.log(`💳 ACCOUNT NUMBER: ${nuban}`);
            console.log(`👤 ACCOUNT NAME:   ${accountName}`);
            console.log(`🔗 REFERENCE:      ${testRef}`);
            console.log("--------------------------------------------------");
        } catch (error: any) {
            console.error("⚠️ Failed to create Virtual NUBAN:", error.response?.status, JSON.stringify(error.response?.data || error.message, null, 2));
        }
    }

    console.log("\n==================================================");
    console.log("             TEST EXECUTION COMPLETED             ");
    console.log("==================================================");
}

testAnchorSandbox().catch(console.error);
