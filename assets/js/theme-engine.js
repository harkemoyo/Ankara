// assets/js/theme-engine.js
// Online Store 2.0 Theme JSON Section Rendering Engine
// ====================================================

import FeaturedCollection from './components/FeaturedCollection.js';

export default class ThemeEngine {
    constructor(containerEl) {
        this.container = containerEl || document.getElementById('theme-layout-sections');
        if (!this.container) return;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('/api/theme');
            if (!response.ok) return;
            const data = await response.json();
            if (data.theme) {
                this.renderSections(data.theme);
            }
        } catch (e) {
            console.warn('ThemeEngine: loaded defaults or bypassed', e);
        }
    }

    renderSections(theme) {
        const { sections, order } = theme;
        if (!sections || !order) return;

        order.forEach(sectionId => {
            const config = sections[sectionId];
            if (!config) return;

            let sectionEl = document.getElementById(`section-${sectionId}`);
            if (!sectionEl) {
                sectionEl = document.createElement('section');
                sectionEl.id = `section-${sectionId}`;
                sectionEl.className = `theme-section section-${config.type}`;
                this.container.appendChild(sectionEl);
            }

            this.mountSection(sectionEl, config);
        });
    }

    mountSection(el, config) {
        const settings = config.settings || {};

        if (config.type === 'hero') {
            const heading = settings.heading || 'Contemporary African Fashion';
            const sub = settings.subheading || 'Bold prints, exquisite craftsmanship, and timeless designs.';
            const btn = settings.button_text || 'Explore Shop';
            const link = settings.button_link || '/shop';

            const headingEl = el.querySelector('.hero-dynamic-heading');
            const subEl = el.querySelector('.hero-dynamic-sub');
            const btnEl = el.querySelector('.hero-dynamic-btn');

            if (headingEl) headingEl.textContent = heading;
            if (subEl) subEl.textContent = sub;
            if (btnEl) {
                btnEl.textContent = btn;
                btnEl.setAttribute('href', link);
            }
        }

        if (config.type === 'featured-collection') {
            const collection = settings.collection || 'all';
            const limit = settings.limit || 4;

            el.setAttribute('data-collection', collection);
            el.setAttribute('data-limit', limit);

            new FeaturedCollection(el);
        }
    }
}

// Auto-initialize if root container is present
document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('theme-layout-sections');
    if (root) new ThemeEngine(root);
});
