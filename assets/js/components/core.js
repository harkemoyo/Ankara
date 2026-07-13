// A simple bootstrapper for Shopify-style OS 2.0 sections
// Any element with data-section="SectionClass" will have that class initialized

import ProductGrid from './ProductGrid.js';
import CollectionFilter from './CollectionFilter.js';

const SECTION_REGISTRY = {
    'product-grid': ProductGrid,
    'collection-filters': CollectionFilter
};

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('[data-section]');
    
    sections.forEach(el => {
        const sectionName = el.getAttribute('data-section');
        const SectionClass = SECTION_REGISTRY[sectionName];
        
        if (SectionClass) {
            // Initialize the section and attach it to the DOM element
            el.__sectionInstance = new SectionClass(el);
        } else {
            console.warn(`Section class not found for data-section="${sectionName}"`);
        }
    });
});
