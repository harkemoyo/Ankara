// assets/footer.js — Shared Single Source of Truth Footer Module across all 7 pages

(function () {
    const FOOTER_JSON_URL = '/api/theme';
    const FALLBACK_JSON_URL = 'data/theme-sections.json';

    const ICONS = {
        location: `<svg fill="none" height="16" stroke="currentColor" viewBox="0 0 24 24" width="16"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`,
        phone: `<svg fill="none" height="16" stroke="currentColor" viewBox="0 0 24 24" width="16"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`,
        email: `<svg fill="none" height="16" stroke="currentColor" viewBox="0 0 24 24" width="16"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path></svg>`,
        arrowDown: `<svg class="footer__widget--title__arrowdown--icon" height="8" viewBox="0 0 10.355 6.394" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M15.138,8.59l-3.961,3.952L7.217,8.59,6,9.807l5.178,5.178,5.178-5.178Z" fill="currentColor" transform="translate(-6 -8.59)"></path></svg>`,
        instagram: `<svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path></svg>`,
        facebook: `<svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>`,
        tiktok: `<svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"></path></svg>`
    };

    function escapeHtml(str) {
        if (str == null) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.renderFooter = function(el, s) {
        if (!el || !s) return;

        const logoImg = s.logo || 'assets/IMG-20260622-WA0082.webp';
        const aboutText = s.about || 'Contemporary fashion rooted in African heritage and crafted for the modern world.';
        const email = s.email || 'hello@maryhumphreywear.com';
        const phone = s.phone || (window.STORE_CONFIG?.PHONE_NUMBER || window.STORE_CONFIG?.WHATSAPP_NUMBER) || '254715687280';
        const phoneDisplay = '+' + phone.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
        const social = s.social || { instagram: '#', facebook: '#', tiktok: '#' };

        // Build locations array — prefer the new array format, fall back to legacy single fields
        const locations = s.locations || [
            { name: s.location || 'Nairobi, Kenya', url: s.location_url || 'https://maps.google.com' }
        ];

        const collectionLinks = s.collection_links || [
            { label: 'All Products', url: '/shop' },
            { label: "Men's Ankara Dungaree", url: '/shop/palazzos' },
            { label: 'Ankara Street Luxe Set', url: '/shop/sets' },
            { label: 'African Luxe Throw', url: '/shop/blankets' }
        ];

        const quickLinks = s.quick_links || [
            { label: 'Home', url: '/' },
            { label: 'Our Story', url: '/about' },
            { label: 'Contact Us', url: '/contact' },
            { label: 'Privacy Policy', url: '/privacy' },
            { label: 'Terms of Service', url: '/terms' },
            { label: 'Refund & Return Policy', url: '/refund' },
            { label: 'Shipping Policy', url: '/shipping' }
        ];

        const newsHeading = s.newsletter_heading || 'Join Our World';
        const newsDesc = s.newsletter_desc || 'Subscribe to receive exclusive updates, new arrivals, and stories from the heart of African fashion.';
        const copyright = s.copyright || '© 2026 Mary Humphrey Wear. All Rights Reserved.';

        // Render location list items
        const locationItems = locations.map(loc => `
                            <li class="footer__widget--contact__list--items">
                                ${ICONS.location}
                                <a href="${escapeHtml(loc.url)}" target="_blank" rel="noopener">${escapeHtml(loc.name)}</a>
                            </li>`).join('');

        // Render one map per location
        const mapItems = locations.map(loc => {
            // Extract a usable query for the embed from the location's Google Maps URL
            let mapQuery = loc.name + ', Nairobi';
            try {
                const u = new URL(loc.url);
                // Search URLs: ?query=Noir+Boutique+...
                if (u.searchParams.has('query')) {
                    mapQuery = u.searchParams.get('query');
                }
                // Direct ?q= param
                else if (u.searchParams.has('q')) {
                    mapQuery = u.searchParams.get('q');
                }
                // Place URLs with coordinates: /@-1.29,36.76,...
                else {
                    const coordMatch = loc.url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                    if (coordMatch) {
                        mapQuery = coordMatch[1] + ',' + coordMatch[2];
                    }
                }
            } catch (e) { /* use fallback name */ }

            const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed&iwloc=near`;
            return `<div class="footer__map--item">
                        <span class="footer__map--label">${escapeHtml(loc.name)}</span>
                        <div class="footer__map--iframe-wrap">
                            <iframe
                                src="${embedSrc}"
                                allowfullscreen=""
                                loading="lazy"
                                referrerpolicy="no-referrer-when-downgrade"
                                title="${escapeHtml(loc.name)}">
                            </iframe>
                        </div>
                    </div>`;
        }).join('');

        el.innerHTML = `
        <div class="main__footer section--padding">
            <div class="footer__layout">
                <!-- Col 1: About -->
                <div class="footer__col--wide">
                    <div class="footer__widget">
                        <div class="footer__logo">
                            <a class="footer__logo--link" href="/">
                                <img alt="Mary Humphrey African Wear" class="offcanvas__logo--img" src="${escapeHtml(logoImg)}" />
                            </a>
                        </div>
                        <p class="footer__widget--desc">${escapeHtml(aboutText)}</p>
                        <ul class="footer__widget--contact__list">
                            <li class="footer__widget--contact__list--items">
                                ${ICONS.email}
                                <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>
                            </li>
                            <li class="footer__widget--contact__list--items">
                                ${ICONS.phone}
                                <a href="tel:+${phone.replace(/\D/g, '')}">${escapeHtml(phoneDisplay)}</a>
                            </li>
                            ${locationItems}
                        </ul>
                        <!-- Map Previews -->
                        <div class="footer__maps-grid">
                            ${mapItems}
                        </div>
                    
                        <!-- Social Media -->
                        <ul class="footer__widget--social__list">
                            <li class="footer__widget--social__list--items">
                                <a aria-label="Instagram" class="footer__widget--social__list--link" href="${escapeHtml(social.instagram || '#')}" target="_blank">
                                    ${ICONS.instagram}
                                </a>
                            </li>
                            <li class="footer__widget--social__list--items">
                                <a aria-label="Facebook" class="footer__widget--social__list--link" href="${escapeHtml(social.facebook || '#')}" target="_blank">
                                    ${ICONS.facebook}
                                </a>
                            </li>
                            <li class="footer__widget--social__list--items">
                                <a aria-label="TikTok" class="footer__widget--social__list--link" href="${escapeHtml(social.tiktok || '#')}" target="_blank">
                                    ${ICONS.tiktok}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <!-- Col 2: Our Collection -->
                <div class="footer__col--narrow">
                    <div class="footer__widget">
                        <h2 class="footer__widget--title">
                            Our Collection
                            <button aria-label="toggle" class="footer__widget--button"></button>
                            ${ICONS.arrowDown}
                        </h2>
                        <ul class="footer__widget--menu footer__widget--inner">
                            ${collectionLinks.map(l => `<li class="footer__widget--menu__list"><a class="footer__widget--menu__text" href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a></li>`).join('')}
                        </ul>
                    </div>
                </div>
                <!-- Col 3: Quick Links -->
                <div class="footer__col--narrow">
                    <div class="footer__widget">
                        <h2 class="footer__widget--title">
                            Quick Links
                            <button aria-label="toggle" class="footer__widget--button"></button>
                            ${ICONS.arrowDown}
                        </h2>
                        <ul class="footer__widget--menu footer__widget--inner">
                            ${quickLinks.map(l => `<li class="footer__widget--menu__list"><a class="footer__widget--menu__text" href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a></li>`).join('')}
                        </ul>
                    </div>
                </div>
                <!-- Col 4: Newsletter -->
                <div class="footer__col--wide">
                    <div class="footer__widget">
                        <h2 class="footer__widget--title">${escapeHtml(newsHeading)}</h2>
                        <p class="footer__widget--desc">${escapeHtml(newsDesc)}</p>
                        <form action="#" class="footer__newsletter--form" id="newsletter-form" method="POST" onsubmit="event.preventDefault(); window.handleNewsletterSubmit(this);">
                            <label for="newsletter-email">
                                <input class="footer__newsletter--input" id="newsletter-email" name="email" placeholder="Enter your email address" required="" type="email" />
                            </label>
                            <button class="footer__newsletter--btn primary__btn" type="submit">Subscribe</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <!-- Footer Bottom Bar -->
        <div class="footer__bottom">
            <div class="footer__bottom--inner-wrap">
                <div class="footer__bottom--inner">
                    <p class="copyright__content">${escapeHtml(copyright)}</p>
                    <div class="footer__payment">
                        <span class="footer__payment--label">M-Pesa &nbsp;&middot;&nbsp; Paybill &nbsp;&middot;&nbsp; Send Money</span>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    window.showNewsletterThankYouModal = function () {
        let modal = document.getElementById('newsletter-thankyou-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'newsletter-thankyou-modal';
            modal.style.cssText = `
                position: fixed;
                inset: 0;
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.55);
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                padding: 20px;
            `;

            modal.innerHTML = `
                <div style="
                    background: #ffffff;
                    max-width: 440px;
                    width: 100%;
                    border-radius: 16px;
                    padding: 40px 32px 36px;
                    text-align: center;
                    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
                    position: relative;
                    transform: scale(0.92);
                    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-sizing: border-box;
                ">
                    <button type="button" aria-label="Close" onclick="window.closeNewsletterThankYouModal()" style="
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        border: none;
                        background: #f5f5f5;
                        color: #555;
                        font-size: 16px;
                        line-height: 1;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: background 0.2s, color 0.2s;
                    " onmouseover="this.style.background='#e5e5e5';this.style.color='#111'" onmouseout="this.style.background='#f5f5f5';this.style.color='#555'">✕</button>

                    <div style="
                        width: 64px;
                        height: 64px;
                        background: linear-gradient(135deg, #fdeddf 0%, #f7d4aa 100%);
                        border: 2px solid #800020;
                        color: #800020;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                        box-shadow: 0 8px 16px rgba(128, 0, 32, 0.12);
                    ">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#800020" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>

                    <h3 style="
                        font-family: 'Frank Ruhl Libre', serif;
                        font-size: 2.2rem;
                        line-height: 1.25;
                        color: #1a1818;
                        margin: 0 0 12px;
                        font-weight: 700;
                    ">Thank You for Subscribing!</h3>

                    <p style="
                        font-size: 1.15rem;
                        line-height: 1.6;
                        color: #5c5755;
                        margin: 0 0 28px;
                    ">Welcome to the Mary Humphrey African Wear family. You will be the first to receive exclusive updates, new arrivals, and special VIP offers.</p>

                    <button type="button" onclick="window.closeNewsletterThankYouModal()" class="primary__btn" style="
                        width: 100%;
                        padding: 14px 28px;
                        font-size: 1.1rem;
                        font-weight: 600;
                        letter-spacing: 0.05em;
                        text-transform: uppercase;
                        border-radius: 8px;
                        cursor: pointer;
                    ">Continue</button>
                </div>
            `;

            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    window.closeNewsletterThankYouModal();
                }
            });

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && modal.style.visibility === 'visible') {
                    window.closeNewsletterThankYouModal();
                }
            });

            document.body.appendChild(modal);
        }

        // Trigger animation
        requestAnimationFrame(() => {
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            const card = modal.firstElementChild;
            if (card) {
                card.style.transform = 'scale(1)';
            }
        });
    };

    window.closeNewsletterThankYouModal = function () {
        const modal = document.getElementById('newsletter-thankyou-modal');
        if (!modal) return;
        modal.style.opacity = '0';
        const card = modal.firstElementChild;
        if (card) {
            card.style.transform = 'scale(0.92)';
        }
        setTimeout(() => {
            modal.style.visibility = 'hidden';
        }, 300);
    };

    window.handleNewsletterSubmit = async function (form) {
        const input = form.querySelector('input[type="email"]');
        const email = input ? input.value.trim() : '';
        const btn = form.querySelector('button[type="submit"]');

        if (!email) return;

        if (btn) btn.disabled = true;

        try {
            fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            }).catch(e => console.warn('Newsletter sync warning:', e));

            form.reset();
            window.showNewsletterThankYouModal();
        } catch (err) {
            form.reset();
            window.showNewsletterThankYouModal();
        } finally {
            if (btn) btn.disabled = false;
        }
    };

    async function initFooter() {
        const el = document.getElementById('site-footer') || document.querySelector('[data-section-id="footer"]') || document.querySelector('.footer__section');
        if (!el) return;

        try {
            const res = await fetch(FOOTER_JSON_URL);
            if (res.ok) {
                const data = await res.json();
                const footerSettings = data?.theme?.sections?.footer?.settings || data?.sections?.footer?.settings;
                if (footerSettings) {
                    renderFooter(el, footerSettings);
                    return;
                }
            }
        } catch (e) { }

        try {
            const resFallback = await fetch(FALLBACK_JSON_URL);
            if (resFallback.ok) {
                const dataFallback = await resFallback.json();
                const footerSettings = dataFallback?.sections?.footer?.settings;
                if (footerSettings) {
                    renderFooter(el, footerSettings);
                }
            }
        } catch (e) { }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFooter);
    } else {
        initFooter();
    }
})();
