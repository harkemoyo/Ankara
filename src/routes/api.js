const express = require('express');
const { checkout } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { orderLookupLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/checkout', checkout);
router.get('/orders/:order_number', orderLookupLimiter, getOrder);

module.exports = router;
