require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET');
    console.log('Cleaning database...');
    try {
        const orders = await prisma.order.deleteMany({});
        console.log(`Deleted ${orders.count} orders`);

        const creds = await prisma.credential.deleteMany({});
        console.log(`Deleted ${creds.count} credentials`);

        const vars = await prisma.productVariation.deleteMany({});
        console.log(`Deleted ${vars.count} variations`);

        const prods = await prisma.product.deleteMany({});
        console.log(`Deleted ${prods.count} products`);

        console.log('✅ Database cleaned!');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

clean();
