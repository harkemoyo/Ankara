// assets/storefront-api.js
// Fetches data from Supabase and renders storefront UI
// =============================================

import { supabase } from './supabase-client.js';

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
    const grid = document.querySelector('.product-grid') || document.querySelector('.shop-product-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:2rem;text-align:center;">Loading products...</p>';

    // Build query
    let query = supabase.from('products').select('*').eq('in_stock', true);

    // Apply sale filter if on sale page
    if (window.location.pathname.includes('/sale')) {
        query = query.not('compare_at_price', 'is', null);
    }

    // Apply search filter
    if (filterState.search) {
        query = query.or(`title.ilike.%${filterState.search}%,description.ilike.%${filterState.search}%`);
    }

    // Apply collection filter
    if (filterState.collection && filterState.collection !== 'all') {
        query = query.eq('collection', filterState.collection);
    }
    // Apply product_type filter if set
    if (filterState.productType) {
        query = query.eq('product_type', filterState.productType);
    }

    // Apply size filter
    if (filterState.sizes && filterState.sizes.length > 0) {
        query = query.overlap('sizes', filterState.sizes);
    }

    // Apply price filter
    if (filterState.minPrice > 0) {
        query = query.gte('price', filterState.minPrice);
    }
    if (filterState.maxPrice < 250) {
        query = query.lte('price', filterState.maxPrice);
    }

    // Apply sorting
    if (filterState.sortBy === 'latest') {
        query = query.order('created_at', { ascending: false });
    } else if (filterState.sortBy === 'price-asc') {
        query = query.order('price', { ascending: true });
    } else if (filterState.sortBy === 'price-desc') {
        query = query.order('price', { ascending: false });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    let { data: dbProducts } = await query;
    
    let products = dbProducts || [];

    // Filter by collection if set
    if (filterState.collection && filterState.collection !== 'all') {
        products = products.filter(p => p.collection === filterState.collection);
    }

    if (products.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center" style="grid-column:1/-1;padding:3rem;"><p>No products found matching your filters.</p></div>';
        return;
    }

    grid.innerHTML = products.map((product) => {
        const primaryImage = (product.images && Array.isArray(product.images) && product.images[0]) ? product.images[0] : 'assets/DSC02676.jpg';
        const hoverImage = (product.images && Array.isArray(product.images) && product.images[1]) ? product.images[1] : primaryImage;
        const price = parseFloat(product.price);
        const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
        let badgeHtml = '';
        if (comparePrice && comparePrice > price) {
            const pct = Math.floor(((comparePrice - price) / comparePrice) * 100);
            if (pct >= 5) {
                badgeHtml = `<span class="product__badge" style="top:10px; right:10px; left:auto; background:#000; color:#fff; width:auto; padding:0 8px; line-height:22px; height:22px; font-weight:600;">${pct}% Off</span>`;
            } else if (product.tags && product.tags.includes('sale')) {
                badgeHtml = `<span class="product__badge" style="top:10px; right:10px; left:auto; background:#d32f2f; color:#fff; width:auto; padding:0 8px; line-height:22px; height:22px; font-weight:600;">Sale</span>`;
            }
        } else if (product.tags && product.tags.includes('sale')) {
            badgeHtml = `<span class="product__badge" style="top:10px; right:10px; left:auto; background:#d32f2f; color:#fff; width:auto; padding:0 8px; line-height:22px; height:22px; font-weight:600;">Sale</span>`;
        }
        const colors = product.colors || [];

        return `
        <article class="product__card clean-card" data-handle="${product.handle}">
            <div class="product__card--thumbnail clean-card-thumbnail">
                <a class="product__card--thumbnail__link display-block" href="product.html?handle=${product.handle}">
                    <img class="product__card--thumbnail__img product__primary--img" src="${primaryImage}" alt="${product.title}">
                    <img class="product__card--thumbnail__img product__secondary--img" src="${hoverImage}" alt="${product.title}">
                </a>
                ${badgeHtml}
                <a href="javascript:void(0)" class="clean-card-add" aria-label="Add to cart" onclick="quickAddToCart('${product.handle}', '${product.title.replace(/'/g, "\\'")}', ${product.price}, '${primaryImage}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </a>
            </div>
            <div class="product__card--content clean-card-content">
                <h3 class="product__card--title clean-title" style="margin-top: 10px;">
                    <a href="product.html?handle=${product.handle}">${product.title}</a>
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
window.swapCardImage = function(swatchEl, imageSrc, handle) {
    const label = swatchEl.getAttribute('title');
    window.location.href = `product.html?handle=${handle}&color=${encodeURIComponent(label || '')}`;
};

// Quick add to cart from shop grid
window.quickAddToCart = function(handle, title, price, image) {
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
    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order');

    if (!collections) return;

    // 1. Populate top horizontal tabs
    const tabsContainer = document.getElementById('collection-tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = collections.map((c, i) => `
            <button 
                class="collection-tab ${filterState.collection === c.handle ? 'active' : ''}" 
                data-collection="${c.handle}"
                onclick="filterByCollection(this, '${c.handle}')"
                style="padding:8px 18px;border:1px solid #ddd;background:${filterState.collection === c.handle ? '#1a1a1a' : '#fff'};color:${filterState.collection === c.handle ? '#fff' : '#333'};cursor:pointer;border-radius:2px;font-size:1.3rem;margin-right:8px;margin-bottom:8px;transition:all 0.2s;"
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

window.filterByCollection = function(btn, collection) {
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

window.filterByCollectionSidebar = function(linkEl, collection) {
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
    const params = new URLSearchParams(window.location.search);
    const handle = params.get('handle');
    if (!handle || !document.getElementById('dyn-product-title')) return;

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('handle', handle)
        .single();

    if (error || !product) {
        document.getElementById('dyn-product-title').innerText = 'Product Not Found';
        return;
    }

    // Fetch product variants from DB
    const { data: vars } = await supabase.from('product_variants').select('*').eq('product_id', product.id);
    product.variants = vars || [];

    // Store product globally for add-to-cart
    window._currentProduct = product;

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

    const descEl = document.getElementById('dyn-product-desc');
    if (descEl) descEl.innerText = product.description || '';

    // Badge
    const badgeEl = document.getElementById('dyn-product-badge');
    if (badgeEl) {
        badgeEl.style.display = 'none';
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
                alt="${product.title} image ${i+1}"
                class="${i===0?'active':''}"
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
                class="swatch-btn ${i===initialColorIndex?'active':''}"
                aria-label="${c.label}"
                aria-pressed="${i===initialColorIndex?'true':'false'}"
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
                class="size-btn ${i===0?'active':''}" 
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
    
    // Set sticky buy bar elements
    const stickyTitle = document.getElementById('sticky-product-title');
    if (stickyTitle) stickyTitle.innerText = product.title;
    
    const stickyImg = document.getElementById('sticky-product-img');
    if (stickyImg && product.images && product.images.length > 0) {
        stickyImg.src = product.images[0];
        stickyImg.alt = product.title;
    }

    // Populate Tab Panels (Craftsmanship, Features, Weight, Dimensions)
    const tabCraftsmanship = document.getElementById('tab-craftsmanship');
    if (tabCraftsmanship) {
        tabCraftsmanship.innerHTML = `
            <p style="font-size:1.4rem; line-height:1.8; color:var(--foreground-color,#333);">
                Handcrafted with pride using 100% authentic African Ankara wax print fabric. 
                Every piece reflects rich cultural artistry, tailored precision, and reinforced stitching for exceptional durability and timeless elegance.
            </p>
        `;
    }

    const tabFeatures = document.getElementById('tab-features');
    if (tabFeatures) {
        tabFeatures.innerHTML = `
            <ul style="font-size:1.4rem; line-height:2; color:var(--foreground-color,#333); padding-left:2rem; margin:0;">
                <li>Premium 100% Cotton Ankara Wax Print</li>
                <li>Vibrant, fade-resistant color dyes</li>
                <li>Tailored comfort fit designed for everyday versatility</li>
                <li>Ethically handcrafted by expert African artisans</li>
            </ul>
        `;
    }

    const tabWeight = document.getElementById('tab-weight');
    if (tabWeight) {
        tabWeight.innerHTML = `
            <p style="font-size:1.4rem; line-height:1.8; color:var(--foreground-color,#333);">
                <strong>Garment Weight:</strong> Approx. 450g – 650g (Lightweight, breathable & structured for all-day comfort).
            </p>
        `;
    }

    const tabDimensions = document.getElementById('tab-dimensions');
    if (tabDimensions) {
        tabDimensions.innerHTML = `
            <p style="font-size:1.4rem; line-height:1.8; color:var(--foreground-color,#333);">
                <strong>Sizing & Fit:</strong> Standard international sizing (${(product.sizes || ['S','M','L','XL']).join(', ')}). 
                Relaxed yet tailored silhouette. Refer to our size guide for precise body measurements.
            </p>
        `;
    }

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
}

// Select a color swatch on product page
window.selectColor = function(btn, image, label) {
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
window.selectSize = function(btn, size) {
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
};

// Swap main product image
window.swapMainImage = function(thumbEl, src) {
    const mainImg = document.getElementById('dyn-product-image');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('#dyn-product-gallery img').forEach(t => t.classList.remove('active'));
    if (thumbEl) {
        thumbEl.classList.add('active');
    } else {
        // Try to find matching thumbnail by src
        const thumbs = document.querySelectorAll('#dyn-product-gallery img');
        thumbs.forEach(t => {
            if (t.src && (t.src === src || t.getAttribute('src') === src)) {
                t.classList.add('active');
            }
        });
    }
    
    const stickyImg = document.getElementById('sticky-product-img');
    if (stickyImg) stickyImg.src = src;
};

// =============================================
// QUANTITY STEPPER (product page)
// =============================================
window.changeQty = function(delta) {
    const input = document.getElementById('product-quantity-display');
    if (!input) return;
    let qty = parseInt(input.value) || 1;
    qty = Math.max(1, qty + delta);
    input.value = qty;
};

// =============================================
// ADD TO CART (overrides product.html's handler)
// =============================================
window.addProductToCart = function(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const product = window._currentProduct;
    if (!product) return;

    const qtyInput = document.getElementById('product-quantity-display');
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    const size = window._selectedSize || (product.sizes && product.sizes[0]) || 'M';
    const color = window._selectedColor || '';

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
                    color
                });
            });
        } else {
            addToCart({ id: product.handle, title: product.title, price: product.price, image: (product.images && product.images[0]) || '', qty, size, color });
        }
    }
};

window.buyProductNow = function(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const product = window._currentProduct;
    if (!product) return;

    const qtyInput = document.getElementById('product-quantity-display');
    const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
    const size = window._selectedSize || (product.sizes && product.sizes[0]) || 'M';
    const color = window._selectedColor || '';

    if (typeof addToCart === 'function') {
        addToCart({
            id: product.handle,
            title: product.title,
            price: product.price,
            image: (product.images && product.images[0]) || '',
            qty,
            size,
            color
        });
        window.location.href = 'checkout.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
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
});

// Live currency switching for grids
window.addEventListener('currency:changed', () => {
    if (document.querySelector('.shop-product-grid') || document.querySelector('[data-section="product-grid"]') || document.querySelector('.product-grid')) {
        loadShopProducts();
    }
});
