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
    const grid = document.querySelector('.shop-product-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:2rem;text-align:center;">Loading products...</p>';

    // Build query
    let query = supabase.from('products').select('*').eq('in_stock', true);

    // Apply search filter
    if (filterState.search) {
        query = query.or(`title.ilike.%${filterState.search}%,description.ilike.%${filterState.search}%`);
    }

    // Apply collection filter
    if (filterState.collection && filterState.collection !== 'all') {
        query = query.eq('collection', filterState.collection);
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

    const { data: products, error } = await query;

    // Update Product Count label if present
    const countEl = document.querySelector('.product__count span');
    if (countEl && products) {
        countEl.textContent = `${products.length} products`;
    }

    if (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<p style="padding:2rem;text-align:center;color:#e74c3c;">Error loading products.</p>';
        return;
    }

    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="padding:2rem;text-align:center;">No products found matching your filters.</p>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const primaryImage = (product.images && product.images[0]) || 'assets/img/product/product1.png';
        const hoverImage = (product.images && product.images[1]) || primaryImage;
        const price = parseFloat(product.price).toFixed(2);
        const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price).toFixed(2) : null;
        const isOnSale = comparePrice && parseFloat(product.compare_at_price) > parseFloat(product.price);
        const colors = product.colors || [];

        return `
        <article class="product__card clean-card" data-handle="${product.handle}">
            <div class="product__card--thumbnail clean-card-thumbnail">
                <a class="product__card--thumbnail__link display-block" href="product.html?handle=${product.handle}">
                    <img class="product__card--thumbnail__img product__primary--img" src="${primaryImage}" alt="${product.title}">
                    <img class="product__card--thumbnail__img product__secondary--img" src="${hoverImage}" alt="${product.title}">
                </a>
                ${isOnSale ? '<span class="product__badge">Sale</span>' : ''}
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
                    <span class="current__price">£${price}</span>
                    ${comparePrice ? `<span class="old__price" style="text-decoration:line-through;color:#999;margin-left:8px;">£${comparePrice}</span>` : ''}
                </div>
            </div>
        </article>`;
    }).join('');
}

// Swap image on product card when swatch is clicked
window.swapCardImage = function(swatchEl, imageSrc, handle) {
    const card = document.querySelector(`.product__card[data-handle="${handle}"]`);
    if (!card) return;
    const primary = card.querySelector('.product__primary--img');
    if (primary) primary.src = imageSrc;
    card.querySelectorAll('.card-swatch').forEach(s => s.style.border = '2px solid #ddd');
    swatchEl.style.border = '2px solid #1a1a1a';
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

    // Store product globally for add-to-cart
    window._currentProduct = product;

    // Basic info
    document.title = `${product.title} — Mary Humphrey African Wear`;
    document.getElementById('dyn-product-title').innerText = product.title;
    const bcTitle = document.getElementById('dyn-product-title-bc');
    if (bcTitle) bcTitle.innerText = product.title;
    const bcActive = document.getElementById('dyn-product-title-bc-active');
    if (bcActive) bcActive.innerText = product.title;
    document.getElementById('dyn-product-price').innerText = `£${parseFloat(product.price).toFixed(2)}`;

    const descEl = document.getElementById('dyn-product-desc');
    if (descEl) descEl.innerText = product.description || '';

    // Badge
    const badgeEl = document.getElementById('dyn-product-badge');
    if (badgeEl) {
        if (product.tags && product.tags.length > 0) {
            badgeEl.innerText = product.tags[0];
            badgeEl.style.display = 'inline-block';
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
                alt="${product.title} image ${i+1}"
                style="width:70px;height:90px;object-fit:cover;cursor:pointer;border:2px solid ${i===0?'#1a1a1a':'#ddd'};"
                onclick="swapMainImage(this,'${img}')"
            >
        `).join('');
    }

    // Color swatches
    const colourContainer = document.getElementById('colour-options');
    if (colourContainer && product.colors && product.colors.length > 0) {
        colourContainer.innerHTML = product.colors.map((c, i) => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;" onclick="selectColor(this,'${c.image}','${c.label}')">
                <button 
                    class="swatch-btn ${i===0?'active':''}"
                    aria-label="${c.label}"
                    aria-pressed="${i===0?'true':'false'}"
                    style="width:40px;height:40px;border-radius:50%;border:2px solid ${i===0?'#1a1a1a':'#ddd'};overflow:hidden;padding:0;background:none;display:inline-block;cursor:pointer;"
                    title="${c.label}"
                >
                    <img src="${c.image || product.images[0]}" alt="${c.label}" class="swatch-img" style="width:100%;height:100%;object-fit:cover;">
                </button>
                <span style="font-size:1.1rem;color:#666;">${c.label}</span>
            </div>
        `).join('');
        window._selectedColor = product.colors[0].label;
    }

    // Size buttons
    const sizeContainer = document.getElementById('size-options');
    if (sizeContainer && product.sizes && product.sizes.length > 0) {
        sizeContainer.innerHTML = product.sizes.map((size, i) => `
            <button 
                class="size-btn ${i===0?'active':''}" 
                data-size="${size}"
                onclick="selectSize(this,'${size}')"
                style="padding:0.8rem 1.4rem;border:1px solid ${i===0?'#1a1a1a':'#ccc'};background:${i===0?'#1a1a1a':'#fff'};color:${i===0?'#fff':'#333'};cursor:pointer;font-size:1.3rem;"
            >${size}</button>
        `).join('');
        window._selectedSize = product.sizes[0];
    }
}

// Select a color swatch on product page
window.selectColor = function(container, image, label) {
    window._selectedColor = label;
    swapMainImage(null, image);
    document.querySelectorAll('#colour-options .swatch-btn').forEach(s => {
        s.style.border = '2px solid #ddd';
        s.setAttribute('aria-pressed', 'false');
    });
    const swatch = container.querySelector('.swatch-btn');
    if (swatch) {
        swatch.style.border = '2px solid #1a1a1a';
        swatch.setAttribute('aria-pressed', 'true');
    }
};

// Select a size on product page
window.selectSize = function(btn, size) {
    window._selectedSize = size;
    document.querySelectorAll('.size-btn').forEach(b => {
        b.style.background = '#fff';
        b.style.color = '#333';
        b.style.border = '1px solid #ccc';
    });
    btn.style.background = '#1a1a1a';
    btn.style.color = '#fff';
    btn.style.border = '1px solid #1a1a1a';
};

// Swap main product image
window.swapMainImage = function(thumbEl, src) {
    const mainImg = document.getElementById('dyn-product-image');
    if (mainImg) mainImg.src = src;
    document.querySelectorAll('#dyn-product-gallery img').forEach(t => t.style.border = '2px solid #ddd');
    if (thumbEl) thumbEl.style.border = '2px solid #1a1a1a';
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
