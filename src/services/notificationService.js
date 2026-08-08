// src/services/notificationService.js
// Central Event-Driven Notification Orchestrator
// =================================================

const EventEmitter = require('events');
const { supabaseAdmin } = require('../config/supabase');
const whatsappService = require('./whatsappService');
const emailService = require('./emailService');

class NotificationService extends EventEmitter {
    constructor() {
        super();
        this.setupListeners();
    }

    setupListeners() {
        // Core PAYMENT_CONFIRMED Event Listener
        this.on('PAYMENT_CONFIRMED', async (payload) => {
            await this.handlePaymentConfirmed(payload);
        });

        // ORDER_STATUS_CHANGED Event Listener
        this.on('ORDER_STATUS_CHANGED', async (payload) => {
            await this.handleStatusChanged(payload);
        });
    }

    /**
     * Handle PAYMENT_CONFIRMED event
     * Dispatches notifications asynchronously with isolated failure handling
     */
    async handlePaymentConfirmed(payload) {
        const {
            orderId,
            orderNumber,
            customer,
            amount,
            currency = 'KES',
            paymentMethod = 'paystack',
            paymentReference,
            items = [],
            shippingAddress = {}
        } = payload;

        console.log(`[NotificationService] Processing PAYMENT_CONFIRMED for Order #${orderNumber}`);

        // Fetch current notification flags to guarantee notification idempotency
        let currentFlags = {};
        try {
            const { data } = await supabaseAdmin
                .from('orders')
                .select('whatsapp_mary_notified, whatsapp_customer_notified, mailersend_receipt_sent')
                .eq('order_number', orderNumber)
                .maybeSingle();
            if (data) currentFlags = data;
        } catch (_) { /* continue with safe dispatch */ }

        // 1. Notify Mary via WhatsApp (Async / Non-blocking / Idempotent)
        if (!currentFlags.whatsapp_mary_notified) {
            setImmediate(async () => {
                try {
                    const maryResult = await whatsappService.sendPaymentAlertToMary({
                        orderNumber,
                        customerName: customer.name,
                        amount,
                        currency,
                        reference: paymentReference
                    });

                    if (maryResult && maryResult.success) {
                        await supabaseAdmin
                            .from('orders')
                            .update({ whatsapp_mary_notified: true })
                            .eq('order_number', orderNumber);
                    }
                } catch (err) {
                    console.error(`[NotificationService] Mary WhatsApp notification failed for #${orderNumber}:`, err.message);
                }
            });
        }

        // 2. Notify Customer via WhatsApp (Async / Non-blocking / Idempotent)
        if (customer.phone && !currentFlags.whatsapp_customer_notified) {
            setImmediate(async () => {
                try {
                    const custResult = await whatsappService.sendPaymentConfirmationToCustomer({
                        toPhone: customer.phone,
                        customerName: customer.name,
                        amount,
                        currency,
                        orderNumber,
                        trackingUrl: `https://maryhumphreywear.org/order-status?ref=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customer.email)}`
                    });

                    if (custResult && custResult.success) {
                        await supabaseAdmin
                            .from('orders')
                            .update({ whatsapp_customer_notified: true })
                            .eq('order_number', orderNumber);
                    }
                } catch (err) {
                    console.error(`[NotificationService] Customer WhatsApp notification failed for #${orderNumber}:`, err.message);
                }
            });
        }

        // 3. Send MailerSend Email Receipt (Async / Non-blocking / Idempotent)
        if (customer.email && !currentFlags.mailersend_receipt_sent) {
            setImmediate(async () => {
                try {
                    const emailResult = await emailService.sendOrderReceipt({
                        id: orderId,
                        order_number: orderNumber,
                        customer_name: customer.name,
                        customer_email: customer.email,
                        subtotal: payload.subtotal || amount,
                        shipping_cost: payload.shippingCost || 0,
                        total_amount: amount,
                        currency,
                        payment_provider: paymentMethod,
                        payment_ref: paymentReference,
                        shipping_address: shippingAddress,
                        order_items: items,
                        created_at: new Date().toISOString()
                    }, customer.email);

                    if (emailResult && emailResult.success) {
                        await supabaseAdmin
                            .from('orders')
                            .update({ mailersend_receipt_sent: true })
                            .eq('order_number', orderNumber);
                    }
                } catch (err) {
                    console.error(`[NotificationService] MailerSend receipt failed for #${orderNumber}:`, err.message);
                }
            });
        }
    }

    /**
     * Handle ORDER_STATUS_CHANGED event (e.g. processing, ready_for_delivery, shipped, delivered)
     */
    async handleStatusChanged(payload) {
        const { orderNumber, customerName, customerPhone, customerEmail, status } = payload;

        if (!customerPhone && !customerEmail) return;

        setImmediate(async () => {
            try {
                if (customerPhone) {
                    await whatsappService.sendOrderStatusUpdate({
                        toPhone: customerPhone,
                        customerName,
                        orderNumber,
                        status
                    });
                }
            } catch (err) {
                console.error(`[NotificationService] WhatsApp status update failed for #${orderNumber}:`, err.message);
            }
        });
    }

    /**
     * Emit PAYMENT_CONFIRMED event helper
     */
    emitPaymentConfirmed(payload) {
        this.emit('PAYMENT_CONFIRMED', payload);
    }
}

module.exports = new NotificationService();
