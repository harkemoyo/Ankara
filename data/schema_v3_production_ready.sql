-- =============================================
-- Ankara Store - Enterprise Production-Ready Schema (v3)
-- Complete Shopify-Grade Database Architecture Blueprint
-- =============================================

-- 1. Products Table (With status, SEO, and audit fields)
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    compare_at_price NUMERIC(10,2),
    description TEXT,
    collection TEXT,
    product_type TEXT,
    vendor TEXT DEFAULT 'Mary Humphrey African Wear',
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'out_of_stock')),
    tags TEXT[] DEFAULT '{}',
    seo_title TEXT,
    seo_description TEXT,
    canonical_url TEXT,
    images TEXT[] DEFAULT '{}',
    colors JSONB DEFAULT '[]',
    sizes TEXT[] DEFAULT '{S,M,L,XL,2X}',
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 2. Collections Table
CREATE TABLE IF NOT EXISTS collections (
    id BIGSERIAL PRIMARY KEY,
    handle TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    sort_order INT DEFAULT 0,
    seo_title TEXT,
    seo_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Product Collections (Many-to-Many join)
CREATE TABLE IF NOT EXISTS product_collections (
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    collection_id BIGINT REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
);

-- 4. Dynamic Product Options (e.g., Size, Color, Material, Capacity)
CREATE TABLE IF NOT EXISTS product_options (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS option_values (
    id BIGSERIAL PRIMARY KEY,
    option_id BIGINT REFERENCES product_options(id) ON DELETE CASCADE,
    value TEXT NOT NULL
);

-- 5. Product Variants (Variant-level pricing and stock)
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sku TEXT UNIQUE,
    price NUMERIC(10,2),
    compare_at_price NUMERIC(10,2),
    stock INT DEFAULT 0,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inventory Movement History Log
CREATE TABLE IF NOT EXISTS inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
    change INT NOT NULL,
    reason TEXT NOT NULL, -- e.g., 'Initial Stock', 'Order #1021', 'Restock', 'Adjustment'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- 7. Metafields System (Dynamic custom fields per product)
CREATE TABLE IF NOT EXISTS metafields (
    id BIGSERIAL PRIMARY KEY,
    owner_type TEXT NOT NULL DEFAULT 'product', -- 'product', 'collection', 'variant'
    owner_id BIGINT NOT NULL,
    namespace TEXT DEFAULT 'custom',
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    value_type TEXT DEFAULT 'single_line_text_field',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_type, owner_id, namespace, key)
);

-- 8. Settings Table (Singleton)
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
