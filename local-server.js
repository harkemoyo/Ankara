require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets and HTML files from the root folder
app.use(express.static(path.join(__dirname)));

// API Routes — all requests to /api/* are handled here
app.use('/api', apiRoutes);

// Route root request to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route path-based collection requests to shop.html
app.get('/shop/:handle', (req, res) => {
    res.sendFile(path.join(__dirname, 'shop.html'));
});

// Route path-based product requests to product.html
app.get('/product/:handle', (req, res) => {
    res.sendFile(path.join(__dirname, 'product.html'));
});
app.get('/products/:handle', (req, res) => {
    res.sendFile(path.join(__dirname, 'product.html'));
});

// Clean route for fabrics page
app.get('/fabric', (req, res) => {
    res.sendFile(path.join(__dirname, 'material.html'));
});

// Fallback for html pages to support clean routes (e.g. /shop instead of /shop.html)
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path + '.html');
    res.sendFile(filePath, (err) => {
        if (err) next();
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`\n🚀 Local server successfully running at:`);
    console.log(`   👉 http://localhost:${PORT}\n`);
});
