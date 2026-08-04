import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const properties = await prisma.property.findMany({
        take: 5,
        select: { title: true, pricePerYear: true }
    });
    console.log("Checking DB Prices as of now:");
    properties.forEach(p => {
        console.log(`${p.title}: ${p.pricePerYear}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
