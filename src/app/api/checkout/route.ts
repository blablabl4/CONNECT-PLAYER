import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { product_id, variation_id, variation_name, customer_name, customer_email, customer_whatsapp } = body;

        if (!product_id || !customer_name || !customer_email) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: product_id, customer_name, customer_email' },
                { status: 400 }
            );
        }

        // Fetch product
        const product = await prisma.product.findFirst({
            where: { id: product_id, is_active: true },
        });

        if (!product) {
            return NextResponse.json({ error: 'Produto não encontrado ou indisponível' }, { status: 404 });
        }

        // Check stock (available credentials)
        const stockCount = await prisma.credential.count({
            where: {
                product_id,
                is_used: false,
                ...(variation_id ? { variation_id } : {}),
            },
        });

        if (stockCount === 0) {
            return NextResponse.json({ error: 'Produto/Variação sem estoque disponível' }, { status: 400 });
        }

        // Create order
        const order = await prisma.order.create({
            data: {
                product_id,
                variation_id: variation_id || null,
                variation_name: variation_name || null,
                customer_name,
                customer_email,
                customer_whatsapp: customer_whatsapp || '',
                status: 'pending',
                payment_method: 'pix',
                total: Number(product.price),
            },
        });

        return NextResponse.json({
            order_id: order.id,
            total: Number(product.price),
            pix_qr_code: '',
            pix_code: '',
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 });
    }
}
