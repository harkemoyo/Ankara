const { supabaseAdmin } = require('../config/supabase');

async function processCheckout(reference, cart, customer) {
    // ── Validate inputs ──
    if (!reference || !cart || !Array.isArray(cart) || cart.length === 0) {
        throw new Error('Missing reference or cart');
    }
    if (!customer?.email || !customer?.name) {
        throw new Error('Customer email and name are required');
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
        throw new Error('Payment verification failed');
    }

    if (!paystackData.status || paystackData.data?.status !== 'success') {
        console.warn('Paystack payment not successful:', paystackData);
        throw new Error('Payment not confirmed by Paystack');
    }

    // ── 2. Calculate expected total (in kobo/pence) ──
    const subtotal     = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const shippingCost = subtotal >= 80 ? 0 : 5.99;  // Free shipping over £80
    const total        = subtotal + shippingCost;
    const totalKobo    = Math.round(total * 100);     // Paystack sends amount in smallest unit

    // Verify the amount paid matches what we expect (fraud prevention)
    if (paystackData.data.amount !== totalKobo) {
        console.warn(`Amount mismatch! Expected ${totalKobo}, got ${paystackData.data.amount}`);
        throw new Error('Payment amount mismatch');
    }

    // ── 3. Check for duplicate order (idempotency) ──
    const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('id, order_number')
        .eq('payment_ref', reference)
        .maybeSingle();

    if (existing) {
        // Already processed this reference — return the existing order
        return { success: true, order_number: existing.order_number, duplicate: true };
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
        throw new Error('Order could not be created');
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
        throw new Error('Order created but items failed');
    }

    console.log(`✅ Order ${order.order_number} created for ${customer.email}`);
    return { success: true, order_number: order.order_number };
}

module.exports = {
    processCheckout
};
