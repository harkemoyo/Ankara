// Test Supabase connection and table contents
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // use service role to bypass RLS
);

async function test() {
    console.log('\n=== Supabase Connection Test ===');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Anon key starts with:', process.env.SUPABASE_ANON_KEY?.substring(0, 30) + '...');
    console.log('Anon key length:', process.env.SUPABASE_ANON_KEY?.length);
    console.log('Service key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

    // Test products table
    const { data: products, error: pe } = await supabase.from('products').select('id,title,handle').limit(5);
    if (pe) {
        console.log('\n❌ Products error:', pe.message, pe.details, pe.hint);
    } else {
        console.log(`\n✅ Products table: ${products.length} rows found`);
        products.forEach(p => console.log(`   - [${p.id}] ${p.title} (${p.handle})`));
    }

    // Test collections table
    const { data: cols, error: ce } = await supabase.from('collections').select('id,title,handle');
    if (ce) {
        console.log('\n❌ Collections error:', ce.message);
    } else {
        console.log(`\n✅ Collections table: ${cols.length} rows found`);
    }

    // Test with ANON key (simulates browser)
    const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: anonProducts, error: ae } = await anonClient.from('products').select('id,title').limit(3);
    if (ae) {
        console.log('\n❌ Anon key test FAILED:', ae.message, ae.hint);
        console.log('   → The anon key may be truncated or invalid');
    } else {
        console.log(`\n✅ Anon key works: ${anonProducts.length} products visible to browser`);
    }
}

test().catch(console.error);
