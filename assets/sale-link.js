// Dynamically show/hide sale link based on whether there are sale products
async function checkAndShowSaleLink() {
    try {
        const response = await fetch('/api/sale-check');
        const data = await response.json();
        
        if (data.hasSale) {
            // Add sale link to desktop navigation
            const desktopNav = document.querySelector('.header__menu--wrapper');
            if (desktopNav && !document.getElementById('desktop-sale-link')) {
                const shopLink = desktopNav.querySelector('li:nth-child(2)');
                const saleLi = document.createElement('li');
                saleLi.className = 'header__menu--items sale-link';
                saleLi.id = 'desktop-sale-link';
                saleLi.innerHTML = '<a class="header__menu--link" href="sale.html" style="color:#d9534f; font-weight:600;">Sale</a>';
                
                if (shopLink) {
                    desktopNav.insertBefore(saleLi, shopLink.nextSibling);
                }
            }
            
            // Add sale link to mobile navigation
            const mobileNav = document.querySelector('.offcanvas__menu_ul');
            if (mobileNav && !document.getElementById('mobile-sale-link')) {
                const shopLink = mobileNav.querySelector('li:nth-child(2)');
                const saleLi = document.createElement('li');
                saleLi.className = 'offcanvas__menu_li sale-link';
                saleLi.id = 'mobile-sale-link';
                saleLi.innerHTML = '<a class="offcanvas__menu_item" href="sale.html" style="color:#d9534f; font-weight:600;">Sale</a>';
                
                if (shopLink) {
                    mobileNav.insertBefore(saleLi, shopLink.nextSibling);
                }
            }
        }
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
