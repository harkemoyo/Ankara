const express = require('express');
const { checkout } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { orderLookupLimiter } = require('../middleware/rateLimit');

const router = express.Router();
const productController = require('../controllers/productController');

// Product & Collection routes
router.get('/products', productController.getProducts);
router.get('/collections', productController.getCollections);

// Checkout & Order routes
router.post('/checkout', checkout);
router.get('/orders/:order_number', orderLookupLimiter, getOrder);

module.exports = router;
