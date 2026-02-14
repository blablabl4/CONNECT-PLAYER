import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { variations: true },
        });

        if (!product) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }

        // Get credential counts for this product
        const credentialCounts = await prisma.credential.groupBy({
            by: ['variation_id'],
            where: { product_id: id, is_used: false },
            _count: { id: true },
        });

        // Build stock map
        let totalProductStock = 0;
        const variationStockMap = new Map<string, number>();
        for (const c of credentialCounts) {
            totalProductStock += c._count.id;
            if (c.variation_id) {
                variationStockMap.set(c.variation_id, c._count.id);
            }
        }

        return NextResponse.json({
            ...product,
            price: Number(product.price),
            stock: totalProductStock,
            variations: product.variations.map((v: any) => ({
                ...v,
                price: Number(v.price),
                original_price: v.original_price ? Number(v.original_price) : null,
                stock: variationStockMap.get(v.id) || 0,
            })),
        });
    } catch {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
}
