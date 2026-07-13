// server.js — Ankara Store Backend
// =============================================
// Handles:
//  - Static file serving
//  - POST /api/checkout   (Paystack verify → Supabase order insert)
//  - GET  /api/orders/:id (order lookup for thank-you page)
// =============================================

require('dotenv').config();

const express = require('express');
const path    = require('path');
const fetch   = require('node-fetch');
const apiRoutes = require('./src/routes/api');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase clients have been moved to src/config/supabase.js
// ─── Static Files ────────────────────────────────────────────────────────────
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(__dirname));

// ─── Page Routes ─────────────────────────────────────────────────────────────
const pages = ['/', '/shop', '/about', '/contact', '/product', '/admin', '/cart', '/checkout', '/thank-you'];
const pageMap = {
    '/':          'index.html',
    '/shop':      'shop.html',
    '/about':     'about.html',
    '/contact':   'contact.html',
    '/product':   'product.html',
    '/admin':     'admin.html',
    '/cart':      'cart.html',
    '/checkout':  'checkout.html',
    '/thank-you': 'thank-you.html',
};
pages.forEach(route => {
    app.get(route, (req, res) => {
        const file = pageMap[route];
        res.sendFile(path.join(__dirname, file));
    });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);


// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Ankara Store running at http://localhost:${PORT}`);
    console.log(`   Supabase URL: ${process.env.SUPABASE_URL ? '✅ set' : '❌ NOT SET — check .env'}`);
    console.log(`   Service Key:  ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ set' : '❌ NOT SET — orders will fail'}`);
    console.log(`   Paystack Key: ${process.env.PAYSTACK_SECRET_KEY ? '✅ set' : '❌ NOT SET — checkout will fail'}`);
});
