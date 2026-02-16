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

        let paymentMpId: string | null = null;
        if (body.data?.id) paymentMpId = String(body.data.id);
        else if (body.payment_id) paymentMpId = String(body.payment_id);

        if (!paymentMpId) return NextResponse.json({ received: true });

        let mpPaymentData: any;
        try { mpPaymentData = await mpPayment.get({ id: paymentMpId }); }
        catch (mpError) { console.error('Error fetching payment from MP:', mpError); return NextResponse.json({ error: 'Pagamento não encontrado no MP' }, { status: 404 }); }

        const mpStatus = mpPaymentData.status;
        const externalReference = mpPaymentData.external_reference;
        if (!externalReference) return NextResponse.json({ received: true });

        const order = await prisma.order.findUnique({
            where: { id: externalReference },
            include: { product: true, variation: true },
        });

        if (!order) { console.error('Order not found:', externalReference); return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 }); }
        if (order.status === 'delivered') return NextResponse.json({ success: true, message: 'Already delivered' });

        if (!order.payment_id || order.payment_id === '') {
            await prisma.order.update({ where: { id: order.id }, data: { payment_id: paymentMpId } });
        }

        if (mpStatus === 'approved') {
            // Get credential group/subgroup and max_uses from the variation
            const variation = order.variation as any;
            const credGroup = variation?.credential_group || '';
            const credSubgroup = variation?.credential_subgroup || null;
            const maxUsesPerCred = variation?.max_uses_per_credential || 1;

            // Find an available credential from the pool by group/subgroup
            let credential: any;
            if (credSubgroup) {
                credential = await prisma.credential.findFirst({
                    where: {
                        group: credGroup,
                        subgroup: credSubgroup,
                        is_used: false,
                        current_uses: { lt: maxUsesPerCred },
                    },
                });
            } else if (credGroup) {
                credential = await prisma.credential.findFirst({
                    where: {
                        group: credGroup,
                        is_used: false,
                        current_uses: { lt: maxUsesPerCred },
                    },
                });
            }

            if (credential) {
                const newUses = credential.current_uses + 1;
                const fullyUsed = newUses >= maxUsesPerCred;

                await prisma.$transaction([
                    prisma.credential.update({
                        where: { id: credential.id },
                        data: {
                            current_uses: newUses,
                            max_uses: maxUsesPerCred,
                            is_used: fullyUsed,
                            assigned_to: order.id,
                            product_id: order.product_id,
                            variation_id: order.variation_id,
                        },
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

        return NextResponse.json({ success: true, mp_status: mpStatus });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ status: 'ok', webhook: 'active' });
}
