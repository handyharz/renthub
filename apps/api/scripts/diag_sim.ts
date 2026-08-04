import { PrismaClient, PropertyStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function getPropertiesSimulated(filters: any) {
    const {
        landlordId,
        status,
        city,
        state,
        // ... other filters
    } = filters;

    const where: any = {
        deletedAt: null,
        ...(status
            ? { status }
            : { status: { in: [PropertyStatus.AVAILABLE, PropertyStatus.RENTED] } }
        ),
        ...(landlordId && { landlordId }),
        // ... simplified others
    };

    console.log("SIMULATED WHERE:", JSON.stringify(where, null, 2));

    const properties = await prisma.property.findMany({ where });
    return properties;
}

async function main() {
    const landlordId = "cmkr8rjtd000013z4sdmkyz45";

    console.log("--- SIMULATION 1: landlordId Only ---");
    const res1 = await getPropertiesSimulated({ landlordId });
    console.log(`Found: ${res1.length}`);

    console.log("\n--- SIMULATION 2: landlordId + Empty String Status ---");
    const res2 = await getPropertiesSimulated({ landlordId, status: "" });
    console.log(`Found: ${res2.length}`);

    console.log("\n--- SIMULATION 3: Checking if any other landords own it ---");
    const p = await prisma.property.findUnique({ where: { id: "cmkrarr920006gd91905y8vzw" } });
    console.log(`Property landlordId in DB: ${p?.landlordId}`);
}

main().finally(() => prisma.$disconnect());
