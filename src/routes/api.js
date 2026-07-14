const express = require('express');
const { initCheckout, paystackWebhook } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { orderLookupLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const productController = require('../controllers/productController');

// Product & Collection routes
router.get('/products', productController.getProducts);
router.get('/products/:handle', productController.getProductByHandle);
router.get('/collections', productController.getCollections);

// Checkout & Order routes
router.post('/checkout/init', initCheckout);
router.post('/webhooks/paystack', paystackWebhook);
router.get('/orders/:order_number', orderLookupLimiter, getOrder);

module.exports = router;
