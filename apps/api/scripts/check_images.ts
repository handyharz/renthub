import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const propertyId = "cmkrarr920006gd91905y8vzw";
    console.log(`--- Checking images for property ${propertyId} ---`);

    const images = await prisma.image.findMany({
        where: { propertyId }
    });

    console.log(`Found ${images.length} images.`);
    images.forEach((img, i) => {
        console.log(`${i + 1}: URL=${img.url}, isPrimary=${img.isPrimary}`);
    });
}

main().finally(() => prisma.$disconnect());
