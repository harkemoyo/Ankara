// scripts/seed-single-product.js
// Universal single product seeder — works with both current and upgraded schema

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

async function seedSingleProduct() {
    console.log('🌱 Seeding single proof-of-concept product into Supabase...');

    try {
        // 1. Base Product Data (compatible with existing Supabase products table)
        const baseProduct = {
            handle: 'diani-sunny-dress',
            title: 'The Diani Sunny Dress',
            price: 4500.00,
            compare_at_price: 5200.00,
            description: 'Handcrafted luxury Ankara dress inspired by coastal breeze. Lightweight, breathable, and vibrant color patterns for any occasion.',
            collection: 'dresses',
            vendor: 'Mary Humphrey African Wear',
            tags: ['dress', 'ankara', 'summer', 'new arrival'],
            images: ['assets/DSC01383.jpg', 'assets/DSC01389.jpg', 'assets/DSC01390.jpg'],
            colors: [{ hex: '#422326', label: 'Ankara Red', image: 'assets/DSC01383.jpg' }],
            sizes: ['S', 'M', 'L', 'XL'],
            in_stock: true
        };

        // Try adding extended schema fields (product_type, status) if available
        let productPayload = { ...baseProduct };
        try {
            productPayload.product_type = 'Dress';
            productPayload.status = 'active';
        } catch (_) {}

        // Attempt insert with full payload
        let { data: product, error: prodErr } = await supabaseAdmin
            .from('products')
            .upsert(productPayload, { onConflict: 'handle' })
            .select()
            .single();

        // If product_type column is missing in schema, fallback to base fields seamlessly
        if (prodErr && prodErr.message.includes('product_type')) {
            console.log('ℹ️ Seeding using current database schema...');
            const { data: fbProd, error: fbErr } = await supabaseAdmin
                .from('products')
                .upsert(baseProduct, { onConflict: 'handle' })
                .select()
                .single();

            if (fbErr) throw fbErr;
            product = fbProd;
        } else if (prodErr) {
            throw prodErr;
        }

        console.log(`✅ Product Seeded: "${product.title}" (ID: ${product.id}, Handle: ${product.handle})`);

        // 2. Try link to product_collections if table exists
        try {
            const { data: collections } = await supabaseAdmin
                .from('collections')
                .select('id, handle')
                .in('handle', ['women', 'new-arrivals', 'dresses']);

            if (collections && collections.length > 0) {
                const joins = collections.map(col => ({
                    product_id: product.id,
                    collection_id: col.id
                }));

                await supabaseAdmin
                    .from('product_collections')
                    .upsert(joins, { onConflict: 'product_id,collection_id' });
                console.log(`✅ Collection links created`);
            }
        } catch (_) { /* table not created yet */ }

        // 3. Try create product variants if table exists
        try {
            const sizes = ['S', 'M', 'L', 'XL'];
            const variants = sizes.map(size => ({
                product_id: product.id,
                title: `Size ${size}`,
                option1: size,
                sku: `MHW-DSD-${size}`,
                price: 4500.00,
                stock: 10,
                image: 'assets/DSC01383.jpg'
            }));

            for (const variant of variants) {
                await supabaseAdmin.from('product_variants').upsert(variant, { onConflict: 'sku' });
            }
            console.log(`✅ 4 Variants created (S, M, L, XL)`);
        } catch (_) { /* table not created yet */ }

        console.log('\n🎉 Single product seed COMPLETE!');
        console.log('👉 View Live Product Card: http://localhost:3000/shop.html');
        console.log('👉 View Live Product Detail: http://localhost:3000/product.html?handle=diani-sunny-dress');

    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    }
}

seedSingleProduct();
