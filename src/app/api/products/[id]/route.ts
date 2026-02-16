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

        // Get stock per credential group/subgroup
        const credentialSlots = await prisma.credential.groupBy({
            by: ['group', 'subgroup'],
            where: { is_used: false, group: { not: '' } },
            _sum: { max_uses: true, current_uses: true },
        });

        const stockMap = new Map<string, number>();
        for (const c of credentialSlots) {
            const key = `${c.group}:${c.subgroup || ''}`;
            const remaining = (c._sum.max_uses || 0) - (c._sum.current_uses || 0);
            stockMap.set(key, remaining);
        }

        let totalStock = 0;
        const variations = product.variations.map((v: any) => {
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
