import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log(`--- DIAGNOSTIC: Unique Property IDs ---`);

    const properties = await prisma.property.findMany({
        select: { id: true }
    });

    console.log(`Total properties returned by findMany: ${properties.length}`);

    const idCounts: Record<string, number> = {};
    properties.forEach(p => {
        idCounts[p.id] = (idCounts[p.id] || 0) + 1;
    });

    const uniqueIds = Object.keys(idCounts);
    console.log(`Unique Property IDs: ${uniqueIds.length}`);

    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    if (duplicates.length > 0) {
        console.log("\nDUPLICATE IDs FOUND:");
        duplicates.forEach(([id, count]) => {
            console.log(`- ID: ${id} appears ${count} times`);
        });
    } else {
        console.log("\nNo duplicate IDs found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
