require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const API_URL = `http://${HOST}:${PORT}/api/checkout/mpesa`;

const TEST_EMAIL = 'mpesatest@example.com';

async function runMpesaTest() {
    console.log('🚀 Starting M-Pesa Checkout Smoke Test...');

    const payload = {
        customer: {
            email: TEST_EMAIL,
            name: 'M-Pesa Tester',
            phone: '0715687280',
            address1: '456 M-Pesa Way',
            city: 'Nairobi',
            postcode: '00100',
            country: 'KE',
            mpesa_method: 'paybill',
            mpesa_code: 'QWE123RTY4'
        },
        cart: [
            {
                id: 'tnj001',
                title: 'The Nova Joggers',
                price: '6000.00',
                qty: 1,
                image: 'assets/DSC01528.jpg'
            }
        ]
    };

    try {
        console.log(`📡 Sending POST to ${API_URL}`);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok && data.success && data.reference) {
             console.log('✅ PASS: Successfully created M-Pesa pending order');
             console.log('   Reference:', data.reference);
             console.log('   Total:', data.total);
             console.log('   Method Chosen:', data.mpesa_method);
             
             // Verify in Supabase database
             const { data: dbOrder, error: dbError } = await supabaseAdmin
                 .from('orders')
                 .select('*')
                 .eq('order_number', data.reference)
                 .single();
                 
             if (dbError || !dbOrder) {
                 console.error('❌ FAIL: Order not found in database:', dbError);
                 process.exit(1);
             }
             
             console.log('✅ PASS: Order found in Supabase Database');
             console.log('   Status in DB:', dbOrder.status);
             console.log('   Payment Provider in DB:', dbOrder.payment_provider);
             console.log('   Notes in DB:', dbOrder.notes);
             
             if (dbOrder.status !== 'pending_payment') {
                 console.error('❌ FAIL: Unexpected order status in DB:', dbOrder.status);
                 process.exit(1);
             }
             if (dbOrder.payment_provider !== 'mpesa') {
                 console.error('❌ FAIL: Unexpected payment provider in DB:', dbOrder.payment_provider);
                 process.exit(1);
             }
        } else {
             console.error('❌ FAIL: Unexpected response:', response.status, data);
             process.exit(1);
         }

    } catch (err) {
        console.error('❌ FAIL: M-Pesa test failed with exception:', err);
        process.exit(1);
    } finally {
        console.log('🧹 Cleaning up test data...');
        const { data: testOrders } = await supabaseAdmin
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
    
    console.log('🎉 M-Pesa Smoke test completed successfully!');
}

runMpesaTest();
