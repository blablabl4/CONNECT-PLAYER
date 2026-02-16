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
