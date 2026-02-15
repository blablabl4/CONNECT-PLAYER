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

        // Get credential counts for each product and variation
        const credentialCounts = await prisma.credential.groupBy({
            by: ['product_id', 'variation_id'],
            where: { is_used: false },
            _count: { id: true },
        });

        // Build a lookup map: "productId" or "productId:variationId" -> count
        const stockMap = new Map<string, number>();
        for (const c of credentialCounts) {
            // Skip credentials without product_id (unlinked credentials)
            if (!c.product_id) continue;

            if (c.variation_id) {
                stockMap.set(`${c.product_id}:${c.variation_id}`, c._count.id);
            }
            // Accumulate product-level stock
            const currentProductStock = stockMap.get(c.product_id) || 0;
            stockMap.set(c.product_id, currentProductStock + c._count.id);
        }

        const serialized = products.map((p: any) => ({
            ...p,
            price: Number(p.price),
            original_price: p.original_price ? Number(p.original_price) : null,
            stock: stockMap.get(p.id) || 0,
            variations: p.variations.map((v: any) => ({
                ...v,
                price: Number(v.price),
                original_price: v.original_price ? Number(v.original_price) : null,
                stock: stockMap.get(`${p.id}:${v.id}`) || 0,
            })),
        }));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Products error:', error);
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }
}
