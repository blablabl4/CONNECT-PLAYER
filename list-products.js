const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const products = await prisma.product.findMany();
        console.log('Total Products:', products.length);
        products.forEach(p => {
            console.log(`- [${p.id}] ${p.name} (${p.price})`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
