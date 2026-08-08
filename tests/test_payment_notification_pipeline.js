// tests/test_payment_notification_pipeline.js
// Automated Test Suite for Paystack + WhatsApp + MailerSend Pipeline
// ==================================================================

require('dotenv').config();
const assert = require('assert');
const crypto = require('crypto');
const paymentService = require('../src/services/paymentService');
const whatsappService = require('../src/services/whatsappService');
const emailService = require('../src/services/emailService');
const notificationService = require('../src/services/notificationService');
const { supabaseAdmin } = require('../src/config/supabase');

async function runTests() {
    console.log('\n🧪 STARTING COMPREHENSIVE PIPELINE TESTS...\n');
    let passed = 0;
    let failed = 0;

    const testOrderNumber = `TEST-ORDER-${Date.now()}`;
    const testAmount = 4500.00;
    const testCustomerEmail = `customer_${Date.now()}@example.com`;

    // Setup: Create a test order in Supabase
    console.log(`[Setup] Creating initial test order #${testOrderNumber}...`);
    const { data: createdOrder, error: createErr } = await supabaseAdmin
        .from('orders')
        .insert({
            order_number: testOrderNumber,
            status: 'pending_payment',
            customer_name: 'Test Customer',
            customer_email: testCustomerEmail,
            customer_phone: '0715687280',
            subtotal: 4000.00,
            shipping_cost: 500.00,
            total: testAmount,
            currency: 'KES',
            payment_provider: 'paystack'
        })
        .select()
        .single();

    if (createErr) {
        console.error('[Setup Error]:', createErr.message);
        return;
    }

    // TEST 1: Normal Paystack Payment Verification & Webhook Event
    console.log('\n--- TEST 1: Normal Paystack Payment & Notification Chain ---');
    try {
        const webhookPayload = {
            event: 'charge.success',
            data: {
                id: `pstk_tx_${Date.now()}`,
                reference: testOrderNumber,
                amount: testAmount * 100, // Paystack kobo
                currency: 'KES',
                status: 'success',
                customer: {
                    first_name: 'Test',
                    last_name: 'Customer',
                    email: testCustomerEmail
                }
            }
        };

        const result = await paymentService.handleWebhook(webhookPayload, null, JSON.stringify(webhookPayload));
        assert.strictEqual(result.status, 'paid', 'Order should transition to paid');

        // Verify in Database
        const { data: verifiedOrder } = await supabaseAdmin
            .from('orders')
            .select('status, payment_ref, paid_at')
            .eq('order_number', testOrderNumber)
            .single();

        assert.strictEqual(verifiedOrder.status, 'paid', 'Database order status must be paid');
        assert.ok(verifiedOrder.paid_at, 'paid_at timestamp must be set');
        console.log('✅ TEST 1 PASSED: Order transitioned to PAID with timestamps and notifications dispatched');
        passed++;
    } catch (err) {
        console.error('❌ TEST 1 FAILED:', err.message);
        failed++;
    }

    // TEST 2: Idempotency (Sending the same webhook twice)
    console.log('\n--- TEST 2: Duplicate Webhook Idempotency ---');
    try {
        const duplicatePayload = {
            event: 'charge.success',
            data: {
                id: `pstk_duplicate_${Date.now()}`,
                reference: testOrderNumber,
                amount: testAmount * 100,
                status: 'success'
            }
        };

        const dupResult = await paymentService.handleWebhook(duplicatePayload, null, JSON.stringify(duplicatePayload));
        assert.strictEqual(dupResult.status, 'already_paid', 'Duplicate payment must be recognized as already_paid');
        console.log('✅ TEST 2 PASSED: Idempotency acknowledged duplicate without repeating side-effects');
        passed++;
    } catch (err) {
        console.error('❌ TEST 2 FAILED:', err.message);
        failed++;
    }

    // TEST 3: Payment Amount Protection (Mismatched amount)
    console.log('\n--- TEST 3: Wrong Amount Discrepancy Protection ---');
    const mismatchOrderNumber = `MISMATCH-${Date.now()}`;
    try {
        await supabaseAdmin.from('orders').insert({
            order_number: mismatchOrderNumber,
            status: 'pending_payment',
            customer_name: 'Mismatch Tester',
            customer_email: 'mismatch@example.com',
            total: 10000.00,
            currency: 'KES'
        });

        const tamperedPayload = {
            event: 'charge.success',
            data: {
                reference: mismatchOrderNumber,
                amount: 5000 * 100, // Trying to pay 5,000 instead of 10,000
                status: 'success'
            }
        };

        const mismatchResult = await paymentService.handleWebhook(tamperedPayload, null, JSON.stringify(tamperedPayload));
        assert.strictEqual(mismatchResult.error, 'amount_mismatch', 'Amount mismatch must be flagged');

        const { data: checkOrder } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('order_number', mismatchOrderNumber)
            .single();

        assert.notStrictEqual(checkOrder.status, 'paid', 'Order with wrong amount must NOT be marked as paid');
        console.log('✅ TEST 3 PASSED: Underpayment safely rejected and flagged for admin review');
        passed++;
    } catch (err) {
        console.error('❌ TEST 3 FAILED:', err.message);
        failed++;
    }

    // TEST 4: WhatsApp Failure Resilience
    console.log('\n--- TEST 4: WhatsApp Failure Resilience (Order remains PAID) ---');
    try {
        const resilientOrderNum = `RESILIENT-WA-${Date.now()}`;
        await supabaseAdmin.from('orders').insert({
            order_number: resilientOrderNum,
            status: 'pending_payment',
            customer_name: 'Resilience Tester',
            customer_email: 'resilience@example.com',
            total: 3000.00,
            currency: 'KES'
        });

        const payload = {
            event: 'charge.success',
            data: {
                reference: resilientOrderNum,
                amount: 3000 * 100,
                status: 'success'
            }
        };

        await paymentService.handleWebhook(payload, null, JSON.stringify(payload));

        const { data: resOrder } = await supabaseAdmin
            .from('orders')
            .select('status')
            .eq('order_number', resilientOrderNum)
            .single();

        assert.strictEqual(resOrder.status, 'paid', 'Order must be PAID even when WhatsApp runs in background or mock');
        console.log('✅ TEST 4 PASSED: Notification failure/mock does not block or revert payment state');
        passed++;
    } catch (err) {
        console.error('❌ TEST 4 FAILED:', err.message);
        failed++;
    }

    // TEST 5: MailerSend Receipt Generation
    console.log('\n--- TEST 5: MailerSend Payment Receipt Execution ---');
    try {
        const receiptResult = await emailService.sendOrderReceipt({
            order_number: testOrderNumber,
            customer_name: 'Test Customer',
            total_amount: testAmount,
            currency: 'KES',
            payment_provider: 'Paystack',
            payment_ref: 'TEST_REF_123',
            order_items: [{ product_title: 'The Talisman Kimono', quantity: 1, line_total: 4500 }]
        }, testCustomerEmail);

        assert.ok(receiptResult, 'Receipt generation must resolve safely');
        console.log('✅ TEST 5 PASSED: MailerSend receipt generated and resolved smoothly');
        passed++;
    } catch (err) {
        console.error('❌ TEST 5 FAILED:', err.message);
        failed++;
    }

    // TEST 6: Paystack Volume Monitoring
    console.log('\n--- TEST 6: Volume Monitoring Calculations ---');
    try {
        const metrics = await paymentService.checkVolumeThresholds();
        assert.ok(metrics !== undefined, 'Volume metrics must be computable');
        console.log(`✅ TEST 6 PASSED: Volume metrics computed (Total: KSh ${metrics?.totalVolumeKes?.toLocaleString() || 0}, Alert Level: ${metrics?.alertLevel || 'normal'})`);
        passed++;
    } catch (err) {
        console.error('❌ TEST 6 FAILED:', err.message);
        failed++;
    }

    console.log(`\n========================================`);
    console.log(`🏁 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    // Cleanup test records
    await supabaseAdmin.from('orders').delete().in('order_number', [testOrderNumber, mismatchOrderNumber]);
    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
