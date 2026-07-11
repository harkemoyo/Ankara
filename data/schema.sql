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
