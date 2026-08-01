// scripts/seed-fabrics.js
// Seeder for Ankara fabrics in the products table

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

const fabricImages = [
    "assets/IMG-20260622-WA0070.webp",
    "assets/IMG-20260622-WA0069.webp",
    "assets/IMG-20260622-WA0071.webp",
    "assets/IMG-20260622-WA0068.webp",
    "assets/IMG-20260622-WA0067.webp",
    "assets/IMG-20260622-WA0066.webp",
    "assets/IMG-20260622-WA0065.webp",
    "assets/IMG-20260622-WA0064.webp",
    "assets/IMG-20260622-WA0063.webp",
    "assets/IMG-20260622-WA0062.webp",
    "assets/IMG-20260622-WA0061.webp",
    "assets/IMG-20260622-WA0060.webp",
    "assets/IMG-20260622-WA0059.webp",
    "assets/IMG-20260622-WA0058.webp",
    "assets/IMG-20260622-WA0057.webp",
    "assets/IMG-20260622-WA0056.webp",
    "assets/IMG-20260622-WA0055.webp",
    "assets/IMG-20260622-WA0054.webp",
    "assets/IMG-20260622-WA0053.webp",
    "assets/IMG-20260622-WA0052.webp",
    "assets/IMG-20260622-WA0051.webp",
    "assets/IMG-20260622-WA0050.webp",
    "assets/IMG-20260622-WA0049.webp",
    "assets/IMG-20260622-WA0048.webp",
    "assets/IMG-20260622-WA0047.webp",
    "assets/IMG-20260622-WA0046.webp",
    "assets/IMG-20260622-WA0044.webp",
    "assets/IMG-20260622-WA0038.webp",
    "assets/IMG-20260622-WA0037.webp",
    "assets/IMG-20260622-WA0036.webp",
    "assets/IMG-20260622-WA0035.webp",
    "assets/IMG-20260622-WA0034.webp",
    "assets/IMG-20260622-WA0033.webp",
    "assets/IMG-20260622-WA0032.webp",
    "assets/IMG-20260622-WA0031.webp",
    "assets/IMG-20260622-WA0030.webp"
];

const fabricNames = [
    "Sunburst Gold", "Midnight Bloom", "Savannah Green", "Royal Indigo", 
    "Crimson Tide", "Desert Sand", "Ocean Wave", "Sunset Orange", 
    "Emerald Dream", "Ruby Red", "Safari Amber", "Lumina Pearl",
    "Ebony Silk", "Ivory Thread", "Golden Harvest"
];

async function seedFabrics() {
    console.log('🌱 Seeding Ankara fabrics into Supabase...');

    const productsToInsert = fabricImages.map((imgPath, index) => {
        const baseName = fabricNames[index % fabricNames.length];
        const styleSuffix = String.fromCharCode(65 + Math.floor(index / fabricNames.length)); // A, B, C...
        const title = `${baseName} Ankara Fabric - Style ${styleSuffix}`;
        const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        // Dynamically compute KSh price (between 1200 KSh and 2400 KSh)
        const price = 1200 + (index % 7) * 200;
        const compareAtPrice = index % 5 === 0 ? price + 400 : null;

        return {
            handle,
            title,
            price,
            compare_at_price: compareAtPrice,
            description: `Premium 100% cotton African wax print fabric, featuring the stunning ${baseName} pattern (Style ${styleSuffix}). Sourced for bold identity and lasting quality. Ideal for custom dresses, kimonos, joggers, home accent projects, and bespoke tailoring. Sold by the yard (approx. 36" x 44" per yard). Hand wash cold, hang dry.`,
            collection: 'fabrics',
            product_type: 'fabric',
            vendor: 'Mary Humphrey African Wear',
            status: 'active',
            tags: ['fabric', 'ankara', 'materials', 'wax print'],
            images: [imgPath],
            colors: [{ hex: '#d4af37', label: `${baseName} Pattern`, image: imgPath }],
            sizes: ['1 Yard', '2 Yards', '6 Yards Bundle'],
            in_stock: true
        };
    });

    try {
        console.log(`Inserting/Upserting ${productsToInsert.length} fabric products...`);
        
        // Use upsert on handle to avoid duplication issues if run multiple times
        const { data, error } = await supabaseAdmin
            .from('products')
            .upsert(productsToInsert, { onConflict: 'handle' })
            .select();

        if (error) {
            throw error;
        }

        console.log(`✅ Success! Seeded ${data.length} fabric products in database.`);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message || err);
    }
}

seedFabrics();
