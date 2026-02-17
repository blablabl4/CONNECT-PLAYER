import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
    console.log('Deletando credenciais...');
    const c = await prisma.credential.deleteMany({});
    console.log(`  ${c.count} credenciais deletadas`);

    console.log('Deletando variações...');
    const v = await prisma.productVariation.deleteMany({});
    console.log(`  ${v.count} variações deletadas`);

    console.log('Deletando produtos...');
    const p = await prisma.product.deleteMany({});
    console.log(`  ${p.count} produtos deletados`);

    console.log('\n✅ Tudo zerado!');
    await prisma.$disconnect();
    await pool.end();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
