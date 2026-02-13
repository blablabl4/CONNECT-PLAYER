import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [totalOrders, pendingOrders, totalProducts, paidOrders, recentOrders] = await Promise.all([
            prisma.order.count(),
            prisma.order.count({ where: { status: 'pending' } }),
            prisma.product.count(),
            prisma.order.findMany({
                where: { status: 'paid' },
                select: { total: true },
            }),
            prisma.order.findMany({
                include: { product: true },
                orderBy: { created_at: 'desc' },
                take: 10,
            }),
        ]);

        const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

        return NextResponse.json({
            stats: {
                totalOrders,
                totalRevenue,
                pendingOrders,
                totalProducts,
                todayOrders: 0,
                todayRevenue: 0,
            },
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                customer_name: o.customer_name,
                customer_email: o.customer_email,
                product_name: o.product?.name || 'N/A',
                total: Number(o.total),
                status: o.status,
                created_at: o.created_at.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 });
    }
}
