export default class ProductCard {
    constructor(product) {
        this.product = product;
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

    render() {
        const product = this.product;
        const card = this.createEl('article', 'product__card clean-card product-card', {
            'data-handle': product.handle
        });

        if (!product.in_stock) {
            card.classList.add('out-of-stock');
        }

        // 1. Thumbnail Wrap
        const thumbnailWrap = this.createEl('div', 'product__card--thumbnail clean-card-thumbnail');
        
        const thumbnailLink = this.createEl('a', 'product__card--thumbnail__link display-block', {
            href: `product.html?handle=${product.handle}`
        });

        const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : 'assets/placeholder.webp';
        const hoverImage = (product.images && product.images.length > 1) ? product.images[1] : primaryImage;

        const mainImg = this.createEl('img', 'product__card--thumbnail__img product__primary--img', {
            src: primaryImage,
            alt: product.title,
            loading: 'lazy'
        });
        const secondaryImg = this.createEl('img', 'product__card--thumbnail__img product__secondary--img', {
            src: hoverImage,
            alt: product.title,
            loading: 'lazy'
        });

        thumbnailLink.append(mainImg, secondaryImg);
        thumbnailWrap.appendChild(thumbnailLink);

        // Badges
        if (!product.in_stock) {
            const badge = this.createEl('span', 'badge sold-out-badge', {}, 'Sold Out');
            thumbnailWrap.appendChild(badge);
        } else if (product.compare_at_price > product.price) {
            const badge = this.createEl('span', 'badge sale-badge', {}, 'Sale');
            thumbnailWrap.appendChild(badge);
        }

        // Action overlay buttons on hover
        if (product.in_stock) {
            // Quick Add to Cart button
            const addBtn = this.createEl('button', 'clean-card-add', {
                'type': 'button',
                'aria-label': 'Add to cart',
                'title': 'Add to Cart'
            });
            addBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`;
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Fire custom global event
                window.dispatchEvent(new CustomEvent('cart:add', {
                    detail: {
                        id: product.handle,
                        title: product.title,
                        price: product.price,
                        image: primaryImage,
                        qty: 1,
                        size: (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'M',
                        color: (product.colors && product.colors.length > 0) ? product.colors[0].label : ''
                    }
                }));
            });

            // Quick View button
            const quickBtn = this.createEl('button', 'clean-card-quickview', {
                'type': 'button',
                'aria-label': 'Quick view',
                'title': 'Quick View'
            });
            quickBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
            quickBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Fire custom global event to open Quick View
                window.dispatchEvent(new CustomEvent('quickview:open', {
                    detail: { handle: product.handle }
                }));
            });

            thumbnailWrap.append(addBtn, quickBtn);
        }

        // 2. Card Content
        const content = this.createEl('div', 'product__card--content clean-card-content');

        const titleLink = this.createEl('a', 'product__card--title-link', {
            href: `product.html?handle=${product.handle}`
        });
        const title = this.createEl('h3', 'product__card--title clean-title', {}, product.title);
        titleLink.appendChild(title);

        // Color Swatches
        let swatchesContainer = null;
        if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
            swatchesContainer = this.createEl('div', 'product-card__swatches', {
                'style': 'display: flex; gap: 8px; margin-top: 8px; justify-content: center;'
            });
            product.colors.forEach((color, index) => {
                const swatch = this.createEl('button', 'swatch-btn', {
                    'aria-label': color.label,
                    'aria-pressed': index === 0 ? 'true' : 'false',
                    'title': color.label,
                    'type': 'button',
                    'style': `width: 2.4rem; height: 2.4rem; border-radius: 50%; padding: 0; border: 2px solid ${index === 0 ? 'var(--primary-color)' : 'transparent'}; cursor: pointer; overflow: hidden; display: inline-block;`
                });
                
                const swatchImgUrl = color.image || primaryImage;
                const swatchImg = this.createEl('img', 'swatch-img', {
                    src: swatchImgUrl,
                    alt: color.label,
                    style: 'width: 100%; height: 100%; object-fit: cover; display: block;'
                });
                swatch.appendChild(swatchImg);

                swatch.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    Array.from(swatchesContainer.children).forEach(btn => {
                        btn.setAttribute('aria-pressed', 'false');
                        btn.style.borderColor = 'transparent';
                    });
                    swatch.setAttribute('aria-pressed', 'true');
                    swatch.style.borderColor = 'var(--primary-color)';
                    
                    mainImg.src = swatchImgUrl;
                });

                swatchesContainer.appendChild(swatch);
            });
        }

        // Price Wrapper
        const priceWrapper = this.createEl('div', 'product__card--price clean-price');
        const currentPrice = this.createEl('span', 'current__price', {}, this.formatPrice(product.price));
        priceWrapper.appendChild(currentPrice);

        if (product.compare_at_price > product.price) {
            const oldPrice = this.createEl('span', 'old__price', {
                'style': 'text-decoration:line-through;color:#999;margin-left:8px;'
            }, this.formatPrice(product.compare_at_price));
            priceWrapper.appendChild(oldPrice);
        }

        content.append(titleLink);
        if (swatchesContainer) {
            content.appendChild(swatchesContainer);
        }
        content.appendChild(priceWrapper);

        card.append(thumbnailWrap, content);
        return card;
    }
}
