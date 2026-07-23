-- =====================================================================
-- Mary Humphrey African Wear — REAL PRODUCT SEED
-- 10 actual products from the Boutique Inventory spreadsheet
-- Run AFTER cleanup-reset.sql
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- STEP 1: Correct Collections
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM collections;
ALTER SEQUENCE collections_id_seq RESTART WITH 1;

INSERT INTO collections (handle, title, description, sort_order) VALUES
  ('fabrics',    'Fabrics',          'Premium Ankara & Kitenge fabrics sold by the yard',    0),
  ('new-arrivals','New Arrivals',    'Our latest handcrafted pieces',                        1),
  ('women',       'Women',           'Ankara fashion for women',                             2),
  ('men',         'Men',             'Ankara fashion for men',                               3),
  ('joggers',     'Joggers',         'Ankara joggers',                                       4),
  ('pullovers',   'Pullovers',       'Ankara-lined pullovers',                               5),
  ('hoodies',     'Hoodies',         'Ankara hoodies',                                       6),
  ('dresses',     'Dresses',         'Ankara dresses',                                       7),
  ('kimonos',     'Kimonos',         'Ankara kimonos & cover-ups',                           8),
  ('blankets',    'Blankets & Throws','Kitenge blankets and throws',                         9),
  ('capes',       'Capes',           'Ankara capes',                                        10),
  ('palazzos',    'Palazzos',        'Ankara palazzo trousers',                             11),
  ('dungarees',   'Dungarees',       'Ankara dungarees',                                    12),
  ('sale',        'Sale',            'Discounted items',                                    13);


-- ─────────────────────────────────────────────────────────────────────
-- STEP 2: Clear old products
-- ─────────────────────────────────────────────────────────────────────
DELETE FROM product_collections;
DELETE FROM variants;
DELETE FROM products;
ALTER SEQUENCE products_id_seq RESTART WITH 1;


-- ─────────────────────────────────────────────────────────────────────
-- STEP 3: Insert Real Products
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO products (
  handle, title, description, product_type,
  price, compare_at_price, vendor, status,
  images, sizes, colors, tags
) VALUES

-- ── 1. The Nova Joggers ──────────────────────────────────────────────
(
  'the-nova-joggers',
  'The Nova Joggers',
  'Complete your look with The Nova Joggers—where vibrant African design meets unmatched comfort. Crafted from premium Ankara fabric, these joggers feature a soft black fleece waistband and fleece ankle cuffs for a warm, comfortable fit. The adjustable drawstring waist lets you customize the fit, while practical side pockets add everyday functionality. Designed for movement, warmth, and effortless style, The Nova Joggers are perfect for travel, relaxing, or stepping out in confidence.',
  'joggers',
  6000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01383.jpg', '/assets/DSC01389.jpg', '/assets/DSC01390.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Multi-print'],
  ARRAY['joggers','new-arrivals','women','men']
),

-- ── 2. The Nova Pullovers ────────────────────────────────────────────
(
  'the-nova-pullovers',
  'The Nova Pullovers',
  'The Nova Pullover is designed for those who love bold African fashion without compromising on comfort. It provides exceptional warmth while feeling gentle fabric along your skin. Whether you''re heading out on a chilly morning, travelling or relaxing, The Nova Pullover keeps you cozy and stylish all day long. Thoughtfully made for comfort, warmth and everyday elegance.',
  'pullovers',
  7000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01394.jpg', '/assets/DSC01401.jpg', '/assets/DSC01406.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Multi-print'],
  ARRAY['pullovers','new-arrivals','women','men']
),

-- ── 3. The Helsinki Blanket ──────────────────────────────────────────
(
  'the-helsinki-blanket',
  'The Helsinki Blanket',
  'Wrap yourself in warmth with The Helsinki Blanket — where African craftsmanship meets everyday comfort. Made from vibrant kitenge fabric and lined with an ultra-soft fleece, this double-layered blanket is designed to keep you warm while adding a beautiful touch of African elegance to your home or wardrobe. Whether draped over your shoulders on a chilly evening, wrapped around you while travelling, or styled as a throw blanket on your sofa or bed, The Helsinki Blanket is as versatile as it is beautiful. Thoughtfully crafted for warmth, comfort, and timeless style.',
  'blankets',
  8000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01410.jpg', '/assets/DSC01412.jpg', '/assets/DSC01428.jpg'],
  ARRAY['M','L'],
  ARRAY['Multi-print'],
  ARRAY['blankets','women','men']
),

-- ── 4. African Luxe Throw ────────────────────────────────────────────
(
  'african-luxe-throw',
  'African Luxe Throw',
  'Wrap yourself in warmth with the African Luxe Throw — where African craftsmanship meets everyday comfort. Made from vibrant kitenge fabric and lined with an ultra-soft fleece, this double-layered throw is designed to keep you warm while adding a beautiful touch of African elegance to your home or wardrobe. Lightweight, cozy, and easy to carry — perfect for travel, cozy evenings, and thoughtful gifting.',
  'blankets',
  10000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01431.jpg', '/assets/DSC01436.jpg', '/assets/DSC01438.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Multi-print'],
  ARRAY['blankets','new-arrivals']
),

-- ── 5. The Nova Hoodies ──────────────────────────────────────────────
(
  'the-nova-hoodies',
  'The Nova Hoodies',
  'Stay warm and stylish with this premium Ankara Hoodie, designed for everyday comfort and a bold, fashionable look. Made from high-quality Ankara fabric and finished with a soft fleece lining, it offers warmth, durability, and a comfortable fit. Features a comfortable hood with adjustable drawstrings, a front kangaroo pocket, and ribbed cuffs and waistband. Perfect for casual wear, travel, and cooler weather.',
  'hoodies',
  7500, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01444.jpg', '/assets/DSC01448.jpg', '/assets/DSC01450.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Multi-print'],
  ARRAY['hoodies','new-arrivals','women','men']
),

-- ── 6. The Diani Sunny Dress ─────────────────────────────────────────
(
  'the-diani-sunny-dress',
  'The Diani Sunny Dress',
  'The Diani Sunny Dress is designed to bring joy to every moment. Crafted from vibrant Ankara fabric, this lightweight dress features a flattering, flowing silhouette that moves beautifully with you. Whether you''re strolling by the beach, enjoying brunch with friends, exploring a new city, or celebrating a special occasion, The Diani Sunny Dress is made to help you feel confident, feminine, and effortlessly stylish. Easy to wear and beautifully handcrafted, it''s the perfect dress for sunshine-filled days and unforgettable moments.',
  'dresses',
  6000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01451.jpg', '/assets/DSC01456.jpg', '/assets/DSC01465.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Multi-print'],
  ARRAY['dresses','new-arrivals','women']
),

-- ── 7. The Talisman Kimono ───────────────────────────────────────────
(
  'the-talisman-kimono',
  'The Talisman Kimono',
  'The Talisman Kimono is a timeless layering piece designed to elevate every outfit with effortless elegance. Crafted from premium Ankara fabric, its flowing silhouette drapes beautifully, making it perfect for every season and every occasion. Whether worn over a dress, paired with jeans and shorts, or styled with your favourite everyday essentials, The Talisman Kimono adds a bold touch of African artistry to your wardrobe. Lightweight, versatile, and easy to style — it''s a statement piece you''ll reach for again and again.',
  'kimonos',
  7000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01469.jpg', '/assets/DSC01479.jpg', '/assets/DSC01482.jpg'],
  ARRAY['S/M','M/L','One Size'],
  ARRAY['Multi-print'],
  ARRAY['kimonos','new-arrivals','women','men']
),

-- ── 8. Noir Cape ─────────────────────────────────────────────────────
(
  'noir-cape',
  'Noir Cape',
  'Wrap yourself in warmth, elegance, and effortless style. Crafted from ultra-soft, body-soothing black fleece and beautifully finished with vibrant kitenge detailing, the Noir Cape is designed for those who love comfort without compromising on style. Its flowing silhouette drapes beautifully over any outfit, making it the perfect layering piece for cool mornings, cozy evenings, travel, or everyday wear. The luxurious fleece provides exceptional warmth, while the bold kitenge trim adds a unique African touch. Designed to be unisex — timeless, versatile, and handcrafted to stand out.',
  'capes',
  8000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01485.jpg', '/assets/DSC01491.jpg', '/assets/DSC01495.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Black/Kitenge'],
  ARRAY['capes','new-arrivals','women','men']
),

-- ── 9. Village Market Palazzo ────────────────────────────────────────
(
  'village-market-palazzo',
  'Village Market Palazzo',
  'A statement piece designed for women who love bold style and effortless comfort. Crafted from two complementary Ankara prints, the Village Market Palazzo features a unique patchwork design that celebrates creativity and individuality. The flattering high waist, functional side pockets, and flowing wide-leg silhouette create a look that''s both comfortable and sophisticated. Perfect for brunch, shopping, travel, or making an everyday statement — each pair is handcrafted with attention to detail.',
  'palazzos',
  6000, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01496.jpg', '/assets/DSC01499.jpg', '/assets/DSC01504.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Multi-print'],
  ARRAY['palazzos','women','new-arrivals']
),

-- ── 10. Classic Dungarees ────────────────────────────────────────────
(
  'classic-dungarees',
  'Classic Dungarees',
  'The Classic Dungarees combine modern style with everyday comfort. Designed with a relaxed fit and adjustable shoulder straps, they are perfect for casual outings, travel, or everyday wear. Soft and durable fabric, functional side pockets, and a straight-leg design make these dungarees easy to pair with T-shirts, tops, or sweaters. Available in multiple colours including Red, Blue, and Olive Green.',
  'dungarees',
  5500, NULL,
  'Mary Humphrey African Wear', 'active',
  ARRAY['/assets/DSC01507.jpg', '/assets/DSC01512.jpg', '/assets/DSC01514.jpg'],
  ARRAY['S','M','L'],
  ARRAY['Red','Blue','Olive Green'],
  ARRAY['dungarees','women','new-arrivals']
);


-- ─────────────────────────────────────────────────────────────────────
-- STEP 4: Auto-map products → collections via tags
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO product_collections (product_id, collection_id)
SELECT p.id, c.id
FROM products p
JOIN collections c ON c.handle = ANY(p.tags)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────
-- STEP 5: Auto-generate variants (one per size × color)
-- ─────────────────────────────────────────────────────────────────────

-- For products with single-color sizes
INSERT INTO variants (product_id, title, price, sku, inventory_quantity, option1, option2)
SELECT
  p.id,
  s || ' / ' || c AS title,
  CASE
    WHEN p.handle = 'the-helsinki-blanket' AND s = 'L' THEN 10000
    WHEN p.handle = 'the-helsinki-blanket' AND s = 'M' THEN 8000
    ELSE p.price
  END AS price,
  UPPER(REGEXP_REPLACE(p.handle, '-', '_', 'g')) || '_' || UPPER(s) || '_' || UPPER(LEFT(c, 3)) AS sku,
  10 AS inventory_quantity,
  s AS option1,
  c AS option2
FROM products p
CROSS JOIN UNNEST(p.sizes) AS s
CROSS JOIN UNNEST(p.colors) AS c
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────────────
-- STEP 6: Verify
-- ─────────────────────────────────────────────────────────────────────
SELECT 'products'           AS tbl, COUNT(*) AS cnt FROM products
UNION ALL
SELECT 'variants',                  COUNT(*)         FROM variants
UNION ALL
SELECT 'collections',               COUNT(*)         FROM collections
UNION ALL
SELECT 'product_collections',       COUNT(*)         FROM product_collections;
