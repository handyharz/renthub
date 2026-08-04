import { PrismaClient, PropertyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";

    const properties = await prisma.property.findMany({
        where: { landlordId }
    });

    console.log(`Analyzing ${properties.length} properties for landlord ${landlordId}...`);

    for (const p of properties) {
        console.log(`\nChecking: ${p.title} (${p.id})`);

        // REPLICATE PropertyService where logic exactly
        const deletedAtCheck = p.deletedAt === null;
        const statusCheck = [PropertyStatus.AVAILABLE, PropertyStatus.RENTED].includes(p.status);

        // I need to find if there is ANY other trap.
        // Wait, what if landlordId is NOT exactly matched? (e.g. whitespace)
        // No, Prisma updateMany worked.

        const finalCheck = deletedAtCheck && statusCheck;

        console.log(` - pass: ${finalCheck} (deleted=${deletedAtCheck}, status=${statusCheck})`);

        if (!finalCheck) {
            console.log(` !!! FAILED !!!`);
        }
    }

    // Now test with the ACTUAL Prisma query structure
    const whereClause = {
        deletedAt: null,
        status: { in: [PropertyStatus.AVAILABLE, PropertyStatus.RENTED] },
        landlordId: landlordId
    };

    const results = await prisma.property.findMany({ where: whereClause });
    console.log(`\nFinal Test Result: ${results.length}`);

    if (results.length !== properties.length) {
        console.log("SURPRISE! Discrepancy confirmed in Prisma code.");
        const resultIds = results.map(r => r.id);
        const missing = properties.filter(p => !resultIds.includes(p.id));
        console.log("Missing Object(s):", JSON.stringify(missing, null, 2));
    }
}

main().finally(() => prisma.$disconnect());
