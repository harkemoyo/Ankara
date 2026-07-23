-- =====================================================================
-- Mary Humphrey African Wear — COMPLETE PRODUCT SEED
-- Run this AFTER cleanup-reset.sql
-- Uses real assets already in /assets/ folder
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- COLLECTIONS (safe — cleanup already reset these)
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO collections (handle, title, description, sort_order) VALUES
  ('new-arrivals', 'New Arrivals',  'Our latest handcrafted Ankara pieces',    0),
  ('women',        'Women',         'Ankara fashion for women',                 1),
  ('men',          'Men',           'Ankara fashion for men',                   2),
  ('dresses',      'Dresses',       'Luxury Ankara dresses',                    3),
  ('joggers',      'Joggers',       'Ankara joggers and matching sets',         4),
  ('sets',         'Sets',          'Matching Ankara two-piece sets',           5),
  ('tops',         'Tops',          'Ankara tops and blouses',                  6),
  ('sale',         'Sale',          'Discounted Ankara items',                  7)
ON CONFLICT (handle) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- PRODUCTS — 12 Real Mary Humphrey Products
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO products (
  handle, title, description, product_type,
  price, compare_at_price,
  vendor, status,
  images, sizes, colors,
  tags, created_at, updated_at
) VALUES

-- 1. Nova Joggers Set
(
  'nova-joggers-set',
  'The Nova Joggers Set',
  'Turn heads wherever you go in our signature Nova Joggers Set. Crafted from premium Ankara wax print fabric, this two-piece matching set features a relaxed-fit jogger pant with an elasticated waistband and a coordinating cropped top. Bold African print meets modern streetwear — perfect for casual outings, market days, or weekend brunch.',
  'sets',
  5500, 7000,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01383.jpg',
    '/assets/DSC01389.jpg',
    '/assets/DSC01390.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['sets','joggers','new-arrivals','women'],
  NOW(), NOW()
),

-- 2. Diani Sunny Dress
(
  'diani-sunny-dress',
  'The Diani Sunny Dress',
  'Sun, sand, and vibrant prints — the Diani Sunny Dress was made for it all. This midi-length dress features a flowy silhouette, sweetheart neckline, and a hand-selected Ankara print that radiates energy. Whether you''re heading to the coast or a garden party, this dress guarantees you will be remembered.',
  'dresses',
  4800, 6000,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01394.jpg',
    '/assets/DSC01401.jpg',
    '/assets/DSC01406.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['dresses','women','new-arrivals'],
  NOW(), NOW()
),

-- 3. Ankara Pencil Skirt
(
  'ankara-pencil-skirt',
  'The Ankara Pencil Skirt',
  'Boardroom-ready and street-style approved. Our Ankara Pencil Skirt is tailored to perfection with a high-waist cut that cinches the waist and celebrates your curves. Finished with a back kick pleat for easy movement, this skirt pairs beautifully with a tucked-in blouse or oversized shirt.',
  'sets',
  3200, 4200,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01410.jpg',
    '/assets/DSC01412.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['sets','women'],
  NOW(), NOW()
),

-- 4. Empress Maxi Dress
(
  'empress-maxi-dress',
  'The Empress Maxi Dress',
  'Command any room you walk into. The Empress Maxi Dress is a floor-length statement piece built for women who own their power. Featuring a dramatic wrap neckline, fitted bodice, and a full flowing skirt, this dress is crafted from vibrant African wax print that makes every movement a spectacle.',
  'dresses',
  5800, 7500,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01428.jpg',
    '/assets/DSC01431.jpg',
    '/assets/DSC01436.jpg'
  ],
  ARRAY['XS','S','M','L','XL','2XL'],
  ARRAY['Multi-print'],
  ARRAY['dresses','women','new-arrivals'],
  NOW(), NOW()
),

-- 5. Talisman Kimono
(
  'talisman-kimono',
  'The Talisman Kimono',
  'Layer up in luxury. The Talisman Kimono is an open-front statement cover crafted from lightweight Ankara fabric. Wear it over a swimsuit, a simple dress, or a monochrome outfit to instantly elevate your look. The bold print and flowing silhouette make this a true wardrobe talisman — protective, powerful, and endlessly stylish.',
  'tops',
  3500, 4500,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01438.jpg',
    '/assets/DSC01444.jpg',
    '/assets/DSC01448.jpg'
  ],
  ARRAY['One Size','S/M','L/XL'],
  ARRAY['Multi-print'],
  ARRAY['tops','women'],
  NOW(), NOW()
),

-- 6. Heritage Wrap Dress
(
  'heritage-wrap-dress',
  'The Heritage Wrap Dress',
  'Timeless meets contemporary. The Heritage Wrap Dress wraps around your body in the most flattering way — adjustable tie waist, V-neckline, and a midi length that works for almost every occasion. Made from our signature Ankara wax print fabric, every piece is unique and tells a story. From office lunch to evening dinners, this dress does it all.',
  'dresses',
  4200, 5500,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01450.jpg',
    '/assets/DSC01451.jpg',
    '/assets/DSC01456.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['dresses','women'],
  NOW(), NOW()
),

-- 7. Ankara Puff Sleeve Top
(
  'ankara-puff-sleeve-top',
  'The Ankara Puff Sleeve Top',
  'Make a statement from the shoulders up. The Ankara Puff Sleeve Top features dramatically voluminous puff sleeves crafted from premium wax print cotton, paired with a fitted bodice and cropped hem. Style it tucked into high-waist trousers or a skirt for a polished, head-turning look.',
  'tops',
  2800, 3800,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01465.jpg',
    '/assets/DSC01469.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['tops','women','new-arrivals'],
  NOW(), NOW()
),

-- 8. Midnight Joggers
(
  'midnight-joggers',
  'The Midnight Joggers',
  'Comfort is a lifestyle. Our Midnight Joggers are cut from soft Ankara fabric with a relaxed fit, elasticated waistband, and tapered ankle. Designed for those who refuse to compromise style for comfort, these joggers work day to night — from a morning coffee run to an evening hangout.',
  'joggers',
  3800, 5000,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01479.jpg',
    '/assets/DSC01482.jpg',
    '/assets/DSC01485.jpg'
  ],
  ARRAY['XS','S','M','L','XL','2XL'],
  ARRAY['Multi-print'],
  ARRAY['joggers','men','women'],
  NOW(), NOW()
),

-- 9. Peplum Ankara Top
(
  'peplum-ankara-top',
  'The Peplum Ankara Top',
  'Structured, elegant, and uniquely African. The Peplum Ankara Top features a form-fitting bodice with a dramatic peplum flare at the waist — designed to accentuate curves and add instant drama to any outfit. Pair with straight-leg trousers or a pencil skirt and let the top do all the talking.',
  'tops',
  2500, 3200,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01491.jpg',
    '/assets/DSC01495.jpg',
    '/assets/DSC01496.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['tops','women'],
  NOW(), NOW()
),

-- 10. Harambee Co-ord Set
(
  'harambee-coord-set',
  'The Harambee Co-ord Set',
  'Unity in style. The Harambee Co-ord Set is a matching two-piece featuring a boxy cropped jacket and wide-leg trouser — both in a striking coordinated Ankara print. This power set transitions effortlessly from creative boardrooms to evening events. A true conversation starter that celebrates African heritage with contemporary flair.',
  'sets',
  6500, 8500,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01499.jpg',
    '/assets/DSC01504.jpg',
    '/assets/DSC01507.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['sets','women','new-arrivals'],
  NOW(), NOW()
),

-- 11. Sasa Mini Dress
(
  'sasa-mini-dress',
  'The Sasa Mini Dress',
  'Life is short — wear bold prints. The Sasa Mini Dress is a fitted, above-the-knee dress that hugs your silhouette in all the right ways. Cut from vibrant Ankara fabric with a sweetheart neckline and invisible zip back, this dress is designed for evenings out, celebrations, and anytime you want to feel incredible.',
  'dresses',
  4000, 5200,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01512.jpg',
    '/assets/DSC01514.jpg',
    '/assets/DSC01522.jpg'
  ],
  ARRAY['XS','S','M','L','XL'],
  ARRAY['Multi-print'],
  ARRAY['dresses','women','sale'],
  NOW(), NOW()
),

-- 12. Lagos Lounge Set
(
  'lagos-lounge-set',
  'The Lagos Lounge Set',
  'Lagos energy, all day comfort. The Lagos Lounge Set is your go-to when you want to look effortlessly put-together without trying too hard. Featuring a relaxed long-sleeve top and matching wide-leg pants in premium Ankara fabric, this set is the perfect blend of bold African style and laid-back luxury. Wear it out, wear it home — either way, you''re winning.',
  'sets',
  5200, 6800,
  'Mary Humphrey African Wear', 'active',
  ARRAY[
    '/assets/DSC01525.jpg',
    '/assets/DSC01527.jpg',
    '/assets/DSC01528.jpg'
  ],
  ARRAY['XS','S','M','L','XL','2XL'],
  ARRAY['Multi-print'],
  ARRAY['sets','women','joggers','new-arrivals'],
  NOW(), NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- PRODUCT → COLLECTION MAPPINGS
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO product_collections (product_id, collection_id)
SELECT p.id, c.id
FROM products p
JOIN collections c ON c.handle = ANY(p.tags)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- VARIANTS — one per product, covering all sizes
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO variants (product_id, title, price, sku, inventory_quantity, option1, option2)
SELECT 
  p.id,
  s AS title,
  p.price,
  UPPER(REPLACE(p.handle, '-', '_')) || '_' || UPPER(s) AS sku,
  15 AS inventory_quantity,
  s AS option1,
  'Multi-print' AS option2
FROM products p
CROSS JOIN UNNEST(p.sizes) AS s
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- VERIFY OUTPUT
-- ─────────────────────────────────────────────────────────────────────
SELECT 
  'products'    AS table_name, COUNT(*) AS count FROM products
UNION ALL
SELECT 'variants',     COUNT(*) FROM variants
UNION ALL
SELECT 'collections',  COUNT(*) FROM collections
UNION ALL
SELECT 'product_collections', COUNT(*) FROM product_collections;
