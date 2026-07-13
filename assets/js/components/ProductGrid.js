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

    renderProductCard(product) {
        const card = this.createEl('article', 'product-card');
        if (!product.in_stock) {
            card.classList.add('out-of-stock');
        }

        // Thumbnail / main image link
        const thumbnailLink = this.createEl('a', 'product-card__thumbnail', { href: `product.html?handle=${product.handle}` });
        
        const mainImageUrl = (product.images && product.images.length > 0) ? product.images[0] : 'assets/placeholder.webp';
        const img = this.createEl('img', 'product-card__img main-img', { src: mainImageUrl, alt: product.title, loading: 'lazy' });
        thumbnailLink.appendChild(img);

        // Badges
        if (!product.in_stock) {
            const badge = this.createEl('span', 'badge sold-out-badge', {}, 'Sold Out');
            thumbnailLink.appendChild(badge);
        } else if (product.compare_at_price > product.price) {
            const badge = this.createEl('span', 'badge sale-badge', {}, 'Sale');
            thumbnailLink.appendChild(badge);
        }

        // Swatches (Color)
        let swatchesContainer = null;
        if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
            swatchesContainer = this.createEl('div', 'product-card__swatches');
            product.colors.forEach((color, index) => {
                const swatch = this.createEl('button', 'swatch-btn', {
                    'aria-label': color.label,
                    'aria-pressed': index === 0 ? 'true' : 'false',
                    'title': color.label, // text label on hover
                    'type': 'button'
                });
                
                // Crop thumbnail for swatch
                const swatchImgUrl = color.image || mainImageUrl;
                const swatchImg = this.createEl('img', 'swatch-img', {
                    src: swatchImgUrl,
                    alt: color.label
                });
                swatch.appendChild(swatchImg);

                // Clicking swatch updates the main image without fetching
                swatch.addEventListener('click', (e) => {
                    e.preventDefault();
                    // update aria-pressed
                    Array.from(swatchesContainer.children).forEach(btn => btn.setAttribute('aria-pressed', 'false'));
                    swatch.setAttribute('aria-pressed', 'true');
                    // swap main image
                    img.src = swatchImgUrl;
                });

                swatchesContainer.appendChild(swatch);
            });
        }

        // Content
        const content = this.createEl('div', 'product-card__content');
        
        const titleLink = this.createEl('a', 'product-card__title-link', { href: `product.html?handle=${product.handle}` });
        const title = this.createEl('h3', 'product-card__title', {}, product.title);
        titleLink.appendChild(title);

        const priceWrapper = this.createEl('div', 'product-card__price');
        const currentPrice = this.createEl('span', 'current__price', {}, this.formatPrice(product.price));
        priceWrapper.appendChild(currentPrice);

        if (product.compare_at_price > product.price) {
            const oldPrice = this.createEl('span', 'old__price', {}, this.formatPrice(product.compare_at_price));
            priceWrapper.appendChild(oldPrice);
        }

        content.append(titleLink, priceWrapper);
        if (swatchesContainer) {
            content.appendChild(swatchesContainer);
        }

        card.append(thumbnailLink, content);
        return card;
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
            grid.appendChild(this.renderProductCard(product));
        });

        this.el.appendChild(grid);
    }
}
