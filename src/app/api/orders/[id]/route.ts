import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const order = await prisma.order.findUnique({
            where: { id },
            select: { id: true, status: true, created_at: true, total: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            ...order,
            total: Number(order.total),
        });
    } catch {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
}
