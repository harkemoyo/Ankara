const { supabaseAdmin } = require('../config/supabase');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');

const SYMBOL_TO_ISO = {
    'KSH': 'KES',
    'KES': 'KES',
    'KE': 'KES',
    '$': 'USD',
    'USD': 'USD',
    'US$': 'USD',
};

function normalizeCurrency(raw) {
    if (!raw) return 'KES';
    const key = String(raw).trim().toUpperCase();
    return SYMBOL_TO_ISO[key] || 'KES';
}

async function getOrderCurrency() {
    try {
        const { data: settings } = await supabaseAdmin
            .from('settings')
            .select('currency')
            .eq('id', 1)
            .single();
        return normalizeCurrency(settings?.currency);
    } catch (_) {
        return 'KES';
    }
}

async function initializeCheckout(cart, customer, req) {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        throw new Error('Missing cart');
    }
    if (!customer?.email || !customer?.name) {
        throw new Error('Customer email and name are required');
    }

    // Normalized ISO currency code (settings.currency stores a display symbol, e.g. "KSh")
    const orderCurrency = await getOrderCurrency();

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    // Shipping is free — must match what checkout.html displays to the customer
    const shippingCost = 0;
    const total = subtotal + shippingCost;
    const amountInMinorUnits = Math.round(total * 100);

    // 1. Create PENDING order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            order_number: '', // Trigger populates this
            status: 'pending',
            customer_email: customer.email.toLowerCase().trim(),
            customer_name: customer.name.trim(),
            customer_phone: customer.phone || null,
            customer_user_id: customer.user_id || null,
            shipping_address: {
                address1: customer.address1 || '',
                address2: customer.address2 || '',
                city: customer.city || '',
                postcode: customer.postcode || '',
                country: customer.country || 'KE',
            },
            subtotal,
            shipping_cost: shippingCost,
            total,
            currency: orderCurrency,
            payment_provider: 'paystack',
            payment_ref: null,
        })
        .select('id, order_number')
        .single();

    if (orderError) {
        console.error('Failed to insert pending order:', orderError);
        throw new Error('Order could not be created');
    }

    // 2. Insert order items
    const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_handle: item.id || item.handle || '',
        product_title: item.title,
        variant_size: item.size || null,
        variant_color: item.color || null,
        unit_price: parseFloat(item.price),
        quantity: parseInt(item.qty) || 1,
        image: item.image || null,
        made_to_measure: item.madeToMeasure || false,
    }));

    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        await rollbackPendingOrder(order.id, order.order_number);
        console.error('Failed to insert order items:', itemsError);
        throw new Error('Order items could not be created');
    }

    // 3. Build callback URL for Paystack redirect after payment
    const baseUrl = process.env.BASE_URL || `${req?.protocol || 'http'}://${req?.get?.('host') || 'localhost:3000'}`;
    const callback_url = `${baseUrl}/thank-you.html?order=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(customer.email)}`;

    // 4. Initialize Paystack Transaction
    // Paystack reserves a reference permanently, so reusing an order number that was
    // already sent (or reissued after a rollback) fails with duplicate_reference.
    // Use a unique reference per attempt and carry order_number in metadata so the
    // webhook can always resolve the order.
    const paystackReference = `${order.order_number}-${Date.now().toString(36).toUpperCase()}`;

    let paystackData;
    try {
        const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: customer.email,
                amount: amountInMinorUnits,
                currency: orderCurrency,
                reference: paystackReference,
                callback_url,
                metadata: {
                    order_number: order.order_number,
                    order_id: order.id,
                },
            })
        });
        paystackData = await paystackRes.json();
    } catch (err) {
        await rollbackPendingOrder(order.id, order.order_number);
        console.error('[Checkout] Paystack request failed:', err.message);
        throw new Error('Payment initialization failed');
    }

    if (!paystackData.status) {
        await rollbackPendingOrder(order.id, order.order_number);
        console.error(
            `[Checkout] Paystack rejected order ${order.order_number}: ${paystackData.message || 'unknown error'}`,
            paystackData
        );
        throw new Error(`Payment initialization failed: ${paystackData.message || 'unknown error'}`);
    }

    // Persist the reference so the webhook can match it back to this order
    await supabaseAdmin
        .from('orders')
        .update({ payment_ref: paystackReference })
        .eq('id', order.id);

    // 5. Notify only once payment initialization has actually succeeded,
    //    so abandoned/failed attempts never alert Mary.
    await sendMadeToMeasureAlerts(order.order_number, customer, orderCurrency, total, orderItems);

    // WhatsApp alert (mocked until access token arrives)
    try {
        await whatsappService.sendNewOrderAlertToMary({
            orderNumber: order.order_number,
            customerName: customer.name.trim(),
            customerPhone: customer.phone || 'No phone',
            items: orderItems,
            totalAmount: total,
            currency: orderCurrency,
        });
    } catch (err) {
        console.error('[Checkout] New order WhatsApp alert to Mary failed:', err.message);
    }

    // Email fallback to Mary while WhatsApp is off
    try {
        emailService.sendNewOrderAlertToMary({
            orderNumber: order.order_number,
            customer,
            items: orderItems,
            totalAmount: total,
            currency: orderCurrency,
        });
    } catch (err) {
        console.error('[Checkout] New order email alert to Mary failed:', err.message);
    }

    return {
        success: true,
        access_code: paystackData.data.access_code,
        authorization_url: paystackData.data.authorization_url,
        reference: order.order_number
    };
}

/**
 * Remove a pending order and its items after a failed payment initialization,
 * so unusable orders don't accumulate in the database.
 */
async function rollbackPendingOrder(orderId, orderNumber) {
    try {
        await supabaseAdmin.from('order_items').delete().eq('order_id', orderId);
        await supabaseAdmin.from('orders').delete().eq('id', orderId).eq('status', 'pending');
        console.warn(`[Checkout] Rolled back pending order ${orderNumber} after failed payment init`);
    } catch (err) {
        console.error(`[Checkout] Failed to roll back pending order ${orderNumber}:`, err.message);
    }
}

/**
 * M-Pesa Manual Checkout
 * Creates a pending order and returns the order reference.
 * Customer pays via M-Pesa (Paybill or Send Money) and the
 * admin manually marks it as paid from the admin panel.
 */
async function initializeMpesaCheckout(cart, customer) {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        throw new Error('Missing cart');
    }
    if (!customer?.email || !customer?.name) {
        throw new Error('Customer email and name are required');
    }

    // Normalized ISO currency code (settings.currency stores a display symbol, e.g. "KSh")
    const orderCurrency = await getOrderCurrency();

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const shippingCost = subtotal >= 10000 ? 0 : 500;   // KES: free shipping over KSh 10,000
    const total = subtotal + shippingCost;

    // Determine which M-Pesa method customer chose
    const mpesaMethod = customer.mpesa_method || 'paybill'; // 'paybill' or 'send_money'

    // 1. Create PENDING order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            order_number: '', // Trigger populates this
            status: 'pending_payment',
            customer_email: customer.email.toLowerCase().trim(),
            customer_name: customer.name.trim(),
            customer_phone: customer.phone || null,
            customer_user_id: customer.user_id || null,
            shipping_address: {
                address1: customer.address1 || '',
                address2: customer.address2 || '',
                city: customer.city || '',
                postcode: customer.postcode || '',
                country: customer.country || 'KE',
            },
            subtotal,
            shipping_cost: shippingCost,
            total,
            currency: orderCurrency,
            payment_provider: 'mpesa',
            payment_ref: null,
            notes: `M-Pesa ${mpesaMethod === 'send_money' ? 'Send Money to 0715687280' : 'Paybill 247247, Acc 687280'}`,
        })
        .select('id, order_number')
        .single();

    if (orderError) {
        console.error('Failed to insert pending order:', orderError);
        throw new Error('Order could not be created');
    }

    // 2. Insert order items
    const orderItems = cart.map(item => ({
        order_id: order.id,
        product_id: item.product_id || null,
        product_handle: item.id || item.handle || '',
        product_title: item.title,
        variant_size: item.size || null,
        variant_color: item.color || null,
        unit_price: parseFloat(item.price),
        quantity: parseInt(item.qty) || 1,
        image: item.image || null,
        made_to_measure: item.madeToMeasure || false,
    }));

    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Failed to insert order items:', itemsError);
        throw new Error('Order items could not be created');
    }

    // 2b. Send made-to-measure alerts (email + WhatsApp)
    await sendMadeToMeasureAlerts(order.order_number, customer, orderCurrency, total, orderItems);

    // 3. Send order confirmation email with M-Pesa payment instructions
    try {
        emailService.sendOrderConfirmation({
            id: order.id,
            order_number: order.order_number,
            total_amount: total,
            payment_provider: 'mpesa',
            customer_name: customer.name.trim(),
        }, customer.email.toLowerCase().trim());
    } catch (_) { /* email is non-critical */ }

    return {
        success: true,
        reference: order.order_number,
        total,
        mpesa_method: mpesaMethod,
    };
}

async function processWebhook(eventData) {
    const { event, data } = eventData;

    if (event === 'charge.success') {
        // Update order status to paid
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('order_number', data.reference)
            .select('id')
            .single();

        if (orderError || !order) {
            console.error('Failed to update order status to paid:', orderError);
            return;
        }

        // Trigger transactional order confirmation email via MailerSend queue
        if (data && data.customer && data.customer.email) {
            emailService.sendOrderConfirmation({
                id: order.id,
                order_number: data.reference,
                total_amount: (data.amount || 0) / 100,
                customer_name: data.customer.first_name || 'Customer'
            }, data.customer.email);
        }

        // Decrement inventory (assuming inventory_quantity column exists)
        const { data: items } = await supabaseAdmin
            .from('order_items')
            .select('product_handle, quantity')
            .eq('order_id', order.id);

        if (items) {
            for (const item of items) {
                if (!item.product_handle) continue;
                const { data: product, error: getErr } = await supabaseAdmin
                    .from('products')
                    .select('inventory_quantity')
                    .eq('handle', item.product_handle)
                    .maybeSingle();

                if (!getErr && product && product.inventory_quantity !== undefined && product.inventory_quantity !== null) {
                    const newQty = Math.max(0, product.inventory_quantity - item.quantity);
                    await supabaseAdmin
                        .from('products')
                        .update({ inventory_quantity: newQty })
                        .eq('handle', item.product_handle);
                }
            }
        }
    } else if (event === 'charge.failed') {
        await supabaseAdmin
            .from('orders')
            .update({ status: 'failed' })
            .eq('order_number', data.reference);
    }
}

async function sendMadeToMeasureAlerts(orderNumber, customer, currency, totalAmount, items) {
    if (!customer?.email && !customer?.phone) return;
    const mtmItems = items.filter(i => i.made_to_measure);
    if (mtmItems.length === 0) return;

    const payload = {
        orderNumber,
        customer: {
            name: customer.name || 'Customer',
            phone: customer.phone || '',
            email: customer.email || ''
        },
        items,
        currency,
        totalAmount
    };

    // Email customer
    if (customer.email) {
        emailService.sendMadeToMeasureAlert(payload, customer.email, false);
    }

    // Email owner
    const ownerEmail = process.env.OWNER_EMAIL || process.env.SUPPORT_EMAIL;
    if (ownerEmail && ownerEmail.includes('@')) {
        emailService.sendMadeToMeasureAlert(payload, ownerEmail, true);
    } else {
        console.warn('[Checkout] No OWNER_EMAIL or SUPPORT_EMAIL configured; skipping MTM owner alert');
    }

    const itemList = mtmItems.map(i => `${i.product_title || 'Item'} x${i.quantity || 1}`).join(', ');

    // WhatsApp owner
    try {
        await whatsappService.sendMadeToMeasureAlertToMary({
            orderNumber,
            customerName: customer.name || 'Customer',
            customerPhone: customer.phone || 'No phone',
            itemList
        });
    } catch (err) {
        console.error('[Checkout] WhatsApp alert to Mary failed:', err.message);
    }

    // WhatsApp customer
    if (customer.phone) {
        try {
            await whatsappService.sendMadeToMeasureAlertToCustomer({
                toPhone: customer.phone,
                customerName: customer.name || 'Customer',
                orderNumber,
                itemList
            });
        } catch (err) {
            console.error('[Checkout] WhatsApp alert to customer failed:', err.message);
        }
    }
}

module.exports = {
    initializeCheckout,
    initializeMpesaCheckout,
    processWebhook
};
