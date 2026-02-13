import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface ProductVariation {
    id: string;
    product_id: string;
    name: string; // "30 Dias", "1 Tela", etc.
    description: string;
    price: number;
    original_price?: number;
    discount?: number;
    badge?: string;
    duration: string;
    stock: number;
    created_at?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number; // Preço base (ou menor preço das variações)
    original_price?: number;
    image_url: string;
    category: string;
    duration: string;
    is_active: boolean;
    stock: number; // Soma dos estoques das variações ou estoque geral
    features: string[];
    variations?: ProductVariation[]; // Opcional, carregado via join
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    product_id: string;
    variation_id?: string;
    variation_name?: string;
    customer_name: string;
    customer_email: string;
    customer_whatsapp: string;
    status: 'pending' | 'paid' | 'delivered' | 'cancelled';
    payment_id: string;
    payment_method: string;
    total: number;
    credential_id?: string;
    created_at: string;
    updated_at: string;
    product?: Product;
}

export interface Credential {
    id: string;
    product_id: string;
    variation_id?: string; // Link específico para uma variação
    email: string;
    password: string;
    is_used: boolean;
    assigned_to?: string;
    created_at: string;
    product?: Product;
    variation?: ProductVariation;
}
