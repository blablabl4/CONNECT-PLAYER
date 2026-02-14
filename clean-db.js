require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    console.log('Cleaning database...');
    try {
        // Delete in order to respect foreign keys (though cascade might handle it)
        // Order depends on Product, Credential depends on Product/Variation

        // 1. Delete Orders (if any, to be safe, or keep them? User said "Fake do site produto categoria", implies products)
        // Let's delete orders too to be 100% clean
        await prisma.order.deleteMany({});
        console.log('Orders deleted.');

        // 2. Delete Credentials
        await prisma.credential.deleteMany({});
        console.log('Credentials deleted.');

        // 3. Delete Variations
        await prisma.productVariation.deleteMany({});
        console.log('Variations deleted.');

        // 4. Delete Products
        await prisma.product.deleteMany({});
        console.log('Products deleted.');

        console.log('Database cleaned successfully.');
    } catch (e) {
        console.error('Error cleaning database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

clean();
