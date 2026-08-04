import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const userId = "cmkr8rjtd000013z4sdmkyz45";
    console.log(`--- DIAGNOSTIC: Property counts by status for landlord ${userId} ---`);

    const stats = await prisma.property.groupBy({
        by: ['status'],
        where: { landlordId: userId },
        _count: true
    });

    console.log(JSON.stringify(stats, null, 2));

    const total = await prisma.property.count({ where: { landlordId: userId } });
    console.log(`\nGrand Total: ${total}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
