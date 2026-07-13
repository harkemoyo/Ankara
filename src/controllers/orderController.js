const { getOrderByNumber } = require('../services/orderService');

async function getOrder(req, res) {
    const { order_number } = req.params;
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Customer email is required for lookup' });
    }

    try {
        const order = await getOrderByNumber(order_number, email);
        return res.json(order);
    } catch (error) {
        if (error.message === 'Order not found') {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (error.message === 'Unauthorized') {
            return res.status(403).json({ error: 'Unauthorized to view this order' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getOrder
};
