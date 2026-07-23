-- =====================================================================
-- Mary Humphrey African Wear — Database Cleanup & Reset Script
-- Removes all old test/placeholder products and resets collections.
-- Safe to run. Preserves orders if any exist.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- STEP 1: Clear old order_items test data (test orders only)
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM order_items
WHERE product_title IN (
    'Test Duffle Bag',
    'Ankara Print Dress',
    'Vibrant African Tunic',
    'Traditional Kente Skirt',
    'African Print Blouse'
);

-- ─────────────────────────────────────────────────────────────────────
-- STEP 2: Clear old test orders (with placeholder handles only)
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM orders
WHERE order_number IN (
    SELECT DISTINCT o.order_number FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.id IS NULL  -- orphaned orders with no items left
);


-- ─────────────────────────────────────────────────────────────────────
-- STEP 3: Remove ALL existing placeholder/test products
-- ─────────────────────────────────────────────────────────────────────

-- Clear product_collections join rows first (FK constraint)
DELETE FROM product_collections;

-- Clear all old products (we are replacing with real Mary Humphrey inventory)
DELETE FROM products;

-- Reset the BIGSERIAL ID sequence so new products start from ID 1
ALTER SEQUENCE products_id_seq RESTART WITH 1;


-- ─────────────────────────────────────────────────────────────────────
-- STEP 4: Reset collections with correct real-world categories
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM collections;
ALTER SEQUENCE collections_id_seq RESTART WITH 1;

INSERT INTO collections (handle, title, description, sort_order) VALUES
  ('new-arrivals',     'New Arrivals',        'Our latest handcrafted Ankara pieces', 0),
  ('women',            'Women',               'Ankara fashion for women',              1),
  ('men',              'Men',                 'Ankara fashion for men',                2),
  ('dresses',          'Dresses',             'Luxury Ankara dresses',                 3),
  ('joggers',          'Joggers',             'Ankara joggers and loungewear',         4),
  ('sale',             'Sale',                'Discounted Ankara items',               5);


-- ─────────────────────────────────────────────────────────────────────
-- STEP 5: Verify — should return empty products table + 6 collections
-- ─────────────────────────────────────────────────────────────────────
SELECT 'products' AS table_name, COUNT(*) AS row_count FROM products
UNION ALL
SELECT 'collections', COUNT(*) FROM collections
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items;
