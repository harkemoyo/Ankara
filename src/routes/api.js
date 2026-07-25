const express = require('express');
const { initCheckout, paystackWebhook } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { orderLookupLimiter } = require('../middleware/rateLimit');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();
const productController = require('../controllers/productController');

// Product, Collection & Theme routes
router.get('/products', productController.getProducts);
router.get('/products/:handle', productController.getProductByHandle);
router.get('/collections', productController.getCollections);
router.get('/theme', productController.getTheme);
router.get('/sale-check', productController.hasSaleProducts);

// Settings routes
router.get('/settings', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('settings').select('*').eq('id', 1).single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/settings', async (req, res) => {
    try {
        const { store_name, currency, announcement, logo, exchange_rate, announcements } = req.body;
        const payload = {
            store_name,
            currency,
            announcement,
            logo,
            exchange_rate,
            announcements,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabaseAdmin.from('settings').upsert({ id: 1, ...payload }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Checkout & Order routes
router.post('/checkout/init', initCheckout);
router.post('/webhooks/paystack', paystackWebhook);
router.get('/orders/:order_number', orderLookupLimiter, getOrder);

// Contact Inquiry Route
const emailService = require('../services/emailService');
router.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    emailService.sendContactFormNotification(name, email, message);
    res.json({ success: true, message: 'Message sent successfully' });
});

module.exports = router;
