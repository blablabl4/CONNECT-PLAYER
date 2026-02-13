import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Webhook for payment gateway (Mercado Pago, etc.)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Mercado Pago sends a notification with the payment ID
        // This is a simplified handler – adjust to your payment provider's format
        const paymentId = body.data?.id || body.payment_id;
        const status = body.action === 'payment.updated' ? 'paid' : null;

        if (!paymentId || !status) {
            return NextResponse.json({ received: true });
        }

        // Find order by payment_id
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('payment_id', paymentId)
            .single();

        if (orderError || !order) {
            console.error('Order not found for payment:', paymentId);
            return NextResponse.json({ received: true });
        }

        // Skip if already processed
        if (order.status !== 'pending') {
            return NextResponse.json({ received: true });
        }

        // Find available credential for this product
        // Find available credential for this product
        let credQuery = supabase
            .from('credentials')
            .select('*')
            .eq('product_id', order.product_id)
            .eq('is_used', false)
            .limit(1);

        if (order.variation_id) {
            credQuery = credQuery.eq('variation_id', order.variation_id);
        }

        const { data: credential, error: credError } = await credQuery.single();

        if (credError || !credential) {
            console.error('No available credentials for product:', order.product_id);
            // Still mark as paid, admin will need to handle manually
            await supabase
                .from('orders')
                .update({ status: 'paid' })
                .eq('id', order.id);

            return NextResponse.json({ received: true, warning: 'No credentials available' });
        }

        // Assign credential to order
        await supabase
            .from('credentials')
            .update({ is_used: true, assigned_to: order.id })
            .eq('id', credential.id);

        // Update order status
        await supabase
            .from('orders')
            .update({ status: 'delivered', credential_id: credential.id })
            .eq('id', order.id);

        // Send email with credentials
        try {
            await resend.emails.send({
                from: 'Connect Player <onboarding@resend.dev>', // Default Resend test domain
                to: [order.customer_email],
                subject: `Seu acesso chegou! - Connect Player`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h1>Olá, ${order.customer_name}!</h1>
                        <p>Obrigado pela sua compra. O pagamento foi confirmado e aqui estão os seus dados de acesso:</p>
                        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e4e4e7;">
                            <p style="margin: 5px 0;"><strong>Produto:</strong> ${credential.email}</p>
                            <p style="margin: 5px 0;"><strong>Senha:</strong> ${credential.password}</p>
                            ${order.variation_name ? `<p style="margin: 5px 0; color: #666; font-size: 0.9em;">Variação: ${order.variation_name}</p>` : ''}
                        </div>
                        <p>Se tiver dúvidas, entre em contato com nosso suporte.</p>
                        <p>Atenciosamente,<br>Equipe Connect Player</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        console.log(`Order ${order.id} completed. Credential ${credential.id} assigned. Email sent.`);

        return NextResponse.json({ received: true, status: 'delivered' });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
