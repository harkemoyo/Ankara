// assets/storefront-api.js
// Fetches data from Supabase and renders storefront UI

import { supabase } from './supabase-client.js';

// =============================================
// SHOP PAGE — Load and render product grid
// =============================================
async function loadShopProducts(collection = null) {
    const grid = document.querySelector('.shop-product-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="padding:2rem;">Loading products...</p>';

    let query = supabase.from('products').select('*').eq('in_stock', true);
    if (collection && collection !== 'all') {
        query = query.eq('collection', collection);
    }

    const { data: products, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = '<p>Error loading products.</p>';
        return;
    }

    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="padding:2rem;">No products found.</p>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const primaryImage = (product.images && product.images[0]) || '';
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
            </div>
            <div class="product__card--content clean-card-content">
                <h3 class="product__card--title clean-title">
                    <a href="product.html?handle=${product.handle}">${product.title}</a>
                </h3>
                ${colors.length > 0 ? `
                <div class="card-color-swatches" style="display:flex;gap:6px;margin:6px 0;">
                    ${colors.map((c, i) => `
                        <span 
                            class="card-swatch" 
                            title="${c.label}"
                            data-image="${c.image}"
                            data-handle="${product.handle}"
                            style="width:18px;height:18px;border-radius:50%;background:${c.hex};border:2px solid ${i === 0 ? '#1a1a1a' : '#ddd'};cursor:pointer;display:inline-block;"
                            onclick="swapCardImage(this, '${c.image}', '${product.handle}')"
                        ></span>
                    `).join('')}
                </div>` : ''}
                <div class="product__card--price clean-price">
                    <span class="current__price">${price}</span>
                    ${comparePrice ? `<span class="old__price" style="text-decoration:line-through;color:#999;margin-left:8px;">${comparePrice}</span>` : ''}
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

// =============================================
// SHOP PAGE — Load collection filter tabs
// =============================================
async function loadCollectionTabs() {
    const tabsContainer = document.getElementById('collection-tabs');
    if (!tabsContainer) return;

    const { data: collections } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order');

    if (!collections) return;

    tabsContainer.innerHTML = collections.map((c, i) => `
        <button 
            class="collection-tab ${i === 0 ? 'active' : ''}" 
            data-collection="${c.handle}"
            onclick="filterByCollection(this, '${c.handle}')"
            style="padding:8px 18px;border:1px solid #ddd;background:${i === 0 ? '#1a1a1a' : '#fff'};color:${i === 0 ? '#fff' : '#333'};cursor:pointer;border-radius:2px;font-size:1.3rem;margin-right:8px;margin-bottom:8px;transition:all 0.2s;"
        >${c.title}</button>
    `).join('');
}

window.filterByCollection = function(btn, collection) {
    document.querySelectorAll('.collection-tab').forEach(t => {
        t.style.background = '#fff';
        t.style.color = '#333';
    });
    btn.style.background = '#1a1a1a';
    btn.style.color = '#fff';
    loadShopProducts(collection);
};

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
                <span 
                    class="colour-swatch ${i===0?'selected':''}"
                    style="width:36px;height:36px;border-radius:50%;background:${c.hex};border:3px solid ${i===0?'#1a1a1a':'#ddd'};display:inline-block;"
                    title="${c.label}"
                ></span>
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
    document.querySelectorAll('.colour-swatch').forEach(s => s.style.border = '3px solid #ddd');
    const swatch = container.querySelector('.colour-swatch');
    if (swatch) swatch.style.border = '3px solid #1a1a1a';
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

// =============================================
// INIT — Run on page load
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    // Shop page
    if (document.querySelector('.shop-product-grid')) {
        loadCollectionTabs();
        loadShopProducts();
    }

    // Product page
    if (document.getElementById('dyn-product-title')) {
        loadProductDetails();
    }
});
