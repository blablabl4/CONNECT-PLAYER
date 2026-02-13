import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List all orders with product info
export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            include: { product: true },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json(orders.map(o => ({
            ...o,
            total: Number(o.total),
            product_name: o.product?.name || 'N/A',
            product: o.product ? { ...o.product, price: Number(o.product.price) } : null,
        })));
    } catch (error) {
        console.error('Admin orders GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
    }
}

// PUT: Update order status
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'id e status obrigatórios' }, { status: 400 });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json({ ...order, total: Number(order.total) });
    } catch (error) {
        console.error('Admin orders PUT error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
    }
}
