import ProductGrid from './ProductGrid.js';
import CollectionFilter from './CollectionFilter.js';
import QuickViewDrawer from './QuickViewDrawer.js';
import CartDrawer from './CartDrawer.js';
import FeaturedCollection from './FeaturedCollection.js';

const SECTION_REGISTRY = {
    'product-grid': ProductGrid,
    'collection-filters': CollectionFilter,
    'featured-collection': FeaturedCollection
};

async function renderHeaderCollections() {
    try {
        const res = await fetch('/api/collections');
        if (!res.ok) return;
        const { collections } = await res.json();
        if (!Array.isArray(collections) || collections.length === 0) return;

        const menu = document.querySelector('ul.header__sub--menu.mega-menu');
        if (!menu) return;

        const columns = menu.querySelectorAll('li.header__sub--menu__items.mega-col');
        const collectionsCol = Array.from(columns).find(col => {
            const heading = col.querySelector('span.mega-menu__heading');
            return heading && heading.textContent.trim().toLowerCase() === 'collections';
        });
        const stylesCol = Array.from(columns).find(col => {
            const heading = col.querySelector('span.mega-menu__heading');
            return heading && heading.textContent.trim().toLowerCase() === 'shop by style';
        });

        // Remove the hardcoded "Shop by Style" column
        if (stylesCol) stylesCol.remove();

        if (!collectionsCol) return;
        const list = collectionsCol.querySelector('ul.mega-col__list');
        if (!list) return;

        list.innerHTML = collections
            .filter(c => c.handle && c.title)
            .map(c => `<li class="header__sub--menu__items"><a class="header__sub--menu__link" href="/shop/${encodeURIComponent(c.handle)}">${c.title}</a></li>`)
            .join('');
    } catch (e) {
        console.error('Failed to render header collections', e);
    }
}

function init() {
    // 1. Render dynamic header collections from backend
    renderHeaderCollections();

    // 2. Initialize Singletons
    window.quickViewDrawer = new QuickViewDrawer();
    window.cartDrawer = new CartDrawer();

    // 3. Initialize Page Sections
    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(el => {
        const sectionName = el.getAttribute('data-section');
        const SectionClass = SECTION_REGISTRY[sectionName];
        
        if (SectionClass) {
            el.__sectionInstance = new SectionClass(el);
        } else {
            console.warn(`Section class not found for data-section="${sectionName}"`);
        }
    });
}

// Robust execution pattern (runs immediately if document is already loaded)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
