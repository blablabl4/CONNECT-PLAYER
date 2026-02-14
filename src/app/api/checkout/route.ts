import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mpPreference } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();


        // Handle both camelCase and snake_case for compatibility
        const productId = body.productId || body.product_id;
        const email = body.email || body.customer_email;
        const name = body.name || body.customer_name;
        const whatsapp = body.whatsapp || body.customer_whatsapp;

        if (!productId || !email || !name) {
            return NextResponse.json(
                { error: 'Dados incompletos: Nome, Email e Produto são obrigatórios.' },
                { status: 400 }
            );
        }

        // 1. Fetch Product
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Produto não encontrado' },
                { status: 404 }
            );
        }

        // 2. Create Pending Order
        const order = await prisma.order.create({
            data: {
                product_id: product.id,
                customer_name: name,
                customer_email: email,
                customer_whatsapp: whatsapp || '',
                total: product.price,
                status: 'pending',
            },
        });

        // 3. Create Mercado Pago Preference
        const result = await mpPreference.create({
            body: {
                items: [
                    {
                        id: product.id,
                        title: product.name,
                        quantity: 1,
                        unit_price: Number(product.price),
                        currency_id: 'BRL',
                    },
                ],
                payer: {
                    email: email,
                    name: name,
                },
                external_reference: order.id,
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?order_id=${order.id}`,
                    failure: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?status=failure`,
                    pending: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?status=pending`,
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://connectplayer.com.br'}/api/webhook/payment`,
            },
        });

        if (!result.init_point) {
            throw new Error('Falha ao criar preferência de pagamento');
        }

        // 4. Update Order with Payment Link (optional, or just return it)
        await prisma.order.update({
            where: { id: order.id },
            data: { payment_id: result.id }, // Storing Preference ID as payment_id initially
        });

        return NextResponse.json({ url: result.init_point, order_id: order.id });
    } catch (error) {
        console.error('Checkout Error:', error);
        return NextResponse.json(
            { error: 'Erro ao processar checkout' },
            { status: 500 }
        );
    }
}
