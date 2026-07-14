const { initializeCheckout, processWebhook } = require('../services/checkoutService');
const crypto = require('crypto');

async function initCheckout(req, res) {
    const { cart, customer } = req.body;

    try {
        const result = await initializeCheckout(cart, customer);
        return res.json(result);
    } catch (error) {
        console.error('Checkout error:', error.message);
        
        if (error.message === 'Missing cart' || error.message === 'Customer email and name are required') {
            return res.status(400).json({ error: error.message });
        }
        
        return res.status(500).json({ error: error.message });
    }
}

async function paystackWebhook(req, res) {
    // Validate Paystack Signature
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(401).send('Unauthorized webhook signature');
    }

    try {
        await processWebhook(req.body);
    } catch (err) {
        console.error('Webhook processing error:', err);
    }

    res.sendStatus(200);
}

module.exports = {
    initCheckout,
    paystackWebhook
};
