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

function createHttpError(message, statusCode = 400) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

function validateCustomer(customer) {
    const email = String(customer?.email || '').trim().toLowerCase();
    const name = String(customer?.name || '').trim();
    if (!email || !name) {
        throw createHttpError('Customer email and name are required', 400);
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw createHttpError('Please enter a valid email address', 400);
    }
    if (name.length > 120) {
        throw createHttpError('Customer name is too long', 400);
    }
    return {
        ...customer,
        email,
        name,
        phone: customer?.phone ? String(customer.phone).trim().slice(0, 40) : null
    };
}

/**
 * Resolve every cart item against authoritative product prices in Supabase.
 * Prevents client-side price tampering and negative/invalid quantities.
 */
async function resolveVerifiedCartItems(cart) {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        throw createHttpError('Missing cart', 400);
    }
    if (cart.length > 50) {
        throw createHttpError('Cart exceeds maximum allowed items', 400);
    }

    const handles = Array.from(new Set(
        cart
            .map(item => String(item?.id || item?.handle || '').trim())
            .filter(Boolean)
    ));
    const numericIds = Array.from(new Set(
        cart
            .map(item => Number(item?.product_id))
            .filter(id => Number.isInteger(id) && id > 0)
    ));

    if (handles.length === 0 && numericIds.length === 0) {
        throw createHttpError('Cart contains invalid items', 400);
    }

    const byHandle = new Map();
    const byId = new Map();

    if (handles.length > 0) {
        const { data: handleProducts, error } = await supabaseAdmin
            .from('products')
            .select('id, handle, title, price, images, in_stock, status')
            .in('handle', handles);
        if (error) {
            console.error('[Checkout] Product lookup by handle failed:', error.message);
            throw createHttpError('Unable to verify product prices right now', 500);
        }
        for (const p of (handleProducts || [])) {
            byHandle.set(String(p.handle).toLowerCase(), p);
            byId.set(p.id, p);
        }
    }

    const missingNumericIds = numericIds.filter(id => !byId.has(id));
    if (missingNumericIds.length > 0) {
        const { data: idProducts, error } = await supabaseAdmin
            .from('products')
            .select('id, handle, title, price, images, in_stock, status')
            .in('id', missingNumericIds);
        if (!error && idProducts) {
            for (const p of idProducts) {
                byHandle.set(String(p.handle).toLowerCase(), p);
                byId.set(p.id, p);
            }
        }
    }

    // Optional variant-level pricing lookup (when product_variants defines an override price)
    const variantsByProductId = new Map();
    const matchedProductIds = Array.from(byId.keys());
    if (matchedProductIds.length > 0) {
        try {
            const { data: variants } = await supabaseAdmin
                .from('product_variants')
                .select('product_id, title, option1, option2, price')
                .in('product_id', matchedProductIds);
            for (const v of (variants || [])) {
                if (!variantsByProductId.has(v.product_id)) {
                    variantsByProductId.set(v.product_id, []);
                }
                variantsByProductId.get(v.product_id).push(v);
            }
        } catch (_) {
            // product_variants table may be empty or optional — base product price is used
        }
    }

    const verifiedItems = [];
    for (const item of cart) {
        const rawHandle = String(item?.id || item?.handle || '').trim();
        const rawQty = Number(item?.qty ?? 1);
        if (!Number.isInteger(rawQty) || rawQty < 1 || rawQty > 99) {
            throw createHttpError('Invalid item quantity. Quantity must be between 1 and 99.', 400);
        }

        const dbProduct =
            (rawHandle && byHandle.get(rawHandle.toLowerCase())) ||
            (Number.isInteger(Number(item?.product_id)) && byId.get(Number(item.product_id))) ||
            null;

        if (!dbProduct || dbProduct.status === 'archived') {
            throw createHttpError(
                `Product "${item?.title || rawHandle || 'item'}" is no longer available. Please refresh your cart.`,
                400
            );
        }

        const sizeStr = item?.size ? String(item.size).trim().slice(0, 40) : null;
        const colorStr = item?.color ? String(item.color).trim().slice(0, 60) : null;

        let unitPrice = parseFloat(dbProduct.price);
        const productVariants = variantsByProductId.get(dbProduct.id) || [];
        if (productVariants.length > 0 && (sizeStr || colorStr)) {
            const matchedVariant = productVariants.find(v => {
                const vPrice = parseFloat(v.price);
                if (!Number.isFinite(vPrice) || vPrice <= 0) return false;
                const opts = [v.title, v.option1, v.option2].filter(Boolean).map(s => String(s).toLowerCase());
                const sizeMatch = !sizeStr || opts.some(o => o === sizeStr.toLowerCase() || o.includes(sizeStr.toLowerCase()));
                const colorMatch = !colorStr || opts.some(o => o === colorStr.toLowerCase() || o.includes(colorStr.toLowerCase()));
                return sizeMatch && colorMatch;
            });
            if (matchedVariant && parseFloat(matchedVariant.price) > 0) {
                unitPrice = parseFloat(matchedVariant.price);
            }
        }

        if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
            throw createHttpError(`Invalid price configuration for "${dbProduct.title}".`, 400);
        }

        const dbImage = Array.isArray(dbProduct.images) && dbProduct.images.length > 0
            ? dbProduct.images[0]
            : null;

        verifiedItems.push({
            product_id: dbProduct.id,
            product_handle: dbProduct.handle,
            product_title: dbProduct.title,
            variant_size: sizeStr,
            variant_color: colorStr,
            unit_price: unitPrice,
            quantity: rawQty,
            image: (item?.image && String(item.image).slice(0, 500)) || dbImage || null,
            made_to_measure: Boolean(item?.madeToMeasure)
        });
    }

    const subtotal = verifiedItems.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
    return { verifiedItems, subtotal };
}

async function initializeCheckout(cart, customer, req) {
    const cleanCustomer = validateCustomer(customer);
    const { verifiedItems, subtotal } = await resolveVerifiedCartItems(cart);

    // Normalized ISO currency code (settings.currency stores a display symbol, e.g. "KSh")
    const orderCurrency = await getOrderCurrency();

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
            customer_email: cleanCustomer.email,
            customer_name: cleanCustomer.name,
            customer_phone: cleanCustomer.phone,
            customer_user_id: cleanCustomer.user_id || null,
            shipping_address: {
                address1: String(cleanCustomer.address1 || '').slice(0, 200),
                address2: String(cleanCustomer.address2 || '').slice(0, 200),
                city: String(cleanCustomer.city || '').slice(0, 100),
                postcode: String(cleanCustomer.postcode || '').slice(0, 40),
                country: String(cleanCustomer.country || 'KE').slice(0, 10),
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

    // 2. Insert verified order items
    const orderItems = verifiedItems.map(item => ({
        order_id: order.id,
        ...item
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
    const baseUrl = process.env.BASE_URL || `${req?.protocol || 'https'}://${req?.get?.('host') || 'maryhumphreywear.org'}`;
    const callback_url = `${baseUrl}/thank-you.html?order=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(cleanCustomer.email)}`;

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
                email: cleanCustomer.email,
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
    await sendMadeToMeasureAlerts(order.order_number, cleanCustomer, orderCurrency, total, orderItems);

    // WhatsApp alert (mocked until access token arrives)
    try {
        await whatsappService.sendNewOrderAlertToMary({
            orderNumber: order.order_number,
            customerName: cleanCustomer.name,
            customerPhone: cleanCustomer.phone || 'No phone',
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
            customer: cleanCustomer,
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
    const cleanCustomer = validateCustomer(customer);
    const { verifiedItems, subtotal } = await resolveVerifiedCartItems(cart);

    // Normalized ISO currency code (settings.currency stores a display symbol, e.g. "KSh")
    const orderCurrency = await getOrderCurrency();

    const shippingCost = subtotal >= 10000 ? 0 : 500;   // KES: free shipping over KSh 10,000
    const total = subtotal + shippingCost;

    // Determine which M-Pesa method customer chose
    const mpesaMethod = cleanCustomer.mpesa_method === 'send_money' ? 'send_money' : 'paybill';

    // 1. Create PENDING order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            order_number: '', // Trigger populates this
            status: 'pending_payment',
            customer_email: cleanCustomer.email,
            customer_name: cleanCustomer.name,
            customer_phone: cleanCustomer.phone,
            customer_user_id: cleanCustomer.user_id || null,
            shipping_address: {
                address1: String(cleanCustomer.address1 || '').slice(0, 200),
                address2: String(cleanCustomer.address2 || '').slice(0, 200),
                city: String(cleanCustomer.city || '').slice(0, 100),
                postcode: String(cleanCustomer.postcode || '').slice(0, 40),
                country: String(cleanCustomer.country || 'KE').slice(0, 10),
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

    // 2. Insert verified order items
    const orderItems = verifiedItems.map(item => ({
        order_id: order.id,
        ...item
    }));

    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        await rollbackPendingOrder(order.id, order.order_number);
        console.error('Failed to insert order items:', itemsError);
        throw new Error('Order items could not be created');
    }

    // 2b. Send made-to-measure alerts (email + WhatsApp)
    await sendMadeToMeasureAlerts(order.order_number, cleanCustomer, orderCurrency, total, orderItems);

    // 3. Send order confirmation email with M-Pesa payment instructions
    try {
        emailService.sendOrderConfirmation({
            id: order.id,
            order_number: order.order_number,
            total_amount: total,
            payment_provider: 'mpesa',
            customer_name: cleanCustomer.name,
        }, cleanCustomer.email);
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
