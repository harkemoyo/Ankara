-- Run this in Supabase SQL Editor to create the missing product_variants table

CREATE TABLE IF NOT EXISTS product_variants (
    id               BIGSERIAL PRIMARY KEY,
    product_id       BIGINT REFERENCES products(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    option1          TEXT,
    option2          TEXT,
    option3          TEXT,
    sku              TEXT UNIQUE,
    price            NUMERIC(10,2),
    compare_at_price NUMERIC(10,2),
    stock            INT DEFAULT 0,
    image            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id         BIGSERIAL PRIMARY KEY,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
    change     INT  NOT NULL,
    reason     TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "product_variants_public_read" ON product_variants FOR SELECT USING (TRUE);
CREATE POLICY IF NOT EXISTS "product_variants_admin_write" ON product_variants FOR ALL USING (auth.role() = 'authenticated');
