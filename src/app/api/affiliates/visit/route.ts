import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST: Track a visit from an affiliate link
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, page, user_agent } = body;

        if (!code) {
            return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 });
        }

        // Find the affiliate by code
        const affiliate = await prisma.affiliate.findUnique({
            where: { code },
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 });
        }

        // Get IP from headers
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            || request.headers.get('x-real-ip')
            || '';

        // Create visit record
        await prisma.affiliateVisit.create({
            data: {
                affiliate_id: affiliate.id,
                ip,
                user_agent: user_agent || '',
                page: page || '/',
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Affiliate visit error:', error);
        return NextResponse.json({ error: 'Erro ao registrar visita' }, { status: 500 });
    }
}
