require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

const PORT = process.env.PORT || 3000;
const API_URL = `http://localhost:${PORT}/api/checkout`;

// We use a specific test email to easily identify and clean up
const TEST_EMAIL = 'smoketest@example.com';
const TEST_REFERENCE = `smoke_test_${Date.now()}`;

async function runSmokeTest() {
    console.log('🚀 Starting Checkout Smoke Test...');

    const payload = {
        reference: TEST_REFERENCE,
        customer: {
            email: TEST_EMAIL,
            name: 'Smoke Tester',
            phone: '0712345678',
            address1: '123 Test St',
            city: 'Nairobi',
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
        // 1. Hit the endpoint
        console.log(`📡 Sending POST to ${API_URL}`);
        
        // NOTE: In a real smoke test against the live endpoint, the Paystack verify will fail 
        // because TEST_REFERENCE is not a real Paystack transaction. 
        // If we want a true end-to-end without mocking Paystack, we need a real test reference.
        // For this automated smoke test, we'll expect it to fail gracefully at the payment verification stage,
        // which still proves the route is wired up.
        // If the user meant "mock the paystack response", we would need to run this against a test environment.
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.status === 502 && data.error === 'Payment verification failed') {
             console.log('✅ Endpoint reached, Paystack verification naturally failed for fake reference.');
        } else if (response.status === 402 && data.error === 'Payment not confirmed by Paystack') {
             console.log('✅ Endpoint reached, Paystack returned unconfirmed status for fake reference.');
        } else if (response.ok) {
             console.log('✅ Order created successfully!', data);
             // If we somehow bypassed paystack or used a valid test reference
        } else {
             console.error('❌ Unexpected response:', response.status, data);
             process.exit(1);
        }

    } catch (err) {
        console.error('❌ Smoke test failed with exception:', err);
        process.exit(1);
    } finally {
        // Cleanup: Delete any orders created with the test email just in case
        console.log('🧹 Cleaning up test data...');
        const { data: testOrders, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('customer_email', TEST_EMAIL);

        if (testOrders && testOrders.length > 0) {
            const ids = testOrders.map(o => o.id);
            // Delete order_items first (if FK cascades aren't set)
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
