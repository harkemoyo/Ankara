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

function init() {
    // 1. Initialize Singletons
    window.quickViewDrawer = new QuickViewDrawer();
    window.cartDrawer = new CartDrawer();

    // 2. Initialize Page Sections
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
