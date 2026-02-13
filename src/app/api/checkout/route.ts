import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { product_id, variation_id, variation_name, customer_name, customer_email, customer_whatsapp } = body;

        // Validate required fields
        if (!product_id || !customer_name || !customer_email) {
            return NextResponse.json(
                { error: 'Campos obrigatórios: product_id, customer_name, customer_email' },
                { status: 400 }
            );
        }

        // Fetch product
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', product_id)
            .eq('is_active', true)
            .single();

        if (productError || !product) {
            return NextResponse.json({ error: 'Produto não encontrado ou indisponível' }, { status: 404 });
        }

        // Check stock (available credentials)
        let stockQuery = supabase
            .from('credentials')
            .select('*', { count: 'exact', head: true })
            .eq('product_id', product_id)
            .eq('is_used', false);

        if (variation_id) {
            stockQuery = stockQuery.eq('variation_id', variation_id);
        }

        const { count } = await stockQuery;

        if (!count || count === 0) {
            return NextResponse.json({ error: 'Produto/Variação sem estoque disponível' }, { status: 400 });
        }

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                product_id,
                variation_id: variation_id || null,
                variation_name: variation_name || null,
                customer_name,
                customer_email,
                customer_whatsapp: customer_whatsapp || '',
                status: 'pending',
                payment_method: 'pix',
                total: product.price, // Note: In a real app we should verify price against variation price in DB
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // TODO: Generate Pix QR Code via Mercado Pago API
        // For now, return order ID for the status page

        return NextResponse.json({
            order_id: order.id,
            total: product.price,
            pix_qr_code: '', // TODO: actual QR code
            pix_code: '', // TODO: actual Pix copy-paste code
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 });
    }
}
