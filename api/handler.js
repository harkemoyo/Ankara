// api/handler.js — Vercel Serverless API Handler
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const apiRoutes = require('../src/routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

module.exports = app;
