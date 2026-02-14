import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Default categories
const DEFAULT_CATEGORIES = [
    { icon: '🎬', name: 'Streaming', color: '#E50914' },
    { icon: '🎵', name: 'Música', color: '#1DB954' },
    { icon: '📺', name: 'IPTV', color: '#7C3AED' },
    { icon: '🎮', name: 'Games', color: '#2563EB' },
    { icon: '☁️', name: 'Cloud', color: '#0EA5E9' },
    { icon: '🔒', name: 'VPN', color: '#F59E0B' },
];

// GET: list categories
export async function GET() {
    try {
        const setting = await prisma.setting.findUnique({ where: { key: 'categories' } });
        if (setting?.value) {
            return NextResponse.json(JSON.parse(setting.value));
        }
        return NextResponse.json(DEFAULT_CATEGORIES);
    } catch {
        return NextResponse.json(DEFAULT_CATEGORIES);
    }
}

// PUT: save categories
export async function PUT(request: NextRequest) {
    try {
        const categories = await request.json();
        await prisma.setting.upsert({
            where: { key: 'categories' },
            update: { value: JSON.stringify(categories) },
            create: { key: 'categories', value: JSON.stringify(categories) },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Categories PUT error:', error);
        return NextResponse.json({ error: 'Erro ao salvar categorias' }, { status: 500 });
    }
}
