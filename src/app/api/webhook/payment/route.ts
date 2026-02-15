import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { mpPayment } from '@/lib/mercadopago';
import { resend } from '@/lib/resend';
import { credentialDeliveryEmail, orderConfirmationEmail } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Webhook received:', JSON.stringify(body));

        // Mercado Pago sends: { action: "payment.updated", data: { id: "123456" } }
        // or via query params: ?type=payment&data.id=123456
        let paymentMpId: string | null = null;

        if (body.data?.id) {
            paymentMpId = String(body.data.id);
        } else if (body.payment_id) {
            // Legacy/direct format
            paymentMpId = String(body.payment_id);
        }

        if (!paymentMpId) {
            // Might be a test notification or irrelevant event
            return NextResponse.json({ received: true });
        }

        // Fetch payment details from Mercado Pago
        let mpPaymentData: any;
        try {
            mpPaymentData = await mpPayment.get({ id: paymentMpId });
        } catch (mpError) {
            console.error('Error fetching payment from MP:', mpError);
            return NextResponse.json({ error: 'Pagamento não encontrado no MP' }, { status: 404 });
        }

        const mpStatus = mpPaymentData.status; // approved, pending, rejected, cancelled, etc.
        const externalReference = mpPaymentData.external_reference; // This is the order ID

        if (!externalReference) {
            console.log('No external_reference, skipping');
            return NextResponse.json({ received: true });
        }

        // Find order by ID (external_reference is the order ID)
        const order = await prisma.order.findUnique({
            where: { id: externalReference },
            include: { product: true },
        });

        if (!order) {
            console.error('Order not found:', externalReference);
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }

        // Skip if already delivered
        if (order.status === 'delivered') {
            return NextResponse.json({ success: true, message: 'Already delivered' });
        }

        // Update payment_id on the order if not set
        if (!order.payment_id || order.payment_id === '') {
            await prisma.order.update({
                where: { id: order.id },
                data: { payment_id: paymentMpId },
            });
        }

        if (mpStatus === 'approved') {
            // Find an available credential — strictly match variation
            const credential = await prisma.credential.findFirst({
                where: {
                    product_id: order.product_id,
                    is_used: false,
                    variation_id: order.variation_id || null,
                },
            });

            if (credential) {
                // Mark credential as used and assign to order
                await prisma.$transaction([
                    prisma.credential.update({
                        where: { id: credential.id },
                        data: { is_used: true, assigned_to: order.id },
                    }),
                    prisma.order.update({
                        where: { id: order.id },
                        data: { status: 'delivered', credential_id: credential.id },
                    }),
                ]);

                // Send emails
                try {
                    await resend.emails.send({
                        from: process.env.EMAIL_FROM || 'Connect Player <noreply@connectplayer.com.br>',
                        to: order.customer_email,
                        subject: `Seus dados de acesso - ${order.product?.name || 'Produto'}`,
                        html: credentialDeliveryEmail({
                            customerName: order.customer_name,
                            productName: order.product?.name || 'Produto',
                            credentialEmail: credential.email || undefined,
                            credentialPassword: credential.password || undefined,
                            credentialLink: credential.link || undefined,
                            variationName: order.variation_name || undefined,
                        }),
                    });

                    await resend.emails.send({
                        from: process.env.EMAIL_FROM || 'Connect Player <noreply@connectplayer.com.br>',
                        to: order.customer_email,
                        subject: `Pedido confirmado - Connect Player`,
                        html: orderConfirmationEmail({
                            customerName: order.customer_name,
                            productName: order.product?.name || 'Produto',
                            total: Number(order.total).toFixed(2),
                            orderId: order.id,
                        }),
                    });
                } catch (emailError) {
                    console.error('Email send error:', emailError);
                }
            } else {
                // No credential available, just mark as paid
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: 'paid' },
                });
            }
        } else if (mpStatus === 'cancelled' || mpStatus === 'rejected' || mpStatus === 'refunded') {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'cancelled' },
            });
        }
        // For 'pending', 'in_process', etc. — do nothing, keep waiting

        return NextResponse.json({ success: true, mp_status: mpStatus });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 });
    }
}

// Mercado Pago may also send GET requests for verification
export async function GET() {
    return NextResponse.json({ status: 'ok', webhook: 'active' });
}
