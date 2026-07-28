const express = require('express');
const multer = require('multer');
const { initCheckout, initMpesaCheckout, paystackWebhook } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { orderLookupLimiter } = require('../middleware/rateLimit');
const { supabaseAdmin } = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
const productController = require('../controllers/productController');

// Product, Collection & Theme routes
router.get('/products', productController.getProducts);
router.get('/products/:handle', productController.getProductByHandle);
router.get('/collections', productController.getCollections);
router.get('/theme', productController.getTheme);
router.put('/theme', productController.updateTheme);
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

// Homepage image upload — stores in Supabase Storage products/homepage/
router.post('/upload/homepage', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const baseName = req.file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const fileName = `homepage/${baseName}-${Date.now()}.webp`;

        // Automatically convert to WebP and ensure file size is under 100KB
        const webpBuffer = await processImageToWebpUnder100KB(req.file.buffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from('products')
            .upload(fileName, webpBuffer, {
                contentType: 'image/webp',
                upsert: true
            });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabaseAdmin.storage.from('products').getPublicUrl(fileName);
        res.json({ url: urlData.publicUrl, fileName, sizeBytes: webpBuffer.length });
    } catch (error) {
        console.error('Homepage upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
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

router.put('/settings', async (req, res) => {
    try {
        const { store_name, currency, announcement, logo, exchange_rate, announcements, story } = req.body;
        const payload = {
            store_name,
            currency,
            announcement,
            logo,
            exchange_rate,
            announcements,
            story,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabaseAdmin.from('settings').upsert({ id: 1, ...payload }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
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

router.post('/pages', async (req, res) => {
    try {
        const { slug, title, content } = req.body;
        const { data, error } = await supabaseAdmin.from('pages').insert([{ slug, title, content }]).select().single();
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create page' });
    }
});

router.put('/pages/:slug', async (req, res) => {
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

router.delete('/pages/:slug', async (req, res) => {
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
router.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    emailService.sendContactFormNotification(name, email, message);
    res.json({ success: true, message: 'Message sent successfully' });
});

module.exports = router;
