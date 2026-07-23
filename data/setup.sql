-- =====================================================================
-- Ankara / Mary Humphrey African Wear — Safe Master Migration SQL
-- Guaranteed 100% Non-Destructive Migration Script.
-- Safe to run against existing databases with live data.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- 1. SETTINGS (singleton row — all store config lives here)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
    id               INT PRIMARY KEY DEFAULT 1,
    store_name       TEXT DEFAULT 'Mary Humphrey African Wear',
    store_email      TEXT DEFAULT 'info@maryhumphreywear.org',
    support_email    TEXT DEFAULT 'info@maryhumphreywear.org',
    phone            TEXT,
    currency         TEXT DEFAULT 'KES',
    timezone         TEXT DEFAULT 'Africa/Nairobi',
    logo_url         TEXT,
    favicon_url      TEXT,
    announcement     TEXT,
    tagline          TEXT DEFAULT 'Luxury African Fashion',
    facebook         TEXT,
    instagram        TEXT,
    tiktok           TEXT,
    whatsapp         TEXT,
    meta_title       TEXT DEFAULT 'Mary Humphrey African Wear',
    meta_description TEXT DEFAULT 'Handcrafted Ankara fashion from Nairobi. Shop dresses, joggers, hoodies and more.',
    email_header_color TEXT DEFAULT '#422326',
    email_footer_text  TEXT DEFAULT '© 2026 Mary Humphrey African Wear. All rights reserved.',
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add any missing settings columns if table already existed
ALTER TABLE settings ADD COLUMN IF NOT EXISTS store_email TEXT DEFAULT 'info@maryhumphreywear.org';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS support_email TEXT DEFAULT 'info@maryhumphreywear.org';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Nairobi';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS announcement TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT 'Luxury African Fashion';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS email_header_color TEXT DEFAULT '#422326';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS email_footer_text TEXT DEFAULT '© 2026 Mary Humphrey African Wear. All rights reserved.';

-- Seed default row if missing (does not overwrite existing row)
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────
-- 2. PRODUCTS (Preserves all existing rows, adds missing columns safely)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id               BIGSERIAL PRIMARY KEY,
    handle           TEXT UNIQUE NOT NULL,
    title            TEXT NOT NULL,
    price            NUMERIC(10,2) NOT NULL DEFAULT 0,
    compare_at_price NUMERIC(10,2),
    description      TEXT,
    product_type     TEXT,
    vendor           TEXT DEFAULT 'Mary Humphrey African Wear',
    status           TEXT DEFAULT 'active',
    tags             TEXT[] DEFAULT '{}',
    seo_title        TEXT,
    seo_description  TEXT,
    images           TEXT[] DEFAULT '{}',
    colors           JSONB  DEFAULT '[]',
    sizes            TEXT[] DEFAULT '{S,M,L,XL,2XL}',
    in_stock         BOOLEAN DEFAULT TRUE,
    inventory_quantity INT DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add missing columns to existing products table without touching data
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_quantity INT DEFAULT 0;


-- ─────────────────────────────────────────────────────────────────────
-- 3. COLLECTIONS (Preserves all existing rows, adds missing columns safely)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
    id               BIGSERIAL PRIMARY KEY,
    handle           TEXT UNIQUE NOT NULL,
    title            TEXT NOT NULL,
    description      TEXT,
    image            TEXT,
    sort_order       INT  DEFAULT 0,
    status           TEXT DEFAULT 'active',
    seo_title        TEXT,
    seo_description  TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collections ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE collections ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Seed starter collections if missing (does not overwrite existing handles)
INSERT INTO collections (handle, title, sort_order) VALUES
  ('new-arrivals', 'New Arrivals', 0),
  ('women',        'Women',       1),
  ('men',          'Men',         2),
  ('sale',         'Sale',        3)
ON CONFLICT (handle) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────
-- 4. PRODUCT ↔ COLLECTION (many-to-many join)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_collections (
    product_id    BIGINT REFERENCES products(id)    ON DELETE CASCADE,
    collection_id BIGINT REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, collection_id)
);


-- ─────────────────────────────────────────────────────────────────────
-- 5. PRODUCT IMAGES (separate gallery table)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
    id         BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    alt        TEXT,
    position   INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────
-- 6. PRODUCT VARIANTS (size/color stock per product)
-- ─────────────────────────────────────────────────────────────────────
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


-- ─────────────────────────────────────────────────────────────────────
-- 7. INVENTORY MOVEMENTS LOG
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_movements (
    id         BIGSERIAL PRIMARY KEY,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
    change     INT  NOT NULL,
    reason     TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────
-- 8. CUSTOMERS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          TEXT UNIQUE NOT NULL,
    first_name     TEXT,
    last_name      TEXT,
    phone          TEXT,
    accepts_marketing BOOLEAN DEFAULT FALSE,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────
-- 9. ORDERS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number     TEXT UNIQUE,
    status           TEXT DEFAULT 'pending'
                       CHECK (status IN ('pending','paid','fulfilled','cancelled','refunded','failed')),
    customer_email   TEXT NOT NULL,
    customer_name    TEXT,
    customer_phone   TEXT,
    customer_user_id UUID REFERENCES customers(id),
    shipping_address JSONB DEFAULT '{}',
    subtotal         NUMERIC(10,2),
    shipping_cost    NUMERIC(10,2) DEFAULT 0,
    total            NUMERIC(10,2),
    currency         TEXT DEFAULT 'KES',
    payment_provider TEXT DEFAULT 'paystack',
    payment_ref      TEXT,
    tracking_number  TEXT,
    fulfillment_note TEXT,
    paid_at          TIMESTAMPTZ,
    fulfilled_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate order_number trigger: ORD-0001, ORD-0002…
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    seq_val INT;
BEGIN
    SELECT COUNT(*) + 1 INTO seq_val FROM orders;
    NEW.order_number := 'ORD-' || LPAD(seq_val::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
    EXECUTE FUNCTION generate_order_number();


-- ─────────────────────────────────────────────────────────────────────
-- 10. ORDER ITEMS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id      BIGINT,
    product_handle  TEXT,
    product_title   TEXT NOT NULL,
    variant_size    TEXT,
    variant_color   TEXT,
    variant_title   TEXT,
    unit_price      NUMERIC(10,2) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    image           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────────────────────
-- 11. EMAIL TEMPLATES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
    id          BIGSERIAL PRIMARY KEY,
    slug        TEXT UNIQUE NOT NULL,
    name        TEXT NOT NULL,
    subject     TEXT NOT NULL,
    html_body   TEXT NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default templates safely
INSERT INTO email_templates (slug, name, subject, html_body) VALUES
(
  'order_confirmation',
  'Order Confirmation',
  'Order Confirmation #{{order_number}} – Mary Humphrey African Wear',
  '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:{{email_header_color}};padding:20px;text-align:center;">
    <h1 style="color:#fff;margin:0;">{{store_name}}</h1>
  </div>
  <div style="padding:30px 20px;">
    <h2>Thank You for Your Order!</h2>
    <p>Hi {{customer_name}},</p>
    <p>We''re thrilled to confirm your order <strong>#{{order_number}}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr style="background:#f5f5f5;">
        <td style="padding:10px;border:1px solid #eee;"><strong>Order Number</strong></td>
        <td style="padding:10px;border:1px solid #eee;">#{{order_number}}</td>
      </tr>
      <tr>
        <td style="padding:10px;border:1px solid #eee;"><strong>Total Paid</strong></td>
        <td style="padding:10px;border:1px solid #eee;">{{currency}} {{total}}</td>
      </tr>
      <tr style="background:#f5f5f5;">
        <td style="padding:10px;border:1px solid #eee;"><strong>Shipping To</strong></td>
        <td style="padding:10px;border:1px solid #eee;">{{shipping_address}}</td>
      </tr>
    </table>
    <p>We will notify you as soon as your luxury Ankara items have been shipped!</p>
  </div>
  <div style="background:#f9f9f9;padding:15px;text-align:center;font-size:12px;color:#777;">
    {{email_footer_text}}
  </div>
  </body></html>'
),
(
  'contact_notification',
  'Contact Form Notification',
  'New Inquiry from {{name}} – Mary Humphrey African Wear',
  '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;padding:20px;">
  <h2>New Contact Inquiry</h2>
  <p><strong>From:</strong> {{name}}</p>
  <p><strong>Email:</strong> {{email}}</p>
  <p><strong>Message:</strong></p>
  <blockquote style="background:#f9f9f9;padding:15px;border-left:4px solid #422326;">{{message}}</blockquote>
  </body></html>'
),
(
  'welcome',
  'Welcome Email',
  'Welcome to Mary Humphrey African Wear, {{first_name}}!',
  '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:{{email_header_color}};padding:20px;text-align:center;">
    <h1 style="color:#fff;margin:0;">{{store_name}}</h1>
  </div>
  <div style="padding:30px 20px;">
    <h2>Welcome, {{first_name}}!</h2>
    <p>Thank you for creating an account with Mary Humphrey African Wear.</p>
    <p>You can now track your orders, save your addresses, and shop faster next time.</p>
    <a href="https://maryhumphreywear.org/shop.html"
       style="display:inline-block;background:#422326;color:#fff;padding:12px 30px;text-decoration:none;border-radius:4px;margin-top:15px;">
      Shop Now
    </a>
  </div>
  <div style="background:#f9f9f9;padding:15px;text-align:center;font-size:12px;color:#777;">
    {{email_footer_text}}
  </div>
  </body></html>'
),
(
  'shipping_notification',
  'Shipping Notification',
  'Your order #{{order_number}} has been shipped!',
  '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:{{email_header_color}};padding:20px;text-align:center;">
    <h1 style="color:#fff;margin:0;">{{store_name}}</h1>
  </div>
  <div style="padding:30px 20px;">
    <h2>Your Order is On Its Way!</h2>
    <p>Hi {{customer_name}},</p>
    <p>Great news! Your order <strong>#{{order_number}}</strong> has been shipped.</p>
    <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
    <p>Estimated delivery: 2-5 business days.</p>
  </div>
  <div style="background:#f9f9f9;padding:15px;text-align:center;font-size:12px;color:#777;">
    {{email_footer_text}}
  </div>
  </body></html>'
)
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────
-- 12. METAFIELDS (optional custom metadata)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS metafields (
    id         BIGSERIAL PRIMARY KEY,
    owner_type TEXT NOT NULL DEFAULT 'product',
    owner_id   BIGINT NOT NULL,
    namespace  TEXT DEFAULT 'custom',
    key        TEXT NOT NULL,
    value      TEXT NOT NULL,
    value_type TEXT DEFAULT 'single_line_text_field',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_type, owner_id, namespace, key)
);


-- ─────────────────────────────────────────────────────────────────────
-- VERIFY: Output list of tables
-- ─────────────────────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
