import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function generateCode(name: string): string {
    const clean = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
    const suffix = Math.random().toString(36).substring(2, 6);
    return `${clean.substring(0, 8)}${suffix}`;
}

// POST: Register affiliate (or return existing)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, phone, email } = body;

        if (!name || !phone || !email) {
            return NextResponse.json(
                { error: 'Nome, telefone e email são obrigatórios' },
                { status: 400 }
            );
        }

        // Check if affiliate already exists
        const existing = await prisma.affiliate.findUnique({
            where: { email },
            include: { _count: { select: { visits: true } } },
        });

        if (existing) {
            return NextResponse.json({
                affiliate: existing,
                link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://connectplayer.com.br'}/?ref=${existing.code}`,
                already_exists: true,
            });
        }

        // Create new affiliate
        const code = generateCode(name);
        const affiliate = await prisma.affiliate.create({
            data: { name, phone, email, code },
        });

        return NextResponse.json({
            affiliate,
            link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://connectplayer.com.br'}/?ref=${affiliate.code}`,
            already_exists: false,
        });
    } catch (error) {
        console.error('Affiliate POST error:', error);
        return NextResponse.json({ error: 'Erro ao cadastrar afiliado' }, { status: 500 });
    }
}

// GET: Lookup affiliate by email
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 });
        }

        const affiliate = await prisma.affiliate.findUnique({
            where: { email },
            include: { _count: { select: { visits: true } } },
        });

        if (!affiliate) {
            return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 });
        }

        return NextResponse.json({
            affiliate,
            link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://connectplayer.com.br'}/?ref=${affiliate.code}`,
        });
    } catch (error) {
        console.error('Affiliate GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar afiliado' }, { status: 500 });
    }
}
