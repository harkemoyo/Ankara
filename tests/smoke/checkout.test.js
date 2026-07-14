require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api/checkout/init`;

const TEST_EMAIL = 'smoketest@example.com';

async function runSmokeTest() {
    console.log('🚀 Starting Checkout Init Smoke Test...');

    const payload = {
        customer: {
            email: TEST_EMAIL,
            name: 'Smoke Tester',
            phone: '0712345678',
            address1: '123 Test St',
            city: 'Nairobi',
            postcode: '00100',
            country: 'KE'
        },
        cart: [
            {
                id: 'test-product',
                title: 'Test Duffle Bag',
                price: '10.00',
                qty: 1
            }
        ]
    };

    let orderId = null;

    try {
        console.log(`📡 Sending POST to ${API_URL}`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok && data.success && data.access_code && data.reference) {
             console.log('✅ PASS: Successfully created pending order and got access code');
             console.log('   Reference:', data.reference);
             console.log('   Access Code:', data.access_code);
        } else {
             console.error('❌ FAIL: Unexpected response:', response.status, data);
             process.exit(1);
        }

    } catch (err) {
        console.error('❌ FAIL: Smoke test failed with exception:', err);
        process.exit(1);
    } finally {
        console.log('🧹 Cleaning up test data...');
        const { data: testOrders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('customer_email', TEST_EMAIL);

        if (testOrders && testOrders.length > 0) {
            const ids = testOrders.map(o => o.id);
            await supabaseAdmin.from('order_items').delete().in('order_id', ids);
            await supabaseAdmin.from('orders').delete().in('id', ids);
            console.log(`✅ Deleted ${testOrders.length} test order(s).`);
        } else {
            console.log('✅ No test orders needed cleanup.');
        }
    }
    
    console.log('🎉 Smoke test completed successfully!');
}

runSmokeTest();
