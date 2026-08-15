// assets/header.js — Shared Single Source of Truth Header Module across all storefront pages

(function () {
    'use strict';

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function getActiveRoute() {
        const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        if (path === '/' || path === '/index.html') return 'home';
        if (path.startsWith('/shop')) return 'collections';
        if (path.startsWith('/fabric') || path.startsWith('/material')) return 'fabrics';
        if (path.startsWith('/sale')) return 'sale';
        if (path.startsWith('/about') || path.startsWith('/our-story')) return 'about';
        if (path.startsWith('/contact')) return 'contact';
        if (path.startsWith('/account')) return 'account';
        return '';
    }

    function isHomePage() {
        const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        return path === '/' || path === '/index.html';
    }

    const DEFAULT_COLLECTIONS = [
        { handle: 'all', title: 'All Products' },
        { handle: 'diani-dresses', title: 'Diani Dresses' },
        { handle: 'pullovers', title: 'Nova Pullovers' },
        { handle: 'nova-hoodies', title: 'Nova Hoodies' },
        { handle: 'joggers', title: 'Nova Joggers' },
        { handle: 'kimonos', title: 'Talisman Kimonos' },
        { handle: 'blankets', title: 'Helsinki Blankets' },
        { handle: 'palazzos', title: 'Village Market Palazzos' },
        { handle: 'geco-dungaree', title: 'Geco Dungarees' },
        { handle: 'new-arrivals', title: 'New Arrivals' },
        { handle: 'nova', title: 'Nova Collection' },
        { handle: 'noir-cape', title: 'Noir Cape' },
        { handle: 'menswear', title: 'Menswear' },
        { handle: 'womenswear', title: 'Womenswear' }
    ];

    function getActiveCollections() {
        try {
            const cached = JSON.parse(sessionStorage.getItem('ankara_collections') || '[]');
            if (Array.isArray(cached) && cached.length > 0) return cached;
        } catch (e) { }
        return DEFAULT_COLLECTIONS;
    }

    function buildMegaMenuHtml(collections) {
        const curatedHandles = new Set(['new-arrivals', 'nova', 'noir-cape', 'menswear', 'womenswear']);
        
        const standardMarketing = [
            { title: 'New Arrivals', href: '/shop/new-arrivals' },
            { title: 'Nova Collection', href: '/shop/nova' },
            { title: 'Noir Cape', href: '/shop/noir-cape' },
            { title: 'Menswear', href: '/shop/menswear' },
            { title: 'Womenswear', href: '/shop/womenswear' },
            { title: 'Authentic Fabrics', href: '/fabric' },
            { title: 'Sale', href: '/sale' }
        ];

        const stylesList = [];
        const customCollections = [];

        collections.forEach(c => {
            if (c.handle === 'all') {
                stylesList.unshift({ title: c.title || 'All Products', href: '/shop' });
            } else if (curatedHandles.has(c.handle)) {
                customCollections.push({ title: c.title, href: `/shop/${encodeURIComponent(c.handle)}` });
            } else {
                stylesList.push({ title: c.title, href: `/shop/${encodeURIComponent(c.handle)}` });
            }
        });

        if (!stylesList.some(item => item.href === '/shop')) {
            stylesList.unshift({ title: 'All Products', href: '/shop' });
        }

        const seenHrefs = new Set();
        const rightColList = [];
        [...customCollections, ...standardMarketing].forEach(item => {
            if (!seenHrefs.has(item.href)) {
                seenHrefs.add(item.href);
                rightColList.push(item);
            }
        });

        return `
            <li class="header__sub--menu__items mega-col">
                <span class="mega-menu__heading">Shop by Style</span>
                <ul class="mega-col__list">
                    ${stylesList.map(item => `<li class="header__sub--menu__items"><a class="header__sub--menu__link" href="${item.href}">${escapeHtml(item.title)}</a></li>`).join('')}
                </ul>
            </li>
            <li class="header__sub--menu__items mega-col">
                <span class="mega-menu__heading">Collections</span>
                <ul class="mega-col__list">
                    ${rightColList.map(item => `<li class="header__sub--menu__items"><a class="header__sub--menu__link" href="${item.href}">${escapeHtml(item.title)}</a></li>`).join('')}
                </ul>
            </li>
        `;
    }

    function buildMobileSubMenuHtml(collections) {
        const list = [{ title: 'All Products', href: '/shop' }];
        collections.forEach(c => {
            if (c.handle !== 'all') {
                list.push({ title: c.title, href: `/shop/${encodeURIComponent(c.handle)}` });
            }
        });
        if (!list.some(i => i.href === '/shop/menswear')) list.push({ title: 'Menswear', href: '/shop/menswear' });
        if (!list.some(i => i.href === '/shop/womenswear')) list.push({ title: 'Womenswear', href: '/shop/womenswear' });

        return list.map(item => `<li class="offcanvas__sub_menu_li"><a class="offcanvas__sub_menu_item" href="${item.href}">${escapeHtml(item.title)}</a></li>`).join('');
    }

    const ICONS = {
        hamburger: `<svg class="ionicon offcanvas__header--menu__open--svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <path d="M80 160h352M80 256h352M80 352h352" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"></path>
        </svg>`,
        arrowDown: `<svg class="menu__arrowdown--icon" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>`,
        search: `<svg fill="none" height="17" viewBox="0 0 17 17" width="17" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 16L11 11M12.6667 6.83333C12.6667 10.3333 9.33333 12.6667 6.83333 12.6667C4.33333 12.6667 1 10.3333 1 6.83333C1 3.33333 3.33333 1 6.83333 1C10.3333 1 12.6667 3.33333 12.6667 6.83333Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>`,
        account: `<svg fill="none" height="17" viewBox="0 0 17 17" width="17" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 16V14.3333C16 12.4924 14.4 11 12.25 11H4.75C2.6 11 1 12.4924 1 14.3333V16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M8.5 7.66667C10.5711 7.66667 12.25 6.17428 12.25 4.33333C12.25 2.49238 10.5711 1 8.5 1C6.42893 1 4.75 2.49238 4.75 4.33333C4.75 6.17428 6.42893 7.66667 8.5 7.66667Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>`,
        cart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>`,
        toolbarHome: `<svg fill="none" height="21" viewBox="0 0 22 17" width="21" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.9141 7.93359c.1406.11719.2109.26953.2109.45703 0 .14063-.0469.25782-.1406.35157l-.3516.42187c-.1172.14063-.2578.21094-.4219.21094-.1406 0-.2578-.04688-.3515-.14062l-.9844-.77344V15c0 .3047-.1172.5625-.3516.7734-.2109.2344-.4687.3516-.7734.3516h-4.5c-.3047 0-.5742-.1172-.8086-.3516-.2109-.2109-.3164-.4687-.3164-.7734v-3.6562h-2.25V15c0 .3047-.11719.5625-.35156.7734-.21094.2344-.46875.3516-.77344.3516h-4.5c-.30469 0-.57422-.1172-.80859-.3516-.21094-.2109-.31641-.4687-.31641-.7734V8.46094l-.94922.77344c-.11719.09374-.24609.14062-.38672.14062-.16406 0-.30468-.07031-.42187-.21094l-.35157-.42187C.921875 8.625.875 8.50781.875 8.39062c0-.1875.070312-.33984.21094-.45703L9.73438.832031C10.1094.527344 10.5312.375 11 .375s.8906.152344 1.2656.457031l8.6485 7.101559zm-3.7266 6.50391V7.05469L11 1.99219l-6.1875 5.0625v7.38281h3.375v-3.6563c0-.3046.10547-.5624.31641-.7734.23437-.23436.5039-.35155.80859-.35155h3.375c.3047 0 .5625.11719.7734.35155.2344.211.3516.4688.3516.7734v3.6563h3.375z" fill="currentColor"></path>
        </svg>`,
        toolbarCollections: `<svg fill="currentColor" height="17" viewBox="0 0 448 512" width="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M416 32H32A32 32 0 0 0 0 64v384a32 32 0 0 0 32 32h384a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32zm-16 48v152H248V80zm-200 0v152H48V80zM48 432V280h152v152zm200 0V280h152v152z"></path>
        </svg>`,
        toolbarSearch: `<svg height="20" viewBox="0 0 512 512" width="22" xmlns="http://www.w3.org/2000/svg">
            <path d="M221.09 64a157.09 157.09 0 10157.09 157.09A157.1 157.1 0 00221.09 64z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"></path>
            <path d="M338.29 338.29L448 448" fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32"></path>
        </svg>`,
        offcanvasAccount: `<svg class="offcanvas__account--items__btn--icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M344 144c-3.92 52.87-44 96-88 96s-84.15-43.13-88-96c-4.38-59.2 38.66-112 88-112s92.38 52.8 88 112z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" />
            <path d="M256 304c-87 0-175.3 48-191.64 138.6C62.39 453.52 70.4 464 81.61 464h348.78c11.21 0 19.22-10.48 17.25-21.4C431.3 352 343 304 256 304z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" />
        </svg>`
    };

    window.renderHeader = function (containerEl, options) {
        if (!containerEl) return;
        const active = getActiveRoute();
        const transparent = options?.transparent ?? (containerEl.dataset.transparent === 'true');
        const logoImg = options?.logo || 'assets/IMG-20260622-WA0082.webp';
        const currentCurrency = (window.AnkaraCurrency && window.AnkaraCurrency.current) ? window.AnkaraCurrency.current : 'KES';
        const collections = getActiveCollections();

        const mainHeaderClasses = transparent
            ? 'main__header transparent__header header__sticky'
            : 'main__header position__relative header__sticky';

        const megaMenuHtml = buildMegaMenuHtml(collections);
        const mobileSubMenuHtml = buildMobileSubMenuHtml(collections);

        const html = `
        <!-- ── Topbar Announcement ─────────────────────── -->
        <div class="header__topbar bg__primary">
            <div class="header__topbar--inner">
                <div class="topbar-left-spacer"></div>
                <p class="header__info--text text-white m-0 text-center" id="announcement-text" data-section-id="announcement"></p>
                <div class="header__topbar--currency">
                    <select class="currency-switcher" aria-label="Select Currency" onchange="if(window.AnkaraCurrency) window.AnkaraCurrency.setCurrency(this.value)">
                        <option value="KES" class="currency-option" ${currentCurrency === 'KES' ? 'selected' : ''}>KES</option>
                        <option value="USD" class="currency-option" ${currentCurrency === 'USD' ? 'selected' : ''}>USD</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- ── Main Header ────────────────────────────── -->
        <div class="${mainHeaderClasses}">
            <div class="main__header--inner flex-between align-items-center">
                <!-- Hamburger / Offcanvas Toggle -->
                <div class="offcanvas__header--menu__open">
                    <a class="offcanvas__header--menu__open--btn" data-offcanvas="" href="javascript:void(0)" aria-label="Open mobile menu">
                        ${ICONS.hamburger}
                        <span class="visually-hidden">Menu</span>
                    </a>
                </div>

                <!-- Logo -->
                <div class="main__logo">
                    <h1 class="main__logo--title">
                        <a class="main__logo--link" href="/">
                            <img alt="Mary Humphrey African Wear" class="main__logo--img" src="${logoImg}" />
                        </a>
                    </h1>
                </div>

                <!-- Desktop Navigation -->
                <div class="header__menu">
                    <nav class="header__menu--navigation">
                        <ul class="header__menu--wrapper">
                            <li class="header__menu--items ${active === 'home' ? 'active-page' : ''}">
                                <a class="header__menu--link ${active === 'home' ? 'active' : ''}" href="/">Home</a>
                            </li>
                            <li class="header__menu--items ${active === 'collections' ? 'active-page' : ''}">
                                <a class="header__menu--link ${active === 'collections' ? 'active' : ''}" href="/shop">Collections
                                    ${ICONS.arrowDown}
                                </a>
                                <ul class="header__sub--menu mega-menu">
                                    ${megaMenuHtml}
                                </ul>
                            </li>
                            <li class="header__menu--items ${active === 'fabrics' ? 'active-page' : ''}">
                                <a class="header__menu--link ${active === 'fabrics' ? 'active' : ''}" href="/fabric">Fabrics</a>
                            </li>
                            <li class="header__menu--items ${active === 'sale' ? 'active-page' : ''}">
                                <a class="header__menu--link header__menu--link--sale ${active === 'sale' ? 'active' : ''}" href="/sale">Sale</a>
                            </li>
                            <li class="header__menu--items ${active === 'about' ? 'active-page' : ''}">
                                <a class="header__menu--link ${active === 'about' ? 'active' : ''}" href="/about">Our Story</a>
                            </li>
                            <li class="header__menu--items ${active === 'contact' ? 'active-page' : ''}">
                                <a class="header__menu--link ${active === 'contact' ? 'active' : ''}" href="/contact">Contact</a>
                            </li>
                        </ul>
                    </nav>
                </div>

                <!-- Header Account / Icons -->
                <div class="header__account">
                    <ul class="header__account--wrapper">
                        <!-- Search -->
                        <li class="header__account--items header__account--search__items">
                            <a class="header__account--btn search__open--btn" data-offcanvas="" href="javascript:void(0)" aria-label="Open search">
                                <span class="header__account--btn__icon">
                                    ${ICONS.search}
                                </span>
                                <span class="visually-hidden">Search</span>
                            </a>
                        </li>
                        <!-- Account -->
                        <li class="header__account--items">
                            <a class="header__account--btn" href="/account" aria-label="My Account">
                                <span class="header__account--btn__icon">
                                    ${ICONS.account}
                                </span>
                                <span class="visually-hidden">My Account</span>
                            </a>
                        </li>
                        <!-- Cart -->
                        <li class="header__account--items header__minicart--items">
                            <a class="header__account--btn minicart__open--btn" data-offcanvas="" href="javascript:void(0)" aria-label="Open cart">
                                <span class="header__account--btn__icon">
                                    ${ICONS.cart}
                                </span>
                                <span class="items__count js-item-count js-cart-count">0</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- ── Offcanvas Mobile Menu ──────────────────── -->
        <div class="offcanvas__header">
            <div class="offcanvas__inner">
                <!-- Offcanvas Logo -->
                <div class="offcanvas__logo">
                    <a class="offcanvas__logo--link" href="/">
                        <img alt="Mary Humphrey African Wear" src="${logoImg}" class="offcanvas__logo--img" />
                    </a>
                    <button aria-label="close menu" class="offcanvas__close--btn" data-offcanvas="">✕</button>
                </div>
                <nav class="offcanvas__menu">
                    <ul class="offcanvas__menu_ul">
                        <li class="offcanvas__menu_li ${active === 'home' ? 'active' : ''}">
                            <a class="offcanvas__menu_item ${active === 'home' ? 'active' : ''}" href="/">Home</a>
                        </li>
                        <li class="offcanvas__menu_li ${active === 'collections' ? 'active' : ''}">
                            <a class="offcanvas__menu_item ${active === 'collections' ? 'active' : ''}" href="/shop">Collections</a>
                            <button type="button" class="offcanvas__sub_menu_toggle" aria-label="Toggle Submenu"></button>
                            <ul class="offcanvas__sub_menu">
                                ${mobileSubMenuHtml}
                            </ul>
                        </li>
                        <li class="offcanvas__menu_li ${active === 'fabrics' ? 'active' : ''}">
                            <a class="offcanvas__menu_item ${active === 'fabrics' ? 'active' : ''}" href="/fabric">Fabrics</a>
                        </li>
                        <li class="offcanvas__menu_li ${active === 'sale' ? 'active' : ''}">
                            <a class="offcanvas__menu_item header__menu--link--sale ${active === 'sale' ? 'active' : ''}" href="/sale">Sale</a>
                        </li>
                        <li class="offcanvas__menu_li ${active === 'about' ? 'active' : ''}">
                            <a class="offcanvas__menu_item ${active === 'about' ? 'active' : ''}" href="/about">Our Story</a>
                        </li>
                        <li class="offcanvas__menu_li ${active === 'contact' ? 'active' : ''}">
                            <a class="offcanvas__menu_item ${active === 'contact' ? 'active' : ''}" href="/contact">Contact</a>
                        </li>
                    </ul>
                    <div class="offcanvas__account--items">
                        <a class="offcanvas__account--signup__btn" href="/account">
                            <svg fill="none" height="16" viewBox="0 0 17 17" width="16" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 16V14.3333C16 12.4924 14.4 11 12.25 11H4.75C2.6 11 1 12.4924 1 14.3333V16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path d="M8.5 7.66667C10.5711 7.66667 12.25 6.17428 12.25 4.33333C12.25 2.49238 10.5711 1 8.5 1C6.42893 1 4.75 2.49238 4.75 4.33333C4.75 6.17428 6.42893 7.66667 8.5 7.66667Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                            Sign In / Register
                        </a>
                    </div>
                </nav>
            </div>
        </div>

        <!-- ── Mini Cart Drawer ───────────────────────── -->
        <div class="offCanvas__minicart js-cart-form">
            <div class="minicart__header">
                <div class="minicart__header--top">
                    <h3 class="minicart__title">Cart</h3>
                    <button aria-label="close cart" class="minicart__close--btn" data-offcanvas="" type="button">×</button>
                </div>
            </div>
            <div class="minicart__empty--text">
                <p>Your bag is empty.</p>
                <a class="primary__btn" href="/shop">Continue Shopping</a>
            </div>
            <div class="minicart__product" id="minicart-items-list"></div>
            <div class="minicart__amount">
                <div class="cart__note">
                    <h4>Order Note</h4>
                    <textarea class="cart__note--input" placeholder=""></textarea>
                </div>
                <div class="minicart__amount_list">
                    <span>Subtotal</span>
                    <span id="minicart-subtotal">
                        <b><span class="currency-symbol">KSh</span>0.00</b>
                    </span>
                </div>
                <p>Shipping, taxes, and discount codes calculated at checkout.</p>
            </div>
            <div class="minicart__button">
                <a class="minicart__button--link checkout__btn" href="javascript:void(0)" onclick="if(window.triggerCheckout) window.triggerCheckout(); else window.location.href='/checkout';">Check Out</a>
            </div>
        </div>

        <!-- ── Search Overlay ─────────────────────────── -->
        <div class="predictive__search--box">
            <div class="predictive__search--box__inner">
                <h2 class="predictive__search--title">Search Products</h2>
                <form action="/shop" class="predictive__search--form" method="get" role="search">
                    <label for="Search">
                        <input class="predictive__search--input" id="Search" name="q" placeholder="Search Here" type="search" />
                    </label>
                    <button aria-label="search button" class="predictive__search--button text-white">
                        ${ICONS.search}
                    </button>
                </form>
            </div>
            <button aria-label="close search" class="predictive__search--close__btn" data-offcanvas="">
                <svg height="28" viewBox="0 0 512 512" width="28" xmlns="http://www.w3.org/2000/svg">
                    <path d="M368 368L144 144M368 144L144 368" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"></path>
                </svg>
            </button>
        </div>

        <!-- ── Mobile Sticky Toolbar ─────────────────── -->
        <div class="offcanvas__sticky--toolbar">
            <ul class="flex-between">
                <li class="offcanvas__sticky--toolbar__list">
                    <a class="offcanvas__sticky--toolbar__btn" href="/">
                        <span class="offcanvas__sticky--toolbar__icon">${ICONS.toolbarHome}</span>
                        <span class="offcanvas__sticky--toolbar__label">Home</span>
                    </a>
                </li>
                <li class="offcanvas__sticky--toolbar__list">
                    <a class="offcanvas__sticky--toolbar__btn" href="/shop">
                        <span class="offcanvas__sticky--toolbar__icon">${ICONS.toolbarCollections}</span>
                        <span class="offcanvas__sticky--toolbar__label">Collections</span>
                    </a>
                </li>
                <li class="offcanvas__sticky--toolbar__list">
                    <a class="offcanvas__sticky--toolbar__btn search__open--btn" data-offcanvas="" href="javascript:void(0)">
                        <span class="offcanvas__sticky--toolbar__icon">${ICONS.toolbarSearch}</span>
                        <span class="offcanvas__sticky--toolbar__label">Search</span>
                    </a>
                </li>
                <li class="offcanvas__sticky--toolbar__list">
                    <a class="offcanvas__sticky--toolbar__btn minicart__open--btn" data-offcanvas="" href="javascript:void(0)">
                        <span class="offcanvas__sticky--toolbar__icon">${ICONS.cart}</span>
                        <span class="offcanvas__sticky--toolbar__label">Cart</span>
                        <span class="items__count js-item-count js-cart-count">0</span>
                    </a>
                </li>
            </ul>
        </div>
        `;

        containerEl.innerHTML = html;

        // 1. Re-bind offcanvas click handlers to ensure dynamic buttons work immediately
        bindOffcanvasHandlers(containerEl);

        // 2. Attach sticky scroll handler
        initStickyScroll(containerEl);

        // 3. Trigger announcement bar if already loaded
        if (window.ankaraAnnouncement && typeof window.ankaraAnnouncement.render === 'function') {
            window.ankaraAnnouncement.render();
        }

        // 4. Update cart badges if cart is available
        if (window.CartService && typeof window.CartService.updateCartBadges === 'function') {
            window.CartService.updateCartBadges();
        } else {
            try {
                const storedCart = JSON.parse(localStorage.getItem('ankara_cart') || '[]');
                const totalCount = storedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
                containerEl.querySelectorAll('.js-item-count, .js-cart-count').forEach(el => {
                    el.textContent = totalCount;
                });
            } catch (e) { }
        }

        // 5. Asynchronously synchronize with backend for any collection changes
        syncCollectionsWithBackend(containerEl);
    };

    function bindOffcanvasHandlers(container) {
        const offcanvasBtns = container.querySelectorAll('[data-offcanvas]');
        const offcanvasHeader = container.querySelector('.offcanvas__header');
        const minicart = container.querySelector('.offCanvas__minicart');
        const searchBox = container.querySelector('.predictive__search--box');
        const body = document.body;

        offcanvasBtns.forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();

                // Hamburger / offcanvas menu
                if (btn.closest('.offcanvas__header--menu__open') || btn.closest('.offcanvas__menu')) {
                    if (offcanvasHeader) {
                        const isOpen = offcanvasHeader.classList.toggle('open');
                        offcanvasHeader.classList.toggle('active', isOpen);
                        body.classList.toggle('mobile_menu_open', isOpen);
                    }
                }

                // Search toggle
                if (btn.classList.contains('search__open--btn') || btn.closest('.predictive__search--box')) {
                    if (searchBox) {
                        searchBox.classList.toggle('open');
                        searchBox.classList.toggle('active');
                    }
                }

                // Minicart toggle
                if (btn.classList.contains('minicart__open--btn') || btn.closest('.offCanvas__minicart')) {
                    if (minicart) {
                        minicart.classList.toggle('open');
                        minicart.classList.toggle('active');
                    }
                }

                // Close button inside offcanvas
                if (btn.classList.contains('offcanvas__close--btn') ||
                    btn.classList.contains('minicart__close--btn') ||
                    btn.classList.contains('predictive__search--close__btn')) {
                    if (offcanvasHeader) {
                        offcanvasHeader.classList.remove('open', 'active');
                        body.classList.remove('mobile_menu_open');
                    }
                    if (minicart) {
                        minicart.classList.remove('open', 'active');
                    }
                    if (searchBox) {
                        searchBox.classList.remove('open', 'active');
                    }
                }
            });
        });

        // Submenu accordion toggle for mobile menu
        const menuWrapper = container.querySelector('.offcanvas__menu_ul');
        if (menuWrapper) {
            menuWrapper.addEventListener('click', function (e) {
                const toggleBtn = e.target.closest('.offcanvas__sub_menu_toggle');
                const itemLink = e.target.closest('.offcanvas__menu_item');

                let targetToggle = toggleBtn;
                if (!targetToggle && itemLink) {
                    const siblingSub = itemLink.parentElement ? itemLink.parentElement.querySelector('.offcanvas__sub_menu') : null;
                    if (siblingSub) {
                        e.preventDefault();
                        targetToggle = itemLink.parentElement.querySelector('.offcanvas__sub_menu_toggle');
                    }
                }

                if (targetToggle) {
                    e.preventDefault();
                    e.stopPropagation();
                    const parent = targetToggle.parentElement;
                    const subMenu = parent.querySelector('.offcanvas__sub_menu');
                    const isActive = parent.classList.contains('active');

                    if (isActive) {
                        parent.classList.remove('active');
                        targetToggle.classList.remove('active');
                        if (subMenu) {
                            subMenu.style.display = 'none';
                        }
                    } else {
                        // Close any open sibling submenus
                        const siblings = Array.from(parent.parentElement.children).filter(el => el !== parent);
                        siblings.forEach(sib => {
                            sib.classList.remove('active');
                            const sibToggle = sib.querySelector('.offcanvas__sub_menu_toggle');
                            if (sibToggle) sibToggle.classList.remove('active');
                            const sibSub = sib.querySelector('.offcanvas__sub_menu');
                            if (sibSub) sibSub.style.display = 'none';
                        });

                        parent.classList.add('active');
                        targetToggle.classList.add('active');
                        if (subMenu) {
                            subMenu.style.display = 'block';
                        }
                    }
                }
            });
        }

        // Close offcanvas when clicking outside
        document.addEventListener('click', function (e) {
            if (offcanvasHeader && offcanvasHeader.classList.contains('open')) {
                if (!e.target.closest('.offcanvas__header') &&
                    !e.target.closest('.offcanvas__header--menu__open') &&
                    !e.target.closest('.offcanvas__header--menu__open--btn')) {
                    offcanvasHeader.classList.remove('open', 'active');
                    body.classList.remove('mobile_menu_open');
                }
            }
        });
    }

    function initStickyScroll(container) {
        const mainHeader = container.querySelector('.header__sticky');
        if (!mainHeader) return;

        function updateScroll() {
            if (window.scrollY > 80) {
                mainHeader.classList.add('sticky');
                document.body.classList.add('header--scrolled');
                container.classList.add('header--scrolled');
            } else {
                mainHeader.classList.remove('sticky');
                document.body.classList.remove('header--scrolled');
                container.classList.remove('header--scrolled');
            }
        }

        window.addEventListener('scroll', updateScroll, { passive: true });
        updateScroll();
    }

    async function syncCollectionsWithBackend(container) {
        try {
            const res = await fetch('/api/collections');
            if (!res.ok) return;
            const data = await res.json();
            const collections = data.collections;
            if (!Array.isArray(collections) || collections.length === 0) return;

            const current = JSON.stringify(getActiveCollections());
            const incoming = JSON.stringify(collections);

            if (current !== incoming) {
                try {
                    sessionStorage.setItem('ankara_collections', incoming);
                } catch (e) { }

                const megaMenuEl = container.querySelector('.header__sub--menu.mega-menu');
                if (megaMenuEl) {
                    megaMenuEl.innerHTML = buildMegaMenuHtml(collections);
                }

                const mobileSubMenuEl = container.querySelector('.offcanvas__sub_menu');
                if (mobileSubMenuEl) {
                    mobileSubMenuEl.innerHTML = buildMobileSubMenuHtml(collections);
                }
            }
        } catch (e) {
            // Silently retain current collections if backend is temporarily unreachable
        }
    }

    function initHeader() {
        const el = document.getElementById('site-header') ||
                   document.querySelector('[data-section-id="header"]') ||
                   document.querySelector('header.header__section');
        if (!el) return;

        if (el.dataset.headerInitialized === 'true') return;
        el.dataset.headerInitialized = 'true';

        window.renderHeader(el);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        initHeader();
    }
})();
