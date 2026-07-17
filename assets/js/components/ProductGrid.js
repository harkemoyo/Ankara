import ProductCard from './ProductCard.js';

export default class ProductGrid {
    constructor(el) {
        this.el = el;
        this.state = {
            loading: true,
            error: null,
            products: [],
            facets: {},
            pagination: null
        };
        
        // Listen to global filter changes
        window.addEventListener('filter:changed', () => {
            this.fetchProducts();
        });

        // Listen for history popstate (browser back/forward)
        window.addEventListener('popstate', () => {
            this.fetchProducts();
        });

        // Listen for currency change to re-render prices
        window.addEventListener('currency:changed', () => {
            this.render();
        });
        
        // Listen for settings loaded (exchange rate) to re-render
        window.addEventListener('settings:loaded', () => {
            this.render();
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
            this.state.pagination = data.pagination;
            
            // Update product count dynamically
            const countEl = document.querySelector('.product__count span');
            if (countEl && this.state.pagination) {
                const total = this.state.pagination.total;
                countEl.textContent = `${total} ${total === 1 ? 'product' : 'products'}`;
            }
            
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
        if (window.AnkaraCurrency) {
            return window.AnkaraCurrency.convertAndFormat(num);
        }
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

        this.state.products.forEach(product => {
            const cardComponent = new ProductCard(product);
            this.el.appendChild(cardComponent.render());
        });

        this.renderPagination();
    }

    renderPagination() {
        const container = document.getElementById('pagination-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.state.pagination || this.state.pagination.totalPages <= 1) {
            return;
        }

        const { page, totalPages } = this.state.pagination;

        const nav = this.createEl('nav', 'pagination justify-content-center');
        const ul = this.createEl('ul', 'pagination__wrapper d-flex align-items-center justify-content-center');

        // Prev Arrow
        const liPrev = this.createEl('li', 'pagination__list');
        const aPrev = this.createEl('button', `pagination__item--arrow link ${page <= 1 ? 'disabled' : ''}`);
        aPrev.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22.51" height="20.443" viewbox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M244 400L100 256l144-144M120 256h292"/></svg><span class="visually-hidden">page left arrow</span>`;
        if (page > 1) {
            aPrev.addEventListener('click', () => this.goToPage(page - 1));
        } else {
            aPrev.disabled = true;
            aPrev.style.opacity = 0.5;
            aPrev.style.cursor = 'not-allowed';
        }
        liPrev.appendChild(aPrev);
        ul.appendChild(liPrev);

        // Page Numbers
        for (let i = 1; i <= totalPages; i++) {
            const li = this.createEl('li', 'pagination__list');
            if (i === page) {
                const span = this.createEl('span', 'pagination__item pagination__item--current', {}, i.toString());
                li.appendChild(span);
            } else {
                const a = this.createEl('button', 'pagination__item link', {}, i.toString());
                a.addEventListener('click', () => this.goToPage(i));
                li.appendChild(a);
            }
            ul.appendChild(li);
        }

        // Next Arrow
        const liNext = this.createEl('li', 'pagination__list');
        const aNext = this.createEl('button', `pagination__item--arrow link ${page >= totalPages ? 'disabled' : ''}`);
        aNext.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="22.51" height="20.443" viewbox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M268 112l144 144-144 144M392 256H100"/></svg><span class="visually-hidden">page right arrow</span>`;
        if (page < totalPages) {
            aNext.addEventListener('click', () => this.goToPage(page + 1));
        } else {
            aNext.disabled = true;
            aNext.style.opacity = 0.5;
            aNext.style.cursor = 'not-allowed';
        }
        liNext.appendChild(aNext);
        ul.appendChild(liNext);

        nav.appendChild(ul);
        container.appendChild(nav);
    }

    goToPage(page) {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.fetchProducts();
    }
}
