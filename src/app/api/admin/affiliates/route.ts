import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List all affiliates with visit counts (admin)
export async function GET() {
    try {
        const affiliates = await prisma.affiliate.findMany({
            include: {
                _count: { select: { visits: true } },
                visits: {
                    orderBy: { created_at: 'desc' },
                    take: 1,
                    select: { created_at: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json(affiliates.map((a: any) => ({
            ...a,
            total_visits: a._count.visits,
            last_visit: a.visits[0]?.created_at || null,
            visits: undefined,
            _count: undefined,
        })));
    } catch (error) {
        console.error('Admin affiliates GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar afiliados' }, { status: 500 });
    }
}
