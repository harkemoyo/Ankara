// assets/announcement.js
// =============================================
// Lightweight Rotating Announcement Bar System
// =============================================

class AnkaraAnnouncement {
    constructor() {
        this.baseText = "FREE Nairobi Delivery on Orders Over KSh 10,000";
        this.kesThreshold = 10000;
        this.autoFormat = true;
        this.currentIndex = 0;
        this.intervalId = null;
        this.isHovered = false;
        this.intervalMs = 4500; // rotate every 4.5 seconds

        // Listen to currency changes to dynamically format Slide 1
        window.addEventListener('currency:changed', () => {
            this.render();
        });

        // Listen for settings loaded from Supabase CMS
        window.addEventListener('settings:loaded', (e) => {
            const data = e.detail;
            if (data && data.announcement) {
                this.baseText = data.announcement;
            }
            this.render();
        });
    }

    getSlideData() {
        const currentCurrency = window.AnkaraCurrency ? window.AnkaraCurrency.current : 'KES';
        const rate = (window.AnkaraCurrency && window.AnkaraCurrency.rate) ? window.AnkaraCurrency.rate : 130.00;
        const usdThreshold = Math.round(this.kesThreshold / rate) || 80;

        const slide1Text = currentCurrency === 'USD'
            ? `🚚 FREE Nairobi Delivery on Orders Over $${usdThreshold}`
            : `🚚 FREE Nairobi Delivery on Orders Over KSh ${this.kesThreshold.toLocaleString()}`;

        return [
            slide1Text,
            `📍 Currently Delivering Within Nairobi County Only`,
            `✨ Celebrating African Heritage Through Fashion`
        ];
    }

    async init() {
        try {
            const res = await fetch('/api/theme');
            if (res.ok) {
                const { theme } = await res.json();
                if (theme && theme.sections && theme.sections.announcement) {
                    const settings = theme.sections.announcement.settings || {};
                    if (settings.text) this.baseText = settings.text;
                    if (settings.free_shipping_threshold_kes) {
                        this.kesThreshold = parseInt(settings.free_shipping_threshold_kes, 10);
                    }
                    this.autoFormat = settings.auto_format !== false;
                }
            }
        } catch (e) {
            console.error('Failed to fetch announcement settings:', e);
        }
        this.render();
        this.bindEvents();
        this.startAutoRotate();
    }

    render() {
        const annEl = document.getElementById('announcement-text');
        if (!annEl) return;

        const slides = this.getSlideData();

        annEl.setAttribute('aria-live', 'polite');
        annEl.setAttribute('aria-atomic', 'true');

        let track = annEl.querySelector('.announcement-slider-track');
        if (!track) {
            annEl.innerHTML = `<div class="announcement-slider-track"></div>`;
            track = annEl.querySelector('.announcement-slider-track');
        }

        track.innerHTML = slides.map((text, idx) => `
            <div class="announcement-slide ${idx === this.currentIndex ? 'active' : ''}" data-index="${idx}">
                <span>${text}</span>
            </div>
        `).join('');
    }

    nextSlide() {
        const annEl = document.getElementById('announcement-text');
        if (!annEl) return;

        const slideEls = annEl.querySelectorAll('.announcement-slide');
        if (!slideEls || slideEls.length === 0) return;

        // Remove active class from current slide
        slideEls[this.currentIndex]?.classList.remove('active');

        // Increment slide index
        this.currentIndex = (this.currentIndex + 1) % slideEls.length;

        // Add active class to new slide
        slideEls[this.currentIndex]?.classList.add('active');
    }

    bindEvents() {
        const topbar = document.querySelector('.header__topbar');
        const annEl = document.getElementById('announcement-text');
        const target = topbar || annEl;
        if (!target) return;

        target.addEventListener('mouseenter', () => {
            this.isHovered = true;
            this.pauseAutoRotate();
        });

        target.addEventListener('mouseleave', () => {
            this.isHovered = false;
            this.startAutoRotate();
        });
    }

    startAutoRotate() {
        this.pauseAutoRotate();

        // Check prefers-reduced-motion accessibility setting
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || this.isHovered) {
            return;
        }

        this.intervalId = setInterval(() => {
            this.nextSlide();
        }, this.intervalMs);
    }

    pauseAutoRotate() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}

window.AnkaraAnnouncementManager = new AnkaraAnnouncement();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AnkaraAnnouncementManager.init());
} else {
    window.AnkaraAnnouncementManager.init();
}
