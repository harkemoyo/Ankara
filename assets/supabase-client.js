// assets/supabase-client.js
// =============================================
// Replace the two values below with your real
// Supabase Project URL and anon key from:
// Supabase Dashboard → Settings → API
// =============================================

const SUPABASE_URL = 'https://oscqakcygvvtjngbuhbw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_0lphROA0QZoxj4CGqsI3iA_gXjSS2UF';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Multi-Currency Helper on Window Object
window.AnkaraCurrency = {
    current: localStorage.getItem('mhw-currency') || 'KES',
    rate: 130.00, // Default fallback
    convertAndFormat(usdPrice) {
        const priceNum = parseFloat(usdPrice) || 0;
        if (this.current === 'KES') {
            const kesPrice = priceNum * this.rate;
            // Round to nearest integer for clean KSh formatting, add commas
            return `KSh ${Math.round(kesPrice).toLocaleString()}`;
        }
        return `$${priceNum.toFixed(2)}`;
    },
    setCurrency(currency) {
        this.current = currency;
        localStorage.setItem('mhw-currency', currency);
        window.dispatchEvent(new CustomEvent('currency:changed', { detail: currency }));
    }
};

// Initialize settings and exchange rate
supabase.from('settings').select('*').eq('id', 1).single().then(({ data, error }) => {
    if (!error && data) {
        if (data.exchange_rate) {
            window.AnkaraCurrency.rate = parseFloat(data.exchange_rate);
        }
        // Fire settings loaded event
        window.dispatchEvent(new CustomEvent('settings:loaded', { detail: data }));
    }
});

// UI Sync logic
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sync Currency Switchers
    const switchers = document.querySelectorAll('.currency-switcher');
    switchers.forEach(sw => {
        sw.value = window.AnkaraCurrency.current;
    });

    window.addEventListener('currency:changed', (e) => {
        switchers.forEach(sw => {
            sw.value = e.detail;
        });
    });

    // 2. Announcement Bar Rotation
    let announcements = [];
    let currentAnnIdx = 0;
    const annEl = document.getElementById('announcement-text');

    window.addEventListener('settings:loaded', (e) => {
        const data = e.detail;
        if (data.announcements && Array.isArray(data.announcements) && data.announcements.length > 0) {
            announcements = data.announcements;
            if (annEl) {
                annEl.textContent = announcements[0];
                if (announcements.length > 1) {
                    setInterval(() => {
                        annEl.style.opacity = 0;
                        setTimeout(() => {
                            currentAnnIdx = (currentAnnIdx + 1) % announcements.length;
                            annEl.textContent = announcements[currentAnnIdx];
                            annEl.style.opacity = 1;
                        }, 500); // 500ms fade duration
                    }, 5000); // Rotate every 5 seconds
                }
            }
        }
    });
});
