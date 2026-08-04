import { PrismaClient, PropertyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";

    console.log("--- TEST 1: All Properties ---");
    const all = await prisma.property.findMany({ select: { id: true, title: true, landlordId: true } });
    console.log(`Total properties in DB: ${all.length}`);

    console.log("\n--- TEST 2: Filter by Landlord Only ---");
    const byLandlord = await prisma.property.findMany({ where: { landlordId } });
    console.log(`Found ${byLandlord.length} properties for landlord ${landlordId}`);
    if (byLandlord.length > 0) {
        console.log(`First one: ${byLandlord[0].title}`);
    }

    console.log("\n--- TEST 3: Full Where Clause (Simulated) ---");
    const where = {
        deletedAt: null,
        status: { in: [PropertyStatus.AVAILABLE, PropertyStatus.RENTED] },
        landlordId: landlordId
    };
    console.log("Where object:", JSON.stringify(where, null, 2));
    const full = await prisma.property.findMany({ where });
    console.log(`Found ${full.length} properties with full where clause`);
}

main().finally(() => prisma.$disconnect());
