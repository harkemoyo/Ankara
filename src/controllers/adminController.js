const { supabaseAdmin } = require('../config/supabase');

const VALID_STATUS = [
    'pending_payment',
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'fulfilled',
    'cancelled'
];

async function updateOrderStatus(req, res) {
    const { order_number } = req.params;
    const { status, notes } = req.body;

    if (!order_number) {
        return res.status(400).json({ error: 'Order number is required' });
    }
    if (!VALID_STATUS.includes(status)) {
        return res.status(400).json({
            error: `Invalid status. Must be one of: ${VALID_STATUS.join(', ')}`
        });
    }

    try {
        // Fetch existing order
        const { data: order, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('order_number', order_number)
            .single();

        if (fetchError || !order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const update = { status };
        if (notes) update.notes = notes;

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update(update)
            .eq('order_number', order_number)
            .select('*')
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: `Order ${order_number} updated to ${status}`,
            order: data
        });
    } catch (err) {
        console.error('[Admin] Update order status failed:', err.message);
        res.status(500).json({ error: 'Failed to update order status', details: err.message });
    }
}

module.exports = { updateOrderStatus };
