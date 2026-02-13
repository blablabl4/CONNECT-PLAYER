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

        // Convert Decimal to number for JSON serialization
        const serialized = products.map(p => ({
            ...p,
            price: Number(p.price),
            original_price: p.price ? Number(p.price) : undefined,
            variations: p.variations.map(v => ({
                ...v,
                price: Number(v.price),
                original_price: v.original_price ? Number(v.original_price) : null,
            })),
        }));

        return NextResponse.json(serialized);
    } catch (error) {
        console.error('Products error:', error);
        return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }
}
