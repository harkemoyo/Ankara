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
            <div class="quickview__header" style="display:flex; justify-content:space-between; align-items:center; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color); margin-bottom: 3rem;">
                <h3 class="quickview__title" style="font-family: var(--frank-ruhl-fonts); font-size: 2.2rem; color: var(--primary-color); font-weight: 600; margin:0;">Choose options</h3>
                <button type="button" class="quickview__close--btn js-quickview-close" aria-label="close quickview" style="background: none; border: none; font-size: 2.4rem; cursor: pointer; color: var(--primary-color); line-height: 1;">&times;</button>
            </div>
            <div class="quickview__loading" style="text-align:center; padding: 3rem 0; font-size: 1.6rem; color: var(--foreground-sub-color);">
                Loading product options...
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
            this.el.querySelector('.quickview__loading').textContent = 'Failed to load product details.';
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

        // 1. Header
        const header = this.createEl('div', 'quickview__header', {
            style: 'display:flex; justify-content:space-between; align-items:center; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color); margin-bottom: 3rem;'
        });
        const titleHeader = this.createEl('h3', 'quickview__title', {
            style: 'font-family: var(--frank-ruhl-fonts); font-size: 2.2rem; color: var(--primary-color); font-weight: 600; margin:0;'
        }, 'Choose options');
        const closeBtn = this.createEl('button', 'quickview__close--btn js-quickview-close', {
            style: 'background: none; border: none; font-size: 2.4rem; cursor: pointer; color: var(--primary-color); line-height: 1;',
            'aria-label': 'close quickview'
        });
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.close());
        header.append(titleHeader, closeBtn);

        // 2. Info Wrap
        const infoWrap = this.createEl('div', 'quickview__product-info', {
            style: 'display: flex; gap: 2rem; margin-bottom: 3rem;'
        });
        const imgWrap = this.createEl('div', 'quickview__img-wrap', {
            style: 'flex: 0 0 80px; height: 80px; background: #fff; padding: 0.5rem; border: 1px solid var(--border-color);'
        });
        
        // Find main image or swatch-specific image
        const activeColorObj = product.colors ? product.colors.find(c => c.label === this.selectedColor) : null;
        const mainImageUrl = (activeColorObj && activeColorObj.image) || (product.images && product.images.length > 0 ? product.images[0] : 'assets/placeholder.webp');
        
        const img = this.createEl('img', 'quickview__img', {
            src: mainImageUrl,
            alt: product.title,
            style: 'width: 100%; height: 100%; object-fit: contain;'
        });
        imgWrap.appendChild(img);

        const details = this.createEl('div', 'quickview__details');
        const brand = this.createEl('div', 'quickview__brand-label', {
            style: 'font-size: 1.1rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--foreground-sub-color); margin-bottom: 0.5rem;'
        }, product.vendor || 'MARY HUMPHREY');
        const productTitle = this.createEl('div', 'quickview__product-title', {
            style: 'font-family: var(--frank-ruhl-fonts); font-size: 1.8rem; color: var(--primary-color); margin-bottom: 0.5rem; font-weight:600;'
        }, product.title);
        
        const priceWrap = this.createEl('div', 'quickview__price-wrap', {
            style: 'font-size: 1.4rem; color: var(--primary-color);'
        });
        const priceSpan = this.createEl('span', 'quickview__price', {
            style: 'margin-right: 1rem; font-weight:600;'
        }, this.formatPrice(product.price));
        const viewDetailsLink = this.createEl('a', 'quickview__details-link', {
            href: `product.html?handle=${product.handle}`,
            style: 'text-decoration: underline; font-size: 1.2rem; color: var(--foreground-sub-color);'
        }, 'View details');
        priceWrap.append(priceSpan, viewDetailsLink);

        details.append(brand, productTitle, priceWrap);
        infoWrap.append(imgWrap, details);

        // 3. Color Swatches
        const colorWrap = this.createEl('div', 'quickview__color-wrap', {
            style: 'margin-bottom: 2.5rem;'
        });
        const colorLabel = this.createEl('div', 'quickview__color-label', {
            style: 'font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem;'
        }, 'Color: ');
        const colorVal = this.createEl('span', 'quickview__color-value', {
            style: 'color: var(--foreground-sub-color); font-weight:500;'
        }, this.selectedColor || 'As Shown');
        colorLabel.appendChild(colorVal);
        colorWrap.appendChild(colorLabel);

        if (product.colors && product.colors.length > 0) {
            const swatches = this.createEl('div', 'quickview__swatches', {
                style: 'display: flex; gap: 1.2rem;'
            });
            product.colors.forEach(color => {
                const isActive = color.label === this.selectedColor;
                const swatch = this.createEl('button', 'swatch-btn', {
                    'aria-label': color.label,
                    'aria-pressed': isActive ? 'true' : 'false',
                    'title': color.label,
                    'type': 'button',
                    'style': `width:3.6rem; height:3.6rem; border-radius:50%; overflow:hidden; border: 2px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}; cursor: pointer; padding:0; background:none;`
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

        // 4. Size Dropdown
        const sizeWrap = this.createEl('div', 'quickview__size-wrap', {
            style: 'margin-bottom: 2.5rem;'
        });
        const sizeLabel = this.createEl('div', 'quickview__size-label', {
            style: 'font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem;'
        }, 'Size:');
        const sizeSelect = this.createEl('select', 'quickview__size-select', {
            style: 'width: 100%; padding: 1rem; border: 1px solid var(--border-color); font-size: 1.4rem; outline: none; background: #fff; border-radius: 4px;'
        });
        
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

        // 5. Quantity Wrap
        const qtyWrap = this.createEl('div', 'quickview__qty-wrap', {
            style: 'margin-bottom: 3rem;'
        });
        const qtyLabel = this.createEl('div', 'quickview__qty-label', {
            style: 'font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem;'
        }, 'Quantity:');
        
        const qtySelector = this.createEl('div', 'quickview__qty-selector', {
            style: 'display: inline-flex; align-items: center; border: 1px solid var(--border-color); border-radius: 4px; background: #fff;'
        });
        
        const minusBtn = this.createEl('button', 'qty-btn', {
            style: 'border: none; background: transparent; padding: 0.8rem 1.5rem; font-size: 1.6rem; color: var(--primary-color); cursor: pointer;'
        });
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
            style: 'width: 4rem; text-align: center; border: none; font-size: 1.4rem; color: var(--primary-color); outline: none; background: transparent;',
            readonly: true
        });

        const plusBtn = this.createEl('button', 'qty-btn', {
            style: 'border: none; background: transparent; padding: 0.8rem 1.5rem; font-size: 1.6rem; color: var(--primary-color); cursor: pointer;'
        });
        plusBtn.innerHTML = '+';
        plusBtn.addEventListener('click', () => {
            this.quantity++;
            qtyInput.value = this.quantity;
        });

        qtySelector.append(minusBtn, qtyInput, plusBtn);
        qtyWrap.append(qtyLabel, qtySelector);

        // 6. Actions Wrap
        const actionsWrap = this.createEl('div', 'quickview__actions', {
            style: 'display: flex; flex-direction: column; gap: 1.5rem;'
        });
        
        const addToCartBtn = this.createEl('button', 'botm-btn botm-btn-secondary', {
            style: 'padding: 1.6rem; background: var(--secondary-color); color: #fff; font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; border: none; font-weight: 600; cursor: pointer;'
        }, 'Add to Cart');
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

        const buyNowBtn = this.createEl('button', 'botm-btn botm-btn-primary', {
            style: 'padding: 1.6rem; background: var(--primary-color); color: #fff; font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; border: none; font-weight: 600; cursor: pointer;'
        }, 'Buy It Now');
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

        // Append everything
        this.el.append(header, infoWrap, colorWrap, sizeWrap, qtyWrap, actionsWrap);
    }
}
