export default class ProductCard {
    constructor(product) {
        this.product = product;
        this.selectedSize = (product.sizes && product.sizes.length > 0) ? product.sizes[0] : 'M';
        this.selectedColor = (product.colors && product.colors.length > 0) ? product.colors[0].label : '';
        this.selectedColorHex = (product.colors && product.colors.length > 0) ? product.colors[0].hex : '';
        this.quantity = 1;
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
        return `KSh ${parseFloat(num).toLocaleString()}`;
    }

    render() {
        const product = this.product;
        const card = this.createEl('article', 'product__card js-product-card', {
            'data-handle': product.handle,
            'id': `card-${product.handle}`
        });

        if (!product.in_stock) {
            card.classList.add('out-of-stock');
        }

        // ================= Left Column (Images & Thumbnails) =================
        const leftCol = this.createEl('div', 'product-card-left', {
            style: 'display:flex; flex-direction:column;'
        });

        const thumbnailWrap = this.createEl('div', 'product__card--thumbnail');
        const thumbnailLink = this.createEl('a', 'product__card--thumbnail__link', {
            href: `product.html?handle=${product.handle}`
        });

        const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : 'assets/DSC02676.jpg';

        const mainImg = this.createEl('img', 'product__card--thumbnail__img product__primary--img', {
            src: primaryImage,
            alt: product.title,
            loading: 'lazy',
            id: `main-img-card-${product.handle}`
        });

        thumbnailLink.appendChild(mainImg);
        thumbnailWrap.appendChild(thumbnailLink);

        // Badge
        const isSalePage = window.location.pathname.includes('sale.html') || window.location.pathname === '/sale' || window.location.pathname.endsWith('/sale') || window.location.search.includes('collection=sale');
        if (!product.in_stock) {
            const badge = this.createEl('span', 'product__card--badge sold-out-badge', {}, 'Sold Out');
            thumbnailWrap.appendChild(badge);
        } else if (isSalePage) {
            const badge = this.createEl('span', 'product__card--badge sale-badge', {
                style: 'background-color: #ED1D24; color: #fff;'
            }, 'Sale');
            thumbnailWrap.appendChild(badge);
        }

        leftCol.appendChild(thumbnailWrap);

        // Thumbnails list (if multiple images exist)
        if (product.images && product.images.length > 1) {
            const thumbsContainer = this.createEl('div', 'card-thumbnails-container', {
                style: 'display:flex; gap:8px; padding:12px; background:#f5f0ea; overflow-x:auto;'
            });

            product.images.forEach((img, idx) => {
                const thumbItem = this.createEl('div', `card-thumb-item ${idx === 0 ? 'active' : ''}`, {
                    style: `width:50px; height:50px; border:2px solid ${idx === 0 ? '#1a1108' : '#e5dec9'}; border-radius:4px; overflow:hidden; cursor:pointer; flex-shrink:0; background:#fff;`
                });
                const thumbImg = this.createEl('img', '', {
                    src: img,
                    style: 'width:100%; height:100%; object-fit:cover;'
                });
                thumbItem.appendChild(thumbImg);

                thumbItem.addEventListener('click', () => {
                    mainImg.src = img;
                    Array.from(thumbsContainer.children).forEach(child => {
                        child.style.borderColor = '#e5dec9';
                    });
                    thumbItem.style.borderColor = '#1a1108';
                });

                thumbsContainer.appendChild(thumbItem);
            });
            leftCol.appendChild(thumbsContainer);
        }

        // ================= Right Column (Details & Actions) =================
        const content = this.createEl('div', 'product__card--content');

        // Vendor
        const vendor = this.createEl('span', 'product__card--vendor', {
            style: 'font-size:1.1rem; letter-spacing:0.15em; text-transform:uppercase; color:#8e7a6b; font-weight:600;'
        }, product.vendor || 'MARY HUMPHREY AFRICAN WEAR');

        // Title
        const titleLink = this.createEl('a', 'product__card--title-link', {
            href: `product.html?handle=${product.handle}`
        });
        const title = this.createEl('h3', 'product__card--title', {}, product.title);
        titleLink.appendChild(title);

        // Price
        const priceWrapper = this.createEl('div', 'product__card--price');
        const currentPrice = this.createEl('span', 'current__price', {}, this.formatPrice(product.price));
        priceWrapper.appendChild(currentPrice);

        if (isSalePage && product.compare_at_price > product.price) {
            const oldPrice = this.createEl('span', 'old__price', {}, this.formatPrice(product.compare_at_price));
            priceWrapper.appendChild(oldPrice);
        }

        // Subtext
        const subtext = this.createEl('span', '', {
            style: 'font-size:1.1rem; color:#777; margin-top:-0.5rem; display:block;'
        }, 'Tax included. Shipping calculated at checkout.');

        content.append(vendor, titleLink, priceWrapper, subtext);

        // Colors (if any exist)
        if (product.colors && product.colors.length > 0) {
            const colorRow = this.createEl('div', 'card-color-row', {
                style: 'margin-top:0.5rem;'
            });
            const colorLabelWrap = this.createEl('div', '', {
                style: 'font-size:1.3rem; color:#555; font-weight:600; margin-bottom:6px;'
            });
            colorLabelWrap.innerHTML = `COLOUR: <span class="sel-color-lbl" style="font-weight:400; color:#1a1108;">${this.selectedColor}</span>`;
            const colorLabelValue = colorLabelWrap.querySelector('.sel-color-lbl');

            const swatchesContainer = this.createEl('div', 'card-color-swatches');

            product.colors.forEach((c, idx) => {
                const swatch = this.createEl('span', `card-swatch ${idx === 0 ? 'active' : ''}`, {
                    style: `background:${c.hex};`,
                    title: c.label
                });

                swatch.addEventListener('click', () => {
                    this.selectedColor = c.label;
                    colorLabelValue.textContent = c.label;
                    if (c.image) mainImg.src = c.image;

                    Array.from(swatchesContainer.children).forEach(s => s.classList.remove('active'));
                    swatch.classList.add('active');
                });

                swatchesContainer.appendChild(swatch);
            });

            colorRow.append(colorLabelWrap, swatchesContainer);
            content.appendChild(colorRow);
        }

        // Sizes (if any exist)
        const sizes = product.sizes || ['S', 'M', 'L'];
        const sizeRow = this.createEl('div', 'card-size-row', {
            style: 'margin-top:0.5rem;'
        });
        const sizeLabelWrap = this.createEl('div', '', {
            style: 'font-size:1.3rem; color:#555; font-weight:600; margin-bottom:6px;'
        });
        sizeLabelWrap.innerHTML = `SIZE: <span class="sel-size-lbl" style="font-weight:400; color:#1a1108;">${this.selectedSize}</span>`;
        const sizeLabelValue = sizeLabelWrap.querySelector('.sel-size-lbl');

        const sizeButtonsWrap = this.createEl('div', '', {
            style: 'display:flex; gap:6px;'
        });

        sizes.forEach((sz, idx) => {
            const sizeBtn = this.createEl('button', `card-size-btn ${sz === this.selectedSize ? 'active' : ''}`, {
                style: 'padding:6px 12px; border:1px solid #ccc; background:#fff; border-radius:4px; cursor:pointer; font-size:1.3rem; transition:all 0.2s;'
            }, sz);

            sizeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectedSize = sz;
                sizeLabelValue.textContent = sz;

                Array.from(sizeButtonsWrap.children).forEach(btn => btn.classList.remove('active'));
                sizeBtn.classList.add('active');
            });

            sizeButtonsWrap.appendChild(sizeBtn);
        });

        sizeRow.append(sizeLabelWrap, sizeButtonsWrap);
        content.appendChild(sizeRow);

        // Quantity selector
        const qtyRow = this.createEl('div', 'card-qty-row', {
            style: 'margin-top:0.5rem;'
        });
        const qtyLabel = this.createEl('span', 'card-qty-label', {
            style: 'font-weight:600; text-transform:uppercase; font-size:1.2rem; letter-spacing:0.05em; color:#555;'
        }, 'Quantity');

        const qtyStepper = this.createEl('div', 'card-qty-stepper');
        const decBtn = this.createEl('button', 'card-qty-btn', {}, '-');
        const qtyInput = this.createEl('input', 'card-qty-num', {
            type: 'number',
            value: '1',
            min: '1',
            readonly: 'true',
            style: 'width:40px; background:transparent; border:none; text-align:center; font-size:1.4rem;'
        });
        const incBtn = this.createEl('button', 'card-qty-btn', {}, '+');

        decBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let current = parseInt(qtyInput.value) || 1;
            if (current > 1) {
                current -= 1;
                qtyInput.value = current;
                this.quantity = current;
            }
        });

        incBtn.addEventListener('click', (e) => {
            e.preventDefault();
            let current = parseInt(qtyInput.value) || 1;
            current += 1;
            qtyInput.value = current;
            this.quantity = current;
        });

        qtyStepper.append(decBtn, qtyInput, incBtn);
        qtyRow.append(qtyLabel, qtyStepper);
        content.appendChild(qtyRow);

        // ADD TO BAG / BUY IT NOW buttons
        const btnGroup = this.createEl('div', '', {
            style: 'display:flex; flex-direction:column; gap:10px; margin-top:1rem;'
        });

        const atcBtn = this.createEl('button', 'card-btn-atc', {}, 'ADD TO BAG');
        const binBtn = this.createEl('button', 'card-btn-bin', {}, 'BUY IT NOW');

        const triggerCartAdd = (isBuyNow) => {
            if (typeof window.addToCart === 'function') {
                window.addToCart({
                    id: product.handle,
                    title: product.title,
                    price: product.price,
                    image: mainImg.src || primaryImage,
                    qty: this.quantity,
                    size: this.selectedSize,
                    color: this.selectedColor
                });

                if (isBuyNow) {
                    setTimeout(() => {
                        window.location.href = 'checkout.html';
                    }, 300);
                }
            }
        };

        atcBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerCartAdd(false);
        });

        binBtn.addEventListener('click', (e) => {
            e.preventDefault();
            triggerCartAdd(true);
        });

        btnGroup.append(atcBtn, binBtn);
        content.appendChild(btnGroup);

        card.append(leftCol, content);
        return card;
    }
}
