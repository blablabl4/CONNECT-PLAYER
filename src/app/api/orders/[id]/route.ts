import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { data: order, error } = await supabase
            .from('orders')
            .select('id, status, created_at, total')
            .eq('id', id)
            .single();

        if (error) throw error;
        return NextResponse.json(order);
    } catch {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
}
