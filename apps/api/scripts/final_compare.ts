import axios from "axios";
import { PrismaClient } from "@prisma/client";

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";
    const prisma = new PrismaClient();

    console.log("Fetching from DB...");
    const dbRows = await prisma.property.findMany({
        where: { landlordId },
        select: { id: true, title: true }
    });
    const dbIds = dbRows.map(r => r.id).sort();
    console.log(`DB Count: ${dbIds.length}`);

    console.log("\nFetching from API...");
    const url = `http://localhost:5001/api/properties?landlordId=${landlordId}`;
    try {
        const res = await axios.get(url);
        const apiIds = res.data.data.properties.map((p: any) => p.id).sort();
        console.log(`API Count: ${apiIds.length}`);

        const missing = dbIds.filter(id => !apiIds.includes(id));
        console.log("\nMISSING in API response:");
        for (const id of missing) {
            const p = dbRows.find(r => r.id === id);
            console.log(`- ${p?.title} (${id})`);

            const full = await prisma.property.findUnique({ where: { id } });
            console.log("  Filtered details:", {
                status: full?.status,
                deletedAt: full?.deletedAt,
                city: full?.city,
                state: full?.state,
                price: full?.pricePerYear
            });
        }
    } catch (e: any) {
        console.error("API error:", e.message);
    }

    await prisma.$disconnect();
}

main();
