// src/services/paymentService.js
// Dedicated Paystack Payment Service, Verification, Idempotency & Volume Monitor
// ==============================================================================

const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');
const notificationService = require('./notificationService');

class PaymentService {
    constructor() {
        this.secretKey = process.env.PAYSTACK_SECRET_KEY;
        this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
        // In Paystack, webhooks are signed using the standard Secret Key
        this.webhookSecret = process.env.PAYSTACK_SECRET_KEY;
        this.warningThreshold = 445000; // KSh 445,000
        this.criticalThreshold = 480000; // KSh 480,000
    }

    /**
     * Verify Paystack Webhook HMAC SHA512 Signature
     */
    verifySignature(rawBody, headerSignature) {
        if (!this.webhookSecret || !headerSignature) return false;
        try {
            const hash = crypto
                .createHmac('sha512', this.webhookSecret)
                .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
                .digest('hex');
            return hash === headerSignature;
        } catch (err) {
            console.error('[PaymentService] Signature verification error:', err.message);
            return false;
        }
    }

    /**
     * Process Paystack Webhook Event with Full Idempotency & Amount Verification
     */
    async handleWebhook(eventData, signature, rawBody) {
        // 1. Signature Verification
        if (signature && !this.verifySignature(rawBody || eventData, signature)) {
            const err = new Error('Unauthorized Paystack webhook signature');
            err.statusCode = 401;
            throw err;
        }

        const { event, data } = eventData || {};

        if (event !== 'charge.success') {
            console.log(`[PaymentService] Ignored non-charge event: ${event}`);
            return { success: true, ignored: true, event };
        }

        const reference = data?.reference;
        if (!reference) {
            console.error('[PaymentService] Webhook missing transaction reference');
            return { success: false, error: 'missing_reference' };
        }

        // 2. Fetch Existing Order from Supabase
        // References are unique per attempt (order_number + suffix), so resolve using
        // metadata.order_number first, then the stored payment_ref, then the raw
        // reference for older orders created before unique references were introduced.
        const metaOrderNumber = data?.metadata?.order_number;
        let order = null;
        let fetchErr = null;

        for (const [column, value] of [
            ['order_number', metaOrderNumber],
            ['payment_ref', reference],
            ['order_number', reference],
        ]) {
            if (!value) continue;
            const { data: found, error } = await supabaseAdmin
                .from('orders')
                .select('*, order_items(*)')
                .eq(column, value)
                .maybeSingle();
            if (error) fetchErr = error;
            if (found) {
                order = found;
                break;
            }
        }

        if (fetchErr || !order) {
            console.error(`[PaymentService] Order not found for reference: ${reference}`);
            return { success: false, error: 'order_not_found', reference };
        }

        // 3. Mandatory Idempotency Check
        // If order is already marked as paid, return HTTP 200 without duplicate actions
        if (order.status === 'paid') {
            console.log(`[PaymentService] Idempotency: Order #${reference} is already paid. Acknowledging.`);
            return { success: true, status: 'already_paid', reference };
        }

        // 4. Payment Amount Protection
        const paystackPaidAmount = (data.amount || 0) / 100;
        const expectedTotal = parseFloat(order.total);
        const tolerance = 0.50; // Currency conversion margin

        if (Math.abs(paystackPaidAmount - expectedTotal) > tolerance) {
            console.error(`[PaymentService] Amount mismatch for Order #${reference}: Paystack=${paystackPaidAmount}, Expected=${expectedTotal}`);
            await supabaseAdmin
                .from('orders')
                .update({
                    notes: `FLAGGED: Amount mismatch. Paystack paid: ${paystackPaidAmount}, Expected: ${expectedTotal}. Paystack ID: ${data.id}`
                })
                .eq('id', order.id);

            return { success: false, error: 'amount_mismatch', expectedTotal, paystackPaidAmount };
        }

        // 5. Update Existing Order to PAID
        const { error: updateErr } = await supabaseAdmin
            .from('orders')
            .update({
                status: 'paid',
                payment_provider: 'paystack',
                payment_ref: String(data.id || reference),
                paid_at: new Date().toISOString()
            })
            .eq('id', order.id);

        if (updateErr) {
            console.error(`[PaymentService] Failed to update order status to paid:`, updateErr);
            throw updateErr;
        }

        // 6. Safe Inventory Reduction
        if (order.order_items && Array.isArray(order.order_items)) {
            for (const item of order.order_items) {
                if (!item.product_handle) continue;
                try {
                    const { data: prod } = await supabaseAdmin
                        .from('products')
                        .select('inventory_quantity')
                        .eq('handle', item.product_handle)
                        .maybeSingle();

                    if (prod && prod.inventory_quantity !== null && prod.inventory_quantity !== undefined) {
                        const newQty = Math.max(0, prod.inventory_quantity - (item.quantity || 1));
                        await supabaseAdmin
                            .from('products')
                            .update({ inventory_quantity: newQty })
                            .eq('handle', item.product_handle);
                    }
                } catch (invErr) {
                    console.warn(`[PaymentService] Inventory adjustment note for ${item.product_handle}:`, invErr.message);
                }
            }
        }

        // 7. Emit Central PAYMENT_CONFIRMED Event
        notificationService.emitPaymentConfirmed({
            orderId: order.id,
            orderNumber: order.order_number,
            customer: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone
            },
            amount: paystackPaidAmount,
            currency: order.currency || 'KES',
            subtotal: order.subtotal,
            shippingCost: order.shipping_cost,
            paymentMethod: 'paystack',
            paymentReference: String(data.id || reference),
            items: order.order_items || [],
            shippingAddress: order.shipping_address || {}
        });

        // 8. Check Paystack Volume Thresholds (Non-blocking)
        setImmediate(() => {
            this.checkVolumeThresholds();
        });

        return { success: true, status: 'paid', reference };
    }

    /**
     * Volume Monitoring (KSh 445,000 Warning / KSh 480,000 Critical)
     */
    async checkVolumeThresholds() {
        try {
            const { data: orders, error } = await supabaseAdmin
                .from('orders')
                .select('total, currency')
                .eq('status', 'paid')
                .eq('payment_provider', 'paystack');

            if (error || !orders) return null;

            const totalVolumeKes = orders.reduce((sum, o) => {
                const amt = parseFloat(o.total) || 0;
                return sum + (o.currency === 'USD' ? amt * 130 : amt);
            }, 0);

            let alertLevel = 'normal';
            if (totalVolumeKes >= this.criticalThreshold) {
                alertLevel = 'critical';
                console.warn(`[Paystack Volume CRITICAL ALERT]: Total volume reached KSh ${totalVolumeKes.toLocaleString()} (Threshold: KSh ${this.criticalThreshold.toLocaleString()})`);
            } else if (totalVolumeKes >= this.warningThreshold) {
                alertLevel = 'warning';
                console.warn(`[Paystack Volume WARNING]: Total volume reached KSh ${totalVolumeKes.toLocaleString()} (Threshold: KSh ${this.warningThreshold.toLocaleString()})`);
            }

            return { totalVolumeKes, alertLevel, count: orders.length };
        } catch (err) {
            console.error('[PaymentService] Volume calculation error:', err.message);
            return null;
        }
    }
}

module.exports = new PaymentService();
