import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("--- DIAGNOSTIC: Checking Transactions ---");

    const transactions = await prisma.transaction.findMany({
        include: {
            property: {
                include: {
                    landlord: true
                }
            },
            tenant: true
        }
    });

    console.log(`Found ${transactions.length} transactions`);

    transactions.forEach(t => {
        console.log(`\nTransaction ID: ${t.id}`);
        console.log(`Status: ${t.status}`);
        console.log(`Property: ${t.property.title} (ID: ${t.property.id})`);
        console.log(`Landlord: ${t.property.landlord.firstName} ${t.property.landlord.lastName} (ID: ${t.property.landlord.id}, ClerkID: ${t.property.landlord.clerkId})`);
        console.log(`Tenant: ${t.tenant.firstName} ${t.tenant.lastName} (ID: ${t.tenant.id}, ClerkID: ${t.tenant.clerkId})`);
    });

    console.log("\n--- Checking Users ---");
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    users.forEach(u => {
        console.log(`- ${u.firstName} ${u.lastName} [${u.role}] (ClerkID: ${u.clerkId})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
