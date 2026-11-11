// Dynamically show/hide sale link based on whether there are sale products
const SALE_LINK_SELECTOR = 'a[href="/sale"], a[href="sale.html"]';

function getSaleCheck() {
    if (!window._saleCheckPromise) {
        window._saleCheckPromise = fetch('/api/sale-check')
            .then(async r => {
                if (r.ok) {
                    const data = await r.json();
                    if (data && typeof data.hasSale !== 'undefined') {
                        return data;
                    }
                }
                throw new Error('API sale check failed');
            })
            .catch(async () => {
                // Fallback to client-side Supabase if backend /api/sale-check fails or is unreachable
                try {
                    const client = window.supabaseClient ||
                        (window.supabase && typeof window.supabase.createClient === 'function' && window.STORE_CONFIG
                            ? window.supabase.createClient(window.STORE_CONFIG.SUPABASE_URL, window.STORE_CONFIG.SUPABASE_ANON_KEY)
                            : null);
                    if (client) {
                        const { data } = await client
                            .from('products')
                            .select('id, compare_at_price, price, product_type')
                            .gt('compare_at_price', 0);
                        if (data && data.length > 0) {
                            const saleProducts = data.filter(p => {
                                if ((p.product_type || '').toLowerCase() === 'fabric') return false;
                                const price = parseFloat(p.price) || 0;
                                const comp = parseFloat(p.compare_at_price) || 0;
                                return comp > price && price > 0;
                            });
                            if (saleProducts.length > 0) {
                                return { hasSale: true, maxDiscountPercent: 20, saleCount: saleProducts.length };
                            }
                        }
                    }
                } catch (e) {
                    console.warn('Fallback sale check failed:', e);
                }
                return { hasSale: false, maxDiscountPercent: 0, saleCount: 0 };
            });
    }
    return window._saleCheckPromise;
}
window.getSaleCheck = getSaleCheck;

function findTopLevelSaleItems(nav) {
    if (!nav) return [];
    return Array.from(nav.children).filter(li => {
        // Exclude Collections / submenu parent li which contains the dropdown mega-menu
        if (li.querySelector('.mega-menu, .offcanvas__sub_menu')) {
            return false;
        }
        return Boolean(li.querySelector('a.header__menu--link--sale, a[href="/sale"], a[href="sale.html"]'));
    });
}

async function checkAndShowSaleLink() {
    try {
        const data = await getSaleCheck();
        const isActiveSale = Boolean(data && (data.hasSale || Number(data.saleCount) > 0));

        // Show/hide any Sale links inside mega-menu / mobile sub-menu
        document.querySelectorAll('.mega-menu, .offcanvas__sub_menu').forEach(menu => {
            menu.querySelectorAll(SALE_LINK_SELECTOR).forEach(a => {
                const li = a.closest('li');
                if (li) {
                    li.style.display = isActiveSale ? '' : 'none';
                }
            });
        });

        const navs = [
            {
                nav: document.querySelector('.header__menu--wrapper'),
                id: 'desktop-sale-link',
                liClass: 'header__menu--items sale-link',
                linkClass: 'header__menu--link header__menu--link--sale'
            },
            {
                nav: document.querySelector('.offcanvas__menu_ul'),
                id: 'mobile-sale-link',
                liClass: 'offcanvas__menu_li sale-link',
                linkClass: 'offcanvas__menu_item header__menu--link--sale'
            }
        ];

        navs.forEach(({ nav, id, liClass, linkClass }) => {
            if (!nav) return;

            const existing = findTopLevelSaleItems(nav);

            if (!isActiveSale) {
                // If there is NO sale, it should NOT show anywhere on the main line
                existing.forEach(li => {
                    li.style.display = 'none';
                });
                return;
            }

            // If there IS an active sale, show it on the main line with distinctive sale color
            if (existing.length > 0) {
                existing[0].style.display = '';
                const a = existing[0].querySelector('a');
                if (a) {
                    a.style.color = '#d9534f';
                    a.style.fontWeight = '600';
                }
                existing.slice(1).forEach(li => li.remove());
                return;
            }

            // If not found in DOM, inject it into the main navigation line
            const shopLink = nav.querySelector(':scope > li:nth-child(2)') || nav.children[1];
            const saleLi = document.createElement('li');
            saleLi.className = liClass;
            saleLi.id = id;
            saleLi.innerHTML = `<a class="${linkClass}" href="/sale" style="color:#d9534f !important; font-weight:600;">Sale</a>`;
            if (shopLink && shopLink.nextSibling) {
                nav.insertBefore(saleLi, shopLink.nextSibling);
            } else {
                nav.appendChild(saleLi);
            }
        });
    } catch (error) {
        console.error('Error checking sale products:', error);
    }
}
window.checkAndShowSaleLink = checkAndShowSaleLink;

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShowSaleLink);
} else {
    checkAndShowSaleLink();
}
