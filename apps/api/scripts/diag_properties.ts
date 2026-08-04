import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("--- DIAGNOSTIC: Checking Property Ownership ---");

    const properties = await prisma.property.findMany({
        include: {
            landlord: true
        }
    });

    console.log(`Found ${properties.length} properties`);

    const ownershipCount: Record<string, number> = {};
    properties.forEach(p => {
        const key = `${p.landlord.firstName} ${p.landlord.lastName} (${p.landlord.clerkId})`;
        ownershipCount[key] = (ownershipCount[key] || 0) + 1;
    });

    console.log("\nProperties per Landlord:");
    Object.entries(ownershipCount).forEach(([name, count]) => {
        console.log(`${name}: ${count} properties`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
