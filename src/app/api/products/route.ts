import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { is_active: true },
            include: { variations: true },
            orderBy: { created_at: 'desc' },
        });

        // Get stock per credential group/subgroup
        const credentialSlots: any[] = await prisma.$queryRaw`
            SELECT "group", subgroup,
                   SUM(max_uses - current_uses) as remaining
            FROM credentials
            WHERE is_used = false AND "group" != ''
            GROUP BY "group", subgroup
        `;

        const stockMap = new Map<string, number>();
        for (const c of credentialSlots) {
            const key = `${c.group}:${c.subgroup || ''}`;
            stockMap.set(key, Number(c.remaining));
        }

        const serialized = products.map((p: any) => {
            let totalStock = 0;
            const vars = p.variations.map((v: any) => {
                let varStock = 0;
                if (v.credential_group) {
                    const key = `${v.credential_group}:${v.credential_subgroup || ''}`;
                    varStock = stockMap.get(key) || 0;
                }
                totalStock += varStock;
                return {
                    ...v,
                    price: Number(v.price),
                    original_price: v.original_price ? Number(v.original_price) : null,
                    stock: varStock,
                };
            });
            return {
                ...p,
                price: Number(p.price),
                original_price: p.original_price ? Number(p.original_price) : null,
                stock: totalStock,
                variations: vars,
            };
        });

        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Products error:', error);
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }
}
