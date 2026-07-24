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
    product_type TEXT,
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
-- Reset and insert Boutique Inventory System products
TRUNCATE TABLE products RESTART IDENTITY;

INSERT INTO products (handle, title, price, compare_at_price, collection, images, colors, sizes, tags, description) VALUES
('the-nova-joggers', 'The Nova Joggers', 6000.00, NULL, 'trousers', ARRAY['assets/DSC01528.jpg', 'assets/DSC01550.jpg', 'assets/DSC01522.jpg', 'assets/DSC01514.jpg'], '[{"label":"Vibrant Ankara","image":"assets/DSC01528.jpg","hex":"#422326"}]'::jsonb, ARRAY['S','M','L'], ARRAY['trousers','joggers'], 'Complete your look with The Nova Joggers—where vibrant African design meets unmatched comfort. Crafted from premium Ankara fabric, these joggers feature a soft black fleece waistband and fleece ankle cuffs for a warm, comfortable fit. The adjustable drawstring waist lets you customize the fit, while practical side pockets add everyday functionality.'),
('the-nova-pullovers', 'The Nova Pullovers', 7000.00, NULL, 'tops', ARRAY['assets/DSC02582.jpg', 'assets/DSC02579.jpg', 'assets/DSC02554.jpg', 'assets/DSC02544.jpg'], '[{"label":"Ankara Black Fleece","image":"assets/DSC02582.jpg","hex":"#2A1719"}]'::jsonb, ARRAY['S','M','L'], ARRAY['tops','pullovers'], 'The Nova Pullover is designed for those who love bold African Fashion without compromising on comfort. It provides exceptional warmth while feeling gentle fabric along your skin. Whether you''re heading out on a chilly morning, travelling or relaxing, The Nova Pullover keeps you cozy and stylish all day long.'),
('the-helsinki-blanket', 'The Helsinki Blanket', 8000.00, 10000.00, 'accessories', ARRAY['assets/DSC02687.jpg', 'assets/DSC02689.jpg', 'assets/DSC02676.jpg', 'assets/DSC02672.jpg'], '[{"label":"Kitenge Red/Black","image":"assets/DSC02687.jpg","hex":"#78281F"}]'::jsonb, ARRAY['M','L'], ARRAY['accessories','blankets'], 'Wrap yourself in warmth with The Helsinki Blanket where African craftsmanship meets everyday comfort. Made from vibrant kitenge fabric and lined with an ultra-soft fleece, this double-layered blanket is designed to keep you warm while adding a beautiful touch of African elegance to your home or wardrobe.'),
('african-luxe-throw', 'African Luxe Throw', 8000.00, NULL, 'accessories', ARRAY['assets/DSC02676.jpg', 'assets/DSC02672.jpg', 'assets/DSC02662.jpg'], '[{"label":"Luxe Kitenge","image":"assets/DSC02676.jpg","hex":"#D4A843"}]'::jsonb, ARRAY['S','M','L'], ARRAY['accessories','throws'], 'Wrap yourself in warmth with the African Luxe Throw where African craftsmanship meets everyday comfort. Made from vibrant kitenge fabric and lined with an ultra-soft fleece, this double-layered throw is designed to keep you warm while adding a beautiful touch of African elegance to your home or wardrobe.'),
('the-nova-hoodies', 'The Nova Hoodies', 7500.00, NULL, 'tops', ARRAY['assets/DSC01687.jpg', 'assets/DSC01655.jpg', 'assets/DSC01676.jpg', 'assets/DSC01669.jpg'], '[{"label":"Ankara Fleece Hood","image":"assets/DSC01687.jpg","hex":"#E59866"}]'::jsonb, ARRAY['S','M','L'], ARRAY['tops','hoodies'], 'Stay warm and stylish with this premium Ankara Hoodie, designed for everyday comfort and a bold, fashionable look. Made from high-quality Ankara fabric and finished with a soft fleece lining, it offers warmth, durability, and a comfortable fit.'),
('the-diani-sunny-dress', 'The Diani Sunny Dress', 6000.00, NULL, 'dresses', ARRAY['assets/DSC01401.jpg', 'assets/DSC01383.jpg', 'assets/DSC01394.jpg', 'assets/DSC01389.jpg'], '[{"label":"Sunny Ankara","image":"assets/DSC01401.jpg","hex":"#D4A843"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'The Diani Sunny Dress is designed to bring joy to every moment. Crafted from vibrant Ankara fabric, this lightweight dress features a flattering, flowing silhouette that moves beautifully with you. Whether you''re strolling by the beach, enjoying brunch with friends, exploring a new city, or celebrating a special occasion.'),
('the-talisman-kimono', 'The Talisman Kimono', 7000.00, NULL, 'tops', ARRAY['assets/DSC01755.jpg', 'assets/DSC01715.jpg', 'assets/DSC01736.jpg', 'assets/DSC01729.jpg'], '[{"label":"Flowing Ankara","image":"assets/DSC01755.jpg","hex":"#C97F5F"}]'::jsonb, ARRAY['M','L'], ARRAY['tops','kimonos'], 'The Talisman Kimono is a timeless layering piece designed to elevate every outfit with effortless elegance. Crafted from premium Ankara fabric, its flowing silhouette drapes beautifully, making it perfect for every season and every occasion.'),
('noir-cape', 'Noir Cape', 8000.00, NULL, 'outerwear', ARRAY['assets/DSC02616.jpg', 'assets/DSC02608.jpg', 'assets/DSC02637.jpg'], '[{"label":"Fleece Kitenge Trim","image":"assets/DSC02616.jpg","hex":"#1C2833"}]'::jsonb, ARRAY['S','M','L'], ARRAY['outerwear','capes'], 'Wrap yourself in warmth, elegance, and effortless style. Crafted from ultra-soft, body-soothing black fleece and beautifully finished with vibrant kitenge detailing, the Noir Cape is designed for those who love comfort without compromising on style.'),
('village-market-palazzo', 'Village Market Palazzo', 6000.00, NULL, 'skirts', ARRAY['assets/DSC02056.jpg', 'assets/DSC02044.jpg', 'assets/DSC02035.jpg'], '[{"label":"Patchwork Ankara","image":"assets/DSC02056.jpg","hex":"#556B2F"}]'::jsonb, ARRAY['M','L'], ARRAY['skirts','trousers'], 'A statement piece designed for women who love bold style and effortless comfort. Crafted from two complementary Ankara prints, the Village Market Palazzo features a unique patchwork design that celebrates creativity and individuality.'),
('classic-dungarees', 'Classic Dungarees', 6500.00, NULL, 'trousers', ARRAY['assets/DSC02379.jpg', 'assets/DSC02369.jpg', 'assets/DSC02331.jpg'], '[{"label":"Classic Red/Blue","image":"assets/DSC02379.jpg","hex":"#CD6155"}]'::jsonb, ARRAY['M'], ARRAY['trousers','dungarees'], 'The Classic Dungarees combine modern style with everyday comfort. Designed with a relaxed fit and adjustable shoulder straps, they are perfect for casual outings, travel, or everyday wear.'),
('sheba-luxury-couture-gown', 'Sheba Luxury Couture Gown', 15000.00, 18000.00, 'dresses', ARRAY['assets/DSC02676.jpg', 'assets/DSC02672.jpg'], '[{"label":"Gold Ochre","image":"assets/DSC02676.jpg","hex":"#D4A843"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses','luxury'], 'An exquisite premium Ankara gown designed for special occasions, formal events, and making a majestic statement.'),
('safari-tailored-ankara-suit', 'Safari Tailored Ankara Suit', 12000.00, 14500.00, 'tops', ARRAY['assets/DSC02582.jpg', 'assets/DSC02579.jpg'], '[{"label":"Khaki Gold","image":"assets/DSC02582.jpg","hex":"#B7950B"}]'::jsonb, ARRAY['M','L','XL'], ARRAY['tops','suits'], 'Sharp, modern suit tailored from selected premium Ankara materials.'),
('monarch-artisan-evening-coat', 'Monarch Artisan Evening Coat', 14000.00, 16500.00, 'outerwear', ARRAY['assets/DSC02616.jpg', 'assets/DSC02608.jpg'], '[{"label":"Royal Ochre","image":"assets/DSC02616.jpg","hex":"#D4A843"}]'::jsonb, ARRAY['S','M','L'], ARRAY['outerwear','coats'], 'Standout luxury evening coat featuring beautiful geometric patterns.'),
('empress-geometric-maxi-dress', 'Empress Geometric Maxi Dress', 9500.00, NULL, 'dresses', ARRAY['assets/DSC01465.jpg', 'assets/DSC01428.jpg', 'assets/DSC01431.jpg', 'assets/DSC01436.jpg'], '[{"label":"Navy Geometric","image":"assets/DSC01465.jpg","hex":"#1C2833"}]'::jsonb, ARRAY['M','L'], ARRAY['dresses'], 'A stunning, bold maxi dress featuring modern geometric layouts.'),
('obsidian-geometric-wrap-skirt', 'Obsidian Geometric Wrap Skirt', 7500.00, NULL, 'skirts', ARRAY['assets/DSC02035.jpg', 'assets/DSC02018.jpg', 'assets/DSC02026.jpg', 'assets/DSC02030.jpg'], '[{"label":"Obsidian Black","image":"assets/DSC02035.jpg","hex":"#1A1818"}]'::jsonb, ARRAY['S','M','L'], ARRAY['skirts'], 'Premium wrap skirt with eye-catching contrast detailing.'),
('crimson-bloom-peplum-top', 'Crimson Bloom Peplum Top', 6500.00, NULL, 'tops', ARRAY['assets/DSC02267.jpg', 'assets/DSC02292.jpg'], '[{"label":"Crimson Red","image":"assets/DSC02267.jpg","hex":"#A93226"}]'::jsonb, ARRAY['M','L'], ARRAY['tops'], 'Flattering peplum design top that transitions smoothly from day wear to evening events.'),
('indigo-sunburst-shift-dress', 'Indigo Sunburst Shift Dress', 8000.00, NULL, 'dresses', ARRAY['assets/DSC02453.jpg', 'assets/DSC02476.jpg', 'assets/DSC02456.jpg', 'assets/DSC02461.jpg'], '[{"label":"Indigo Blue","image":"assets/DSC02453.jpg","hex":"#2471A3"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'Easygoing, highly stylish shift dress detailed with beautiful indigo sunburst motifs.'),
('heritage-woven-ball-gown', 'Heritage Woven Ball Gown', 16000.00, NULL, 'dresses', ARRAY['assets/DSC02662.jpg', 'assets/DSC02652.jpg'], '[{"label":"Imperial Gold","image":"assets/DSC02662.jpg","hex":"#F1C40F"}]'::jsonb, ARRAY['M','L'], ARRAY['dresses','luxury'], 'Majestic ball gown designed for high-profile red carpets and galas.'),
('amber-sunburst-pleated-dress', 'Amber Sunburst Pleated Dress', 10500.00, NULL, 'dresses', ARRAY['assets/DSC01394.jpg', 'assets/DSC01389.jpg', 'assets/DSC01390.jpg'], '[{"label":"Amber Gold","image":"assets/DSC01394.jpg","hex":"#F39C12"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'Pleated dress styled in glowing amber sunset colors for a vibrant, warm look.'),
('golden-sahara-evening-gown', 'Golden Sahara Evening Gown', 14500.00, NULL, 'dresses', ARRAY['assets/DSC01410.jpg', 'assets/DSC01406.jpg', 'assets/DSC01412.jpg'], '[{"label":"Golden Ochre","image":"assets/DSC01410.jpg","hex":"#D4AC0D"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses','luxury'], 'High-end evening gown radiating the rich colors of the Sahara sunset.'),
('nile-delta-silk-kaftan', 'Nile Delta Silk Kaftan', 11000.00, NULL, 'dresses', ARRAY['assets/DSC01444.jpg', 'assets/DSC01438.jpg', 'assets/DSC01448.jpg', 'assets/DSC01450.jpg'], '[{"label":"Nile Blue","image":"assets/DSC01444.jpg","hex":"#2980B9"}]'::jsonb, ARRAY['M','L'], ARRAY['dresses','kaftan'], 'Luxurious, flowing silk-blend kaftan featuring colors inspired by the Nile Delta.'),
('tribal-dynasty-maxi-dress', 'Tribal Dynasty Maxi Dress', 11500.00, NULL, 'dresses', ARRAY['assets/DSC01485.jpg', 'assets/DSC01479.jpg', 'assets/DSC01482.jpg'], '[{"label":"Tribal Ochre","image":"assets/DSC01485.jpg","hex":"#B9770E"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'A magnificent dress showcasing the heritage patterns of East African craftsmanship.'),
('savanna-gold-tailored-jacket', 'Savanna Gold Tailored Jacket', 12000.00, NULL, 'tops', ARRAY['assets/DSC01507.jpg', 'assets/DSC01504.jpg', 'assets/DSC01499.jpg'], '[{"label":"Savanna Gold","image":"assets/DSC01507.jpg","hex":"#D68910"}]'::jsonb, ARRAY['M','L'], ARRAY['tops','jackets'], 'Exquisite gold-patterned jacket designed to add a premium cultural flair.'),
('emerald-patterned-trench-coat', 'Emerald Patterned Trench Coat', 15500.00, NULL, 'outerwear', ARRAY['assets/DSC01565.jpg', 'assets/DSC01557.jpg', 'assets/DSC01560.jpg', 'assets/DSC01562.jpg'], '[{"label":"Emerald Green","image":"assets/DSC01565.jpg","hex":"#196F3D"}]'::jsonb, ARRAY['S','M','L'], ARRAY['outerwear','coats'], 'Add statement protection against cold breezes with this heavy cotton patterned trench coat.'),
('royal-chevron-silk-robe', 'Royal Chevron Silk Robe', 10000.00, NULL, 'dresses', ARRAY['assets/DSC01609.jpg', 'assets/DSC01597.jpg'], '[{"label":"Royal Red","image":"assets/DSC01609.jpg","hex":"#922B21"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses','robes'], 'Unwind in royal style with this premium silk-blend lounger robe.'),
('imperial-kente-cape-gown', 'Imperial Kente Cape Gown', 16500.00, NULL, 'dresses', ARRAY['assets/DSC01676.jpg', 'assets/DSC01669.jpg', 'assets/DSC01674.jpg', 'assets/DSC01678.jpg'], '[{"label":"Kente Gold","image":"assets/DSC01676.jpg","hex":"#F4D03F"}]'::jsonb, ARRAY['M','L'], ARRAY['dresses','luxury'], 'Make a grand entrance with this cape-sleeved gown detailed with heritage Kente structures.'),
('flame-earth-wave-midi-dress', 'Flame Earth Wave Midi Dress', 9800.00, NULL, 'dresses', ARRAY['assets/DSC01736.jpg', 'assets/DSC01729.jpg', 'assets/DSC01733.jpg'], '[{"label":"Flame Orange","image":"assets/DSC01736.jpg","hex":"#DC7633"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'Vibrant orange sunset dress crafted for brunches, sunny travel, and dates.'),
('midnight-ankara-gala-dress', 'Midnight Ankara Gala Dress', 14000.00, NULL, 'dresses', ARRAY['assets/DSC01814.jpg', 'assets/DSC01805.jpg', 'assets/DSC01806.jpg', 'assets/DSC01819.jpg'], '[{"label":"Midnight Black","image":"assets/DSC01814.jpg","hex":"#1B2631"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses','luxury'], 'Heavy dark-base Ankara print dress designed to stun under evening gala lighting.'),
('copper-sunburst-wrap-top', 'Copper Sunburst Wrap Top', 7000.00, NULL, 'tops', ARRAY['assets/DSC01878.jpg', 'assets/DSC01866.jpg', 'assets/DSC01872.jpg', 'assets/DSC01882.jpg'], '[{"label":"Copper Gold","image":"assets/DSC01878.jpg","hex":"#BA4A00"}]'::jsonb, ARRAY['S','M','L'], ARRAY['tops'], 'Versatile wrap top with copper-orange Ankara prints. Pairs beautifully with high-waisted pants.'),
('zulu-monarch-printed-gown', 'Zulu Monarch Printed Gown', 13500.00, NULL, 'dresses', ARRAY['assets/DSC01946.jpg', 'assets/DSC01932.jpg', 'assets/DSC01924.jpg', 'assets/DSC01950.jpg'], '[{"label":"Zulu Blue","image":"assets/DSC02874.jpg","hex":"#2874A6"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'Zulu Monarch Gown inspired patterns and flowing long sleeves.'),
('obsidian-gold-fringe-dress', 'Obsidian Gold Fringe Dress', 12500.00, NULL, 'dresses', ARRAY['assets/DSC02092.jpg', 'assets/DSC02082.jpg', 'assets/DSC02080.jpg', 'assets/DSC02088.jpg'], '[{"label":"Obsidian Gold","image":"assets/DSC02092.jpg","hex":"#17202A"}]'::jsonb, ARRAY['S','M','L'], ARRAY['dresses'], 'Unique dark dress detailed with golden Ankara highlights.'),
('coral-bloom-flared-top', 'Coral Bloom Flared Top', 7000.00, NULL, 'tops', ARRAY['assets/DSC02196.jpg', 'assets/DSC02190.jpg', 'assets/DSC02192.jpg', 'assets/DSC02203.jpg'], '[{"label":"Coral Red","image":"assets/DSC02196.jpg","hex":"#CD6155"}]'::jsonb, ARRAY['S','M','L'], ARRAY['tops'], 'Flared sleeves top highlighted with bright coral flower patterns.'),
('heritage-kente-evening-suit', 'Heritage Kente Evening Suit', 14000.00, NULL, 'tops', ARRAY['assets/DSC02507.jpg', 'assets/DSC02495.jpg', 'assets/DSC02498.jpg', 'assets/DSC02502.jpg'], '[{"label":"Kente Red","image":"assets/DSC02507.jpg","hex":"#A93226"}]'::jsonb, ARRAY['M','L','XL'], ARRAY['tops','suits'], 'Richly patterned heritage Kente evening suit, perfect for corporate and formal functions.'),
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
