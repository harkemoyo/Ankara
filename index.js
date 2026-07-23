// index.js — Root Entrypoint for Express & Vercel
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRoutes = require('./src/routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Static Files & Assets (for local dev & fallback)
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname)));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Fallback — serve index.html for all other routes
app.get('*', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'index.html'));
    } catch (e) {
        res.status(404).send('Page Not Found');
    }
});

// Start Server locally if not running as serverless function
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export app for Vercel
module.exports = app;
