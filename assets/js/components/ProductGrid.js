import ProductCard from './ProductCard.js';

export default class ProductGrid {
    constructor(el) {
        this.el = el;
        this.state = {
            loading: true,
            error: null,
            products: [],
            facets: {}
        };
        
        // Listen to global filter changes
        window.addEventListener('filter:changed', () => {
            this.fetchProducts();
        });

        // Listen for history popstate (browser back/forward)
        window.addEventListener('popstate', () => {
            this.fetchProducts();
        });

        this.init();
    }

    init() {
        this.fetchProducts();
    }

    async fetchProducts() {
        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            const params = new URLSearchParams(window.location.search);
            const response = await fetch(`/api/products?${params.toString()}`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            this.state.products = data.products;
            this.state.facets = data.facets;
            
            // Dispatch event to update filters with the new facet counts
            window.dispatchEvent(new CustomEvent('facets:updated', { detail: this.state.facets }));
        } catch (error) {
            console.error('Error fetching products:', error);
            this.state.error = 'Failed to load products. Please try again.';
        } finally {
            this.state.loading = false;
            this.render();
        }
    }

    createEl(tag, classNames, attributes = {}, textContent = null) {
        const el = document.createElement(tag);
        if (classNames) el.className = classNames;
        for (const [key, value] of Object.entries(attributes)) {
            el.setAttribute(key, value);
        }
        if (textContent !== null) el.textContent = textContent;
        return el;
    }

    formatPrice(num) {
        return `£${parseFloat(num).toFixed(2)}`;
    }

    renderSkeleton() {
        const skeletonCount = 8;
        const container = this.createEl('div', 'product-grid');
        for (let i = 0; i < skeletonCount; i++) {
            const card = this.createEl('article', 'product-card skeleton-card');
            const img = this.createEl('div', 'skeleton-img');
            const title = this.createEl('div', 'skeleton-text');
            const price = this.createEl('div', 'skeleton-text short');
            card.append(img, title, price);
            container.appendChild(card);
        }
        return container;
    }

    renderEmpty() {
        const container = this.createEl('div', 'empty-state text-center');
        const msg = this.createEl('h3', '', {}, 'No products match your filters');
        const btn = this.createEl('button', 'primary__btn mt-3', {}, 'Clear all filters');
        btn.addEventListener('click', () => {
            window.history.pushState({}, '', window.location.pathname);
            window.dispatchEvent(new Event('filter:changed'));
        });
        container.append(msg, btn);
        return container;
    }

    renderError() {
        const container = this.createEl('div', 'error-state text-center');
        const msg = this.createEl('h3', 'text-danger', {}, this.state.error);
        const btn = this.createEl('button', 'primary__btn mt-3', {}, 'Retry');
        btn.addEventListener('click', () => this.fetchProducts());
        container.append(msg, btn);
        return container;
    }

    render() {
        this.el.innerHTML = ''; // Clear container

        if (this.state.loading) {
            this.el.appendChild(this.renderSkeleton());
            return;
        }

        if (this.state.error) {
            this.el.appendChild(this.renderError());
            return;
        }

        if (this.state.products.length === 0) {
            this.el.appendChild(this.renderEmpty());
            return;
        }

        const grid = this.createEl('div', 'product-grid');
        this.state.products.forEach(product => {
            const cardComponent = new ProductCard(product);
            grid.appendChild(cardComponent.render());
        });

        this.el.appendChild(grid);
    }
}
