const { supabaseAdmin } = require('../config/supabase');

async function initializeCheckout(cart, customer) {
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
        throw new Error('Missing cart');
    }
    if (!customer?.email || !customer?.name) {
        throw new Error('Customer email and name are required');
    }

    // Fetch live currency from settings (fallback to 'KES')
    let orderCurrency = 'KES';
    try {
        const { data: settings } = await supabaseAdmin
            .from('settings')
            .select('currency')
            .eq('id', 1)
            .single();
        if (settings?.currency) orderCurrency = settings.currency;
    } catch (_) { /* use default */ }

    const subtotal     = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
    const shippingCost = subtotal >= 80 ? 0 : 5.99;
    const total        = subtotal + shippingCost;
    const totalKobo    = Math.round(total * 100);

    // 1. Create PENDING order in Supabase
    const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
            order_number:     '', // Trigger populates this
            status:           'pending',
            customer_email:   customer.email.toLowerCase().trim(),
            customer_name:    customer.name.trim(),
            customer_phone:   customer.phone || null,
            customer_user_id: customer.user_id || null,
            shipping_address: {
                address1: customer.address1 || '',
                address2: customer.address2 || '',
                city:     customer.city     || '',
                postcode: customer.postcode || '',
                country:  customer.country  || 'KE',
            },
            subtotal,
            shipping_cost:    shippingCost,
            total,
            currency:         orderCurrency,
            payment_provider: 'paystack',
            payment_ref:      null,
        })
        .select('id, order_number')
        .single();

    if (orderError) {
        console.error('Failed to insert pending order:', orderError);
        throw new Error('Order could not be created');
    }

    // 2. Insert order items
    const orderItems = cart.map(item => ({
        order_id:       order.id,
        product_id:     item.product_id || null,
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
        throw new Error('Order items could not be created');
    }

    // 3. Initialize Paystack Transaction
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: customer.email,
            amount: totalKobo,
            reference: order.order_number,
        })
    });

    const paystackData = await paystackRes.json();
    if (!paystackData.status) {
        console.error('Paystack initialization failed:', paystackData);
        throw new Error('Payment initialization failed');
    }

    return {
        success: true,
        access_code: paystackData.data.access_code,
        reference: order.order_number
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

        // Decrement inventory (assuming inventory_quantity column exists)
        const { data: items } = await supabaseAdmin
            .from('order_items')
            .select('product_handle, quantity')
            .eq('order_id', order.id);

        if (items) {
            for (const item of items) {
                if (!item.product_handle) continue;
                // Since Supabase REST doesn't support decrement natively without RPC,
                // we fetch then update. The query fails gracefully if column doesn't exist
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

module.exports = {
    initializeCheckout,
    processWebhook
};
