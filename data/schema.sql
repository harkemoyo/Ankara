-- =============================================
-- Ankara Store - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    compare_at_price NUMERIC(10,2),
    description TEXT,
    collection TEXT,
    images TEXT[] DEFAULT '{}',
    colors JSONB DEFAULT '[]',
    sizes TEXT[] DEFAULT '{S,M,L,XL,2X}',
    tags TEXT[] DEFAULT '{}',
    vendor TEXT DEFAULT 'Mary Humphrey African Wear',
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id BIGSERIAL PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Settings Table (singleton - always ID=1)
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY DEFAULT 1,
    store_name TEXT DEFAULT 'Mary Humphrey African Wear',
    currency TEXT DEFAULT '£',
    logo TEXT,
    tagline TEXT,
    social_links JSONB DEFAULT '{}',
    announcement TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings row
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Products: Public read, authenticated write
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (TRUE);
CREATE POLICY "products_admin_write" ON products FOR ALL USING (auth.role() = 'authenticated');

-- Collections: Public read, authenticated write
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_public_read" ON collections FOR SELECT USING (TRUE);
CREATE POLICY "collections_admin_write" ON collections FOR ALL USING (auth.role() = 'authenticated');

-- Settings: Public read, authenticated write
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_admin_write" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- Seed Data (Optional - adds 4 sample products)
-- =============================================
INSERT INTO collections (handle, title, description, sort_order) VALUES
    ('all', 'All Products', 'Browse all our Ankara collections', 0),
    ('dresses', 'Dresses', 'Beautiful Ankara print dresses', 1),
    ('tops', 'Tops & Blouses', 'Stylish African print tops', 2),
    ('skirts', 'Skirts', 'Traditional and modern skirts', 3)
ON CONFLICT (handle) DO NOTHING;

INSERT INTO products (handle, title, price, collection, images, colors, sizes, tags, description) VALUES
(
    'ankara-print-dress',
    'Ankara Print Dress',
    85.00,
    'dresses',
    ARRAY['assets/IMG-20260622-WA0081.webp', 'assets/IMG-20260622-WA0009.webp'],
    '[{"label":"Red Print","image":"assets/IMG-20260622-WA0081.webp","hex":"#C0392B"},{"label":"Blue Print","image":"assets/IMG-20260622-WA0009.webp","hex":"#2980B9"}]'::jsonb,
    ARRAY['S','M','L','XL','2X'],
    ARRAY['dresses','ankara','new'],
    'A beautiful authentic Ankara dress with vibrant African prints.'
),
(
    'vibrant-african-tunic',
    'Vibrant African Tunic',
    60.00,
    'tops',
    ARRAY['assets/IMG-20260622-WA0030.webp','assets/IMG-20260622-WA0031.webp'],
    '[{"label":"Orange Print","image":"assets/IMG-20260622-WA0030.webp","hex":"#E67E22"}]'::jsonb,
    ARRAY['S','M','L','XL'],
    ARRAY['tops','ankara','sale'],
    'Colorful tunic perfect for any occasion.'
),
(
    'traditional-kente-skirt',
    'Traditional Kente Skirt',
    120.00,
    'skirts',
    ARRAY['assets/IMG-20260622-WA0011.webp','assets/IMG-20260622-WA0012.webp'],
    '[{"label":"Gold Kente","image":"assets/IMG-20260622-WA0011.webp","hex":"#D4AC0D"}]'::jsonb,
    ARRAY['S','M','L','XL','2X'],
    ARRAY['skirts','kente'],
    'Hand-woven Kente skirt combining tradition with modern fashion.'
),
(
    'african-print-blouse',
    'African Print Blouse',
    45.00,
    'tops',
    ARRAY['assets/IMG-20260622-WA0032.webp','assets/IMG-20260622-WA0033.webp'],
    '[{"label":"Green Print","image":"assets/IMG-20260622-WA0032.webp","hex":"#27AE60"}]'::jsonb,
    ARRAY['S','M','L','XL'],
    ARRAY['tops','ankara'],
    'Elegant African print blouse for every occasion.'
)
ON CONFLICT (handle) DO NOTHING;
