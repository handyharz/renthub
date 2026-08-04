import { PrismaClient, PropertyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";

    const properties = await prisma.property.findMany({
        where: { landlordId }
    });

    console.log(`Auditing ${properties.length} properties...`);

    for (const p of properties) {
        console.log(`\nProperty: ${p.title} (${p.id})`);

        const checks = {
            deletedAt: p.deletedAt === null,
            status: [PropertyStatus.AVAILABLE, PropertyStatus.RENTED].includes(p.status),
            // Map the filters sent from dashboard (none)
            city: true, // city is falsy, so skipped
            state: true, // state is falsy, so skipped
            beds: true, // beds is falsy, so skipped
            price: true, // price is falsy, so skipped
            coords: true, // neLat/swLat is falsy, so skipped
        };

        const passedAll = Object.values(checks).every(v => v);
        console.log(` - Passed overall: ${passedAll}`);
        if (!passedAll) {
            console.log(` - Failures:`, Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k));
        }
    }

    // ACTUAL PRISMA QUERY EXACTLY AS IN SERVICE
    const where = {
        deletedAt: null,
        status: { in: [PropertyStatus.AVAILABLE, PropertyStatus.RENTED] },
        landlordId: landlordId
    };

    const results = await prisma.property.findMany({ where });
    console.log(`\nDirect Prisma where result: ${results.length}`);

}

main().finally(() => prisma.$disconnect());
