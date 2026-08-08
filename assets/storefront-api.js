// assets/storefront-api.js
// Fetches data from Supabase and renders storefront UI
// =============================================

// Global Filter & Sort State for the Shop Page
let filterState = {
    collection: 'all',
    sizes: [],
    minPrice: 0,
    maxPrice: 250,
    sortBy: 'latest',
    search: ''
};

// =============================================
// SHOP PAGE — Load and render product grid (AJAX filtering)
// =============================================
async function loadShopProducts() {
    const grid = document.querySelector('.shop-product-grid') || document.querySelector('.product-grid:not(#related-products-grid)');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:2rem;text-align:center;">Loading products...</p>';

    let products = [];
    try {
        const params = new URLSearchParams();
        if (filterState.collection) params.set('collection', filterState.collection);
        if (filterState.sortBy) params.set('sort', filterState.sortBy);
        if (filterState.search) params.set('q', filterState.search);
        if (filterState.productType) params.set('product_type', filterState.productType);
        if (filterState.sizes && filterState.sizes.length > 0) params.set('sizes', filterState.sizes.join(','));
        if (filterState.minPrice) params.set('min_price', filterState.minPrice);
        if (filterState.maxPrice) params.set('max_price', filterState.maxPrice);

        // Handle sale page specifically if needed
        if (window.location.pathname.includes('/sale')) {
            params.set('collection', 'sale');
        }

        const res = await fetch(`/api/products?${params.toString()}`);
        if (res.ok) {
            const data = await res.json();
            products = data.products || [];
        }
    } catch (e) {
        console.error('Failed to load shop products via API:', e);
    }

    if (products.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center" style="grid-column:1/-1;padding:3rem;"><p>No products found matching your filters.</p></div>';
        return;
    } grid.innerHTML = products.map((product) => {
        const primaryImage = (product.images && Array.isArray(product.images) && product.images[0]) ? product.images[0] : 'assets/DSC02676.jpg';
        const hoverImage = (product.images && Array.isArray(product.images) && product.images[1]) ? product.images[1] : primaryImage;
        const price = parseFloat(product.price);
        const isSalePage = window.location.pathname.includes('/sale') || window.location.pathname === '/sale' || window.location.pathname.endsWith('/sale') || window.location.search.includes('collection=sale');
        const comparePrice = (isSalePage && product.compare_at_price) ? parseFloat(product.compare_at_price) : null;
        let badgeHtml = '';
        if (isSalePage) {
            badgeHtml = `<span class="product__badge" style="top:10px; right:10px; left:auto; background:#ED1D24; color:#fff; width:auto; padding:0 8px; line-height:22px; height:22px; font-weight:600;">Sale</span>`;
        }
        const colors = product.colors || [];

        return `
        <article class="product__card clean-card" data-handle="${product.handle}">
            <div class="product__card--thumbnail clean-card-thumbnail">
                <a class="product__card--thumbnail__link display-block" href="/product/${product.handle}">
                    <img class="product__card--thumbnail__img product__primary--img" src="${primaryImage}" alt="${product.title}">
                    <img class="product__card--thumbnail__img product__secondary--img" src="${hoverImage}" alt="${product.title}">
                </a>
                ${badgeHtml}
                <a href="javascript:void(0)" class="clean-card-add" aria-label="Add to cart" onclick="quickAddToCart('${product.handle}', '${product.title.replace(/'/g, "\\'")}', ${product.price}, '${primaryImage}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </a>
            </div>
            <div class="product__card--content clean-card-content">
                <h3 class="product__card--title clean-title">
                    <a href="/product/${product.handle}">${product.title}</a>
                </h3>
                ${colors.length > 0 ? `
                <div class="card-color-swatches" style="display:flex;justify-content:center;gap:6px;margin:8px 0;">
                    ${colors.map((c, i) => `
                        <span 
                            class="card-swatch" 
                            title="${c.label}"
                            data-image="${c.image}"
                            data-handle="${product.handle}"
                            style="width:16px;height:16px;border-radius:50%;background:${c.hex};border:2px solid ${i === 0 ? '#1a1a1a' : '#ddd'};cursor:pointer;display:inline-block;"
                            onclick="swapCardImage(this, '${c.image}', '${product.handle}')"
                        ></span>
                    `).join('')}
                </div>` : ''}
                <div class="product__card--price clean-price" style="margin-top: 5px;">
                    <span class="current__price">${window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(product.price) : price.toFixed(2)}</span>
                    ${comparePrice && product.compare_at_price ? `<span class="old__price" style="text-decoration:line-through;color:#999;margin-left:8px;">${window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(product.compare_at_price) : comparePrice.toFixed(2)}</span>` : ''}
                </div>
            </div>
        </article>`;
    }).join('');
}

// Swap image on product card when swatch is clicked
window.swapCardImage = function (swatchEl, imageSrc, handle) {
    const label = swatchEl.getAttribute('title');
    window.location.href = `/product/${handle}&color=${encodeURIComponent(label || '')}`;
};

// Quick add to cart from shop grid
window.quickAddToCart = function (handle, title, price, image) {
    if (typeof addToCart === 'function') {
        addToCart({
            id: handle,
            title: title,
            price: price,
            image: image,
            qty: 1,
            size: 'M'
        });
    }
};

// =============================================
// SHOP PAGE — Load collection tabs & sidebar categories
// =============================================
async function loadCollectionsData() {
    let collections = [];
    try {
        const res = await fetch('/api/collections');
        if (res.ok) {
            const data = await res.json();
            collections = data.collections || [];
        }
    } catch (e) {
        console.error('Failed to load collections via API:', e);
    }

    if (collections.length === 0) return;

    // 1. Populate top horizontal tabs
    const tabsContainer = document.getElementById('collection-tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = collections.map((c, i) => `
            <button 
                class="collection-tab ${filterState.collection === c.handle ? 'active' : ''}" 
                data-collection="${c.handle}"
                onclick="filterByCollection(this, '${c.handle}')"
                style="border:1px solid #ddd;background:${filterState.collection === c.handle ? '#1a1a1a' : '#fff'};color:${filterState.collection === c.handle ? '#fff' : '#333'};cursor:pointer;border-radius:2px;font-size:1.3rem;margin-right:8px;margin-bottom:8px;transition:all 0.2s;"
            >${c.title}</button>
        `).join('');
    }

    // 2. Populate sidebar categories menu
    const sidebarContainer = document.getElementById('sidebar-categories');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = collections.map(c => `
            <li class="widget__categories--menu__list" style="margin-bottom:1rem;">
                <a href="javascript:void(0)" 
                   onclick="filterByCollectionSidebar(this, '${c.handle}')"
                   style="font-size:1.4rem; color:${filterState.collection === c.handle ? '#1a1a1a' : '#555'}; font-weight:${filterState.collection === c.handle ? '600' : '400'}; text-decoration:none;"
                >
                   ${c.title}
                </a>
            </li>
        `).join('');
    }
}

window.filterByCollection = function (btn, collection) {
    filterState.collection = collection;

    // Sync top tabs UI
    document.querySelectorAll('.collection-tab').forEach(t => {
        t.style.background = '#fff';
        t.style.color = '#333';
    });
    if (btn) {
        btn.style.background = '#1a1a1a';
        btn.style.color = '#fff';
    }

    // Sync sidebar active links
    document.querySelectorAll('#sidebar-categories a').forEach(a => {
        a.style.color = '#555';
        a.style.fontWeight = '400';
    });
    const sidebarLink = Array.from(document.querySelectorAll('#sidebar-categories a')).find(a => a.textContent.trim() === (btn ? btn.textContent.trim() : ''));
    if (sidebarLink) {
        sidebarLink.style.color = '#1a1a1a';
        sidebarLink.style.fontWeight = '600';
    }

    const params = new URLSearchParams(window.location.search);
    if (collection && collection !== 'all') {
        params.set('collection', collection);
    } else {
        params.delete('collection');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    window.dispatchEvent(new Event('filter:changed'));
};

window.filterByCollectionSidebar = function (linkEl, collection) {
    filterState.collection = collection;

    // Sync sidebar active links
    document.querySelectorAll('#sidebar-categories a').forEach(a => {
        a.style.color = '#555';
        a.style.fontWeight = '400';
    });
    if (linkEl) {
        linkEl.style.color = '#1a1a1a';
        linkEl.style.fontWeight = '600';
    }

    // Sync top tabs UI
    document.querySelectorAll('.collection-tab').forEach(t => {
        t.style.background = '#fff';
        t.style.color = '#333';
    });
    const topTab = Array.from(document.querySelectorAll('.collection-tab')).find(t => t.textContent.trim() === (linkEl ? linkEl.textContent.trim() : ''));
    if (topTab) {
        topTab.style.background = '#1a1a1a';
        topTab.style.color = '#fff';
    }

    const params = new URLSearchParams(window.location.search);
    if (collection && collection !== 'all') {
        params.set('collection', collection);
    } else {
        params.delete('collection');
    }
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
    window.dispatchEvent(new Event('filter:changed'));
};

// =============================================
// SHOP PAGE — Setup Event Listeners for Filters
// =============================================
function setupShopFilters() {
    // 1. Size Filters
    document.querySelectorAll('.size-filter').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedSizes = [];
            document.querySelectorAll('.size-filter:checked').forEach(cb => {
                checkedSizes.push(cb.value);
            });
            filterState.sizes = checkedSizes;
            loadShopProducts();
        });
    });

    // 2. Price Filter Form
    const priceForm = document.querySelector('.price__filter--form');
    if (priceForm) {
        priceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const minInput = document.getElementById('Filter-Price-GTE2');
            const maxInput = document.getElementById('Filter-Price-LTE2');

            filterState.minPrice = minInput && minInput.value ? parseFloat(minInput.value) : 0;
            filterState.maxPrice = maxInput && maxInput.value ? parseFloat(maxInput.value) : 250;

            loadShopProducts();
        });
    }

    // 3. Sorting Dropdown
    const sortSelect = document.querySelector('.product__view--select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            let sortBy = 'newest';
            if (val === '1' || val === '2') {
                sortBy = 'newest';
            } else if (val === '3') {
                sortBy = 'popularity';
            } else if (val === '4') {
                sortBy = 'price_asc';
            } else if (val === '5') {
                sortBy = 'price_desc';
            }

            const params = new URLSearchParams(window.location.search);
            params.set('sort', sortBy);
            const newUrl = `${window.location.pathname}?${params.toString()}`;
            window.history.pushState({}, '', newUrl);
            window.dispatchEvent(new Event('filter:changed'));
        });

        // Add sorting options if they aren't fully in EJS/HTML
        if (sortSelect.options.length < 5) {
            const optPriceDesc = document.createElement('option');
            optPriceDesc.value = '5';
            optPriceDesc.textContent = 'Price: High to Low';
            sortSelect.appendChild(optPriceDesc);
            sortSelect.options[3].textContent = 'Price: Low to High';
        }
    }
}

// =============================================
// PRODUCT PAGE — Load single product details
// =============================================
async function loadProductDetails() {
    window.loadProductDetails = loadProductDetails;
    if (!document.getElementById('dyn-product-title')) return;

    const params = new URLSearchParams(window.location.search);
    let handle = params.get('handle');

    // Extract handle from pathname if clean URL like /product/:handle or /products/:handle is used
    if (!handle) {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        const lastSeg = pathSegments[pathSegments.length - 1];
        if (lastSeg && lastSeg !== 'product.html' && lastSeg !== 'product') {
            handle = lastSeg;
        }
    }

    let product = null;

    if (handle) {
        try {
            const res = await fetch(`/api/products/${encodeURIComponent(handle)}`);
            if (res.ok) {
                product = await res.json();
            }
        } catch (e) {
            console.error('Failed to fetch product details via API:', e);
        }
    }

    // Fallback: If no handle provided or product not found by handle, load first active product
    if (!product) {
        try {
            const res = await fetch('/api/products?limit=1');
            if (res.ok) {
                const data = await res.json();
                if (data.products && data.products.length > 0) {
                    product = data.products[0];
                    // Fetch full product details including variants
                    const detailRes = await fetch(`/api/products/${encodeURIComponent(product.handle)}`);
                    if (detailRes.ok) {
                        product = await detailRes.json();
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load fallback product details:', e);
        }
    }

    if (!product) {
        document.getElementById('dyn-product-title').innerText = 'Product Not Found';
        const section = document.querySelector('.product__details--section');
        if (section) section.classList.remove('is-loading');
        return;
    }

    // Store product globally for add-to-cart
    window._currentProduct = product;
    window.dispatchEvent(new CustomEvent('productLoaded', { detail: product }));

    // Basic info
    document.title = `${product.title} — Mary Humphrey African Wear`;
    document.getElementById('dyn-product-title').innerText = product.title;
    const bcTitle = document.getElementById('dyn-product-title-bc');
    if (bcTitle) bcTitle.innerText = product.title;
    const bcActive = document.getElementById('dyn-product-title-bc-active');
    if (bcActive) bcActive.innerText = product.title;
    const renderPrice = () => {
        const priceText = window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(product.price) : `£${parseFloat(product.price).toFixed(2)}`;
        let html = `<span class="current-price-val">${priceText}</span>`;
        if (product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price)) {
            const compareText = window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(product.compare_at_price) : `£${parseFloat(product.compare_at_price).toFixed(2)}`;
            html += `<span class="compare-price-val">${compareText}</span>`;
        }
        document.getElementById('dyn-product-price').innerHTML = html;

        // Also update sticky price
        const stickyPrice = document.getElementById('sticky-product-price');
        if (stickyPrice) stickyPrice.innerText = priceText;
    };
    renderPrice();
    window.addEventListener('currency:changed', renderPrice);
    window.addEventListener('settings:loaded', renderPrice);

    // Collection label above title (no Made to Measure badge)
    const badgeEl = document.getElementById('dyn-product-badge');
    if (badgeEl) {
        if (product.product_type || product.vendor) {
            badgeEl.textContent = product.product_type || product.vendor;
            badgeEl.style.display = 'block';
        } else {
            badgeEl.style.display = 'none';
        }
    }

    // Main image
    const mainImg = document.getElementById('dyn-product-image');
    if (mainImg && product.images && product.images.length > 0) {
        mainImg.src = product.images[0];
        mainImg.alt = product.title;
    }

    // Gallery thumbnails
    const gallery = document.getElementById('dyn-product-gallery');
    if (gallery && product.images) {
        gallery.innerHTML = product.images.map((img, i) => `
            <img 
                src="${img}" 
                alt="${product.title} image ${i + 1}"
                class="${i === 0 ? 'active' : ''}"
                onclick="swapMainImage(this,'${img}')"
            >
        `).join('');
    }

    // Color swatches
    const colourContainer = document.getElementById('colour-options');
    if (colourContainer && product.colors && product.colors.length > 0) {
        const urlColor = params.get('color');
        let initialColorIndex = 0;
        if (urlColor) {
            const foundIndex = product.colors.findIndex(c => c.label.toLowerCase() === urlColor.toLowerCase());
            if (foundIndex !== -1) initialColorIndex = foundIndex;
        }

        colourContainer.innerHTML = product.colors.map((c, i) => `
            <button 
                class="swatch-btn ${i === initialColorIndex ? 'active' : ''}"
                aria-label="${c.label}"
                aria-pressed="${i === initialColorIndex ? 'true' : 'false'}"
                onclick="selectColor(this,'${c.image}','${c.label}')"
                title="${c.label}"
            >
                <img src="${c.image || product.images[0]}" alt="${c.label}" class="swatch-img">
            </button>
        `).join('');
        window._selectedColor = product.colors[initialColorIndex].label;

        // Update label text
        const activeLabel = document.getElementById('active-colour-label');
        if (activeLabel) activeLabel.innerText = product.colors[initialColorIndex].label;

        const stickyColor = document.getElementById('sticky-selection-color');
        if (stickyColor) stickyColor.innerText = `Colour: ${product.colors[initialColorIndex].label}`;

        // Ensure main image matches the selected color initially
        if (product.colors[initialColorIndex].image) {
            const mainImg = document.getElementById('dyn-product-image');
            if (mainImg) mainImg.src = product.colors[initialColorIndex].image;
        }
    }

    // Size buttons
    const sizeContainer = document.getElementById('size-options');
    if (sizeContainer && product.sizes && product.sizes.length > 0) {
        sizeContainer.innerHTML = product.sizes.map((size, i) => `
            <button 
                class="size-btn ${i === 0 ? 'active' : ''}" 
                data-size="${size}"
                onclick="selectSize(this,'${size}')"
            >${size}</button>
        `).join('');
        window._selectedSize = product.sizes[0];

        // Update label text
        const activeSizeLabel = document.getElementById('active-size-label');
        if (activeSizeLabel) activeSizeLabel.innerText = product.sizes[0];

        const stickySize = document.getElementById('sticky-selection-size');
        if (stickySize) stickySize.innerText = `Size: ${product.sizes[0]}`;
    }

    // Order method CTA (replaces old custom measurements CTA)
    const customCtaId = 'order-method-cta';
    document.getElementById(customCtaId)?.remove();

    // Helper: get WhatsApp number from settings, fallback to config
    function getWhatsAppNumber() {
        const settings = window.__ankaraSettings || {};
        return (settings.whatsapp || window.STORE_CONFIG?.WHATSAPP_NUMBER || window.WHATSAPP_NUMBER || '254700000000').replace(/\D/g, '');
    }

    // Helper: check if WhatsApp is enabled in settings
    function isWhatsAppEnabled() {
        const settings = window.__ankaraSettings || {};
        return settings.whatsapp_enabled !== false;
    }

    // Store settings globally when settings:loaded fires
    window.addEventListener('settings:loaded', (e) => {
        if (e.detail) window.__ankaraSettings = e.detail;
    });

    const orderMethod = product.order_method || 'standard';

    if (orderMethod !== 'standard' && isWhatsAppEnabled()) {
        const phone = getWhatsAppNumber();
        const productName = product.title || 'this item';
        const selectedSize = window._selectedSize || '';
        const selectedColor = window._selectedColor || '';

        if (orderMethod === 'standard_plus_custom') {
            // Small text link below size selector
            let msg = `Hello Mary Humphrey African Wear! 👋\n\nI'm interested in the ${productName} and would like it made to my measurements. Could you please guide me through the measurement process, pricing, and estimated production time?\n\nThank you!`;
            if (selectedSize) msg += `\n\nSelected Size: ${selectedSize}`;
            if (selectedColor) msg += `\nSelected Color: ${selectedColor}`;
            const encodedMsg = encodeURIComponent(msg);
            const cta = document.createElement('div');
            cta.id = customCtaId;
            cta.innerHTML = `
                <p style="margin:1.2rem 0 0.6rem;font-size:1.3rem;color:var(--foreground-sub-color);">Need a custom fit? This design can be tailored to your exact measurements.</p>
                <a href="https://wa.me/${phone}?text=${encodedMsg}" target="_blank" style="display:inline-flex;align-items:center;gap:0.6rem;text-decoration:none;color:#25d366;font-size:1.3rem;font-weight:600;">💬 Contact us on WhatsApp</a>
            `;
            if (sizeContainer) sizeContainer.after(cta);
            else if (colourContainer) colourContainer.after(cta);
        } else if (orderMethod === 'whatsapp_only') {
            // Show made-to-measure checkbox instead of WhatsApp button
            // Buttons remain visible, checkbox marks order as custom fit
            const cta = document.createElement('div');
            cta.id = customCtaId;
            cta.className = 'made-to-measure-option';
            cta.innerHTML = `
                <label class="made-to-measure-label">
                    <input type="checkbox" id="made-to-measure-checkbox" class="made-to-measure-checkbox" />
                    <span class="made-to-measure-text">
                        <strong>Made-to-measure</strong>
                        <small>Check this box if you'd like this item tailored to your exact measurements</small>
                    </span>
                </label>
            `;
            // Insert before buttons container
            const buttonsContainer = document.querySelector('.buttons-container');
            if (buttonsContainer) buttonsContainer.before(cta);
            else if (sizeContainer) sizeContainer.after(cta);

            // Store checkbox state globally for cart
            const checkbox = cta.querySelector('#made-to-measure-checkbox');
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    window._madeToMeasure = checkbox.checked;
                });
            }
        }
    }

    // Set sticky buy bar elements
    const stickyTitle = document.getElementById('sticky-product-title');
    if (stickyTitle) stickyTitle.innerText = product.title;

    const stickyImg = document.getElementById('sticky-product-img');
    if (stickyImg && product.images && product.images.length > 0) {
        stickyImg.src = product.images[0];
        stickyImg.alt = product.title;
    }

    // Populate Tab Panels (Description, Details, Shipping)
    const tabDescription = document.getElementById('tab-description');
    if (tabDescription) {
        tabDescription.innerHTML = `
            <div">
                ${product.description ? `<p>${product.description.replace(/\n/g, '</p><p>')}</p>` : '<p>No description available.</p>'}
            </div>
        `;
    }

    const tabDetails = document.getElementById('tab-details');
    if (tabDetails) {
        const details = [];
        // User-defined details / features (one per line)
        if (product.details && product.details.trim()) {
            product.details.trim().split(/\n/).map(line => line.trim()).filter(Boolean).forEach(line => {
                details.push(`<li style="margin-bottom:6px;">${line}</li>`);
            });
        } else {
            // Fallback defaults if no custom details
            if (product.product_type) details.push(`<li><strong>Category:</strong> ${product.product_type}</li>`);
            if (product.vendor) details.push(`<li><strong>Brand:</strong> ${product.vendor}</li>`);
            if (product.sizes && product.sizes.length) details.push(`<li><strong>Available Sizes:</strong> ${product.sizes.join(', ')}</li>`);
            if (product.colors && product.colors.length) details.push(`<li><strong>Colours:</strong> ${product.colors.map(c => c.label).join(', ')}</li>`);
            if (product.tags && product.tags.length) details.push(`<li><strong>Tags:</strong> ${product.tags.join(', ')}</li>`);
            details.push('<li><strong>Material:</strong> 100% Cotton Ankara Wax Print</li>');
            details.push('<li><strong>Care:</strong> Hand wash cold, hang dry</li>');
        }
        tabDetails.innerHTML = `
            <ul">
                ${details.join('')}
            </ul>
        `;
    }

    // Load related products from same collection
    loadRelatedProducts(product);

    // Setup Social Share Links
    const currentUrl = encodeURIComponent(window.location.href);
    const productTitle = encodeURIComponent(product.title);
    const shareLinks = document.querySelectorAll('.product-share-box a');
    if (shareLinks.length >= 3) {
        shareLinks[0].href = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`;
        shareLinks[0].target = '_blank';
        shareLinks[1].href = `https://pinterest.com/pin/create/button/?url=${currentUrl}&media=${encodeURIComponent((product.images && product.images[0]) || '')}&description=${productTitle}`;
        shareLinks[1].target = '_blank';
        shareLinks[2].href = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${productTitle}`;
        shareLinks[2].target = '_blank';
    }

    // Scroll listener for sticky buy bar
    window.addEventListener('scroll', () => {
        const buyBtn = document.querySelector('.product__card--btn');
        const stickyBar = document.getElementById('sticky-buy-bar');
        if (!buyBtn || !stickyBar) return;

        const buyBtnRect = buyBtn.getBoundingClientRect();
        if (buyBtnRect.bottom < 0) {
            stickyBar.classList.add('visible');
        } else {
            stickyBar.classList.remove('visible');
        }
    });

    // Remove skeleton loading state to reveal real product content
    const section = document.querySelector('.product__details--section');
    if (section) section.classList.remove('is-loading');
}

// Load related products from the same collection
async function loadRelatedProducts(product) {
    const grid = document.getElementById('related-products-grid');
    if (!grid) return;

    let items = [];
    try {
        // Fetch up to 5 products in the same collection
        if (product.collection) {
            const res = await fetch(`/api/products?collection=${encodeURIComponent(product.collection)}&limit=5`);
            if (res.ok) {
                const data = await res.json();
                items = (data.products || []).filter(p => p.id !== product.id).slice(0, 4);
            }
        }

        // If not enough items, fallback to fetching general products
        if (items.length < 4) {
            const res = await fetch(`/api/products?limit=5`);
            if (res.ok) {
                const data = await res.json();
                const fallbackItems = (data.products || []).filter(p => p.id !== product.id && !items.some(item => item.id === p.id));
                items = items.concat(fallbackItems).slice(0, 4);
            }
        }
    } catch (e) {
        console.error('Failed to load related products via API:', e);
    }

    if (items.length === 0) {
        grid.innerHTML = '<p style="text-align:center;color:#999;">No related products found.</p>';
        return;
    }

    grid.innerHTML = items.map(p => {
        const img = (p.images && p.images[0]) || 'assets/DSC02676.jpg';
        const priceStr = window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(p.price) : `KSh ${parseFloat(p.price).toLocaleString()}`;
        return `
        <article class="product__card clean-card">
            <div class="product__card--thumbnail clean-card-thumbnail">
                <a class="product__card--thumbnail__link display-block" href="/product/${p.handle}">
                    <img class="product__card--thumbnail__img product__primary--img" src="${img}" alt="${p.title}">
                </a>
            </div>
            <div class="product__card--content clean-card-content">
                <h3 class="product__card--title clean-title">
                    <a href="/product/${p.handle}">${p.title}</a>
                </h3>
                <div class="product__card--price clean-price">
                    <span class="current__price">${priceStr}</span>
                </div>
            </div>
        </article>`;
    }).join('');
}

// Select a color swatch on product page
window.selectColor = function (btn, image, label) {
    window._selectedColor = label;
    swapMainImage(null, image);
    document.querySelectorAll('#colour-options .swatch-btn').forEach(s => {
        s.classList.remove('active');
        s.setAttribute('aria-pressed', 'false');
    });
    if (btn) {
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
    }

    // Update labels
    const activeLabel = document.getElementById('active-colour-label');
    if (activeLabel) activeLabel.innerText = label;

    const stickyColor = document.getElementById('sticky-selection-color');
    if (stickyColor) stickyColor.innerText = `Colour: ${label}`;
};

// Select a size on product page
window.selectSize = function (btn, size) {
    window._selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(b => {
        b.classList.remove('active');
    });
    if (btn) {
        btn.classList.add('active');
    }

    // Update labels
    const activeSizeLabel = document.getElementById('active-size-label');
    if (activeSizeLabel) activeSizeLabel.innerText = size;

    const stickySize = document.getElementById('sticky-selection-size');
    if (stickySize) stickySize.innerText = `Size: ${size}`;
    window.dispatchEvent(new CustomEvent('sizeSelected', { detail: size }));
};

// Swap main product image
window.swapMainImage = function (thumbEl, src) {
    const mainImg = document.getElementById('dyn-product-image');
    if (mainImg) mainImg.src = src;
    const thumbs = Array.from(document.querySelectorAll('#dyn-product-gallery img'));
    thumbs.forEach((t, idx) => {
        t.classList.remove('active');
        if (thumbEl && t === thumbEl) {
            window._activeImageIndex = idx;
        } else if (!thumbEl && (t.src === src || t.getAttribute('src') === src)) {
            window._activeImageIndex = idx;
        }
    });
    if (thumbEl) {
        thumbEl.classList.add('active');
    } else {
        thumbs.forEach(t => {
            if (t.src && (t.src === src || t.getAttribute('src') === src)) {
                t.classList.add('active');
            }
        });
    }

    const stickyImg = document.getElementById('sticky-product-img');
    if (stickyImg) stickyImg.src = src;
};

// Shopify-style GLightbox Product Zoom Viewer (Exclusive to product detail page)
window.openProductZoom = function(e, indexOverride) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const product = window._currentProduct;
    let images = (product && product.images && product.images.length > 0) ? product.images : [];
    if (images.length === 0) {
        const mainImg = document.getElementById('dyn-product-image');
        if (mainImg && mainImg.src) images = [mainImg.src];
    }
    if (images.length === 0) return;

    let startIdx = 0;
    if (typeof indexOverride === 'number') {
        startIdx = indexOverride;
    } else if (typeof window._activeImageIndex === 'number') {
        startIdx = window._activeImageIndex;
    } else {
        const mainImg = document.getElementById('dyn-product-image');
        if (mainImg && mainImg.src) {
            const found = images.findIndex(img => img === mainImg.src || mainImg.src.includes(img));
            if (found !== -1) startIdx = found;
        }
    }
    if (startIdx < 0 || startIdx >= images.length) startIdx = 0;

    const elements = images.map((img, i) => ({
        href: img,
        type: 'image',
        title: `${product ? product.title : 'Product Image'} (${i + 1}/${images.length})`,
        description: product ? (product.vendor || 'MARY HUMPHREY AFRICAN WEAR') : ''
    }));

    if (typeof GLightbox === 'function') {
        if (window._productLightboxInstance && typeof window._productLightboxInstance.destroy === 'function') {
            try { window._productLightboxInstance.destroy(); } catch(err){}
        }
        window._productLightboxInstance = GLightbox({
            elements: elements,
            startAt: startIdx,
            touchNavigation: true,
            loop: true,
            zoomable: true,
            draggable: true,
            openEffect: 'zoom',
            closeEffect: 'zoom',
            slideEffect: 'slide'
        });
        window._productLightboxInstance.open();
    }
};

// =============================================
// QUANTITY STEPPER (product page)
// =============================================
window.changeQty = function (delta) {
    const input = document.getElementById('product-quantity-display');
    if (!input) return;
    let qty = parseInt(input.value) || 1;
    qty = Math.max(1, qty + delta);
    input.value = qty;
};

// =============================================
// ADD TO CART (overrides product.html's handler)
// =============================================
window.addProductToCart = function (e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const product = window._currentProduct;
    if (!product) return;

    const qtyInput = document.getElementById('product-quantity-display');
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    const size = window._selectedSize || (product.sizes && product.sizes[0]) || 'M';
    const color = window._selectedColor || '';
    const madeToMeasure = window._madeToMeasure || false;

    if (typeof addToCart === 'function') {
        const btn = document.querySelector('[onclick*="addProductToCart"]');
        if (typeof simulateAdding === 'function') {
            simulateAdding(btn, () => {
                addToCart({
                    id: product.handle,
                    title: product.title,
                    price: product.price,
                    image: (product.images && product.images[0]) || '',
                    qty,
                    size,
                    color,
                    madeToMeasure
                });
            });
        } else {
            addToCart({ id: product.handle, title: product.title, price: product.price, image: (product.images && product.images[0]) || '', qty, size, color, madeToMeasure });
        }
    }
};

window.buyProductNow = function (e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const product = window._currentProduct;
    if (!product) return;

    const qtyInput = document.getElementById('product-quantity-display');
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    const size = window._selectedSize || (product.sizes && product.sizes[0]) || 'M';
    const color = window._selectedColor || '';
    const madeToMeasure = window._madeToMeasure || false;

    if (typeof addToCart === 'function') {
        addToCart({
            id: product.handle,
            title: product.title,
            price: product.price,
            image: (product.images && product.images[0]) || '',
            qty,
            size,
            color,
            madeToMeasure
        });
        window.location.href = '/checkout';
    }
};

function initStorefront() {
    // Shop page init
    if (document.querySelector('.shop-product-grid') || document.querySelector('[data-section="product-grid"]')) {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) {
            filterState.search = q.trim();
            const breadcrumbTitle = document.querySelector('.breadcrumb__title');
            if (breadcrumbTitle) {
                breadcrumbTitle.textContent = `Search Results: "${q}"`;
            }
        }
        loadCollectionsData();
        setupShopFilters();
        loadShopProducts();
    }

    // Product page init
    if (document.getElementById('dyn-product-title')) {
        loadProductDetails();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStorefront);
} else {
    initStorefront();
}

// Live currency switching for grids
window.addEventListener('currency:changed', () => {
    if (document.querySelector('.shop-product-grid') || document.querySelector('[data-section="product-grid"]')) {
        loadShopProducts();
    }
});
