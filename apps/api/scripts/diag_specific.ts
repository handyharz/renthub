import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const userId = "cmkr8rjtd000013z4sdmkyz45";
    const propertyId = "cmkrarr920006gd91905y8vzw";

    console.log(`--- DIAGNOSTIC: Checking Property ${propertyId} ---`);

    const property = await prisma.property.findUnique({
        where: { id: propertyId },
        include: { landlord: true }
    });

    if (!property) {
        console.log("Property NOT FOUND in database.");
    } else {
        console.log("Property Details:");
        console.log(`- Title: ${property.title}`);
        console.log(`- Status: ${property.status}`);
        console.log(`- Landlord ID: ${property.landlordId} (Expected: ${userId})`);
        console.log(`- Deleted At: ${property.deletedAt}`);
        console.log(`- Match: ${property.landlordId === userId ? "YES" : "NO"}`);
    }

    console.log("\n--- Checking User ---");
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });
    if (user) {
        console.log(`User: ${user.firstName} ${user.lastName} (Clerk: ${user.clerkId})`);
    } else {
        console.log("User NOT FOUND in database.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
