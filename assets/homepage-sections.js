// Homepage Sections Renderer — fetches from /api/theme (Online Store 2.0)

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const updaters = {
  announcement(el, settings) {
    if (settings.text != null) el.textContent = settings.text;
  },

  hero(el, settings) {
    const slides = settings.slides || [];
    // Only update real slides, not Swiper loop duplicates
    const slideEls = el.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
    slideEls.forEach((slideEl, i) => {
      const sl = slides[i];
      if (!sl) return;
      if (sl.image) {
        slideEl.style.backgroundImage =
          `linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.05)), url("${sl.image.replace(/"/g, '\\"')}")`;
      }
      const subtitle = slideEl.querySelector('.hero-subtitle');
      if (subtitle && sl.subtitle) subtitle.textContent = sl.subtitle;
      const title = slideEl.querySelector('.hero-title');
      if (title && (sl.title || sl.accent)) {
        title.innerHTML = `${escapeHtml(sl.title || '')} <span class="hero-accent">${escapeHtml(sl.accent || '')}</span>`;
      }
      const desc = slideEl.querySelector('.hero-desc');
      if (desc && sl.desc) desc.textContent = sl.desc;
      const btn = slideEl.querySelector('.hero-btn');
      if (btn && sl.button) btn.firstChild.textContent = sl.button + ' ';
      if (btn && sl.link) btn.href = sl.link;
    });
    // Recreate Swiper loop duplicates so they match the updated real slides
    if (window.heroSwiper && typeof window.heroSwiper.loopDestroy === 'function') {
      try {
        window.heroSwiper.loopDestroy();
        window.heroSwiper.loopCreate();
        window.heroSwiper.update();
        window.heroSwiper.slideToLoop(0, 0);
      } catch (e) {
        console.warn('Swiper refresh error:', e);
      }
    }
  },

  categories(el, settings) {
    const blocks = settings.blocks || [];
    const blockEls = el.querySelectorAll('.category-block');
    blockEls.forEach((blockEl, i) => {
      const b = blocks[i];
      if (!b) return;
      const img = blockEl.querySelector('img');
      if (img && b.image) img.src = b.image;
      const titleEl = blockEl.querySelector('.category-title');
      if (titleEl && b.title) titleEl.textContent = b.title;
      const link = blockEl.querySelector('.category-link');
      if (link && b.link) link.href = b.link;
      const action = blockEl.querySelector('.category-action');
      if (action && b.action) action.textContent = b.action;
    });
  },

  trending(el, settings) {
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.heading) h.textContent = settings.heading;
    const grid = el.querySelector('.home-product-grid');
    if (grid && settings.collection) grid.dataset.collection = settings.collection;
    if (grid && settings.limit) grid.dataset.limit = settings.limit;
    const btn = el.querySelector('.view-all-center a');
    if (btn && settings.button_text) btn.textContent = settings.button_text;
    if (btn && settings.button_link) btn.href = settings.button_link;
  },

  style_of_month(el, settings) {
    const sub = el.querySelector('.botm-header-subtitle');
    if (sub && settings.subtitle) sub.textContent = settings.subtitle;
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.title) h.textContent = settings.title;
    const img = el.querySelector('.botm-image');
    if (img && settings.image) img.src = settings.image;
    const name = el.querySelector('.botm-title');
    if (name && settings.product_name) name.textContent = settings.product_name;
    const price = el.querySelector('.botm-price');
    if (price && settings.price) price.textContent = settings.price;
    const btn = el.querySelector('.botm-layout__content a');
    if (btn && settings.product_handle) btn.href = `product.html?handle=${encodeURIComponent(settings.product_handle)}`;
    if (btn && settings.button_text) btn.textContent = settings.button_text;
  },

  fabrics(el, settings) {
    const sub = el.querySelector('.botm-header-subtitle');
    if (sub && settings.subtitle) sub.textContent = settings.subtitle;
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.title) h.textContent = settings.title;
    const images = settings.images || [];
    const imgEls = el.querySelectorAll('img');
    imgEls.forEach((imgEl, i) => { if (images[i]) imgEl.src = images[i]; });
    const btn = el.querySelector('.view-all-center a');
    if (btn && settings.button_text) btn.textContent = settings.button_text + ' →';
    if (btn && settings.button_link) btn.href = settings.button_link;
  },

  heritage(el, settings) {
    const sub = el.querySelector('.hc-subtitle');
    if (sub && settings.subtitle) sub.textContent = settings.subtitle;
    const segments = settings.segments || [];
    const segEls = el.querySelectorAll('.js-hc-segment');
    segEls.forEach((segEl, i) => {
      const seg = segments[i];
      if (!seg) return;
      if (seg.label) { const lbl = segEl.querySelector('.hc-segment-label'); if (lbl) lbl.textContent = seg.label; }
      if (seg.title) segEl.dataset.title = seg.title;
      if (seg.desc) segEl.dataset.desc = seg.desc;
      if (seg.image) segEl.dataset.image = seg.image;
    });
    // Set initial state from first segment
    if (segments[0]) {
      const img = el.querySelector('.hc-image');
      if (img && segments[0].image) img.src = segments[0].image;
      const title = el.querySelector('.hc-title');
      if (title && segments[0].title) title.textContent = segments[0].title;
      const desc = el.querySelector('.hc-desc');
      if (desc && segments[0].desc) desc.textContent = segments[0].desc;
    }
  },

  sale_promo(el, settings) {
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.title) h.textContent = settings.title;
    const p = el.querySelector('p');
    if (p && settings.description) p.textContent = settings.description;
    const btn = el.querySelector('.view-all-center a');
    if (btn && settings.button_text) btn.textContent = settings.button_text + ' →';
    if (btn && settings.button_link) btn.href = settings.button_link;
    if (settings.bg_color) el.style.backgroundColor = settings.bg_color;
  },

  shop_by_style(el, settings) {
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.title) h.textContent = settings.title;
    const blocks = settings.blocks || [];
    const blockEls = el.querySelectorAll('.style-block');
    blockEls.forEach((blockEl, i) => {
      const b = blocks[i];
      if (!b) return;
      const img = blockEl.querySelector('img');
      if (img && b.image) img.src = b.image;
      const span = blockEl.querySelector('.style-overlay span');
      if (span && b.label) span.textContent = b.label;
      const link = blockEl.querySelector('a');
      if (link && b.link) link.href = b.link;
    });
  },

  statement(el, settings) {
    if (settings.bg_image) el.style.backgroundImage = `url('${settings.bg_image}')`;
    const h = el.querySelector('.home-statement__title');
    if (h && settings.title) h.textContent = settings.title;
    const p = el.querySelector('.home-statement__text');
    if (p && settings.description) p.textContent = settings.description;
    const btn = el.querySelector('.slider__btn');
    if (btn && settings.button_text) btn.textContent = settings.button_text;
    if (btn && settings.button_link) btn.href = settings.button_link;
  },

  testimonials(el, settings) {
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.heading) h.textContent = settings.heading;
    const items = settings.items || [];
    const cards = el.querySelectorAll('.testimonial-card');
    cards.forEach((card, i) => {
      const t = items[i];
      if (!t) return;
      const stars = card.querySelector('.stars');
      if (stars && t.rating) stars.textContent = '★'.repeat(t.rating) + '☆'.repeat(5 - t.rating);
      const p = card.querySelector('p');
      if (p && t.quote) p.textContent = `"${t.quote}"`;
      const name = card.querySelector('h4');
      if (name && t.author) name.textContent = t.author;
    });
  },

  services(el, settings) {
    const items = settings.items || [];
    const serviceEls = el.querySelectorAll('.service-item');
    serviceEls.forEach((svcEl, i) => {
      const svc = items[i];
      if (!svc) return;
      const h = svcEl.querySelector('h3');
      if (h && svc.title) h.textContent = svc.title;
      const p = svcEl.querySelector('p');
      if (p && svc.description) p.textContent = svc.description;
    });
  },

  footer(el, settings) {
    const desc = el.querySelector('.footer__widget--desc');
    if (desc && settings.about) desc.textContent = settings.about;
    const logo = el.querySelector('.offcanvas__logo--img');
    if (logo && settings.logo) logo.src = settings.logo;
    const contactItems = el.querySelectorAll('.footer__widget--contact__list--items');
    if (contactItems[0] && (settings.location || settings.location_url)) {
      const svg = contactItems[0].querySelector('svg');
      const locName = (settings.location || 'Our Location').trim();
      const locUrl = (settings.location_url || '').trim();
      contactItems[0].textContent = '';
      if (svg) contactItems[0].appendChild(svg);
      if (locUrl) {
        const a = document.createElement('a');
        a.href = locUrl;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = ' ' + locName;
        contactItems[0].appendChild(a);
      } else {
        contactItems[0].append(' ' + locName);
      }
    }
    if (contactItems[1] && settings.email) {
      const a = contactItems[1].querySelector('a');
      if (a) { a.textContent = settings.email; a.href = 'mailto:' + settings.email; }
    }
    // Social links
    if (settings.social) {
      const socialLinks = el.querySelectorAll('.footer__widget--social__list--link');
      const urls = [settings.social.instagram, settings.social.facebook, settings.social.tiktok];
      socialLinks.forEach((a, i) => { if (urls[i]) a.href = urls[i]; });
    }
    // Collection links
    if (settings.collection_links) {
      const col = el.querySelectorAll('.footer__col--narrow');
      if (col[0]) {
        const items = col[0].querySelectorAll('.footer__widget--menu__text');
        settings.collection_links.forEach((l, i) => {
          if (items[i]) { items[i].textContent = l.label; items[i].href = l.url; }
        });
      }
    }
    // Quick links
    if (settings.quick_links) {
      const col = el.querySelectorAll('.footer__col--narrow');
      if (col[1]) {
        const items = col[1].querySelectorAll('.footer__widget--menu__text');
        settings.quick_links.forEach((l, i) => {
          if (items[i]) { items[i].textContent = l.label; items[i].href = l.url; }
        });
      }
    }
    // Newsletter
    const newsTitle = el.querySelector('.footer__col--wide:last-child .footer__widget--title');
    if (newsTitle && settings.newsletter_heading) newsTitle.textContent = settings.newsletter_heading;
    const newsDesc = el.querySelector('.footer__col--wide:last-child .footer__widget--desc');
    if (newsDesc && settings.newsletter_desc) newsDesc.textContent = settings.newsletter_desc;
    // Copyright
    if (settings.copyright) {
      const copy = el.querySelector('.copyright__content');
      if (copy) copy.innerHTML = escapeHtml(settings.copyright);
    }
  }
};

async function applyThemeSections() {
  try {
    const res = await fetch('/api/theme');
    if (!res.ok) return;
    const json = await res.json();
    const theme = json.theme;
    if (!theme || !theme.sections) return;
    const order = theme.order || Object.keys(theme.sections);
    order.forEach(key => {
      const sec = theme.sections[key];
      if (!sec) return;
      if (sec.enabled === false) {
        const el = document.querySelector(`[data-section-id="${key}"]`);
        if (el) el.style.display = 'none';
        return;
      }
      const el = document.querySelector(`[data-section-id="${key}"]`);
      if (!el) return;
      const fn = updaters[sec.type || key];
      if (fn) fn(el, sec.settings || {});
    });
  } catch (e) {
    console.error('Theme sections render error', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyThemeSections);
} else {
  applyThemeSections();
}
