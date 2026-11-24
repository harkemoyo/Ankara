const { initializeCheckout, initializeMpesaCheckout } = require('../services/checkoutService');
const paymentService = require('../services/paymentService');

const isProduction = () => process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

async function initCheckout(req, res) {
    const { cart, customer } = req.body || {};

    try {
        const result = await initializeCheckout(cart, customer, req);
        return res.json(result);
    } catch (error) {
        console.error('Checkout error:', error.message);

        const status = error.statusCode || 500;
        if (status >= 400 && status < 500) {
            return res.status(status).json({ error: error.message });
        }

        return res.status(500).json({
            error: isProduction() ? 'Unable to start checkout. Please try again.' : error.message
        });
    }
}

async function initMpesaCheckout(req, res) {
    const { cart, customer } = req.body || {};

    try {
        const result = await initializeMpesaCheckout(cart, customer);
        return res.json(result);
    } catch (error) {
        console.error('M-Pesa checkout error:', error.message);

        const status = error.statusCode || 500;
        if (status >= 400 && status < 500) {
            return res.status(status).json({ error: error.message });
        }

        return res.status(500).json({
            error: isProduction() ? 'Unable to create order. Please try again.' : error.message
        });
    }
}

async function paystackWebhook(req, res) {
    const signature = req.headers['x-paystack-signature'];

    try {
        const result = await paymentService.handleWebhook(req.body, signature, req.rawBody);

        // Fast HTTP 200 acknowledgment to payment gateway
        return res.status(200).json(result || { status: 'acknowledged' });
    } catch (err) {
        if (err.statusCode === 401 || err.message === 'Unauthorized Paystack webhook signature') {
            return res.status(401).send('Unauthorized webhook signature');
        }
        console.error('Webhook processing error:', err.message);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}

module.exports = {
    initCheckout,
    initMpesaCheckout,
    paystackWebhook
};

