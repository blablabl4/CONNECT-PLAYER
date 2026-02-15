import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { resend } from '@/lib/resend';
import { credentialDeliveryEmail, orderConfirmationEmail } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Find order with product and credential
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                product: true,
                credential: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
        }

        if (!order.credential) {
            return NextResponse.json({ error: 'Nenhuma credencial atribuída a este pedido' }, { status: 400 });
        }

        const emailFrom = process.env.EMAIL_FROM || 'Connect Player <noreply@connectplayer.com.br>';

        // Send credential email
        const credResult = await resend.emails.send({
            from: emailFrom,
            to: order.customer_email,
            subject: `Seus dados de acesso - ${order.product?.name || 'Produto'}`,
            html: credentialDeliveryEmail({
                customerName: order.customer_name,
                productName: order.product?.name || 'Produto',
                credentialEmail: order.credential.email || undefined,
                credentialPassword: order.credential.password || undefined,
                credentialLink: order.credential.link || undefined,
                variationName: order.variation_name || undefined,
            }),
        });

        // Send confirmation email
        const confResult = await resend.emails.send({
            from: emailFrom,
            to: order.customer_email,
            subject: `Pedido confirmado - Connect Player`,
            html: orderConfirmationEmail({
                customerName: order.customer_name,
                productName: order.product?.name || 'Produto',
                total: Number(order.total).toFixed(2),
                orderId: order.id,
            }),
        });

        return NextResponse.json({
            success: true,
            credential_email: credResult,
            confirmation_email: confResult,
        });
    } catch (error: any) {
        console.error('Resend email error:', error);
        return NextResponse.json(
            { error: error?.message || 'Erro ao reenviar e-mail' },
            { status: 500 }
        );
    }
}
