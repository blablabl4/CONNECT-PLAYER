-- Create product_variations table
CREATE TABLE IF NOT EXISTS product_variations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "30 Dias", "1 Tela", etc.
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  duration TEXT, -- "30 dias", "1 ano"
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add variation_id to credentials
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL;

-- Add variation_id and variation_name to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS variation_name TEXT;

-- Policy for product_variations (public read, admin write)
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public variations are viewable by everyone" ON product_variations
  FOR SELECT USING (true);

CREATE POLICY "Variations are insertable by admin" ON product_variations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Variations are updateable by admin" ON product_variations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Variations are deletable by admin" ON product_variations
  FOR DELETE USING (auth.role() = 'authenticated');
