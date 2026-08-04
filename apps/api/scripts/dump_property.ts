import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const id = "cmkrarr920006gd91905y8vzw";
    console.log(`--- DUMPING PROPERTY ${id} ---`);
    const property = await prisma.property.findUnique({
        where: { id }
    });
    console.log(JSON.stringify(property, null, 2));
}

main().finally(() => prisma.$disconnect());
