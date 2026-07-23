-- =============================================
-- Shopify-Parity Architecture Schema Update (v2)
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Ensure product_type exists on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT;

-- 2. Product Collections Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS product_collections (
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    collection_id BIGINT REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
);

-- 3. Product Images Table (Normalized images)
CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    position INT DEFAULT 0,
    alt_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Product Variants Table (Normalized variants)
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    title TEXT,
    sku TEXT,
    price NUMERIC(10,2),
    compare_at_price NUMERIC(10,2),
    size TEXT,
    color TEXT,
    color_hex TEXT,
    stock INT DEFAULT 0,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE product_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_collections_public_read" ON product_collections FOR SELECT USING (TRUE);
CREATE POLICY "product_collections_admin_write" ON product_collections FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_images_public_read" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "product_images_admin_write" ON product_images FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_variants_public_read" ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY "product_variants_admin_write" ON product_variants FOR ALL USING (auth.role() = 'authenticated');
