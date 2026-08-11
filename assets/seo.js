import { supabase } from './supabase-client.js';

const BASE_URL = 'https://maryhumphreywear.org';

function setMetaTag(selector, content) {
    const tag = document.querySelector(selector);
    if (tag) tag.setAttribute('content', content);
}

function injectJsonLd(data) {
    const existing = document.querySelector('script[type="application/ld+json"].ankara-seo-ld');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.className = 'ankara-seo-ld';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

function setCanonical() {
    const path = window.location.pathname;
    const cleanUrl = `${BASE_URL}${path}${window.location.search}`;
    const existing = document.querySelector('link[rel="canonical"]');
    if (existing) {
        existing.href = cleanUrl;
    } else {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = cleanUrl;
        document.head.appendChild(link);
    }
    setMetaTag('meta[property="og:url"]', cleanUrl);
    setMetaTag('meta[name="twitter:url"]', cleanUrl);
}

function addOrganizationJsonLd() {
    injectJsonLd({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Mary Humphrey African Wear',
        url: BASE_URL,
        logo: `${BASE_URL}/assets/IMG-20260622-WA0082.webp`,
        sameAs: [
            'https://instagram.com/maryhumphreywear',
            'https://facebook.com/maryhumphreywear'
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            email: 'info@maryhumphreywear.org'
        }
    });
}

function addWebSiteJsonLd() {
    injectJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: BASE_URL,
        name: 'Mary Humphrey African Wear',
        potentialAction: {
            '@type': 'SearchAction',
            target: `${BASE_URL}/shop?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    });
}

async function addProductJsonLd() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const handle = (pathParts[0] === 'product' && pathParts[1]) ? pathParts[1] : new URLSearchParams(window.location.search).get('handle');
    if (!handle) return;

    try {
        let product = null;
        if (supabase) {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('handle', handle)
                .eq('status', 'active')
                .single();
            if (error) throw error;
            product = data;
        } else {
            const response = await fetch(`${window.SUPABASE_URL || 'https://oscqakcygvvtjngbuhbw.supabase.co'}/rest/v1/products?handle=eq.${encodeURIComponent(handle)}&status=eq.active&select=*&limit=1`, {
                headers: {
                    'apikey': window.SUPABASE_ANON_KEY || 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF',
                    'Authorization': `Bearer ${window.SUPABASE_ANON_KEY || 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF'}`
                }
            });
            const data = await response.json();
            product = data[0];
        }

        if (!product) return;

        const image = Array.isArray(product.images) && product.images.length ? product.images[0] : (product.image || `${BASE_URL}/og-image.jpg`);
        const price = product.discounted_price || product.price || 0;
        const currency = product.currency || 'KES';

        document.title = `${product.title} – Mary Humphrey African Wear`;
        setMetaTag('meta[name="description"]', product.description || product.meta_description || `Shop ${product.title} at Mary Humphrey African Wear.`);
        setMetaTag('meta[property="og:title"]', `${product.title} – Mary Humphrey African Wear`);
        setMetaTag('meta[property="og:description"]', product.description || `Shop ${product.title} at Mary Humphrey African Wear.`);
        setMetaTag('meta[property="og:image"]', image);
        setMetaTag('meta[property="og:type"]', 'product');
        setMetaTag('meta[name="twitter:title"]', `${product.title} – Mary Humphrey African Wear`);
        setMetaTag('meta[name="twitter:description"]', product.description || `Shop ${product.title} at Mary Humphrey African Wear.`);
        setMetaTag('meta[name="twitter:image"]', image);

        injectJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            image: image,
            description: product.description || product.title,
            sku: product.id,
            brand: {
                '@type': 'Brand',
                name: 'Mary Humphrey African Wear'
            },
            offers: {
                '@type': 'Offer',
                url: `${BASE_URL}/product/${handle}`,
                priceCurrency: currency,
                price: String(price),
                availability: product.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            }
        });
    } catch (err) {
        console.warn('[SEO] Failed to inject product structured data:', err.message);
    }
}

function init() {
    setCanonical();

    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const isHome = window.location.pathname === '/' || (pathParts.length === 1 && pathParts[0] === 'index.html');
    const isProduct = pathParts[0] === 'product' || (pathParts.length === 1 && pathParts[0] === 'product.html') || new URLSearchParams(window.location.search).get('handle');

    if (isHome) {
        addOrganizationJsonLd();
        addWebSiteJsonLd();
    } else if (isProduct) {
        addProductJsonLd();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
