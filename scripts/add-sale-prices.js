const { createClient } = require('@supabase/supabase-js');

// Use hardcoded credentials from config.js
const SUPABASE_URL = 'https://oscqakcygvvtjngbuhbw.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function addSalePrices() {
    const saleUpdates = [
        { handle: 'the-helsinki-blanket', compare_at_price: 10000.00 },
        { handle: 'sheba-luxury-couture-gown', compare_at_price: 18000.00 },
        { handle: 'safari-tailored-ankara-suit', compare_at_price: 14500.00 },
        { handle: 'monarch-artisan-evening-coat', compare_at_price: 16500.00 },
        { handle: 'the-nova-hoodies', compare_at_price: 12000.00 },
        { handle: 'the-diani-sunny-dress', compare_at_price: 9000.00 }
    ];

    console.log('Adding sale prices to products...');
    
    for (const update of saleUpdates) {
        const { data, error } = await supabaseAdmin
            .from('products')
            .update({ compare_at_price: update.compare_at_price })
            .eq('handle', update.handle)
            .select('handle, title, price, compare_at_price');
        
        if (error) {
            console.error(`Error updating ${update.handle}:`, error);
        } else if (data && data.length > 0) {
            console.log(`✓ Updated ${data[0].handle}: ${data[0].title} - Price: ${data[0].price}, Sale Price: ${data[0].compare_at_price}`);
        } else {
            console.log(`✓ Updated ${update.handle} (no data returned)`);
        }
    }
    
    console.log('Sale prices added successfully!');
}

addSalePrices().catch(console.error);
