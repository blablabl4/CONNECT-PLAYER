import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            where: { is_active: true },
            include: { variations: { include: { credentials: true } } },
            orderBy: { created_at: 'desc' },
        });

        const serialized = products.map((p: any) => {
            let totalStock = 0;
            const vars = p.variations.map((v: any) => {
                // Stock = sum of remaining uses across all linked credentials
                let varStock = 0;
                for (const c of (v.credentials || [])) {
                    if (c.current_uses < c.max_uses) {
                        varStock += c.max_uses - c.current_uses;
                    }
                }
                totalStock += varStock;
                return {
                    ...v,
                    price: Number(v.price),
                    original_price: v.original_price ? Number(v.original_price) : null,
                    stock: varStock,
                    credentials: undefined,
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
