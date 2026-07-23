const express = require('express');
const { initCheckout, paystackWebhook } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { orderLookupLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const productController = require('../controllers/productController');

// Product, Collection & Theme routes
router.get('/products', productController.getProducts);
router.get('/products/:handle', productController.getProductByHandle);
router.get('/collections', productController.getCollections);
router.get('/theme', productController.getTheme);

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
