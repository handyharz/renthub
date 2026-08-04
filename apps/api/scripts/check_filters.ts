import { PrismaClient, PropertyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";

    const allForLandlord = await prisma.property.findMany({
        where: { landlordId }
    });

    console.log(`Checking ${allForLandlord.length} properties...`);

    const statusesToInclude = [PropertyStatus.AVAILABLE, PropertyStatus.RENTED];

    allForLandlord.forEach((p, i) => {
        const passStatus = statusesToInclude.includes(p.status);
        const passDeleted = p.deletedAt === null;

        if (!passStatus || !passDeleted) {
            console.log(`[FAILED] #${i + 1}: ${p.title} (ID: ${p.id})`);
            console.log(`  - Status: ${p.status} (In include list: ${passStatus})`);
            console.log(`  - deletedAt: ${p.deletedAt} (Is null: ${passDeleted})`);
        } else {
            // console.log(`[PASS  ] #${i+1}: ${p.title}`);
        }
    });

    console.log("Check complete.");
}

main().finally(() => prisma.$disconnect());
