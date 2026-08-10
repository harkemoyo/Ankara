require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

// Fail fast on missing critical configuration rather than surfacing it
// as an opaque 500 during checkout.
const REQUIRED_ENV = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'PAYSTACK_SECRET_KEY',
];

const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
    console.error('\n❌ Cannot start — missing required environment variables:');
    missingEnv.forEach(key => console.error(`   • ${key}`));
    console.error('\n   Add them to .env (see .env.example) and restart.\n');
    process.exit(1);
}

const app = express();

// Middleware — capture raw body for Paystack webhook signature verification
app.use(cors());
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
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

// Route clean collection aliases to shop.html
app.get(['/menswear', '/womenswear', '/unisex', '/new-arrivals', '/nova', '/nova-collection'], (req, res) => {
    res.sendFile(path.join(__dirname, 'shop.html'));
});

// Clean route for fabrics page
app.get('/fabric', (req, res) => {
    res.sendFile(path.join(__dirname, 'material.html'));
});

// Route clean aliases for legal policies & thank-you page
app.get(['/privacy', '/privacy-policy'], (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});
app.get(['/terms', '/terms-of-service', '/terms-and-conditions'], (req, res) => {
    res.sendFile(path.join(__dirname, 'terms-of-service.html'));
});
app.get(['/shipping', '/shipping-policy'], (req, res) => {
    res.sendFile(path.join(__dirname, 'shipping-policy.html'));
});
app.get(['/refund', '/refunds', '/refund-policy', '/returns'], (req, res) => {
    res.sendFile(path.join(__dirname, 'refund-policy.html'));
});
app.get('/thank-you', (req, res) => {
    res.sendFile(path.join(__dirname, 'thank-you.html'));
});

// Fallback for html pages to support clean routes (e.g. /shop instead of /shop.html)
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path + '.html');
    res.sendFile(filePath, (err) => {
        if (err) next();
    });
});

// 404 fallback
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    const status = (ok) => (ok ? 'live' : 'MOCK');
    console.log(`\n🚀 Local server successfully running at:`);
    console.log(`   👉 http://localhost:${PORT}`);
    console.log(`   started ${new Date().toLocaleTimeString()}  ·  env: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   base url: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
    console.log(`   paystack: ${status(process.env.PAYSTACK_SECRET_KEY)}  ·  ` +
        `email: ${status(process.env.MAILERSEND_API_KEY || process.env.MAILERSEND_KEY)}  ·  ` +
        `whatsapp: ${status(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)}\n`);
});
