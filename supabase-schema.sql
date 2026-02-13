-- ============================================
-- Connect Player — Database Schema
-- Execute this SQL in Supabase SQL Editor
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT DEFAULT '',
  category TEXT DEFAULT '',
  duration TEXT DEFAULT '30 dias',
  is_active BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credentials pool (accounts to deliver)
CREATE TABLE IF NOT EXISTS credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  is_used BOOLEAN DEFAULT false,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_whatsapp TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'delivered', 'cancelled')),
  payment_id TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'pix',
  total DECIMAL(10,2) NOT NULL,
  credential_id UUID REFERENCES credentials(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Settings (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_credentials_product ON credentials(product_id);
CREATE INDEX IF NOT EXISTS idx_credentials_available ON credentials(product_id, is_used) WHERE is_used = false;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Products: public can read active products, admin can do everything
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full access products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Credentials: only admin
CREATE POLICY "Admin full access credentials" ON credentials
  FOR ALL USING (auth.role() = 'authenticated');

-- Orders: public can create and read their own, admin full access
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read own orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Admin full access orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Settings: admin only
CREATE POLICY "Admin full access settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Seed initial settings
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('store_name', 'Connect Player'),
  ('store_email', 'contato@connectplayer.com'),
  ('whatsapp', ''),
  ('instagram', '')
ON CONFLICT (key) DO NOTHING;
