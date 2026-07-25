// Dynamically show/hide sale link based on whether there are sale products
const SALE_LINK_SELECTOR = 'a[href="/sale"], a[href="sale.html"], a[href="/sale.html"]';

function findSaleItems(nav) {
    return Array.from(nav.querySelectorAll(SALE_LINK_SELECTOR))
        .map(a => a.closest('li'))
        .filter(Boolean);
}

async function checkAndShowSaleLink() {
    try {
        const response = await fetch('/api/sale-check');
        const data = await response.json();

        const navs = [
            {
                nav: document.querySelector('.header__menu--wrapper'),
                id: 'desktop-sale-link',
                liClass: 'header__menu--items sale-link',
                linkClass: 'header__menu--link'
            },
            {
                nav: document.querySelector('.offcanvas__menu_ul'),
                id: 'mobile-sale-link',
                liClass: 'offcanvas__menu_li sale-link',
                linkClass: 'offcanvas__menu_item'
            }
        ];

        navs.forEach(({ nav, id, liClass, linkClass }) => {
            if (!nav) return;

            const existing = findSaleItems(nav);

            if (!data.hasSale) {
                // No sale products — remove any hardcoded or injected sale links
                existing.forEach(li => li.remove());
                return;
            }

            // Keep the first sale link, drop any duplicates
            if (existing.length > 0) {
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

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShowSaleLink);
} else {
    checkAndShowSaleLink();
}
