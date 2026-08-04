import { propertyService } from "../services/propertyService";
import { prisma } from "../config/database";

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";

    console.log("--- FETCHING DIRECT FROM DB ---");
    const dbProperties = await prisma.property.findMany({
        where: { landlordId },
        select: { id: true, title: true }
    });
    const dbIds = dbProperties.map(p => p.id);
    console.log(`DB Count: ${dbIds.length}`);

    console.log("\n--- FETCHING VIA SERVICE ---");
    const serviceResult = await propertyService.getProperties({ landlordId });
    const serviceIds = serviceResult.properties.map(p => p.id);
    console.log(`Service Count: ${serviceIds.length}`);

    const missingInService = dbIds.filter(id => !serviceIds.includes(id));
    console.log("\nMISSING IDs in Service result:");
    for (const id of missingInService) {
        const p = dbProperties.find(prop => prop.id === id);
        console.log(`- ${p?.title} (ID: ${id})`);

        // Check why it's missing
        const fullP = await prisma.property.findUnique({ where: { id } });
        console.log(`  Full Details: Status=${fullP?.status}, deletedAt=${fullP?.deletedAt}, city=${fullP?.city}`);
    }
}

main().finally(() => prisma.$disconnect());
