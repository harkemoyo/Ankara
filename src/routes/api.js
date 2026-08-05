const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { initCheckout, initMpesaCheckout, paystackWebhook } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { orderLookupLimiter } = require('../middleware/rateLimit');
const { supabaseAdmin } = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
const productController = require('../controllers/productController');

// Admin-only auth middleware
async function requireAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: missing token' });
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error) throw error;
        if (user?.app_metadata?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: admin only' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Product, Collection & Theme routes
router.get('/products', productController.getProducts);
router.get('/products/:handle', productController.getProductByHandle);
router.get('/collections', productController.getCollections);
router.get('/theme', productController.getTheme);
router.put('/theme', requireAdmin, productController.updateTheme);
router.get('/sale-check', productController.hasSaleProducts);

const sharp = require('sharp');

async function processImageToWebpUnder100KB(buffer) {
    try {
        let quality = 80;
        const metadata = await sharp(buffer).metadata();
        let currentWidth = metadata.width || 1200;
        if (currentWidth > 1600) currentWidth = 1600;

        let outputBuffer = await sharp(buffer)
            .resize({ width: currentWidth, fit: 'inside', withoutEnlargement: true })
            .webp({ quality })
            .toBuffer();

        while (outputBuffer.length > 100 * 1024 && quality > 15) {
            quality -= 15;
            outputBuffer = await sharp(buffer)
                .resize({ width: currentWidth, fit: 'inside', withoutEnlargement: true })
                .webp({ quality })
                .toBuffer();

            if (outputBuffer.length > 100 * 1024 && quality <= 20 && currentWidth > 300) {
                currentWidth = Math.round(currentWidth * 0.8);
                quality = 70;
            }
        }
        return outputBuffer;
    } catch (e) {
        console.error('Sharp image processing error, using raw buffer:', e);
        return buffer;
    }
}

// Trigger redeployment with updated Vercel environment variables
// Homepage image upload — stores in Supabase Storage products/homepage/
router.post('/upload/homepage', requireAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const baseName = req.file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const isVideo = req.file.mimetype && req.file.mimetype.startsWith('video/');

        let uploadBuffer, fileName, contentType;

        if (isVideo) {
            // Upload video as-is (no conversion)
            const ext = req.file.originalname.match(/\.([^.]+)$/)?.[1] || 'mp4';
            fileName = `homepage/${baseName}-${Date.now()}.${ext}`;
            uploadBuffer = req.file.buffer;
            contentType = req.file.mimetype || 'video/mp4';
        } else {
            // Automatically convert to WebP and ensure file size is under 100KB
            fileName = `homepage/${baseName}-${Date.now()}.webp`;
            uploadBuffer = await processImageToWebpUnder100KB(req.file.buffer);
            contentType = 'image/webp';
        }

        const { error: uploadError } = await supabaseAdmin.storage
            .from('products')
            .upload(fileName, uploadBuffer, {
                contentType,
                upsert: true
            });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabaseAdmin.storage.from('products').getPublicUrl(fileName);
        res.json({ url: urlData.publicUrl, fileName, sizeBytes: uploadBuffer.length });
    } catch (error) {
        console.error('Homepage upload error:', error);
        res.status(500).json({ error: 'Failed to upload file', message: error.message || String(error) });
    }
});

// Permanently purge a section from HTML, JS, and theme JSON
router.delete('/section-purge/:key', requireAdmin, async (req, res) => {
    const key = req.params.key;
    if (!key || /[^a-z0-9_-]/.test(key)) return res.status(400).json({ error: 'Invalid section key' });
    const rootDir = path.join(__dirname, '..', '..');
    const results = { html: false, js: false, theme: false };

    // 1. Remove from index.html
    try {
        const indexPath = path.join(rootDir, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        const sectionRegex = new RegExp(
            `([ \\t]*<!--[^>]*?-->\\s*)?<section[^>]*data-section-id="${key}"[^>]*>[\\s\\S]*?<\\/section>\\s*`,
            'i'
        );
        const newHtml = html.replace(sectionRegex, '');
        if (newHtml !== html) {
            fs.writeFileSync(indexPath, newHtml, 'utf-8');
            results.html = true;
        }
    } catch (e) { console.error('Purge HTML error:', e.message); }

    // 2. Remove updater from homepage-sections.js
    try {
        const jsPath = path.join(rootDir, 'assets', 'homepage-sections.js');
        let js = fs.readFileSync(jsPath, 'utf-8');
        // Match the updater: "  key(el, settings) { ... }," or "  key(el, settings) { ... }\n"
        // We look for the function in the updaters object
        const fnRegex = new RegExp(
            `\\n  ${key}\\(el,\\s*settings\\)\\s*\\{[\\s\\S]*?\\n  \\},?\\n`,
            ''
        );
        const newJs = js.replace(fnRegex, '\n');
        if (newJs !== js) {
            fs.writeFileSync(jsPath, newJs, 'utf-8');
            results.js = true;
        }
    } catch (e) { console.error('Purge JS error:', e.message); }

    // 3. Remove from theme JSON (Supabase + file)
    try {
        const productService = require('../services/productService');
        const theme = await productService.getTheme();
        if (theme.sections && theme.sections[key]) {
            delete theme.sections[key];
        }
        if (theme.order) {
            theme.order = theme.order.filter(k => k !== key);
        }
        await productService.updateTheme(theme);
        results.theme = true;
    } catch (e) { console.error('Purge theme error:', e.message); }

    res.json({ success: true, purged: key, results });
});

// Settings routes
router.get('/settings', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('settings').select('*').eq('id', 1).single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/settings', requireAdmin, async (req, res) => {
    try {
        const { store_name, currency, announcement, logo, exchange_rate, announcements, story, whatsapp, whatsapp_enabled, whatsapp_label,
            contact_email, contact_hero_title, contact_hero_subtitle, contact_response_time, contact_follow_us } = req.body;
        const payload = {
            store_name,
            currency,
            announcement,
            logo,
            exchange_rate,
            announcements,
            story,
            whatsapp,
            whatsapp_enabled,
            whatsapp_label,
            contact_email,
            contact_hero_title,
            contact_hero_subtitle,
            contact_response_time,
            contact_follow_us,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabaseAdmin.from('settings').upsert({ id: 1, ...payload }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Size charts & Customer measurements routes
router.get('/size-charts/:id', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('size_charts')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error) {
            console.error('Error fetching size chart:', error.message);
            return res.status(404).json({ error: 'Size chart not found' });
        }
        res.json(data);
    } catch (error) {
        console.error('Server error fetching size chart:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/customer-measurements', async (req, res) => {
    try {
        const { guest_cart_id, product_id, measurements, note } = req.body;
        if (!guest_cart_id || !product_id || !measurements) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const { data, error } = await supabaseAdmin
            .from('customer_measurements')
            .insert({
                guest_cart_id,
                product_id,
                measurements,
                note: note || null
            })
            .select();
        if (error) {
            console.error('Error inserting customer measurements:', error.message);
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Server error inserting customer measurements:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Pages CMS routes
router.get('/pages', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('pages').select('*').order('slug');
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pages' });
    }
});

router.get('/pages/:slug', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('pages').select('*').eq('slug', req.params.slug).single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});

router.post('/pages', requireAdmin, async (req, res) => {
    try {
        const { slug, title, content } = req.body;
        const { data, error } = await supabaseAdmin.from('pages').insert([{ slug, title, content }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create page' });
    }
});

router.put('/pages/:slug', requireAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        const { data, error } = await supabaseAdmin.from('pages')
            .update({ title, content, updated_at: new Date().toISOString() })
            .eq('slug', req.params.slug)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update page' });
    }
});

router.delete('/pages/:slug', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabaseAdmin.from('pages').delete().eq('slug', req.params.slug);
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete page' });
    }
});

// Checkout & Order routes
router.post('/checkout/init', initCheckout);
router.post('/checkout/mpesa', initMpesaCheckout);
router.post('/webhooks/paystack', paystackWebhook);
router.get('/orders/:order_number', orderLookupLimiter, getOrder);

// Contact Inquiry Route
const emailService = require('../services/emailService');
router.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    try {
        // Store in Supabase
        await supabaseAdmin.from('contact_messages').insert({
            name,
            email,
            subject: subject || '',
            message,
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.error('Failed to store contact message:', e.message);
    }
    // Send email notification and auto-reply (non-blocking)
    emailService.sendContactFormNotification(name, email, subject, message);
    emailService.sendContactAutoReply(name, email, subject, message);
    res.json({ success: true, message: 'Message sent successfully' });
});

module.exports = router;
