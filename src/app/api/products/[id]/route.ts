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

        return NextResponse.json({
            ...product,
            price: Number(product.price),
            variations: product.variations.map(v => ({
                ...v,
                price: Number(v.price),
                original_price: v.original_price ? Number(v.original_price) : null,
            })),
        });
    } catch {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
}
