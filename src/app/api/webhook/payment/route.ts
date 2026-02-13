import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { payment_id, status } = body;

        if (!payment_id) {
            return NextResponse.json({ error: 'payment_id obrigatório' }, { status: 400 });
        }

        // Find order by payment_id
        const order = await prisma.order.findFirst({
            where: { payment_id },
            include: { product: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }

        if (status === 'approved' || status === 'paid') {
            // Find an available credential
            const credential = await prisma.credential.findFirst({
                where: {
                    product_id: order.product_id,
                    is_used: false,
                    ...(order.variation_id ? { variation_id: order.variation_id } : {}),
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

                // Send email with credentials
                try {
                    await resend.emails.send({
                        from: process.env.EMAIL_FROM || 'Connect Player <noreply@connectplayer.com>',
                        to: order.customer_email,
                        subject: `Seus dados de acesso - ${order.product?.name || 'Produto'}`,
                        html: `
                            <h2>Obrigado pela compra, ${order.customer_name}!</h2>
                            <p>Aqui estão seus dados de acesso:</p>
                            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
                                <p><strong>Email:</strong> ${credential.email}</p>
                                <p><strong>Senha:</strong> ${credential.password}</p>
                            </div>
                            <p>Qualquer dúvida, entre em contato!</p>
                        `,
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
        } else if (status === 'cancelled' || status === 'rejected') {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: 'cancelled' },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 });
    }
}
