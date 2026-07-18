// assets/supabase-client.js
// =============================================
// Supabase client + CMS sync for all pages
// All displayed content comes from Supabase — no hardcoded values.
// =============================================

const SUPABASE_URL = 'https://oscqakcygvvtjngbuhbw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Multi-Currency Helper ──────────────────────────────────────────────────
// Prices in the DB are stored in USD-equivalent.
// convertAndFormat() converts to the selected currency using the live rate from Supabase settings.
window.AnkaraCurrency = {
    current: localStorage.getItem('mhw-currency') || 'KES',
    rate: 130.00, // Default KES fallback — overwritten by settings.exchange_rate from Supabase
    convertAndFormat(usdPrice) {
        const priceNum = parseFloat(usdPrice) || 0;
        if (this.current === 'KES') {
            return `KSh ${Math.round(priceNum * this.rate).toLocaleString()}`;
        }
        return `$${priceNum.toFixed(2)}`;
    },
    setCurrency(currency) {
        this.current = currency;
        localStorage.setItem('mhw-currency', currency);
        window.dispatchEvent(new CustomEvent('currency:changed', { detail: currency }));
    }
};

// ── Load Settings from Supabase (runs immediately, before DOMContentLoaded) ─
supabase.from('settings').select('*').eq('id', 1).single().then(({ data, error }) => {
    if (!error && data) {
        // Update exchange rate as soon as it loads
        if (data.exchange_rate) {
            window.AnkaraCurrency.rate = parseFloat(data.exchange_rate);
        }
        // Fire settings:loaded so any listener can react
        window.dispatchEvent(new CustomEvent('settings:loaded', { detail: data }));
    }
});

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
            if (titleEl && titleEl.textContent.includes('Mary Humphrey African Wear')) {
                titleEl.textContent = titleEl.textContent.replace('Mary Humphrey African Wear', data.store_name);
            }
            document.querySelectorAll('[data-store-name]').forEach(el => {
                el.textContent = data.store_name;
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
    });

    // 3. Load sidebar products from Supabase (shop/sale pages)
    renderSidebarProducts();
});
