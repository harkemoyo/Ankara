const { supabaseAnon } = require('../config/supabase');
const productService = require('../services/productService');

const BASE_URL = process.env.BASE_URL?.replace(/\/$/, '') || 'https://maryhumphreywear.org';

const STATIC_PAGES = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/shop', changefreq: 'daily', priority: '0.9' },
    { loc: '/fabric', changefreq: 'daily', priority: '0.8' },
    { loc: '/sale', changefreq: 'weekly', priority: '0.8' },
    { loc: '/journal', changefreq: 'weekly', priority: '0.8' },
    { loc: '/about', changefreq: 'monthly', priority: '0.6' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.6' },
    { loc: '/account', changefreq: 'monthly', priority: '0.4' },
    { loc: '/order-status', changefreq: 'monthly', priority: '0.4' }
];

function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
    const lastmodXml = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    const cfXml = changefreq ? `<changefreq>${changefreq}</changefreq>` : '';
    const priorityXml = priority ? `<priority>${priority}</priority>` : '';
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${lastmodXml ? `    ${lastmodXml}\n` : ''}${cfXml ? `    ${cfXml}\n` : ''}${priorityXml ? `    ${priorityXml}\n` : ''}  </url>`;
}

async function getSitemap(req, res) {
    try {
        const [productsResult, collectionsResult] = await Promise.all([
            supabaseAnon
                .from('products')
                .select('handle, status')
                .eq('status', 'active'),
            supabaseAnon
                .from('collections')
                .select('handle')
        ]);

        if (productsResult.error) throw productsResult.error;
        if (collectionsResult.error) throw collectionsResult.error;

        const products = productsResult.data || [];
        const collections = collectionsResult.data || [];

        const entries = [];

        // Static pages
        for (const page of STATIC_PAGES) {
            entries.push(urlEntry({
                loc: `${BASE_URL}${page.loc}`,
                changefreq: page.changefreq,
                priority: page.priority
            }));
        }

        // Collection pages
        for (const collection of collections) {
            if (collection.handle) {
                entries.push(urlEntry({
                    loc: `${BASE_URL}/shop/${collection.handle}`,
                    changefreq: 'weekly',
                    priority: '0.7'
                }));
            }
        }

        // Product pages
        for (const product of products) {
            if (product.handle) {
                entries.push(urlEntry({
                    loc: `${BASE_URL}/product/${product.handle}`,
                    changefreq: 'weekly',
                    priority: '0.8'
                }));
            }
        }

        // Journal / Blog articles
        try {
            const theme = await productService.getTheme();
            const posts = theme?.sections?.journal?.settings?.posts || [];
            const now = Date.now();
            for (const post of posts) {
                if (!post || post.status === 'draft' || !post.slug) continue;
                if (post.published_at && Date.parse(post.published_at) > now) continue;
                entries.push(urlEntry({
                    loc: `${BASE_URL}/journal/${encodeURIComponent(post.slug)}`,
                    lastmod: (post.updated_at || post.published_at || '').slice(0, 10) || undefined,
                    changefreq: 'monthly',
                    priority: '0.7'
                }));
            }
        } catch (_) { /* skip journal entries on error */ }

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>`;

        res.set('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (err) {
        console.error('[Sitemap] Failed to generate sitemap:', err.message);
        res.status(500).send('Failed to generate sitemap');
    }
}

module.exports = { getSitemap };
