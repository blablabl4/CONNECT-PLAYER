import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Get all settings
export async function GET() {
    try {
        const settings = await prisma.setting.findMany();
        // Convert to key-value object
        const result: Record<string, string> = {};
        settings.forEach((s: { key: string; value: string }) => { result[s.key] = s.value; });
        return NextResponse.json(result);
    } catch (error) {
        console.error('Admin settings GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }
}

// PUT: Upsert settings
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // body is { key: value, key: value, ... }
        const updates = Object.entries(body).map(([key, value]) =>
            prisma.setting.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            })
        );

        await prisma.$transaction(updates);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin settings PUT error:', error);
        return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
    }
}
