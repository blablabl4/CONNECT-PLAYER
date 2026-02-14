import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// GET: list banners
export async function GET() {
    try {
        const setting = await prisma.setting.findUnique({ where: { key: 'banners' } });
        if (setting?.value) {
            return NextResponse.json(JSON.parse(setting.value));
        }
        // Default banners
        return NextResponse.json([
            { url: '/banners/banner1.jpg', alt: 'Contas Premium' },
            { url: '/banners/banner2.jpg', alt: 'Contas Premium' },
        ]);
    } catch {
        return NextResponse.json([]);
    }
}

// POST: upload a new banner (no size limit!)
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo não permitido. Use JPG, PNG, WebP ou GIF' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64}`;

        // Get current banners
        const setting = await prisma.setting.findUnique({ where: { key: 'banners' } });
        const banners = setting?.value ? JSON.parse(setting.value) : [];
        banners.push({ url: dataUrl, alt: 'Banner' });

        await prisma.setting.upsert({
            where: { key: 'banners' },
            update: { value: JSON.stringify(banners) },
            create: { key: 'banners', value: JSON.stringify(banners) },
        });

        return NextResponse.json({ success: true, banners });
    } catch (error) {
        console.error('Banner upload error:', error);
        return NextResponse.json({ error: 'Erro ao fazer upload do banner' }, { status: 500 });
    }
}

// PUT: reorder/update banners list
export async function PUT(request: NextRequest) {
    try {
        const banners = await request.json();
        await prisma.setting.upsert({
            where: { key: 'banners' },
            update: { value: JSON.stringify(banners) },
            create: { key: 'banners', value: JSON.stringify(banners) },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Banners PUT error:', error);
        return NextResponse.json({ error: 'Erro ao salvar banners' }, { status: 500 });
    }
}
