// assets/supabase-client.js
// =============================================
// Supabase client + CMS sync for all pages
// All displayed content comes from Supabase — no hardcoded values.
// =============================================

const SUPABASE_URL = window.SUPABASE_URL || 'https://oscqakcygvvtjngbuhbw.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF';

let supabaseClient = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
        console.error('Failed to initialize Supabase client:', e);
    }
}
export const supabase = supabaseClient;

// ── Multi-Currency Helper ──────────────────────────────────────────────────
window.AnkaraCurrency = {
    current: localStorage.getItem('mhw-currency') || window.DEFAULT_CURRENCY || 'KES',
    rate: window.DEFAULT_EXCHANGE_RATE || 130.00,
    currencySymbol: window.DEFAULT_CURRENCY_SYMBOL || 'KSh',
    convertAndFormat(kesPrice) {
        const priceNum = parseFloat(kesPrice) || 0;
        if (this.current === 'KES') {
            return `${this.currencySymbol} ${Math.round(priceNum).toLocaleString()}`;
        }
        return `$${(priceNum / this.rate).toFixed(2)}`;
    },
    setCurrency(currency) {
        this.current = currency;
        localStorage.setItem('mhw-currency', currency);
        window.dispatchEvent(new CustomEvent('currency:changed', { detail: currency }));
    }
};

function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function updateFooterFromTheme(el, settings) {
    if (!el || !settings) return;
    const desc = el.querySelector('.footer__widget--desc');
    if (desc && settings.about) desc.textContent = settings.about;
    const logo = el.querySelector('.offcanvas__logo--img');
    if (logo && settings.logo) logo.src = settings.logo;
    const contactItems = el.querySelectorAll('.footer__widget--contact__list--items');
    // Item 0: Email
    if (contactItems[0] && settings.email) {
        const a = contactItems[0].querySelector('a');
        if (a) { a.textContent = settings.email; a.href = 'mailto:' + settings.email; }
    }
    // Item 1: Phone (no dynamic update needed unless phone is in settings)
    // Items 2+: Locations — update from locations array
    if (settings.locations && settings.locations.length) {
        settings.locations.forEach((loc, i) => {
            const item = contactItems[2 + i];
            if (item) {
                const a = item.querySelector('a');
                if (a) { a.textContent = loc.name; a.href = loc.url; }
            }
        });
    }
    if (settings.social) {
        const socialLinks = el.querySelectorAll('.footer__widget--social__list--link');
        const urls = [settings.social.instagram, settings.social.facebook, settings.social.tiktok];
        socialLinks.forEach((a, i) => { if (urls[i]) a.href = urls[i]; });
    }
}

// ── Active Navigation Link Highlighter ──────────────────────────────────────
function highlightActiveNav() {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const currentFile = pathParts.length ? pathParts[pathParts.length - 1] : '/';
    const activeFile = (currentFile === '' || currentFile === '/') ? '/' : currentFile;

    document.querySelectorAll('.header__menu--navigation .header__menu--items').forEach(item => {
        const link = item.querySelector('a.header__menu--link');
        if (!link) return;
        const href = link.getAttribute('href');
        if (!href) return;
        const linkFile = href.split('/').pop().split('?')[0];

        if (linkFile === activeFile || (activeFile === '/' && (linkFile === '.' || linkFile === '/'))) {
            item.classList.add('active-page');
            link.classList.add('active');
        } else {
            item.classList.remove('active-page');
            link.classList.remove('active');
        }
    });
}


function applySettingsToDOM(data) {
    if (!data) return;
    if (data.exchange_rate) {
        window.AnkaraCurrency.rate = parseFloat(data.exchange_rate);
    }
    

    // Update Logo across Header & Drawers
    if (data.logo) {
        document.querySelectorAll('.main__logo--img, .offcanvas__logo--img, .offcanvas__logo--link img, .footer__logo--link img')
            .forEach(img => { img.src = data.logo; });
    }
    
    // Update Store Name & Title
    if (data.store_name) {
        const titleEl = document.querySelector('title');
        if (titleEl && titleEl.textContent.includes('Mary Humphrey Wear')) {
            titleEl.textContent = titleEl.textContent.replace('Mary Humphrey Wear', data.store_name);
        }
        document.querySelectorAll('[data-store-name]').forEach(el => { el.textContent = data.store_name; });
        document.querySelectorAll('[data-store-name-alt]').forEach(img => { img.alt = data.store_name; });
    }
    
    // Update Currency Symbol
    if (data.currency) {
        window.AnkaraCurrency.currencySymbol = data.currency;
        document.querySelectorAll('.currency-symbol').forEach(el => { el.textContent = data.currency; });
    }
}

// Apply cached settings immediately for zero-latency paint across all pages
const cachedSettings = localStorage.getItem('mhw_settings_cache');
if (cachedSettings) {
    try { applySettingsToDOM(JSON.parse(cachedSettings)); } catch (e) {}
}

// Fetch live settings asynchronously and update cache
fetch('/api/settings')
    .then(res => res.ok ? res.json() : null)
    .then(data => {
        if (data) {
            localStorage.setItem('mhw_settings_cache', JSON.stringify(data));
            applySettingsToDOM(data);
            window.dispatchEvent(new CustomEvent('settings:loaded', { detail: data }));
        }
    })
    .catch(err => console.error('Error fetching settings:', err));

async function loadSharedTheme() {
    try {
        const res = await fetch('/api/theme');
        if (!res.ok) return;
        const { theme } = await res.json();
        if (!theme || !theme.sections) return;
        window.AnkaraTheme = theme;
        const footer = theme.sections.footer;
        if (footer && footer.settings) {
            const footerEl = document.querySelector('[data-section-id="footer"]') || document.querySelector('.main__footer');
            if (footerEl) updateFooterFromTheme(footerEl, footer.settings);
        }
    } catch (e) { /* silent */ }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSharedTheme);
} else {
    loadSharedTheme();
}

document.addEventListener('DOMContentLoaded', () => {
    highlightActiveNav();


    const switchers = document.querySelectorAll('.currency-switcher');
    switchers.forEach(sw => { sw.value = window.AnkaraCurrency.current; });

    window.addEventListener('currency:changed', (e) => {
        // Update all currency dropdown switchers across pages
        switchers.forEach(sw => { sw.value = e.detail; });


        // Dynamically update raw price elements
        document.querySelectorAll('[data-raw-price]').forEach(el => {
            el.textContent = window.AnkaraCurrency.convertAndFormat(el.dataset.rawPrice);
        });
    });
});
