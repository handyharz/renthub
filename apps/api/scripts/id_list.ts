import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const userId = "cmkr8rjtd000013z4sdmkyz45";
    const properties = await prisma.property.findMany({
        where: { landlordId: userId },
        select: { id: true }
    });
    console.log(`Total IDs found: ${properties.length}`);
    properties.forEach((p, i) => console.log(`${i + 1}: ${p.id}`));
}

main().finally(() => prisma.$disconnect());
