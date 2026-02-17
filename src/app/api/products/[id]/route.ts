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
            include: { variations: { include: { credentials: true } } },
        });

        if (!product) {
            return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
        }

        let totalStock = 0;
        const variations = product.variations.map((v: any) => {
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

        return NextResponse.json({
            ...product,
            price: Number(product.price),
            stock: totalStock,
            variations,
        });
    } catch {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
}
