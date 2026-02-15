import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List all credentials with product/variation info
export async function GET() {
    try {
        const credentials = await prisma.credential.findMany({
            include: { product: true, variation: true },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json(credentials.map((c: any) => ({
            ...c,
            product: c.product ? { ...c.product, price: Number(c.product.price) } : null,
            variation: c.variation ? { ...c.variation, price: Number(c.variation.price), original_price: c.variation.original_price ? Number(c.variation.original_price) : null } : null,
        })));
    } catch (error) {
        console.error('Admin credentials GET error:', error);
        return NextResponse.json({ error: 'Erro ao buscar credenciais' }, { status: 500 });
    }
}

// POST: Create credential
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { product_id, variation_id, email, password, link } = body;

        // Validate: must have either (email AND password) OR link
        const hasEmailPassword = email && password;
        const hasLink = link;

        if (!hasEmailPassword && !hasLink) {
            return NextResponse.json({
                error: 'Forneça email+senha OU link da credencial'
            }, { status: 400 });
        }

        const credential = await prisma.credential.create({
            data: {
                product_id: product_id || null,
                variation_id: variation_id || null,
                email: email || null,
                password: password || null,
                link: link || null,
            },
            include: { product: true, variation: true },
        });

        return NextResponse.json(credential);
    } catch (error) {
        console.error('Admin credentials POST error:', error);
        return NextResponse.json({ error: 'Erro ao criar credencial' }, { status: 500 });
    }
}

// PUT: Update credential
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        const credential = await prisma.credential.update({
            where: { id },
            data,
        });

        return NextResponse.json(credential);
    } catch (error) {
        console.error('Admin credentials PUT error:', error);
        return NextResponse.json({ error: 'Erro ao atualizar credencial' }, { status: 500 });
    }
}

// DELETE: Delete credential
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
        }

        await prisma.credential.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin credentials DELETE error:', error);
        return NextResponse.json({ error: 'Erro ao deletar credencial' }, { status: 500 });
    }
}
