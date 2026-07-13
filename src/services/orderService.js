const { supabaseAdmin } = require('../config/supabase');

async function getOrderByNumber(order_number, customer_email) {
    if (!order_number || !customer_email) {
        throw new Error('Order number and customer email are required');
    }

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
        throw new Error('Order not found');
    }

    // Case-insensitive, trimmed email comparison
    if (order.customer_email.trim().toLowerCase() !== customer_email.trim().toLowerCase()) {
        throw new Error('Unauthorized');
    }

    return order;
}

module.exports = {
    getOrderByNumber
};
