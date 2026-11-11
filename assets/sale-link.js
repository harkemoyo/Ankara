// Dynamically show/hide sale link based on whether there are sale products
const SALE_LINK_SELECTOR = 'a[href="/sale"], a[href="sale.html"]';

function getSaleCheck() {
    if (!window._saleCheckPromise) {
        window._saleCheckPromise = fetch('/api/sale-check')
            .then(r => r.ok ? r.json() : { hasSale: false, maxDiscountPercent: 0 })
            .catch(() => ({ hasSale: false, maxDiscountPercent: 0 }));
    }
    return window._saleCheckPromise;
}
window.getSaleCheck = getSaleCheck;

function findSaleItems(nav) {
    return Array.from(nav.querySelectorAll(SALE_LINK_SELECTOR))
        .map(a => a.closest('li'))
        .filter(Boolean);
}

async function checkAndShowSaleLink() {
    try {
        const data = await getSaleCheck();
        const isActiveSale = Boolean(data && data.hasSale && Number(data.maxDiscountPercent) > 0);

        // Also remove/hide any Sale links inside mega-menu if no active sale
        document.querySelectorAll('.mega-menu').forEach(mega => {
            mega.querySelectorAll(SALE_LINK_SELECTOR).forEach(a => {
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

            const existing = findSaleItems(nav);

            if (!isActiveSale) {
                // No sale products — remove any hardcoded or injected sale links
                existing.forEach(li => li.remove());
                return;
            }

            // Keep the first sale link, make sure it is visible, drop any duplicates
            if (existing.length > 0) {
                existing[0].style.display = '';
                existing.slice(1).forEach(li => li.remove());
                return;
            }

            const shopLink = nav.querySelector('li:nth-child(2)');
            if (!shopLink) return;

            const saleLi = document.createElement('li');
            saleLi.className = liClass;
            saleLi.id = id;
            saleLi.innerHTML = `<a class="${linkClass}" href="/sale" style="color:#d9534f; font-weight:600;">Sale</a>`;
            nav.insertBefore(saleLi, shopLink.nextSibling);
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
