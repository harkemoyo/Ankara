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

INSERT INTO products (handle, title, price, compare_at_price, collection, images, colors, sizes, tags, description) VALUES
('sheba-luxury-couture-gown', 'Sheba Luxury Couture Gown', 245.00, 295.00, 'dresses', ARRAY['assets/DSC02676.jpg', 'assets/DSC02672.jpg'], '[{"label":"Gold Ochre","image":"assets/DSC02676.jpg","hex":"#D4A843"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses','luxury'], 'Authentic African wear.'),
('safari-tailored-ankara-suit', 'Safari Tailored Ankara Suit', 210.00, 260.00, 'tops', ARRAY['assets/DSC02582.jpg', 'assets/DSC02579.jpg'], '[{"label":"Khaki Gold","image":"assets/DSC02582.jpg","hex":"#B7950B"}]'::jsonb, ARRAY['M','L','XL','2X'], ARRAY['tops','suits'], 'Authentic African wear.'),
('monarch-artisan-evening-coat', 'Monarch Artisan Evening Coat', 240.00, 290.00, 'dresses', ARRAY['assets/DSC02616.jpg', 'assets/DSC02608.jpg'], '[{"label":"Royal Ochre","image":"assets/DSC02616.jpg","hex":"#D4A843"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['coats','dresses'], 'Authentic African wear.'),
('royal-sunburst-ankara-gown', 'Royal Sunburst Ankara Gown', 145.00, 185.00, 'dresses', ARRAY['assets/DSC01401.jpg', 'assets/DSC01383.jpg'], '[{"label":"Gold Ochre","image":"assets/DSC01401.jpg","hex":"#D4A843"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('empress-geometric-maxi-dress', 'Empress Geometric Maxi Dress', 160.00, 195.00, 'dresses', ARRAY['assets/DSC01465.jpg', 'assets/DSC01428.jpg'], '[{"label":"Navy Geometric","image":"assets/DSC01465.jpg","hex":"#1C2833"}]'::jsonb, ARRAY['M','L','XL','2X'], ARRAY['dresses'], 'Authentic African wear.'),
('terracotta-earth-wave-kaftan', 'Terracotta Earth Wave Kaftan', 130.00, NULL, 'dresses', ARRAY['assets/DSC01755.jpg', 'assets/DSC01715.jpg'], '[{"label":"Terracotta","image":"assets/DSC01755.jpg","hex":"#C97F5F"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses','kaftan'], 'Authentic African wear.'),
('savannah-botanical-blazer-set', 'Savannah Botanical Blazer Set', 190.00, 230.00, 'tops', ARRAY['assets/DSC01528.jpg', 'assets/DSC01550.jpg'], '[{"label":"Botanical Green","image":"assets/DSC01528.jpg","hex":"#2E5B37"}]'::jsonb, ARRAY['M','L','XL'], ARRAY['tops'], 'Authentic African wear.'),
('royal-kente-artisan-kimono', 'Royal Kente Artisan Kimono', 125.00, 155.00, 'tops', ARRAY['assets/DSC01687.jpg', 'assets/DSC01655.jpg'], '[{"label":"Kente Gold","image":"assets/DSC01687.jpg","hex":"#E59866"}]'::jsonb, ARRAY['S','M','L','XL','2X'], ARRAY['tops'], 'Authentic African wear.'),
('obsidian-geometric-wrap-skirt', 'Obsidian Geometric Wrap Skirt', 95.00, 120.00, 'skirts', ARRAY['assets/DSC02035.jpg', 'assets/DSC02018.jpg'], '[{"label":"Obsidian Black","image":"assets/DSC02035.jpg","hex":"#1A1818"}]'::jsonb, ARRAY['S','M','L'], ARRAY['skirts'], 'Authentic African wear.'),
('crimson-bloom-peplum-top', 'Crimson Bloom Peplum Top', 85.00, NULL, 'tops', ARRAY['assets/DSC02267.jpg', 'assets/DSC02292.jpg'], '[{"label":"Crimson Red","image":"assets/DSC02267.jpg","hex":"#A93226"}]'::jsonb, ARRAY['M','L','XL'], ARRAY['tops'], 'Authentic African wear.'),
('indigo-sunburst-shift-dress', 'Indigo Sunburst Shift Dress', 110.00, 140.00, 'dresses', ARRAY['assets/DSC02453.jpg', 'assets/DSC02476.jpg'], '[{"label":"Indigo Blue","image":"assets/DSC02453.jpg","hex":"#2471A3"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('heritage-woven-ball-gown', 'Heritage Woven Ball Gown', 220.00, NULL, 'dresses', ARRAY['assets/DSC02662.jpg', 'assets/DSC02657.jpg'], '[{"label":"Imperial Gold","image":"assets/DSC02662.jpg","hex":"#F1C40F"}]'::jsonb, ARRAY['M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('sheba-royal-luxury-robe', 'Sheba Royal Luxury Robe', 185.00, 220.00, 'dresses', ARRAY['assets/DSC02687.jpg', 'assets/DSC02689.jpg'], '[{"label":"Deep Burgundy","image":"assets/DSC02687.jpg","hex":"#78281F"}]'::jsonb, ARRAY['S','M','L','XL','2X'], ARRAY['dresses'], 'Authentic African wear.'),
('savannah-printed-palazzo-pants', 'Savannah Printed Palazzo Pants', 98.00, 125.00, 'skirts', ARRAY['assets/DSC02056.jpg', 'assets/DSC02044.jpg'], '[{"label":"Savannah Olive","image":"assets/DSC02056.jpg","hex":"#556B2F"}]'::jsonb, ARRAY['S','M','L'], ARRAY['skirts'], 'Authentic African wear.'),
('african-queen-peplum-blouse', 'African Queen Peplum Blouse', 89.00, NULL, 'tops', ARRAY['assets/DSC02142.jpg', 'assets/DSC02133.jpg'], '[{"label":"Amber Red","image":"assets/DSC02142.jpg","hex":"#900C3F"}]'::jsonb, ARRAY['M','L','XL'], ARRAY['tops'], 'Authentic African wear.'),
('empress-sunset-wrap-dress', 'Empress Sunset Wrap Dress', 155.00, 190.00, 'dresses', ARRAY['assets/DSC02331.jpg', 'assets/DSC02317.jpg'], '[{"label":"Sunset Gold","image":"assets/DSC02331.jpg","hex":"#E67E22"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('kente-structure-designer-blazer', 'Kente Structure Designer Blazer', 175.00, 210.00, 'tops', ARRAY['assets/DSC02554.jpg', 'assets/DSC02544.jpg'], '[{"label":"Kente Red","image":"assets/DSC02554.jpg","hex":"#C0392B"}]'::jsonb, ARRAY['M','L','XL','2X'], ARRAY['tops'], 'Authentic African wear.'),
('amber-sunburst-pleated-dress', 'Amber Sunburst Pleated Dress', 150.00, 180.00, 'dresses', ARRAY['assets/DSC01394.jpg', 'assets/DSC01389.jpg'], '[{"label":"Amber Gold","image":"assets/DSC01394.jpg","hex":"#F39C12"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('golden-sahara-evening-gown', 'Golden Sahara Evening Gown', 230.00, 270.00, 'dresses', ARRAY['assets/DSC01410.jpg', 'assets/DSC01406.jpg'], '[{"label":"Golden Ochre","image":"assets/DSC01410.jpg","hex":"#D4AC0D"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('nile-delta-silk-kaftan', 'Nile Delta Silk Kaftan', 165.00, NULL, 'dresses', ARRAY['assets/DSC01444.jpg', 'assets/DSC01438.jpg'], '[{"label":"Nile Blue","image":"assets/DSC01444.jpg","hex":"#2980B9"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'Authentic African wear.'),
('tribal-dynasty-maxi-dress', 'Tribal Dynasty Maxi Dress', 175.00, 210.00, 'dresses', ARRAY['assets/DSC01485.jpg', 'assets/DSC01479.jpg'], '[{"label":"Tribal Ochre","image":"assets/DSC01485.jpg","hex":"#B9770E"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('savanna-gold-tailored-jacket', 'Savanna Gold Tailored Jacket', 195.00, 235.00, 'tops', ARRAY['assets/DSC01507.jpg', 'assets/DSC01504.jpg'], '[{"label":"Savanna Gold","image":"assets/DSC01507.jpg","hex":"#D68910"}]'::jsonb, ARRAY['M','L','XL'], ARRAY['tops'], 'Authentic African wear.'),
('emerald-patterned-trench-coat', 'Emerald Patterned Trench Coat', 250.00, 300.00, 'dresses', ARRAY['assets/DSC01565.jpg', 'assets/DSC01557.jpg'], '[{"label":"Emerald Green","image":"assets/DSC01565.jpg","hex":"#196F3D"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('royal-chevron-silk-robe', 'Royal Chevron Silk Robe', 140.00, NULL, 'dresses', ARRAY['assets/DSC01609.jpg', 'assets/DSC01597.jpg'], '[{"label":"Royal Red","image":"assets/DSC01609.jpg","hex":"#922B21"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('imperial-kente-cape-gown', 'Imperial Kente Cape Gown', 260.00, 310.00, 'dresses', ARRAY['assets/DSC01676.jpg', 'assets/DSC01669.jpg'], '[{"label":"Kente Gold","image":"assets/DSC01676.jpg","hex":"#F4D03F"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('flame-earth-wave-midi-dress', 'Flame Earth Wave Midi Dress', 135.00, 165.00, 'dresses', ARRAY['assets/DSC01736.jpg', 'assets/DSC01729.jpg'], '[{"label":"Flame Orange","image":"assets/DSC01736.jpg","hex":"#DC7633"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('midnight-ankara-gala-dress', 'Midnight Ankara Gala Dress', 215.00, 250.00, 'dresses', ARRAY['assets/DSC01814.jpg', 'assets/DSC01805.jpg'], '[{"label":"Midnight Black","image":"assets/DSC01814.jpg","hex":"#1B2631"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('copper-sunburst-wrap-top', 'Copper Sunburst Wrap Top', 92.00, NULL, 'tops', ARRAY['assets/DSC01878.jpg', 'assets/DSC01866.jpg'], '[{"label":"Copper Gold","image":"assets/DSC01878.jpg","hex":"#BA4A00"}]'::jsonb, ARRAY['S','M','L'], ARRAY['tops'], 'Authentic African wear.'),
('zulu-monarch-printed-gown', 'Zulu Monarch Printed Gown', 205.00, 245.00, 'dresses', ARRAY['assets/DSC01946.jpg', 'assets/DSC01932.jpg'], '[{"label":"Zulu Blue","image":"assets/DSC02874.jpg","hex":"#2874A6"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('obsidian-gold-fringe-dress', 'Obsidian Gold Fringe Dress', 180.00, 220.00, 'dresses', ARRAY['assets/DSC02092.jpg', 'assets/DSC02082.jpg'], '[{"label":"Obsidian Gold","image":"assets/DSC02092.jpg","hex":"#17202A"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('coral-bloom-flared-top', 'Coral Bloom Flared Top', 95.00, NULL, 'tops', ARRAY['assets/DSC02196.jpg', 'assets/DSC02190.jpg'], '[{"label":"Coral Red","image":"assets/DSC02196.jpg","hex":"#CD6155"}]'::jsonb, ARRAY['S','M','L'], ARRAY['tops'], 'Authentic African wear.'),
('safari-sunset-silk-jumpsuit', 'Safari Sunset Silk Jumpsuit', 190.00, 225.00, 'dresses', ARRAY['assets/DSC02379.jpg', 'assets/DSC02369.jpg'], '[{"label":"Sunset Gold","image":"assets/DSC02379.jpg","hex":"#E59866"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.'),
('heritage-kente-evening-suit', 'Heritage Kente Evening Suit', 225.00, 265.00, 'tops', ARRAY['assets/DSC02507.jpg', 'assets/DSC02495.jpg'], '[{"label":"Kente Red","image":"assets/DSC02507.jpg","hex":"#A93226"}]'::jsonb, ARRAY['M','L','XL','2X'], ARRAY['tops'], 'Authentic African wear.'),
('royal-empress-velvet-gown', 'Royal Empress Velvet Gown', 270.00, 320.00, 'dresses', ARRAY['assets/DSC02637.jpg', 'assets/DSC02628.jpg'], '[{"label":"Empress Gold","image":"assets/DSC02637.jpg","hex":"#F4D03F"}]'::jsonb, ARRAY['S','M','L','XL'], ARRAY['dresses'], 'Authentic African wear.')
ON CONFLICT (handle) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  collection = EXCLUDED.collection,
  images = EXCLUDED.images,
  colors = EXCLUDED.colors,
  sizes = EXCLUDED.sizes,
  tags = EXCLUDED.tags,
  description = EXCLUDED.description;

-- =============================================
-- MIGRATION 2: Orders System
-- Run this AFTER Migration 1 above
-- =============================================

-- 4. Orders Table
-- One row per placed order. Customer info is snapshotted here.
-- customer_user_id is NULL for guest checkouts (Auth users link optionally).
CREATE TABLE IF NOT EXISTS orders (
    id              BIGSERIAL PRIMARY KEY,
    order_number    TEXT UNIQUE NOT NULL,       -- e.g. "ANK-1001"
    status          TEXT NOT NULL DEFAULT 'pending',
                                                -- pending | paid | fulfilled | cancelled
    -- Customer info (snapshotted at checkout)
    customer_email  TEXT NOT NULL,
    customer_name   TEXT NOT NULL,
    customer_phone  TEXT,
    customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- Shipping address (snapshotted)
    shipping_address JSONB NOT NULL DEFAULT '{}',
    -- Financials
    subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_cost   NUMERIC(10,2) NOT NULL DEFAULT 0,
    total           NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT '£',
    -- Payment
    payment_provider TEXT,                      -- e.g. 'paystack'
    payment_ref     TEXT,                       -- Paystack transaction reference
    paid_at         TIMESTAMPTZ,
    -- Fulfillment
    fulfilled_at    TIMESTAMPTZ,
    notes           TEXT,                       -- Internal admin notes
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items Table
-- One row per line item. Product title/price are SNAPSHOTTED so historical
-- orders are never corrupted by future product edits (exactly how Shopify does it).
CREATE TABLE IF NOT EXISTS order_items (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
    -- Snapshot fields (never change even if product is edited)
    product_handle  TEXT NOT NULL,
    product_title   TEXT NOT NULL,
    variant_size    TEXT,
    variant_color   TEXT,
    unit_price      NUMERIC(10,2) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    line_total      NUMERIC(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
    image           TEXT
);

-- Index for fast order lookup by customer email
CREATE INDEX IF NOT EXISTS idx_orders_email  ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =============================================
-- AUTO-INCREMENT ORDER NUMBER (ANK-1001, ANK-1002 …)
-- =============================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1001;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number := 'ANK-' || nextval('order_number_seq')::TEXT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_number ON orders;
CREATE TRIGGER trg_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();

-- =============================================
-- RLS FOR ORDERS — Guest + Admin Model
-- =============================================

ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Admins can do everything on orders
-- Admin is identified by app_metadata->>'role' = 'admin'
-- (Set this via Supabase Dashboard → Auth → Users → Edit user → app_metadata)
CREATE POLICY "orders_admin_all" ON orders
    FOR ALL
    USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "order_items_admin_all" ON order_items
    FOR ALL
    USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Authenticated customers can see THEIR OWN orders only
CREATE POLICY "orders_owner_read" ON orders
    FOR SELECT
    USING (auth.uid() = customer_user_id);

CREATE POLICY "order_items_owner_read" ON order_items
    FOR SELECT
    USING (
        order_id IN (
            SELECT id FROM orders WHERE customer_user_id = auth.uid()
        )
    );

-- Guest checkout: INSERT is allowed with the service role key ONLY
-- (your Express server calls Supabase with the SERVICE KEY, not the anon key,
--  to create the order after Paystack confirms payment)
-- The anon key cannot insert orders directly — this prevents fraud.
-- No anon INSERT policy is created intentionally.

-- =============================================
-- FIX ADMIN RLS ON products / collections / settings
-- Replace the old "auth.role() = 'authenticated'" policies
-- with the correct JWT app_metadata check
-- =============================================

-- Products
DROP POLICY IF EXISTS "products_admin_write"    ON products;
CREATE POLICY "products_admin_write" ON products
    FOR ALL
    USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Collections
DROP POLICY IF EXISTS "collections_admin_write" ON collections;
CREATE POLICY "collections_admin_write" ON collections
    FOR ALL
    USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Settings
DROP POLICY IF EXISTS "settings_admin_write"    ON settings;
CREATE POLICY "settings_admin_write" ON settings
    FOR ALL
    USING  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =============================================
-- HOW TO SET UP YOUR ADMIN USER
-- (Run this in Supabase SQL Editor after creating
--  your admin user via Dashboard → Auth → Users)
-- =============================================
-- Replace 'your-admin-user-uuid-here' with the real UUID
-- from the Auth → Users table.
--
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE id = 'your-admin-user-uuid-here';
