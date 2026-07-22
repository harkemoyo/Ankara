export default class QuickViewDrawer {
    constructor() {
        this.el = null;
        this.product = null;
        this.selectedColor = '';
        this.selectedSize = '';
        this.quantity = 1;

        // Global listener to trigger opening
        window.addEventListener('quickview:open', (e) => {
            this.open(e.detail.handle);
        });

        this.init();
    }

    init() {
        // Look for existing quickview panel
        let panel = document.querySelector('.js-quickview-panel');
        if (!panel) {
            // Create and append dynamically so it works on all pages
            panel = document.createElement('div');
            panel.className = 'offCanvas__quickview js-quickview-panel';
            document.body.appendChild(panel);
        }
        this.el = panel;
        this.renderEmpty();
    }

    renderEmpty() {
        this.el.innerHTML = `
            <div class="quickview__header">
                <h3 class="quickview__title">Choose options</h3>
                <button type="button" class="quickview__close--btn js-quickview-close" aria-label="close quickview">&times;</button>
            </div>
            <div class="quickview__body">
                <div class="quickview__loading">
                    Loading product options...
                </div>
            </div>
        `;

        const closeBtn = this.el.querySelector('.js-quickview-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }

    async open(handle) {
        this.renderEmpty();
        this.el.classList.add('open');
        document.body.classList.add('offCanvas__quickview_active');

        // Add backdrop overlay if not present
        let backdrop = document.getElementById('quickview-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'quickview-backdrop';
            backdrop.style = 'position:fixed; top:0; left:0; width:100%; height:100vh; background:rgba(0,0,0,0.5); z-index:9998; display:block;';
            backdrop.addEventListener('click', () => this.close());
            document.body.appendChild(backdrop);
        } else {
            backdrop.style.display = 'block';
        }

        try {
            const response = await fetch(`/api/products/${handle}`);
            if (!response.ok) throw new Error('Failed to fetch product details');
            this.product = await response.json();
            
            // Set defaults
            this.selectedColor = (this.product.colors && this.product.colors.length > 0) ? this.product.colors[0].label : '';
            this.selectedSize = (this.product.sizes && this.product.sizes.length > 0) ? this.product.sizes[0] : 'M';
            this.quantity = 1;

            this.renderProduct();
        } catch (error) {
            console.error('Error loading quickview:', error);
            const loadingEl = this.el.querySelector('.quickview__loading');
            if (loadingEl) loadingEl.textContent = 'Failed to load product details.';
        }
    }

    close() {
        this.el.classList.remove('open');
        document.body.classList.remove('offCanvas__quickview_active');
        const backdrop = document.getElementById('quickview-backdrop');
        if (backdrop) backdrop.style.display = 'none';
    }

    formatPrice(num) {
        if (window.AnkaraCurrency) {
            return window.AnkaraCurrency.convertAndFormat(num);
        }
        return parseFloat(num).toFixed(2);
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

    renderProduct() {
        const product = this.product;
        this.el.innerHTML = '';

        // 1. Header (Fixed top)
        const header = this.createEl('div', 'quickview__header');
        const titleHeader = this.createEl('h3', 'quickview__title', {}, 'Choose options');
        const closeBtn = this.createEl('button', 'quickview__close--btn js-quickview-close', {
            'type': 'button',
            'aria-label': 'close quickview'
        });
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.close());
        header.append(titleHeader, closeBtn);

        // 2. Scrollable Body Container
        const body = this.createEl('div', 'quickview__body');

        // Product Summary (Image + Details)
        const infoWrap = this.createEl('div', 'quickview__product-info');
        const imgWrap = this.createEl('div', 'quickview__img-wrap');
        
        const activeColorObj = product.colors ? product.colors.find(c => c.label === this.selectedColor) : null;
        const mainImageUrl = (activeColorObj && activeColorObj.image) || (product.images && product.images.length > 0 ? product.images[0] : 'assets/placeholder.webp');
        
        const img = this.createEl('img', 'quickview__img', {
            src: mainImageUrl,
            alt: product.title
        });
        imgWrap.appendChild(img);

        const details = this.createEl('div', 'quickview__details');
        const brand = this.createEl('div', 'quickview__brand-label', {}, product.vendor || 'MARY HUMPHREY');
        const productTitle = this.createEl('div', 'quickview__product-title', {}, product.title);
        
        const priceWrap = this.createEl('div', 'quickview__price-wrap');
        const priceSpan = this.createEl('span', 'quickview__price', {}, this.formatPrice(product.price));
        const viewDetailsLink = this.createEl('a', 'quickview__details-link', {
            href: `product.html?handle=${product.handle}`
        }, 'View details');
        priceWrap.append(priceSpan, viewDetailsLink);

        details.append(brand, productTitle, priceWrap);
        infoWrap.append(imgWrap, details);

        // Color Swatches
        const colorWrap = this.createEl('div', 'quickview__color-wrap');
        const colorLabel = this.createEl('div', 'quickview__color-label', {}, 'Color: ');
        const colorVal = this.createEl('span', 'quickview__color-value', {}, this.selectedColor || 'As Shown');
        colorLabel.appendChild(colorVal);
        colorWrap.appendChild(colorLabel);

        if (product.colors && product.colors.length > 0) {
            const swatches = this.createEl('div', 'quickview__swatches');
            product.colors.forEach(color => {
                const isActive = color.label === this.selectedColor;
                const swatch = this.createEl('button', 'swatch-btn', {
                    'aria-label': color.label,
                    'aria-pressed': isActive ? 'true' : 'false',
                    'title': color.label,
                    'type': 'button',
                    'style': `width:3.8rem; height:3.8rem; border-radius:50%; overflow:hidden; border: 2px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}; cursor: pointer; padding:0; background:none;`
                });
                
                const swatchImg = this.createEl('img', 'swatch-img', {
                    src: color.image || mainImageUrl,
                    alt: color.label,
                    style: 'width:100%; height:100%; object-fit:cover;'
                });
                swatch.appendChild(swatchImg);

                swatch.addEventListener('click', () => {
                    this.selectedColor = color.label;
                    this.renderProduct();
                });
                swatches.appendChild(swatch);
            });
            colorWrap.appendChild(swatches);
        }

        // Size Dropdown
        const sizeWrap = this.createEl('div', 'quickview__size-wrap');
        const sizeLabel = this.createEl('label', 'quickview__size-label', { for: 'quickview-size-select' }, 'Size:');
        const sizeSelect = this.createEl('select', 'quickview__size-select', { id: 'quickview-size-select' });
        
        const sizesList = (product.sizes && product.sizes.length > 0) ? product.sizes : ['S', 'M', 'L', 'XL'];
        sizesList.forEach(size => {
            const option = this.createEl('option', '', { value: size }, size);
            if (size === this.selectedSize) option.selected = true;
            sizeSelect.appendChild(option);
        });
        sizeSelect.addEventListener('change', (e) => {
            this.selectedSize = e.target.value;
        });

        sizeWrap.append(sizeLabel, sizeSelect);

        // Quantity Selector
        const qtyWrap = this.createEl('div', 'quickview__qty-wrap');
        const qtyLabel = this.createEl('div', 'quickview__qty-label', {}, 'Quantity:');
        
        const qtySelector = this.createEl('div', 'quickview__qty-selector');
        
        const minusBtn = this.createEl('button', 'qty-btn qty-minus', { type: 'button' });
        minusBtn.innerHTML = '&minus;';
        minusBtn.addEventListener('click', () => {
            if (this.quantity > 1) {
                this.quantity--;
                qtyInput.value = this.quantity;
            }
        });

        const qtyInput = this.createEl('input', 'qty-input', {
            type: 'text',
            value: this.quantity,
            readonly: true
        });

        const plusBtn = this.createEl('button', 'qty-btn qty-plus', { type: 'button' });
        plusBtn.innerHTML = '+';
        plusBtn.addEventListener('click', () => {
            this.quantity++;
            qtyInput.value = this.quantity;
        });

        qtySelector.append(minusBtn, qtyInput, plusBtn);
        qtyWrap.append(qtyLabel, qtySelector);

        // Action Buttons
        const actionsWrap = this.createEl('div', 'quickview__actions');
        
        const addToCartBtn = this.createEl('button', 'quickview__btn quickview__btn--cart', { type: 'button' }, 'Add to Cart');
        addToCartBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('cart:add', {
                detail: {
                    id: product.handle,
                    title: product.title,
                    price: product.price,
                    image: mainImageUrl,
                    qty: this.quantity,
                    size: this.selectedSize,
                    color: this.selectedColor
                }
            }));
            this.close();
        });

        const buyNowBtn = this.createEl('button', 'quickview__btn quickview__btn--buy', { type: 'button' }, 'Buy It Now');
        buyNowBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('cart:add', {
                detail: {
                    id: product.handle,
                    title: product.title,
                    price: product.price,
                    image: mainImageUrl,
                    qty: this.quantity,
                    size: this.selectedSize,
                    color: this.selectedColor
                }
            }));
            setTimeout(() => {
                window.location.href = 'checkout.html';
            }, 100);
        });

        actionsWrap.append(addToCartBtn, buyNowBtn);

        // Append to Body
        body.append(infoWrap, colorWrap, sizeWrap, qtyWrap, actionsWrap);

        // Append Header and Body to drawer container
        this.el.append(header, body);
    }
}

