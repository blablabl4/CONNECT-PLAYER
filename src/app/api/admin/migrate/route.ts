import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Run database migrations via raw SQL
export async function GET() {
    try {
        const results: string[] = [];

        // Check if products table exists
        const tablesCheck = await prisma.$queryRawUnsafe<{ tablename: string }[]>(
            `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
        );
        const existingTables = tablesCheck.map((t: any) => t.tablename);
        results.push(`Existing tables: ${existingTables.join(', ')}`);

        // Create products table if it doesn't exist
        if (!existingTables.includes('products')) {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS products (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    description TEXT NOT NULL DEFAULT '',
                    price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    image_url TEXT NOT NULL DEFAULT '',
                    category TEXT NOT NULL DEFAULT '',
                    duration TEXT NOT NULL DEFAULT '30 dias',
                    is_active BOOLEAN NOT NULL DEFAULT true,
                    stock INTEGER NOT NULL DEFAULT 0,
                    features TEXT[] DEFAULT '{}',
                    original_price DECIMAL(10,2),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            results.push('Created table: products');
        }

        // Create product_variations table if it doesn't exist
        if (!existingTables.includes('product_variations')) {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS product_variations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                    name TEXT NOT NULL,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL,
                    original_price DECIMAL(10,2),
                    duration TEXT,
                    stock INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id)`);
            results.push('Created table: product_variations');
        }

        // Create credentials table if it doesn't exist
        if (!existingTables.includes('credentials')) {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS credentials (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                    variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
                    email TEXT NOT NULL DEFAULT '',
                    password TEXT NOT NULL DEFAULT '',
                    extra_info TEXT,
                    is_used BOOLEAN NOT NULL DEFAULT false,
                    assigned_to UUID,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_credentials_product_id ON credentials(product_id)`);
            results.push('Created table: credentials');
        }

        // Create orders table if it doesn't exist
        if (!existingTables.includes('orders')) {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS orders (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    product_id UUID NOT NULL,
                    variation_id UUID,
                    product_name TEXT NOT NULL DEFAULT '',
                    variation_name TEXT,
                    customer_name TEXT NOT NULL DEFAULT '',
                    customer_email TEXT NOT NULL DEFAULT '',
                    customer_whatsapp TEXT NOT NULL DEFAULT '',
                    total DECIMAL(10,2) NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'pending',
                    payment_id TEXT,
                    payment_method TEXT,
                    credential_id UUID,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
            results.push('Created table: orders');
        }

        // Create settings table if it doesn't exist
        if (!existingTables.includes('settings')) {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS settings (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    key TEXT NOT NULL UNIQUE,
                    value TEXT NOT NULL DEFAULT '',
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            results.push('Created table: settings');
        }

        // Create affiliates table if it doesn't exist
        if (!existingTables.includes('affiliates')) {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS affiliates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE,
                    code TEXT NOT NULL UNIQUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            results.push('Created table: affiliates');
        }

        // Create affiliate_visits table if it doesn't exist
        if (!existingTables.includes('affiliate_visits')) {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS affiliate_visits (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
                    ip TEXT NOT NULL DEFAULT '',
                    user_agent TEXT NOT NULL DEFAULT '',
                    page TEXT NOT NULL DEFAULT '/',
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
            `);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_affiliate_visits_affiliate_id ON affiliate_visits(affiliate_id)`);
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_affiliate_visits_created_at ON affiliate_visits(created_at DESC)`);
            results.push('Created table: affiliate_visits');
        }

        // ========== SCHEMA EVOLUTION MIGRATIONS ==========
        // These ALTER statements safely update existing tables to match the latest schema.

        // Credentials table: make email/password/product_id optional, add link column
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ALTER COLUMN email DROP NOT NULL`);
            results.push('Altered credentials: email now nullable');
        } catch { results.push('credentials.email already nullable'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ALTER COLUMN password DROP NOT NULL`);
            results.push('Altered credentials: password now nullable');
        } catch { results.push('credentials.password already nullable'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ALTER COLUMN product_id DROP NOT NULL`);
            results.push('Altered credentials: product_id now nullable');
        } catch { results.push('credentials.product_id already nullable'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ADD COLUMN IF NOT EXISTS link TEXT`);
            results.push('Added credentials.link column');
        } catch { results.push('credentials.link column already exists'); }

        // ========== CREDENTIAL GROUPS MIGRATION ==========
        // Add group/subgroup columns to credentials
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ADD COLUMN IF NOT EXISTS "group" TEXT NOT NULL DEFAULT ''`);
            results.push('Added credentials.group column');
        } catch { results.push('credentials.group already exists'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ADD COLUMN IF NOT EXISTS subgroup TEXT`);
            results.push('Added credentials.subgroup column');
        } catch { results.push('credentials.subgroup already exists'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ADD COLUMN IF NOT EXISTS max_uses INTEGER NOT NULL DEFAULT 1`);
            results.push('Added credentials.max_uses column');
        } catch { results.push('credentials.max_uses already exists'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE credentials ADD COLUMN IF NOT EXISTS current_uses INTEGER NOT NULL DEFAULT 0`);
            results.push('Added credentials.current_uses column');
        } catch { results.push('credentials.current_uses already exists'); }

        // Add credential group fields to product_variations
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS credential_group TEXT`);
            results.push('Added product_variations.credential_group column');
        } catch { results.push('product_variations.credential_group already exists'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS credential_subgroup TEXT`);
            results.push('Added product_variations.credential_subgroup column');
        } catch { results.push('product_variations.credential_subgroup already exists'); }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE product_variations ADD COLUMN IF NOT EXISTS max_uses_per_credential INTEGER NOT NULL DEFAULT 1`);
            results.push('Added product_variations.max_uses_per_credential column');
        } catch { results.push('product_variations.max_uses_per_credential already exists'); }

        // Add index for credential group lookups
        try {
            await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_credentials_group_subgroup ON credentials("group", subgroup)`);
            results.push('Added index: credentials(group, subgroup)');
        } catch { results.push('credentials group index already exists'); }

        if (results.length === 1) {
            results.push('All tables already exist!');
        }

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error.message,
            stack: error.stack?.substring(0, 500),
        }, { status: 500 });
    }
}
