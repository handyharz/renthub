import { propertyService } from "../src/services/propertyService";
import { PrismaClient } from "@prisma/client";

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";
    console.log(`--- DIAGNOSTIC: Testing propertyService.getProperties for ${landlordId} ---`);

    try {
        const result = await propertyService.getProperties({
            landlordId
        });

        console.log("\nResults:");
        console.log(`Total count: ${result.total}`);
        console.log(`Properties returned: ${result.properties.length}`);

        result.properties.forEach(p => {
            console.log(`- ${p.title} (ID: ${p.id}, Status: ${p.status}, Landlord: ${p.landlordId})`);
        });

    } catch (err: any) {
        console.error("Error:", err);
    }
}

main().finally(() => new PrismaClient().$disconnect());
