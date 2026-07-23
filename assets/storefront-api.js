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

    let { data: products, error } = await query;

    const allDscProducts = [
        {
            id: 'dsc-sheba-luxury-gown',
            handle: 'sheba-luxury-couture-gown',
            title: 'Sheba Luxury Couture Gown',
            price: 245.00,
            compare_at_price: 295.00,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC02676.jpg', 'assets/DSC02672.jpg'],
            colors: [{ label: 'Gold Ochre', hex: '#D4A843', image: 'assets/DSC02676.jpg' }],
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'dsc-safari-tailored-suit',
            handle: 'safari-tailored-ankara-suit',
            title: 'Safari Tailored Ankara Suit',
            price: 210.00,
            compare_at_price: 260.00,
            collection: 'tops',
            in_stock: true,
            images: ['assets/DSC02582.jpg', 'assets/DSC02579.jpg'],
            colors: [{ label: 'Khaki Gold', hex: '#B7950B', image: 'assets/DSC02582.jpg' }],
            sizes: ['M', 'L', 'XL', '2X']
        },
        {
            id: 'dsc-monarch-evening-coat',
            handle: 'monarch-artisan-evening-coat',
            title: 'Monarch Artisan Evening Coat',
            price: 240.00,
            compare_at_price: 290.00,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC02616.jpg', 'assets/DSC02608.jpg'],
            colors: [{ label: 'Royal Ochre', hex: '#D4A843', image: 'assets/DSC02616.jpg' }],
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'dsc-sunburst-gown',
            handle: 'royal-sunburst-ankara-gown',
            title: 'Royal Sunburst Ankara Gown',
            price: 145.00,
            compare_at_price: 185.00,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC01401.jpg', 'assets/DSC01383.jpg'],
            colors: [{ label: 'Gold Ochre', hex: '#D4A843', image: 'assets/DSC01401.jpg' }],
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'dsc-empress-maxi',
            handle: 'empress-geometric-maxi-dress',
            title: 'Empress Geometric Maxi Dress',
            price: 160.00,
            compare_at_price: 195.00,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC01465.jpg', 'assets/DSC01428.jpg'],
            colors: [{ label: 'Navy Geometric', hex: '#1C2833', image: 'assets/DSC01465.jpg' }],
            sizes: ['M', 'L', 'XL', '2X']
        },
        {
            id: 'dsc-terracotta-kaftan',
            handle: 'terracotta-earth-wave-kaftan',
            title: 'Terracotta Earth Wave Kaftan',
            price: 130.00,
            compare_at_price: null,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC01755.jpg', 'assets/DSC01715.jpg'],
            colors: [{ label: 'Terracotta', hex: '#C97F5F', image: 'assets/DSC01755.jpg' }],
            sizes: ['S', 'M', 'L']
        },
        {
            id: 'dsc-savannah-suit',
            handle: 'savannah-botanical-blazer-set',
            title: 'Savannah Botanical Blazer Set',
            price: 190.00,
            compare_at_price: 230.00,
            collection: 'tops',
            in_stock: true,
            images: ['assets/DSC01528.jpg', 'assets/DSC01550.jpg'],
            colors: [{ label: 'Botanical Green', hex: '#2E5B37', image: 'assets/DSC01528.jpg' }],
            sizes: ['M', 'L', 'XL']
        },
        {
            id: 'dsc-kente-kimono',
            handle: 'royal-kente-artisan-kimono',
            title: 'Royal Kente Artisan Kimono',
            price: 125.00,
            compare_at_price: 155.00,
            collection: 'tops',
            in_stock: true,
            images: ['assets/DSC01687.jpg', 'assets/DSC01655.jpg'],
            colors: [{ label: 'Kente Gold', hex: '#E59866', image: 'assets/DSC01687.jpg' }],
            sizes: ['S', 'M', 'L', 'XL', '2X']
        },
        {
            id: 'dsc-obsidian-skirt',
            handle: 'obsidian-geometric-wrap-skirt',
            title: 'Obsidian Geometric Wrap Skirt',
            price: 95.00,
            compare_at_price: 120.00,
            collection: 'skirts',
            in_stock: true,
            images: ['assets/DSC02035.jpg', 'assets/DSC02018.jpg'],
            colors: [{ label: 'Obsidian Black', hex: '#1A1818', image: 'assets/DSC02035.jpg' }],
            sizes: ['S', 'M', 'L']
        },
        {
            id: 'dsc-crimson-peplum',
            handle: 'crimson-bloom-peplum-top',
            title: 'Crimson Bloom Peplum Top',
            price: 85.00,
            compare_at_price: null,
            collection: 'tops',
            in_stock: true,
            images: ['assets/DSC02267.jpg', 'assets/DSC02292.jpg'],
            colors: [{ label: 'Crimson Red', hex: '#A93226', image: 'assets/DSC02267.jpg' }],
            sizes: ['M', 'L', 'XL']
        },
        {
            id: 'dsc-indigo-shift',
            handle: 'indigo-sunburst-shift-dress',
            title: 'Indigo Sunburst Shift Dress',
            price: 110.00,
            compare_at_price: 140.00,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC02453.jpg', 'assets/DSC02476.jpg'],
            colors: [{ label: 'Indigo Blue', hex: '#2471A3', image: 'assets/DSC02453.jpg' }],
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'dsc-heritage-gown',
            handle: 'heritage-woven-ball-gown',
            title: 'Heritage Woven Ball Gown',
            price: 220.00,
            compare_at_price: null,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC02662.jpg', 'assets/DSC02657.jpg'],
            colors: [{ label: 'Imperial Gold', hex: '#F1C40F', image: 'assets/DSC02662.jpg' }],
            sizes: ['M', 'L', 'XL']
        },
        {
            id: 'dsc-sheba-luxury-robe',
            handle: 'sheba-royal-luxury-robe',
            title: 'Sheba Royal Luxury Robe',
            price: 185.00,
            compare_at_price: 220.00,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC02687.jpg', 'assets/DSC02689.jpg'],
            colors: [{ label: 'Deep Burgundy', hex: '#78281F', image: 'assets/DSC02687.jpg' }],
            sizes: ['S', 'M', 'L', 'XL', '2X']
        },
        {
            id: 'dsc-savannah-palazzo',
            handle: 'savannah-printed-palazzo-pants',
            title: 'Savannah Printed Palazzo Pants',
            price: 98.00,
            compare_at_price: 125.00,
            collection: 'skirts',
            in_stock: true,
            images: ['assets/DSC02056.jpg', 'assets/DSC02044.jpg'],
            colors: [{ label: 'Savannah Olive', hex: '#556B2F', image: 'assets/DSC02056.jpg' }],
            sizes: ['S', 'M', 'L']
        },
        {
            id: 'dsc-african-blouse',
            handle: 'african-queen-peplum-blouse',
            title: 'African Queen Peplum Blouse',
            price: 89.00,
            compare_at_price: null,
            collection: 'tops',
            in_stock: true,
            images: ['assets/DSC02142.jpg', 'assets/DSC02133.jpg'],
            colors: [{ label: 'Amber Red', hex: '#900C3F', image: 'assets/DSC02142.jpg' }],
            sizes: ['M', 'L', 'XL']
        },
        {
            id: 'dsc-empress-sunset',
            handle: 'empress-sunset-wrap-dress',
            title: 'Empress Sunset Wrap Dress',
            price: 155.00,
            compare_at_price: 190.00,
            collection: 'dresses',
            in_stock: true,
            images: ['assets/DSC02331.jpg', 'assets/DSC02317.jpg'],
            colors: [{ label: 'Sunset Gold', hex: '#E67E22', image: 'assets/DSC02331.jpg' }],
            sizes: ['S', 'M', 'L', 'XL']
        },
        {
            id: 'dsc-kente-designer-blazer',
            handle: 'kente-structure-designer-blazer',
            title: 'Kente Structure Designer Blazer',
            price: 175.00,
            compare_at_price: 210.00,
            collection: 'tops',
            in_stock: true,
            images: ['assets/DSC02554.jpg', 'assets/DSC02544.jpg'],
            colors: [{ label: 'Kente Red', hex: '#C0392B', image: 'assets/DSC02554.jpg' }],
            sizes: ['M', 'L', 'XL', '2X']
        }
    ];

    // Always use full DSC catalog
    products = allDscProducts;

    const dscList = [
        'assets/DSC02676.jpg', 'assets/DSC02616.jpg', 'assets/DSC01401.jpg',
        'assets/DSC01465.jpg', 'assets/DSC01528.jpg', 'assets/DSC01755.jpg',
        'assets/DSC02035.jpg', 'assets/DSC02267.jpg', 'assets/DSC02453.jpg',
        'assets/DSC02582.jpg', 'assets/DSC02662.jpg', 'assets/DSC02687.jpg',
        'assets/DSC02579.jpg', 'assets/DSC02680.jpg', 'assets/DSC02684.jpg',
        'assets/DSC02689.jpg', 'assets/DSC02693.jpg', 'assets/DSC02610.jpg'
    ];

    grid.innerHTML = products.map((product, idx) => {
        let primaryImage = (product.images && Array.isArray(product.images) && product.images[0]) ? product.images[0] : dscList[idx % dscList.length];
        if (typeof primaryImage === 'string' && (primaryImage.indexOf('IMG-') !== -1 || primaryImage.indexOf('product1.png') !== -1 || primaryImage.indexOf('.webp') !== -1)) {
            primaryImage = dscList[idx % dscList.length];
        }
        let hoverImage = (product.images && Array.isArray(product.images) && product.images[1]) ? product.images[1] : dscList[(idx + 1) % dscList.length];
        if (typeof hoverImage === 'string' && (hoverImage.indexOf('IMG-') !== -1 || hoverImage.indexOf('product1.png') !== -1 || hoverImage.indexOf('.webp') !== -1)) {
            hoverImage = dscList[(idx + 1) % dscList.length];
        }
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
                    <span class="current__price">${window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(product.price) : price}</span>
                    ${comparePrice && product.compare_at_price ? `<span class="old__price" style="text-decoration:line-through;color:#999;margin-left:8px;">${window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(product.compare_at_price) : comparePrice}</span>` : ''}
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
                class="${i===0?'active':''}"
                onclick="swapMainImage(this,'${img}')"
            >
        `).join('');
    }

    // Color swatches
    const colourContainer = document.getElementById('colour-options');
    if (colourContainer && product.colors && product.colors.length > 0) {
        colourContainer.innerHTML = product.colors.map((c, i) => `
            <button 
                class="swatch-btn ${i===0?'active':''}"
                aria-label="${c.label}"
                aria-pressed="${i===0?'true':'false'}"
                onclick="selectColor(this,'${c.image}','${c.label}')"
                title="${c.label}"
            >
                <img src="${c.image || product.images[0]}" alt="${c.label}" class="swatch-img">
            </button>
        `).join('');
        window._selectedColor = product.colors[0].label;
        
        // Update label text
        const activeLabel = document.getElementById('active-colour-label');
        if (activeLabel) activeLabel.innerText = product.colors[0].label;
        
        const stickyColor = document.getElementById('sticky-selection-color');
        if (stickyColor) stickyColor.innerText = `Colour: ${product.colors[0].label}`;
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
