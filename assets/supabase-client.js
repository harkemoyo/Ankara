// assets/supabase-client.js
// =============================================
// Supabase client + CMS sync for all pages
// All displayed content comes from Supabase — no hardcoded values.
// =============================================

// Load Supabase credentials from environment variables or window config
const SUPABASE_URL = window.SUPABASE_URL || 'https://oscqakcygvvtjngbuhbw.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF';

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Multi-Currency Helper ──────────────────────────────────────────────────
// Prices in the DB are stored in KES (Kenyan Shillings).
// convertAndFormat() converts to the selected currency using the live rate from Supabase settings.
window.AnkaraCurrency = {
    current: localStorage.getItem('mhw-currency') || window.DEFAULT_CURRENCY || 'KES',
    rate: window.DEFAULT_EXCHANGE_RATE || 130.00, // Default fallback — overwritten by settings.exchange_rate from Supabase
    currencySymbol: window.DEFAULT_CURRENCY_SYMBOL || 'KSh',
    convertAndFormat(kesPrice) {
        const priceNum = parseFloat(kesPrice) || 0;
        if (this.current === 'KES') {
            // Database already stores KES values, no conversion needed
            return `${this.currencySymbol} ${Math.round(priceNum).toLocaleString()}`;
        }
        // Convert to USD: divide by exchange rate
        return `$${(priceNum / this.rate).toFixed(2)}`;
    },
    setCurrency(currency) {
        this.current = currency;
        localStorage.setItem('mhw-currency', currency);
        window.dispatchEvent(new CustomEvent('currency:changed', { detail: currency }));
    }
};

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function updateFooterFromTheme(el, settings) {
    const desc = el.querySelector('.footer__widget--desc');
    if (desc && settings.about) desc.textContent = settings.about;
    const logo = el.querySelector('.offcanvas__logo--img');
    if (logo && settings.logo) logo.src = settings.logo;
    const contactItems = el.querySelectorAll('.footer__widget--contact__list--items');
    if (contactItems[0] && (settings.location || settings.location_url)) {
        const svg = contactItems[0].querySelector('svg');
        const locName = (settings.location || 'Our Location').trim();
        const locUrl = (settings.location_url || '').trim();
        contactItems[0].textContent = '';
        if (svg) contactItems[0].appendChild(svg);
        if (locUrl) {
            const a = document.createElement('a');
            a.href = locUrl;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = ' ' + locName;
            contactItems[0].appendChild(a);
        } else {
            contactItems[0].append(' ' + locName);
        }
    }
    if (contactItems[1] && settings.email) {
        const a = contactItems[1].querySelector('a');
        if (a) { a.textContent = settings.email; a.href = 'mailto:' + settings.email; }
    }
    if (settings.social) {
        const socialLinks = el.querySelectorAll('.footer__widget--social__list--link');
        const urls = [settings.social.instagram, settings.social.facebook, settings.social.tiktok];
        socialLinks.forEach((a, i) => { if (urls[i]) a.href = urls[i]; });
    }
    const colLinksList = el.querySelector('.footer__widget--menu__list--collection');
    if (colLinksList && settings.collection_links) {
        colLinksList.innerHTML = settings.collection_links.map(l => `<li><a href="${escapeHtml(l.url || '#')}">${escapeHtml(l.label || '')}</a></li>`).join('');
    }
    const quickLinksList = el.querySelector('.footer__widget--menu__list--quick');
    if (quickLinksList && settings.quick_links) {
        quickLinksList.innerHTML = settings.quick_links.map(l => `<li><a href="${escapeHtml(l.url || '#')}">${escapeHtml(l.label || '')}</a></li>`).join('');
    }
}

// ── Load theme from local JSON and sync shared header/footer on every page ─
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
        const announcement = theme.sections.announcement;
        if (announcement && announcement.settings) {
            const text = announcement.settings.text || '';
            const annEl = document.getElementById('announcement-text');
            if (annEl && text) annEl.innerHTML = text;
        }
    } catch (e) { /* silent */ }
}

// ── Load Settings from Supabase (runs immediately, before DOMContentLoaded) ─
supabase.from('settings').select('*').eq('id', 1).single().then(({ data, error }) => {
    if (!error && data) {
        if (data.exchange_rate) {
            window.AnkaraCurrency.rate = parseFloat(data.exchange_rate);
        }
        window.dispatchEvent(new CustomEvent('settings:loaded', { detail: data }));
    }
});

// Load theme after DOM is parsed
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSharedTheme);
} else {
    loadSharedTheme();
}

// ── Sidebar Featured Products (rendered from Supabase) ────────────────────
async function renderSidebarProducts() {
    const container = document.querySelector('.shop__sidebar--product');
    if (!container) return;

    const { data: products, error } = await supabase
        .from('products')
        .select('handle, title, price, images')
        .eq('in_stock', true)
        .order('created_at', { ascending: false })
        .limit(3);

    if (error || !products || products.length === 0) return;

    container.innerHTML = products.map(p => {
        const img = (p.images && p.images[0]) || '';
        const priceStr = window.AnkaraCurrency
            ? window.AnkaraCurrency.convertAndFormat(p.price)
            : p.price;
        return `
        <div class="small__product--card d-flex">
            <div class="small__product--thumbnail">
                <a class="display-block" href="product.html?handle=${p.handle}">
                    <img src="${img}" alt="${p.title}" loading="lazy" style="width:70px;height:80px;object-fit:cover;"/>
                </a>
            </div>
            <div class="small__product--content">
                <h3 class="small__product--card__title">
                    <a href="product.html?handle=${p.handle}">${p.title}</a>
                </h3>
                <div class="small__product--card__price mb_5">
                    <span class="current__price sidebar-price" data-raw-price="${p.price}">${priceStr}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── DOMContentLoaded: wire up all CMS sync ───────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    // 1. Sync currency switcher UI to stored preference
    const switchers = document.querySelectorAll('.currency-switcher');
    switchers.forEach(sw => { sw.value = window.AnkaraCurrency.current; });

    // Re-render any price elements that store raw price in data-raw-price when currency changes
    window.addEventListener('currency:changed', (e) => {
        switchers.forEach(sw => { sw.value = e.detail; });
        document.querySelectorAll('[data-raw-price]').forEach(el => {
            el.textContent = window.AnkaraCurrency.convertAndFormat(el.dataset.rawPrice);
        });
    });

    // 2. CMS data sync on settings:loaded
    window.addEventListener('settings:loaded', (e) => {
        const data = e.detail;

        // ── Announcement Bar ──
        const annEl = document.getElementById('announcement-text');
        if (annEl) {
            if (data.announcement) {
                annEl.innerHTML = data.announcement;
            } else if (data.announcements && Array.isArray(data.announcements) && data.announcements.length > 0) {
                let idx = 0;
                annEl.innerHTML = data.announcements[0];
                if (data.announcements.length > 1) {
                    setInterval(() => {
                        annEl.style.opacity = 0;
                        setTimeout(() => {
                            idx = (idx + 1) % data.announcements.length;
                            annEl.innerHTML = data.announcements[idx];
                            annEl.style.opacity = 1;
                        }, 500);
                    }, 5000);
                }
            }
        }

        // ── Logo ──
        if (data.logo) {
            document.querySelectorAll('.main__logo--img, .offcanvas__logo--link img')
                .forEach(img => { img.src = data.logo; });
        }

        // ── Store Name (page title + any [data-store-name] elements) ──
        if (data.store_name) {
            const titleEl = document.querySelector('title');
            if (titleEl && titleEl.textContent.includes('Mary Humphrey Wear')) {
                titleEl.textContent = titleEl.textContent.replace('Mary Humphrey Wear', data.store_name);
            }
            if (titleEl && titleEl.textContent.includes('Mary Humphrey African Wear')) {
                titleEl.textContent = titleEl.textContent.replace('Mary Humphrey African Wear', data.store_name);
            }
            document.querySelectorAll('[data-store-name]').forEach(el => {
                el.textContent = data.store_name;
            });
            // Update alt text for images marked with data-store-name-alt
            document.querySelectorAll('[data-store-name-alt]').forEach(img => {
                img.alt = data.store_name;
            });
        }

        // ── Tagline ──
        if (data.tagline) {
            document.querySelectorAll('[data-tagline]').forEach(el => {
                el.textContent = data.tagline;
            });
        }

        // ── Exchange rate: update then re-render any price elements already in DOM ──
        if (data.exchange_rate) {
            window.AnkaraCurrency.rate = parseFloat(data.exchange_rate);
            document.querySelectorAll('[data-raw-price]').forEach(el => {
                el.textContent = window.AnkaraCurrency.convertAndFormat(el.dataset.rawPrice);
            });
        }

        // ── Currency Symbol: update all currency-symbol elements ──
        if (data.currency) {
            window.AnkaraCurrency.currencySymbol = data.currency;
            document.querySelectorAll('.currency-symbol').forEach(el => {
                el.textContent = data.currency;
            });
        }
    });

    // 3. Load sidebar products from Supabase (shop/sale pages)
    renderSidebarProducts();
});
