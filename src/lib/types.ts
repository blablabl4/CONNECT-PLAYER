// Shared types for the application (used by both API routes and frontend)

export interface ProductVariation {
    id: string;
    product_id: string;
    name: string;
    description: string | null;
    price: number;
    original_price?: number | null;
    discount?: number;
    badge?: string;
    duration: string | null;
    stock: number;
    created_at?: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    original_price?: number;
    image_url: string;
    category: string;
    duration: string;
    is_active: boolean;
    stock: number;
    features: string[];
    variations?: ProductVariation[];
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    product_id: string;
    variation_id?: string | null;
    variation_name?: string | null;
    customer_name: string;
    customer_email: string;
    customer_whatsapp: string;
    status: 'pending' | 'paid' | 'delivered' | 'cancelled';
    payment_id: string;
    payment_method: string;
    total: number;
    credential_id?: string | null;
    created_at: string;
    updated_at: string;
    product?: Product;
}

export interface Credential {
    id: string;
    product_id: string;
    variation_id?: string | null;
    email: string;
    password: string;
    is_used: boolean;
    assigned_to?: string | null;
    created_at: string;
    product?: Product;
    variation?: ProductVariation;
}
