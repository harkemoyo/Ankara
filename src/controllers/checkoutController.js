const { processCheckout } = require('../services/checkoutService');

async function checkout(req, res) {
    const { reference, cart, customer } = req.body;

    try {
        const result = await processCheckout(reference, cart, customer);
        return res.json(result);
    } catch (error) {
        console.error('Checkout error:', error.message);
        
        // Map error messages to status codes to preserve existing behavior
        if (error.message === 'Missing reference or cart' || error.message === 'Customer email and name are required') {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === 'Payment verification failed') {
            return res.status(502).json({ error: error.message });
        }
        if (error.message === 'Payment not confirmed by Paystack' || error.message === 'Payment amount mismatch') {
            return res.status(402).json({ error: error.message });
        }
        
        // Default 500 for order creation failures
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    checkout
};
