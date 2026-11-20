const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { initCheckout, initMpesaCheckout, paystackWebhook } = require('../controllers/checkoutController');
const { getOrder } = require('../controllers/orderController');
const { updateOrderStatus } = require('../controllers/adminController');
const { orderLookupLimiter } = require('../middleware/rateLimit');
const { supabaseAdmin } = require('../config/supabase');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
const productController = require('../controllers/productController');

// Admin-only auth middleware (Supabase auth)
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

// Admin secret middleware for server-to-server calls
function requireAdminSecret(req, res, next) {
    const secret = req.headers['x-admin-secret'];
    const expected = process.env.ADMIN_SECRET;
    if (!expected) {
        return res.status(500).json({ error: 'Admin secret not configured' });
    }
    if (!secret || secret !== expected) {
        return res.status(401).json({ error: 'Unauthorized: invalid admin secret' });
    }
    next();
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
        const payload = {
            ...req.body,
            id: 1,
            updated_at: new Date().toISOString()
        };
        const { data, error } = await supabaseAdmin.from('settings').upsert(payload).select().single();
        if (error) {
            console.warn('Settings upsert notice:', error.message);
        }
        res.json(data || payload);
    } catch (error) {
        console.error('Settings update error:', error);
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

// ── Journal / Blog Posts CMS Routes (Shopify-style Blog backed by Supabase theme_sections) ──
const productService = require('../services/productService');

const DEFAULT_JOURNAL_SECTION = {
    type: 'journal',
    enabled: true,
    settings: {
        eyebrow: 'The Mary Humphrey Journal',
        heading: 'Our Journal',
        subtitle: 'Stories of craftsmanship, African heritage, and the people and spaces that inspire every piece we create in Nairobi.',
        posts: [
            {
                id: 'geco-dungarees-story',
                slug: 'the-story-behind-the-geco-dungarees',
                blog: 'Journal',
                title: 'The Story Behind the GECO Dungarees',
                category: 'Behind the Design',
                tags: ['Behind the Design', 'Nairobi', 'Our People'],
                author: 'Mary Humphrey',
                date: 'Nairobi, Kenya',
                published_at: '2026-11-19T09:00:00.000Z',
                image: 'assets/journal-geco-dungarees.jpg',
                caption: 'Mary at Geco Cafe, Nairobi, wearing the GECO Dungarees',
                excerpt: 'Did I ever tell you about the first time I walked into Geco? I came as a designer, hoping for a little space to showcase my work. But something unexpected happened.',
                body: [
                    'Did I ever tell you about the first time I walked into Geco?',
                    'I came as a designer, hoping for a little space to showcase my work. But something unexpected happened.',
                    'The founder of Geco believed in my work almost instantly. He encouraged me, opened doors for me, and has continued to be such a rock and a source of support on this journey.',
                    'Somehow, I ended up falling in love with Geco, not just as a place, but as a space that became part of my story.',
                    'I later brought along a friend who believed in me and my work, and somewhere along the way, we looked at this piece and decided on its name.',
                    'GECO DUNGAREES.'
                ].join('\n\n'),
                body_html: '',
                seo_title: 'The Story Behind the GECO Dungarees – Mary Humphrey Wear Journal',
                seo_description: 'The true story of how Mary Humphrey walked into Geco Cafe in Nairobi as a designer and created the signature GECO Dungarees.',
                cta_text: 'Shop GECO Dungarees',
                cta_link: '/shop/geco-dungaree',
                status: 'published',
                featured: true,
                reading_time: 1,
                created_at: '2026-11-19T09:00:00.000Z',
                updated_at: '2026-11-19T09:00:00.000Z'
            }
        ]
    }
};

function slugifyJournal(text) {
    const base = String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
    return base || ('story-' + Date.now());
}

function parseJournalTags(input, fallbackCategory) {
    let arr = [];
    if (Array.isArray(input)) {
        arr = input;
    } else if (typeof input === 'string') {
        arr = input.split(',');
    }
    const cleaned = arr.map(t => String(t || '').trim()).filter(Boolean);
    if (!cleaned.length && fallbackCategory) cleaned.push(String(fallbackCategory).trim());
    return Array.from(new Set(cleaned));
}

function sanitizeArticleHtml(html) {
    if (!html) return '';
    return String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
        .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
}

function computeReadingTime(body, bodyHtml) {
    const source = (bodyHtml ? String(bodyHtml).replace(/<[^>]+>/g, ' ') : '') + ' ' + String(body || '');
    const words = source.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
}

function isPostPubliclyVisible(post) {
    if (!post || post.status === 'draft') return false;
    if (post.published_at) {
        const pubTime = Date.parse(post.published_at);
        if (!Number.isNaN(pubTime) && pubTime > Date.now()) return false;
    }
    return true;
}

async function getJournalState() {
    const theme = await productService.getTheme();
    if (!theme.sections) theme.sections = {};
    const existing = theme.sections.journal?.settings;
    if (!existing || !Array.isArray(existing.posts) || existing.posts.length === 0) {
        const mergedSettings = {
            eyebrow: existing?.eyebrow || DEFAULT_JOURNAL_SECTION.settings.eyebrow,
            heading: existing?.heading || DEFAULT_JOURNAL_SECTION.settings.heading,
            subtitle: existing?.subtitle || DEFAULT_JOURNAL_SECTION.settings.subtitle,
            posts: Array.isArray(existing?.posts) ? existing.posts : DEFAULT_JOURNAL_SECTION.settings.posts
        };
        if (!existing) {
            mergedSettings.posts = DEFAULT_JOURNAL_SECTION.settings.posts;
        }
        return { theme, settings: mergedSettings };
    }
    return { theme, settings: existing };
}

async function saveJournalState(theme, settings) {
    if (!theme.sections) theme.sections = {};
    theme.sections.journal = {
        type: 'journal',
        enabled: true,
        settings
    };
    await productService.updateTheme(theme);
    return settings;
}

// Public: Fetch published journal articles & page settings (supports ?tag= and ?blog=)
router.get('/journal', async (req, res) => {
    try {
        const { settings } = await getJournalState();
        let publishedPosts = (settings.posts || []).filter(isPostPubliclyVisible);
        if (req.query.tag) {
            const tagLower = String(req.query.tag).trim().toLowerCase();
            publishedPosts = publishedPosts.filter(p => {
                const tags = parseJournalTags(p.tags, p.category).map(t => t.toLowerCase());
                return tags.includes(tagLower) || (p.category || '').toLowerCase() === tagLower;
            });
        }
        if (req.query.blog) {
            const blogLower = String(req.query.blog).trim().toLowerCase();
            publishedPosts = publishedPosts.filter(p => (p.blog || 'Journal').toLowerCase() === blogLower);
        }
        const allTags = Array.from(new Set(
            (settings.posts || [])
                .filter(isPostPubliclyVisible)
                .flatMap(p => parseJournalTags(p.tags, p.category))
        ));
        res.json({
            eyebrow: settings.eyebrow || DEFAULT_JOURNAL_SECTION.settings.eyebrow,
            heading: settings.heading || DEFAULT_JOURNAL_SECTION.settings.heading,
            subtitle: settings.subtitle || DEFAULT_JOURNAL_SECTION.settings.subtitle,
            tags: allTags,
            posts: publishedPosts
        });
    } catch (error) {
        console.error('Failed to fetch journal:', error);
        res.status(500).json({ error: 'Failed to fetch journal posts' });
    }
});

// Public: Fetch single published article by slug or id
router.get('/journal/:slug', async (req, res) => {
    try {
        const { settings } = await getJournalState();
        const post = (settings.posts || []).find(
            p => isPostPubliclyVisible(p) && (p.slug === req.params.slug || p.id === req.params.slug)
        );
        if (!post) return res.status(404).json({ error: 'Article not found' });
        res.json({ post });
    } catch (error) {
        console.error('Failed to fetch journal article:', error);
        res.status(500).json({ error: 'Failed to fetch article' });
    }
});

// Admin: Fetch ALL journal posts (published + scheduled + drafts) & settings
router.get('/admin/journal', requireAdmin, async (req, res) => {
    try {
        const { settings } = await getJournalState();
        res.json({
            eyebrow: settings.eyebrow || DEFAULT_JOURNAL_SECTION.settings.eyebrow,
            heading: settings.heading || DEFAULT_JOURNAL_SECTION.settings.heading,
            subtitle: settings.subtitle || DEFAULT_JOURNAL_SECTION.settings.subtitle,
            posts: settings.posts || []
        });
    } catch (error) {
        console.error('Admin journal fetch error:', error);
        res.status(500).json({ error: 'Failed to load journal posts' });
    }
});

// Admin: Update journal header settings
router.put('/admin/journal/settings', requireAdmin, async (req, res) => {
    try {
        const { theme, settings } = await getJournalState();
        const { eyebrow, heading, subtitle } = req.body || {};
        if (eyebrow !== undefined) settings.eyebrow = String(eyebrow).trim();
        if (heading !== undefined) settings.heading = String(heading).trim();
        if (subtitle !== undefined) settings.subtitle = String(subtitle).trim();
        await saveJournalState(theme, settings);
        res.json({ success: true, settings });
    } catch (error) {
        console.error('Admin journal settings update error:', error);
        res.status(500).json({ error: 'Failed to update journal settings' });
    }
});

// Admin: Create a new blog post / journal article
router.post('/admin/journal/posts', requireAdmin, async (req, res) => {
    try {
        const { theme, settings } = await getJournalState();
        const body = req.body || {};
        if (!body.title || !String(body.title).trim()) {
            return res.status(400).json({ error: 'Article title is required' });
        }
        const now = new Date().toISOString();
        const posts = Array.isArray(settings.posts) ? [...settings.posts] : [];
        let slug = slugifyJournal(body.slug || body.title);
        if (posts.some(p => p.slug === slug)) {
            slug = `${slug}-${Date.now().toString(36)}`;
        }
        const isFeatured = Boolean(body.featured);
        if (isFeatured) {
            posts.forEach(p => { p.featured = false; });
        }
        const category = String(body.category || 'Journal').trim();
        const tags = parseJournalTags(body.tags, category);
        const bodyHtml = sanitizeArticleHtml(body.body_html || '');
        const bodyText = String(body.body || '').trim();
        const newPost = {
            id: 'post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            slug,
            blog: String(body.blog || 'Journal').trim(),
            title: String(body.title).trim(),
            category,
            tags,
            author: String(body.author || 'Mary Humphrey').trim(),
            date: String(body.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })).trim(),
            published_at: body.published_at ? new Date(body.published_at).toISOString() : now,
            image: String(body.image || '').trim(),
            caption: String(body.caption || '').trim(),
            excerpt: String(body.excerpt || '').trim(),
            body: bodyText,
            body_html: bodyHtml,
            seo_title: String(body.seo_title || '').trim(),
            seo_description: String(body.seo_description || '').trim(),
            cta_text: String(body.cta_text || '').trim(),
            cta_link: String(body.cta_link || '').trim(),
            status: body.status === 'draft' ? 'draft' : 'published',
            featured: isFeatured,
            reading_time: computeReadingTime(bodyText, bodyHtml),
            created_at: now,
            updated_at: now
        };
        posts.unshift(newPost);
        settings.posts = posts;
        await saveJournalState(theme, settings);
        res.status(201).json({ success: true, post: newPost, posts });
    } catch (error) {
        console.error('Admin journal create error:', error);
        res.status(500).json({ error: 'Failed to create article' });
    }
});

// Admin: Update an existing blog post / journal article
router.put('/admin/journal/posts/:id', requireAdmin, async (req, res) => {
    try {
        const { theme, settings } = await getJournalState();
        const posts = Array.isArray(settings.posts) ? [...settings.posts] : [];
        const idx = posts.findIndex(p => p.id === req.params.id || p.slug === req.params.id);
        if (idx === -1) {
            return res.status(404).json({ error: 'Article not found' });
        }
        const body = req.body || {};
        const isFeatured = body.featured !== undefined ? Boolean(body.featured) : Boolean(posts[idx].featured);
        if (isFeatured) {
            posts.forEach((p, i) => { if (i !== idx) p.featured = false; });
        }
        const nextCategory = body.category !== undefined ? String(body.category).trim() : (posts[idx].category || 'Journal');
        const nextBodyText = body.body !== undefined ? String(body.body).trim() : (posts[idx].body || '');
        const nextBodyHtml = body.body_html !== undefined ? sanitizeArticleHtml(body.body_html) : (posts[idx].body_html || '');
        const updated = {
            ...posts[idx],
            blog: body.blog !== undefined ? String(body.blog).trim() : (posts[idx].blog || 'Journal'),
            title: body.title !== undefined ? String(body.title).trim() : posts[idx].title,
            slug: body.slug !== undefined && String(body.slug).trim() ? slugifyJournal(body.slug) : posts[idx].slug,
            category: nextCategory,
            tags: body.tags !== undefined ? parseJournalTags(body.tags, nextCategory) : parseJournalTags(posts[idx].tags, nextCategory),
            author: body.author !== undefined ? String(body.author).trim() : posts[idx].author,
            date: body.date !== undefined ? String(body.date).trim() : posts[idx].date,
            published_at: body.published_at !== undefined && body.published_at ? new Date(body.published_at).toISOString() : (posts[idx].published_at || posts[idx].created_at || new Date().toISOString()),
            image: body.image !== undefined ? String(body.image).trim() : posts[idx].image,
            caption: body.caption !== undefined ? String(body.caption).trim() : posts[idx].caption,
            excerpt: body.excerpt !== undefined ? String(body.excerpt).trim() : posts[idx].excerpt,
            body: nextBodyText,
            body_html: nextBodyHtml,
            seo_title: body.seo_title !== undefined ? String(body.seo_title).trim() : (posts[idx].seo_title || ''),
            seo_description: body.seo_description !== undefined ? String(body.seo_description).trim() : (posts[idx].seo_description || ''),
            cta_text: body.cta_text !== undefined ? String(body.cta_text).trim() : posts[idx].cta_text,
            cta_link: body.cta_link !== undefined ? String(body.cta_link).trim() : posts[idx].cta_link,
            status: body.status !== undefined ? (body.status === 'draft' ? 'draft' : 'published') : posts[idx].status,
            featured: isFeatured,
            reading_time: computeReadingTime(nextBodyText, nextBodyHtml),
            updated_at: new Date().toISOString()
        };
        posts[idx] = updated;
        settings.posts = posts;
        await saveJournalState(theme, settings);
        res.json({ success: true, post: updated, posts });
    } catch (error) {
        console.error('Admin journal update error:', error);
        res.status(500).json({ error: 'Failed to update article' });
    }
});

// Admin: Duplicate an existing blog post as Draft (Shopify Duplicate action)
router.post('/admin/journal/posts/:id/duplicate', requireAdmin, async (req, res) => {
    try {
        const { theme, settings } = await getJournalState();
        const posts = Array.isArray(settings.posts) ? [...settings.posts] : [];
        const src = posts.find(p => p.id === req.params.id || p.slug === req.params.id);
        if (!src) return res.status(404).json({ error: 'Article not found' });
        const now = new Date().toISOString();
        const copy = {
            ...src,
            id: 'post-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            title: `${src.title} (Copy)`,
            slug: `${src.slug || 'story'}-copy-${Date.now().toString(36)}`,
            status: 'draft',
            featured: false,
            created_at: now,
            updated_at: now
        };
        posts.unshift(copy);
        settings.posts = posts;
        await saveJournalState(theme, settings);
        res.status(201).json({ success: true, post: copy, posts });
    } catch (error) {
        console.error('Admin journal duplicate error:', error);
        res.status(500).json({ error: 'Failed to duplicate article' });
    }
});

// Admin: Bulk actions (publish / draft / delete) just like Shopify Blog Posts table
router.post('/admin/journal/bulk', requireAdmin, async (req, res) => {
    try {
        const { action, ids } = req.body || {};
        if (!Array.isArray(ids) || !ids.length) {
            return res.status(400).json({ error: 'No articles selected' });
        }
        const { theme, settings } = await getJournalState();
        const idSet = new Set(ids);
        let posts = Array.isArray(settings.posts) ? [...settings.posts] : [];
        const now = new Date().toISOString();

        if (action === 'delete') {
            posts = posts.filter(p => !idSet.has(p.id));
        } else if (action === 'publish') {
            posts = posts.map(p => idSet.has(p.id) ? { ...p, status: 'published', updated_at: now } : p);
        } else if (action === 'draft') {
            posts = posts.map(p => idSet.has(p.id) ? { ...p, status: 'draft', updated_at: now } : p);
        } else {
            return res.status(400).json({ error: 'Invalid bulk action' });
        }

        settings.posts = posts;
        await saveJournalState(theme, settings);
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Admin journal bulk error:', error);
        res.status(500).json({ error: 'Bulk action failed' });
    }
});

// Admin: Delete a blog post / journal article
router.delete('/admin/journal/posts/:id', requireAdmin, async (req, res) => {
    try {
        const { theme, settings } = await getJournalState();
        const posts = (settings.posts || []).filter(p => p.id !== req.params.id && p.slug !== req.params.id);
        settings.posts = posts;
        await saveJournalState(theme, settings);
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Admin journal delete error:', error);
        res.status(500).json({ error: 'Failed to delete article' });
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
router.post('/payments/paystack/webhook', paystackWebhook);
router.post('/webhooks/paystack', paystackWebhook);
router.get('/orders/:order_number', orderLookupLimiter, getOrder);

// Admin order status update
router.patch('/admin/orders/:order_number/status', requireAdminSecret, updateOrderStatus);

// Paystack Volume & Notification Monitoring Routes
const paymentService = require('../services/paymentService');
const whatsappService = require('../services/whatsappService');

router.get('/admin/payments/volume', requireAdmin, async (req, res) => {
    try {
        const metrics = await paymentService.checkVolumeThresholds();
        res.json(metrics || { totalVolumeKes: 0, alertLevel: 'normal', count: 0 });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch volume metrics' });
    }
});

router.post('/admin/notifications/test-whatsapp', requireAdmin, async (req, res) => {
    try {
        const { type, phone, orderNumber, customerName, amount } = req.body;
        let result;
        if (type === 'mary') {
            result = await whatsappService.sendPaymentAlertToMary({
                orderNumber: orderNumber || 'TEST-1001',
                customerName: customerName || 'Jane Doe',
                amount: amount || 4500,
                reference: 'TEST_REF_123'
            });
        } else {
            result = await whatsappService.sendPaymentConfirmationToCustomer({
                toPhone: phone,
                customerName: customerName || 'Jane Doe',
                amount: amount || 4500,
                orderNumber: orderNumber || 'TEST-1001'
            });
        }
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Contact Inquiry Route
const emailService = require('../services/emailService');
router.post('/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    try {
        // Store in Supabase contact_messages
        const { error: dbErr } = await supabaseAdmin.from('contact_messages').insert({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: (subject || '').trim(),
            message: message.trim(),
            status: 'new',
            is_read: false,
            created_at: new Date().toISOString()
        });
        if (dbErr) console.error('Contact message DB error:', dbErr.message);

        // Also upsert into customers table
        try {
            await supabaseAdmin.from('customers').upsert([
                { email: email.trim().toLowerCase(), full_name: name.trim() }
            ], { onConflict: 'email' });
        } catch (custErr) {
            console.log('Customer upsert note:', custErr.message);
        }
    } catch (e) {
        console.error('Failed to store contact message:', e.message);
    }
    // Send email notification and auto-reply (non-blocking)
    emailService.sendContactFormNotification(name, email, subject, message);
    emailService.sendContactAutoReply(name, email, subject, message);
    res.json({ success: true, message: 'Message sent successfully' });
});

// Admin Contact Messages Routes
router.get('/admin/messages', requireAdmin, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('contact_messages')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (e) {
        console.error('Failed to fetch contact messages:', e.message);
        res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
});

router.put('/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
        const { status, notes, is_read } = req.body;
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (is_read !== undefined) updateData.is_read = is_read;

        const { data, error } = await supabaseAdmin
            .from('contact_messages')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Failed to update contact message:', e.message);
        res.status(500).json({ error: 'Failed to update contact message' });
    }
});

router.delete('/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('contact_messages')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (e) {
        console.error('Failed to delete contact message:', e.message);
        res.status(500).json({ error: 'Failed to delete contact message' });
    }
});

// Newsletter Subscription Route
router.post('/newsletter/subscribe', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        try {
            // Store in Supabase subscribers table (if exists)
            await supabaseAdmin.from('subscribers').upsert([
                { email, accepts_marketing: true, subscribed_at: new Date().toISOString() }
            ], { onConflict: 'email' });
        } catch (dbErr) {
            console.log('Subscribers table might not exist, skipping...');
        }

        try {
            // Also save to customers table (as a lead/prospect)
            await supabaseAdmin.from('customers').upsert([
                { email, accepts_marketing: true }
            ], { onConflict: 'email' });
        } catch (dbErr) {
            console.log('Customers table insert failed:', dbErr.message);
        }

        // Send email
        emailService.sendNewsletterWelcomeEmail(email);

        res.json({ success: true, message: 'Subscribed successfully' });
    } catch (e) {
        console.error('Failed to subscribe:', e.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
