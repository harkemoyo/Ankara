const express = require('express');
const { initCheckout, initMpesaCheckout, paystackWebhook } = require('../controllers/checkoutController');
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
        const { store_name, currency, announcement, logo, exchange_rate, announcements, story } = req.body;
        const payload = {
            store_name,
            currency,
            announcement,
            logo,
            exchange_rate,
            announcements,
            story,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabaseAdmin.from('settings').upsert({ id: 1, ...payload }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Pages CMS routes
router.get('/pages', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('pages').select('*').order('slug');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pages' });
    }
});

router.get('/pages/:slug', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('pages').select('*').eq('slug', req.params.slug).single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

router.post('/pages', async (req, res) => {
    try {
        const { slug, title, content } = req.body;
        const { data, error } = await supabaseAdmin.from('pages').insert([{ slug, title, content }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create page' });
    }
});

router.put('/pages/:slug', async (req, res) => {
    try {
        const { title, content } = req.body;
        const { data, error } = await supabaseAdmin.from('pages')
            .update({ title, content, updated_at: new Date().toISOString() })
            .eq('slug', req.params.slug)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update page' });
    }
});

router.delete('/pages/:slug', async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('pages').delete().eq('slug', req.params.slug);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete page' });
    }
});

// Checkout & Order routes
router.post('/checkout/init', initCheckout);
router.post('/checkout/mpesa', initMpesaCheckout);
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
