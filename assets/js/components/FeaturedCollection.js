import ProductCard from './ProductCard.js';

export default class FeaturedCollection {
    constructor(el) {
        this.el = el;
        this.collection = el.getAttribute('data-collection') || 'all';
        this.limit = parseInt(el.getAttribute('data-limit') || '4');
        
        window.addEventListener('currency:changed', () => this.init());
        window.addEventListener('settings:loaded', () => this.init());
        
        this.init();
    }

    async init() {
        this.el.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem 0; font-size: 1.6rem; color: var(--foreground-sub-color);">Loading collection...</div>';
        
        try {
            const response = await fetch(`/api/products?collection=${this.collection}`);
            if (!response.ok) throw new Error('Failed to fetch collection');
            
            const data = await response.json();
            const products = data.products.slice(0, this.limit);
            
            this.el.innerHTML = '';
            
            if (products.length === 0) {
                this.el.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem 0; font-size: 1.6rem; color: var(--foreground-sub-color);">No products found.</div>';
                return;
            }

            products.forEach(product => {
                const card = new ProductCard(product);
                this.el.appendChild(card.render());
            });
        } catch (error) {
            console.error('Error rendering featured collection:', error);
            this.el.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem 0; color: var(--hover-color);">Failed to load products.</div>';
        }
    }
}
