function toggleFilter() {
    const offcanvas = document.getElementById('filter-offcanvas');
    const backdrop = document.getElementById('filter-backdrop');
    offcanvas.classList.toggle('open');
    if (offcanvas.classList.contains('open')) {
        backdrop.style.display = 'block';
        setTimeout(() => backdrop.classList.add('open'), 10);
        document.body.style.overflow = 'hidden';
    } else {
        backdrop.classList.remove('open');
        setTimeout(() => backdrop.style.display = 'none', 300);
        document.body.style.overflow = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Offcanvas filter sidebar
    if (typeof offcanvsSidebar === 'function') {
        offcanvsSidebar(
            ".widget__filter--btn",
            ".offcanvas__filter--close",
            ".offcanvas__filter--sidebar"
        );
    }

    if (typeof customAccordion === 'function') {
        customAccordion(
            ".widget__categories--menu",
            ".widget__categories--menu__list",
            ".widget__categories--sub__menu"
        );
    }

    loadSidebarFeaturedProducts();
});

async function loadSidebarFeaturedProducts() {
    const container = document.getElementById('sidebar-featured-products');
    if (!container) return;
    try {
        const res = await fetch('/api/products?limit=3');
        if (!res.ok) return;
        const data = await res.json();
        const products = data.products || [];
        if (products.length === 0) return;

        container.innerHTML = products.slice(0, 3).map(p => {
            const img = (p.images && p.images[0]) ? p.images[0] : (p.image || '');
            const price = parseFloat(p.price || 0);
            const priceFormatted = window.AnkaraCurrency && typeof window.AnkaraCurrency.convertAndFormat === 'function'
                ? window.AnkaraCurrency.convertAndFormat(price)
                : `KSh ${price.toLocaleString()}`;
            const title = String(p.title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            return `
            <div class="small__product--card d-flex">
                <div class="small__product--thumbnail">
                    <a class="display-block" href="/product/${encodeURIComponent(p.handle || p.id)}">
                        <img alt="${title}" src="${img}" loading="lazy" decoding="async" style="width:70px;height:70px;object-fit:cover;border-radius:6px;" />
                    </a>
                </div>
                <div class="small__product--content" style="padding-left:10px;">
                    <h3 class="small__product--card__title">
                        <a href="/product/${encodeURIComponent(p.handle || p.id)}">${title}</a>
                    </h3>
                    <div class="small__product--card__price mb_5">
                        <span class="current__price">${priceFormatted}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.warn('Sidebar featured products load error:', e);
    }
}
