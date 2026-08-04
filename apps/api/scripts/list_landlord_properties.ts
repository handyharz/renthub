import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const userId = "cmkr8rjtd000013z4sdmkyz45";
    console.log(`--- DIAGNOSTIC: Listing all properties for landlord ${userId} ---`);

    const properties = await prisma.property.findMany({
        where: { landlordId: userId },
        select: {
            id: true,
            title: true,
            status: true,
            deletedAt: true
        }
    });

    console.log(`Found ${properties.length} properties in DB for this landlord.`);

    properties.forEach((p, i) => {
        console.log(`${i + 1}. [${p.status}] ${p.title} (ID: ${p.id}) ${p.deletedAt ? '- DELETED' : ''}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
