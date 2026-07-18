// api/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const productController = require('../src/controllers/productController');
const orderController = require('../src/controllers/orderController');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.get('/api/products', productController.getProducts.bind(productController));
app.get('/api/collections', productController.getCollections.bind(productController));
app.get('/api/products/:handle', productController.getProductByHandle.bind(productController));
app.post('/api/orders', orderController.createOrder.bind(orderController));
app.get('/api/orders/:order_number', orderController.getOrder.bind(orderController));

// Static Files (only for local testing via 'npm run dev', Vercel ignores this)
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(express.static(path.join(__dirname, '../')));

// Fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Start Server locally
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(Server running at http://localhost:);
    });
}

// Export for Vercel
module.exports = app;
