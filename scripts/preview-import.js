// scripts/preview-import.js
// ============================================================================
// Preview how products will be structured before importing to Supabase
// ============================================================================

const spreadsheetProducts = [
  // The Nova Joggers - TNJ001
  {
    product_id: 'TNJ001',
    title: 'The Nova Joggers',
    description: 'Complete your look with The Nova Joggers—where vibrant African design meets unmatched comfort. Crafted from premium Ankara fabric, these joggers feature a soft black fleece waistband and fleece ankle cuffs for a warm, comfortable fit. The adjustable drawstring waist lets you customize the fit, while practical side pockets add everyday functionality. Designed for movement, warmth, and effortless style, The Nova Joggers are perfect for travel, relaxing, or stepping out in confidence.',
    features: [
      'Premium Ankara fabric',
      'Soft black fleece waistband for extra comfort',
      'Soft black fleece ankle cuffs',
      'Adjustable drawstring waist',
      'Functional side pockets',
      'Warm, comfortable, and easy to wear'
    ],
    price: 6000,
    variants: [
      { size: 'Medium', stock: 2 },
      { size: 'One Medium One Large', stock: 1 },
      { size: 'One Small One Large', stock: 1 }
    ],
    product_type: 'Joggers',
    collection: 'pants',
    status: 'active'
  },

  // The Nova Pullovers - TNP002
  {
    product_id: 'TNP002',
    title: 'The Nova Pullovers',
    description: 'The Nova Pullover is designed for those who love bold African Fashion without compromising on comfort. It provides exceptional warmth while feeling gentle fabric along your skin. Whether you\'re heading out on a chilly morning, travelling or relaxing. The nova pullover keeps you cozy and stylish all day long. Thoughtfully made for comfort, warmth and everyday elegance.',
    features: [
      'Ankara fabric lined with ultra-soft black fleece',
      'Soft and comfortable to wear',
      'Warm and cozy feel',
      'Stylish and durable design'
    ],
    price: 7000,
    variants: [
      { size: 'Medium', stock: 2 },
      { size: 'One Medium One Large', stock: 1 },
      { size: 'One Small One Large', stock: 1 }
    ],
    product_type: 'Pullover',
    collection: 'tops',
    status: 'active'
  },

  // The Helsinki Blanket - THB003
  {
    product_id: 'THB003',
    title: 'The Helsinki Blanket',
    description: 'Wrap yourself in warmth with The Helsinki Blanket where African craftsmanship meets everyday comfort. Made from vibrant kitenge fabric and lined with an ultra-soft fleece, this double-layered blanket is designed to keep you warm while adding a beautiful touch of African elegance to your home or wardrobe. Whether draped over your shoulders on a chilly evening, wrapped around you while travelling, or styled as a throw blanket on your sofa or bed, The Helsinki Blanket is as versatile as it is beautiful. Thoughtfully crafted for warmth, comfort, and timeless style.',
    features: [
      'Premium kitenge outer fabric',
      'Ultra-soft fleece lining for exceptional warmth',
      'Double-layered for added comfort and durability',
      'Multi-purpose design—wear it as a wrap or use it as a throw blanket',
      'Lightweight, cozy, and easy to carry',
      'Handmade with care'
    ],
    price: 8000,
    compare_at_price: 10000,
    variants: [
      { size: 'Medium', price: 8000, stock: 5 },
      { size: 'Large', price: 10000, stock: 5 }
    ],
    product_type: 'Blanket',
    collection: 'blankets',
    status: 'active'
  },

  // African Luxe Throw - ALT004
  {
    product_id: 'ALT004',
    title: 'African Luxe Throw',
    description: 'Wrap yourself in warmth with The Helsinki Blanket where African craftsmanship meets everyday comfort. Made from vibrant kitenge fabric and lined with an ultra-soft fleece, this double-layered blanket is designed to keep you warm while adding a beautiful touch of African elegance to your home or wardrobe. Whether draped over your shoulders on a chilly evening, wrapped around you while travelling, or styled as a throw blanket on your sofa or bed, The Helsinki Blanket is as versatile as it is beautiful. Thoughtfully crafted for warmth, comfort, and timeless style.',
    features: [
      'Premium kitenge outer fabric',
      'Ultra-soft fleece lining for exceptional warmth',
      'Double-layered for added comfort and durability',
      'Multi-purpose design—wear it as a wrap or use it as a throw blanket',
      'Lightweight, cozy, and easy to carry',
      'Handmade with care'
    ],
    price: 9000,
    variants: [
      { size: 'All sizes', stock: 10 }
    ],
    product_type: 'Blanket',
    collection: 'blankets',
    status: 'active'
  },

  // The Nova Hoodies - TNH005
  {
    product_id: 'TNH005',
    title: 'The Nova Hoodies',
    description: 'Stay warm and stylish with this premium Ankara Hoodie, designed for everyday comfort and a bold, fashionable look. Made from high-quality Ankara fabric and finished with a soft fleece lining, it offers warmth, durability, and a comfortable fit. Perfect for casual wear, travel, and cooler weather.',
    features: [
      'Premium Ankara fabric',
      'Soft fleece lining for extra warmth',
      'Comfortable hood with adjustable drawstrings',
      'Front kangaroo pocket',
      'Ribbed cuffs and waistband',
      'Warm, comfortable, and easy to wear',
      'Durable stitching for long-lasting use'
    ],
    price: 7500,
    variants: [
      { size: 'Medium', stock: 3 },
      { size: 'Both Medium and Small', stock: 2 },
      { size: 'Large', stock: 2 }
    ],
    product_type: 'Hoodie',
    collection: 'tops',
    status: 'active'
  },

  // The Diani Sunny Dress - TDSD006
  {
    product_id: 'TDSD006',
    title: 'The Diani Sunny Dress',
    description: 'The Diani Sunny Dress is designed to bring joy to every moment. Crafted from vibrant Ankara fabric, this lightweight dress features a flattering, flowing silhouette that moves beautifully with you. Whether you\'re strolling by the beach, enjoying brunch with friends, exploring a new city, or celebrating a special occasion, The Diani Sunny Dress is made to help you feel confident, feminine, and effortlessly stylish. Easy to wear and beautifully handcrafted, it\'s the perfect dress for sunshine-filled days and unforgettable moments. Thoughtfully crafted for comfort, confidence, and timeless elegance.',
    features: [
      'Premium Ankara fabric',
      'Lightweight and breathable',
      'Flattering, flowing silhouette',
      'Comfortable fit for all-day wear',
      'Perfect for casual outings, holidays, brunches, and special occasions',
      'Handmade with care'
    ],
    price: 6000,
    variants: [
      { size: 'Small', stock: 2 },
      { size: 'Medium', stock: 3 },
      { size: 'Large', stock: 2 },
      { size: 'Medium/Large', stock: 2 }
    ],
    product_type: 'Dress',
    collection: 'dresses',
    status: 'active'
  },

  // The Talisman Kimono - TTK007
  {
    product_id: 'TTK007',
    title: 'The Talisman Kimono',
    description: 'The Talisman Kimono is a timeless layering piece designed to elevate every outfit with effortless elegance. Crafted from premium Ankara fabric, its flowing silhouette drapes beautifully, making it perfect for every season and every occasion. Whether worn over a dress, paired with jeans and shorts, or styled with your favorite everyday essentials, The Talisman Kimono adds a bold touch of African artistry to your wardrobe. Lightweight, versatile, and easy to style, it\'s a statement piece you\'ll reach for again and again. Thoughtfully crafted for confidence, comfort, and timeless style.',
    features: [
      'Premium Ankara fabric',
      'Lightweight and breathable',
      'Relaxed, flowing silhouette',
      'Unisex design',
      'Easy to layer over dresses, tops, jumpsuits, shorts, or trousers',
      'Perfect for everyday wear, travel, holidays, and special occasions',
      'Handmade with care'
    ],
    price: 7000,
    variants: [
      { size: 'Medium', stock: 5 }
    ],
    product_type: 'Kimono',
    collection: 'kimonos',
    status: 'active'
  },

  // Noir Cape - Nc008
  {
    product_id: 'Nc008',
    title: 'Noir Cape',
    description: 'Wrap yourself in warmth, elegance, and effortless style. Crafted from ultra-soft, body-soothing black fleece and beautifully finished with vibrant kitenge detailing, the Noir Cape is designed for those who love comfort without compromising on style. Its flowing silhouette drapes beautifully over any outfit, making it the perfect layering piece for cool mornings, cozy evenings, travel, or everyday wear. The luxurious fleece provides exceptional warmth, while the bold kitenge trim adds a unique African touch. Designed to be unisex, the Noir Cape is timeless, versatile, and handcrafted to stand out.',
    features: [
      'Ultra-soft body-soothing fleece',
      'African kitenge trim for a bold finish',
      'Warm, cozy, and lightweight',
      'Relaxed, free-flowing fit',
      'Unisex design',
      'Easy to layer over any outfit',
      'Handmade with love',
      'Perfect for: Cool mornings and evenings, Travel, Casual outings, Cozy days at home, Thoughtful gifts'
    ],
    price: 8000,
    variants: [
      { size: 'Small', stock: 1 },
      { size: 'Medium', stock: 1 },
      { size: 'Large', stock: 1 }
    ],
    product_type: 'Cape',
    collection: 'capes',
    status: 'active'
  },

  // Village Market Palazzo - VMP009
  {
    product_id: 'VMP009',
    title: 'Village Market Palazzo',
    description: 'A statement piece designed for women who love bold style and effortless comfort. Crafted from two complementary Ankara prints, the Village Market Palazzo features a unique patchwork design that celebrates creativity and individuality. The flattering high waist, functional side pockets, and flowing wide-leg silhouette create a look that\'s both comfortable and sophisticated. Perfect for brunch, shopping, travel, or making an everyday statement, each pair is handcrafted with attention to detail.',
    features: [
      'Double Ankara patchwork design',
      'High-waisted fit',
      'Functional side pockets',
      'Relaxed wide-leg silhouette'
    ],
    price: 6000,
    variants: [
      { size: 'Medium', stock: 3 }
    ],
    product_type: 'Pants',
    collection: 'pants',
    status: 'active'
  },

  // Classic Dungarees - CD010
  {
    product_id: 'CD010',
    title: 'Classic Dungarees',
    description: 'The Classic Dungarees combine modern style with everyday comfort. Designed with a relaxed fit and adjustable shoulder straps, they are perfect for casual outings, travel, or everyday wear. Available in multiple colours to suit different styles.',
    features: [
      'Soft and durable fabric',
      'Adjustable shoulder straps',
      'Relaxed, comfortable fit',
      'Functional side pockets',
      'Straight-leg design',
      'Suitable for everyday wear',
      'Available in multiple colours',
      'Easy to pair with T-shirts, tops, or sweaters'
    ],
    price: 6500,
    variants: [
      { size: 'Medium (Red/blue/olive green)', stock: 3 }
    ],
    product_type: 'Dungarees',
    collection: 'dungarees',
    status: 'active'
  }
];

function generateHandle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeSize(sizeStr) {
  const sizeMap = {
    'small': 'S',
    'medium': 'M',
    'large': 'L',
    'one small one large': 'S/L',
    'one medium one large': 'M/L',
    'both medium and small': 'S/M',
    'medium/large': 'M/L',
    'all sizes': 'One Size'
  };
  
  const normalized = sizeStr.toLowerCase().trim();
  return sizeMap[normalized] || sizeStr;
}

console.log('🔍 PRODUCT IMPORT PREVIEW\n');
console.log('=' .repeat(80));
console.log(`Total Products: ${spreadsheetProducts.length}`);
console.log(`Total Variants: ${spreadsheetProducts.reduce((sum, p) => sum + p.variants.length, 0)}`);
console.log('=' .repeat(80));
console.log('\n');

spreadsheetProducts.forEach((product, index) => {
  const handle = generateHandle(product.title);
  const uniqueSizes = [...new Set(product.variants.map(v => normalizeSize(v.size)))];
  
  console.log(`${index + 1}. ${product.title}`);
  console.log(`   Product ID: ${product.product_id}`);
  console.log(`   Handle: ${handle}`);
  console.log(`   Type: ${product.product_type}`);
  console.log(`   Collection: ${product.collection}`);
  console.log(`   Price: KES ${product.price.toLocaleString()}`);
  if (product.compare_at_price) {
    console.log(`   Compare at Price: KES ${product.compare_at_price.toLocaleString()}`);
  }
  console.log(`   Status: ${product.status}`);
  console.log(`   Available Sizes: ${uniqueSizes.join(', ')}`);
  console.log(`   Total Variants: ${product.variants.length}`);
  console.log(`   Description: ${product.description.substring(0, 100)}...`);
  console.log(`   Features: ${product.features.slice(0, 2).join(', ')}...`);
  console.log('\n   VARIANTS:');
  
  product.variants.forEach((variant, vIndex) => {
    const normalizedSize = normalizeSize(variant.size);
    const variantPrice = variant.price || product.price;
    const sku = `${product.product_id}-${normalizedSize}`;
    
    console.log(`   ${vIndex + 1}. Size: ${variant.size} → ${normalizedSize}`);
    console.log(`      SKU: ${sku}`);
    console.log(`      Price: KES ${variantPrice.toLocaleString()}`);
    console.log(`      Stock: ${variant.stock}`);
  });
  
  console.log('\n' + '-'.repeat(80) + '\n');
});

console.log('✅ Preview complete. This shows how products will be structured in the database.');
console.log('📝 To proceed with actual import, run: node scripts/import-spreadsheet-products.js');
