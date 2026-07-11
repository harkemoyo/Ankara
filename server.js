// server.js — Ankara Store Backend
// =============================================
// Handles:
//  - Static file serving
//  - POST /api/checkout   (Paystack verify → Supabase order insert)
//  - GET  /api/orders/:id (order lookup for thank-you page)
// =============================================

require('dotenv').config();

const express = require('express');
const path    = require('path');
const fetch   = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Supabase clients ───────────────────────────────────────────────────────
// ANON key  → used by the browser (read-only per RLS)
// SERVICE key → used by this server only (bypasses RLS — keep it secret!)
const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

// ─── Static Files ────────────────────────────────────────────────────────────
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// ─── Page Routes ─────────────────────────────────────────────────────────────
const pages = ['/', '/shop', '/about', '/contact', '/product', '/admin', '/cart', '/checkout', '/thank-you'];
const pageMap = {
    '/':          'index.html',
    '/shop':      'shop.html',
    '/about':     'about.html',
    '/contact':   'contact.html',
    '/product':   'product.html',
    '/admin':     'admin.html',
    '/cart':      'cart.html',
    '/checkout':  'checkout.html',
    '/thank-you': 'thank-you.html',
};
pages.forEach(route => {
    app.get(route, (req, res) => {
        const file = pageMap[route];
        res.sendFile(path.join(__dirname, file));
    });
});

// ─── CHECKOUT ENDPOINT ────────────────────────────────────────────────────────
// Called by the frontend AFTER Paystack returns a payment reference.
// Flow:
//   1. Frontend collects payment via Paystack popup → gets reference
//   2. Frontend POSTs { reference, cart, customer } to this endpoint
//   3. We verify the reference with Paystack (server-to-server, secret key)
//   4. If verified & amount matches → create order in Supabase
//   5. Return { success, order_number }
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/checkout', async (req, res) => {
    const { reference, cart, customer } = req.body;

    // ── Validate inputs ──
    if (!reference || !cart || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: 'Missing reference or cart' });
    }
    if (!customer?.email || !customer?.name) {
        return res.status(400).json({ error: 'Customer email and name are required' });
    }

    // ── 1. Verify payment with Paystack ──
    let paystackData;
    try {
        const paystackRes = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        paystackData = await paystackRes.json();
    } catch (err) {
        console.error('Paystack verify network error:', err);
        return res.status(502).json({ error: 'Payment verification failed' });
    }

    if (!paystackData.status || paystackData.data?.status !== 'success') {
        console.warn('Paystack payment not successful:', paystackData);
        return res.status(402).json({ error: 'Payment not confirmed by Paystack' });
    }

    // ── 2. Calculate expected total (in kobo/pence) ──
    const subtotal     = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const shippingCost = subtotal >= 80 ? 0 : 5.99;  // Free shipping over £80
    const total        = subtotal + shippingCost;
    const totalKobo    = Math.round(total * 100);     // Paystack sends amount in smallest unit

    // Verify the amount paid matches what we expect (fraud prevention)
    if (paystackData.data.amount !== totalKobo) {
        console.warn(`Amount mismatch! Expected ${totalKobo}, got ${paystackData.data.amount}`);
        return res.status(402).json({ error: 'Payment amount mismatch' });
    }

    // ── 3. Check for duplicate order (idempotency) ──
    const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id, order_number')
        .eq('payment_ref', reference)
        .maybeSingle();

    if (existing) {
        // Already processed this reference — return the existing order
        return res.json({ success: true, order_number: existing.order_number, duplicate: true });
    }

    // ── 4. Create order in Supabase using service role key ──
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            order_number:     '',                    // Trigger will fill this as ANK-XXXX
            status:           'paid',
            customer_email:   customer.email.toLowerCase().trim(),
            customer_name:    customer.name.trim(),
            customer_phone:   customer.phone || null,
            customer_user_id: customer.user_id || null,  // null = guest
            shipping_address: {
                address1: customer.address1 || '',
                address2: customer.address2 || '',
                city:     customer.city     || '',
                postcode: customer.postcode || '',
                country:  customer.country  || 'GB',
            },
            subtotal,
            shipping_cost:    shippingCost,
            total,
            currency:         '£',
            payment_provider: 'paystack',
            payment_ref:      reference,
            paid_at:          new Date().toISOString(),
        })
        .select('id, order_number')
        .single();

    if (orderError) {
        console.error('Failed to insert order:', orderError);
        return res.status(500).json({ error: 'Order could not be created', detail: orderError.message });
    }

    // ── 5. Insert order items (one row per cart item) ──
    const orderItems = cart.map(item => ({
        order_id:       order.id,
        product_id:     item.product_id || null,    // optional FK
        product_handle: item.id || item.handle || '',
        product_title:  item.title,
        variant_size:   item.size   || null,
        variant_color:  item.color  || null,
        unit_price:     parseFloat(item.price),
        quantity:       parseInt(item.qty)   || 1,
        image:          item.image || null,
    }));

    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Failed to insert order items:', itemsError);
        // Order exists but items failed — flag for manual recovery
        await supabaseAdmin
            .from('orders')
            .update({ notes: 'WARNING: order_items insert failed — check manually' })
            .eq('id', order.id);
        return res.status(500).json({ error: 'Order created but items failed', order_number: order.order_number });
    }

    console.log(`✅ Order ${order.order_number} created for ${customer.email}`);
    return res.json({ success: true, order_number: order.order_number });
});

// ─── ORDER LOOKUP (for thank-you page) ───────────────────────────────────────
// Returns public-safe order info. No auth required — order_number acts as token.
// The URL is only known to the customer (Paystack redirected them here).
app.get('/api/orders/:order_number', async (req, res) => {
    const { order_number } = req.params;

    const { data: order, error } = await supabaseAdmin
        .from('orders')
        .select(`
            order_number,
            status,
            customer_name,
            customer_email,
            shipping_address,
            subtotal,
            shipping_cost,
            total,
            currency,
            paid_at,
            created_at,
            order_items (
                product_title,
                variant_size,
                variant_color,
                unit_price,
                quantity,
                line_total,
                image
            )
        `)
        .eq('order_number', order_number)
        .single();

    if (error || !order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Ankara Store running at http://localhost:${PORT}`);
    console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅ set' : '❌ NOT SET — check .env'}`);
    console.log(`   Service Key:  ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ NOT SET — orders will fail'}`);
    console.log(`   Paystack Key: ${process.env.PAYSTACK_SECRET_KEY ? '✅ set' : '❌ NOT SET — checkout will fail'}`);
});
