// api/handler.js — Vercel Serverless API Handler
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const apiRoutes = require('../../src/routes/api');
const { getSitemap } = require('../../src/controllers/sitemapController');

const app = express();

// Middleware — capture raw body for Paystack webhook signature verification
app.use(cors());
app.use(express.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(express.urlencoded({ extended: true }));

// Sitemap
app.get('/sitemap.xml', getSitemap);

// API Routes — all requests to /api/* are handled here
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
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
