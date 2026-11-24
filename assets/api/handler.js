// api/handler.js — Vercel Serverless API Handler
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const apiRoutes = require('../../src/routes/api');
const { getSitemap } = require('../../src/controllers/sitemapController');
const { generalApiLimiter } = require('../../src/middleware/rateLimit');

const app = express();
const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

// Trust Vercel's reverse proxy so express-rate-limit uses the real client IP
app.set('trust proxy', 1);
app.disable('x-powered-by');

// HTTP Security Headers for API responses
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// Explicit CORS allowlist (allows same-origin, webhooks with no Origin, production domain, Vercel previews, and local dev)
const explicitOrigins = new Set([
    'https://maryhumphreywear.org',
    'https://www.maryhumphreywear.org',
]);
if (process.env.BASE_URL) {
    explicitOrigins.add(process.env.BASE_URL.replace(/\/+$/, ''));
}
if (process.env.ALLOWED_ORIGINS) {
    process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim().replace(/\/+$/, '')).filter(Boolean).forEach(o => explicitOrigins.add(o));
}

function isAllowedOrigin(origin) {
    if (!origin) return true; // Server-to-server (Paystack webhooks), curl, or same-origin GET
    if (explicitOrigins.has(origin)) return true;
    try {
        const { protocol, hostname } = new URL(origin);
        if (protocol === 'https:' && hostname.endsWith('.vercel.app')) return true;
        if (!isProd && (hostname === 'localhost' || hostname === '127.0.0.1')) return true;
        if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    } catch (_) {
        return false;
    }
    return false;
}

app.use(cors({
    origin(origin, callback) {
        callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret', 'x-paystack-signature'],
}));

// Middleware — capture raw body for Paystack webhook signature verification & cap JSON payload size
app.use(express.json({
    limit: '2mb',
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Sitemap
app.get('/sitemap.xml', getSitemap);

// Apply broad soft rate-limiter to /api while exempting Paystack webhooks
app.use('/api', (req, res, next) => {
    if (req.path === '/webhooks/paystack' || req.path === '/payments/paystack/webhook') {
        return next();
    }
    return generalApiLimiter(req, res, next);
}, apiRoutes);

// Global Error Handler (never leak internal stack/error details in production)
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    const status = err.statusCode || err.status || 500;
    res.status(status).json({
        error: status >= 500 ? 'Internal Server Error' : (err.message || 'Bad Request'),
        ...(isProd ? {} : { message: err.message })
    });
});

// 404 fallback for unknown API routes
app.use((req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// Start server if running locally (not in Vercel)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || 'localhost';
    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
    });
}

module.exports = app;
