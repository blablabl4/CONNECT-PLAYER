import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mpPayment } from '@/lib/mercadopago';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Handle both camelCase and snake_case for compatibility
        const productId = body.productId || body.product_id;
        const email = body.email || body.customer_email;
        const name = body.name || body.customer_name;
        const whatsapp = body.whatsapp || body.customer_whatsapp;
        const variationId = body.variation_id || body.variationId;
        const variationName = body.variation_name || body.variationName;
        const quantity = Math.max(1, parseInt(body.quantity || '1', 10));

        if (!productId || !email || !name) {
            return NextResponse.json(
                { error: 'Dados incompletos: Nome, Email e Produto são obrigatórios.' },
                { status: 400 }
            );
        }

        // 1. Fetch Product
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { variations: true },
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Produto não encontrado' },
                { status: 404 }
            );
        }

        // Determine unit price (use variation price if applicable)
        let unitPrice = Number(product.price);
        let itemName = product.name;
        if (variationId) {
            const variation = product.variations.find((v: any) => v.id === variationId);
            if (variation) {
                unitPrice = Number(variation.price);
                itemName = `${product.name} - ${variation.name}`;
            }
        }

        // Check stock (available credential slots) — supports multi-use credentials
        let stockResult: any[];
        if (variationId) {
            stockResult = await prisma.$queryRaw`
                SELECT COALESCE(SUM(max_uses - current_uses), 0) as available
                FROM credentials
                WHERE product_id = ${product.id}::uuid AND is_used = false AND variation_id = ${variationId}::uuid
            `;
        } else {
            stockResult = await prisma.$queryRaw`
                SELECT COALESCE(SUM(max_uses - current_uses), 0) as available
                FROM credentials
                WHERE product_id = ${product.id}::uuid AND is_used = false AND variation_id IS NULL
            `;
        }
        const availableCredentials = Number(stockResult[0]?.available || 0);

        if (availableCredentials < quantity) {
            return NextResponse.json(
                {
                    error: availableCredentials === 0
                        ? 'Produto esgotado! Sem credenciais disponíveis no momento.'
                        : `Estoque insuficiente. Disponível: ${availableCredentials} unidade(s).`
                },
                { status: 400 }
            );
        }

        // Calculate total
        const totalAmount = Math.round(unitPrice * quantity * 100) / 100;

        // 2. Create Pending Order
        const order = await prisma.order.create({
            data: {
                product_id: product.id,
                variation_id: variationId || null,
                variation_name: variationName || null,
                customer_name: name,
                customer_email: email,
                customer_whatsapp: whatsapp || '',
                total: totalAmount,
                status: 'pending',
            },
        });

        // 3. Create Pix Payment via Mercado Pago
        const payment = await mpPayment.create({
            body: {
                transaction_amount: totalAmount,
                description: quantity > 1 ? `${quantity}x ${itemName}` : itemName,
                payment_method_id: 'pix',
                payer: {
                    email: email,
                    first_name: name.split(' ')[0],
                    last_name: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
                },
                external_reference: order.id,
                notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://connectplayer.com.br'}/api/webhook/payment`,
            },
        });

        if (!payment.id) {
            throw new Error('Falha ao criar pagamento Pix');
        }

        // Extract Pix data
        const pixQrCode = (payment as any).point_of_interaction?.transaction_data?.qr_code_base64 || '';
        const pixCopiaECola = (payment as any).point_of_interaction?.transaction_data?.qr_code || '';

        // 4. Update Order with Payment ID
        await prisma.order.update({
            where: { id: order.id },
            data: {
                payment_id: String(payment.id),
                payment_method: 'pix',
            },
        });

        return NextResponse.json({
            order_id: order.id,
            payment_id: payment.id,
            qr_code_base64: pixQrCode,
            qr_code: pixCopiaECola,
            total: totalAmount,
        });
    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Erro ao processar checkout' },
            { status: 500 }
        );
    }
}
