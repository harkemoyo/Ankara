// assets/announcement.js
// =============================================
// Consolidated Announcement Bar System
// =============================================

class AnkaraAnnouncement {
    constructor() {
        this.baseText = "Free Shipping on Orders Over KSh 10,000";
        this.kesThreshold = 10000;
        this.autoFormat = true;
        this.initialized = false;
        
        // Listen to currency changes to dynamically format the text
        window.addEventListener('currency:changed', () => {
            this.render();
        });
        
        // Listen for settings loaded from Supabase CMS (which can override settings)
        window.addEventListener('settings:loaded', (e) => {
            const data = e.detail;
            if (data && data.announcement) {
                this.baseText = data.announcement;
            }
            this.render();
        });
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
                        // NOTE: This threshold matches the shipping cost threshold in src/services/checkoutService.js.
                        // If shipping rules change in the future, both must be updated.
                        this.kesThreshold = parseInt(settings.free_shipping_threshold_kes, 10);
                    }
                    this.autoFormat = settings.auto_format !== false;
                }
            }
        } catch (e) {
            console.error('Failed to fetch announcement settings:', e);
        }
        this.initialized = true;
        this.render();
    }

    render() {
        const annEl = document.getElementById('announcement-text');
        if (!annEl) return;

        if (!this.autoFormat) {
            annEl.textContent = this.baseText;
            return;
        }

        const currentCurrency = window.AnkaraCurrency ? window.AnkaraCurrency.current : 'KES';
        const rate = (window.AnkaraCurrency && window.AnkaraCurrency.rate) ? window.AnkaraCurrency.rate : 130.00;
        const usdThreshold = Math.round(this.kesThreshold / rate) || 80;

        if (currentCurrency === 'USD') {
            annEl.innerHTML = `✨ FREE SHIPPING ON ALL ORDERS ABOVE $${usdThreshold} | Celebrating African Heritage Through Fashion ✨`;
        } else {
            annEl.innerHTML = `✨ FREE SHIPPING ON ORDERS OVER KSh ${this.kesThreshold.toLocaleString()} | Celebrating African Heritage Through Fashion ✨`;
        }
    }
}

window.AnkaraAnnouncementManager = new AnkaraAnnouncement();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.AnkaraAnnouncementManager.init());
} else {
    window.AnkaraAnnouncementManager.init();
}
