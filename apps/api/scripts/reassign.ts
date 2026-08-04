import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const targetUserId = "cmkr8rjtd000013z4sdmkyz45"; // Harun Kane
    console.log(`--- REASSIGNING ALL PROPERTIES TO ${targetUserId} ---`);

    const result = await prisma.property.updateMany({
        data: {
            landlordId: targetUserId
        }
    });

    console.log(`Reassigned ${result.count} properties.`);
}

main().finally(() => prisma.$disconnect());
