import axios from "axios";
import { PrismaClient, PropertyStatus } from "@prisma/client";

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";
    const prisma = new PrismaClient();

    console.log("Fetching live 'debugWhere' from API...");
    const url = `http://localhost:5001/api/properties?landlordId=${landlordId}`;
    try {
        const res = await axios.get(url);
        const where = res.data.data.debugWhere;
        const apiTotal = res.data.data.total;
        console.log("SERVER WHERE:", JSON.stringify(where, null, 2));
        console.log("SERVER TOTAL:", apiTotal);

        console.log("\nSimulating EXACT query in script...");
        const simResult = await prisma.property.findMany({ where });
        console.log("SIMULATED RESULT COUNT:", simResult.length);

        if (simResult.length === 20 && apiTotal === 20) {
            console.log("\nLogic confirmed: The exclusion is inside this WHERE object.");

            // Find which of the 21 is missing
            const allForLandlord = await prisma.property.findMany({ where: { landlordId } });
            const simIds = simResult.map(s => s.id);
            const missing = allForLandlord.filter(a => !simIds.includes(a.id));

            console.log("\nEXTREMELY DETAILED CHECK FOR MISSING PROPERTY:");
            for (const p of missing) {
                console.log(`- Title: ${p.title} (${p.id})`);
                console.log(`- Data:`, {
                    status: p.status,
                    deletedAt: p.deletedAt,
                    city: p.city,
                    state: p.state,
                    landlordId: p.landlordId
                });

                // Manually test each piece of WHERE
                for (const [key, val] of Object.entries(where)) {
                    const testWhere = { [key]: val };
                    const testRes = await prisma.property.findMany({
                        where: { id: p.id, ...testWhere }
                    });
                    console.log(`  > Testing [${key}]: ${testRes.length > 0 ? "PASS" : "FAIL"}`);
                }
            }
        } else {
            console.log("DISCREPANCY! Server and Script return different counts for SAME where!");
        }

    } catch (e: any) {
        console.error("Diagnostic error:", e.message);
    }

    await prisma.$disconnect();
}

main();
