// Homepage Sections Renderer — fetches from /api/theme (Online Store 2.0)

function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}const updaters = {
  announcement(el, settings) {
    // Handled dynamically by assets/announcement.js
  },

  hero(el, settings) {
    const slides = settings.slides || [];
    const wrapper = el.querySelector('.swiper-wrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = slides.map(sl => `
      <div class="swiper-slide" style="background-image: linear-gradient(rgba(0,0,0,0.25),rgba(0,0,0,0.45)), url('${escapeHtml(sl.image || '')}');">
        <div class="hero-container">
          <div class="hero-content">
            <span class="hero-subtitle">${escapeHtml(sl.subtitle || '')}</span>
            <h2 class="hero-title">${escapeHtml(sl.title || '')} <span class="hero-accent">${escapeHtml(sl.accent || '')}</span></h2>
            <p class="hero-desc">${escapeHtml(sl.desc || '')}</p>
            <a class="hero-btn" href="${escapeHtml(sl.link || '/shop')}">
              ${escapeHtml(sl.button || 'Shop Now')}
              <svg fill="none" height="11" viewBox="0 0 17 12" width="16"><path d="M15.9732 5.19375L11.1893 0.460018C10.9 0.15 10.5 0.15 10.2 0.465L13.65 4.986L0.936 5.051C0.734 5.066 0.546 5.151 0.41 5.29C0.273 5.43 0.197 5.61 0.198 5.799C0.199 5.987 0.276 6.169 0.415 6.306C0.553 6.443 0.742 6.526 0.944 6.539L13.659 6.474L10.187 9.982C9.971 10.313 9.973 10.702 10.192 11.033C10.359 11.2 10.58 11.246 10.718 11.246C10.817 11.246 11.014 11.226 11.104 11.188C11.194 11.151 11.275 11.096 11.241 11.027L15.979 6.255C16.121 6.109 16.199 5.92 16.198 5.723C16.197 5.527 16.117 5.338 15.973 5.194Z" fill="currentColor"></path></svg>
            </a>
          </div>
        </div>
      </div>
    `).join('');

    if (window.heroSwiper && typeof window.heroSwiper.destroy === 'function') {
      try { window.heroSwiper.destroy(true, true); } catch(e){}
    }
    if (typeof Swiper !== 'undefined') {
      window.heroSwiper = new Swiper('.hero-swiper', {
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.hero-pagination', clickable: true }
      });
    }
  },

  categories(el, settings) {
    const blocks = settings.blocks || [];
    const grid = el.querySelector('.home-category-grid');
    if (!grid) return;
    grid.innerHTML = blocks.map(b => `
      <div class="category-block">
        <a class="category-link" href="${escapeHtml(b.link || '/shop')}">
          <div class="category-image-wrap">
            <img alt="${escapeHtml(b.title || '')}" loading="lazy" decoding="async" src="${escapeHtml(b.image || '')}" />
          </div>
          <div class="category-text-wrap">
            <h3 class="category-title">${escapeHtml(b.title || '')}</h3>
            <span class="category-action">${escapeHtml(b.action || 'Shop Now')}</span>
          </div>
        </a>
      </div>
    `).join('');
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

  async style_of_month(el, settings) {
    const sub = el.querySelector('.botm-header-subtitle');
    if (sub && settings.subtitle) sub.textContent = settings.subtitle;
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.title) h.textContent = settings.title;

    if (!settings.product_handle) return;

    try {
      const res = await fetch(`/api/products?handle=${settings.product_handle}`);
      if (res.ok) {
        const data = await res.json();
        const product = data.product || (data.products && data.products.find(p => p.handle === settings.product_handle));
        if (product) {
          window._botmProduct = product; // Store globally for actions
          const layout = el.querySelector('.botm-layout');
          if (layout) {
            const primaryImage = (product.images && product.images.length > 0) ? product.images[0] : (settings.image || 'assets/placeholder.webp');
            const imagesList = product.images || [primaryImage];
            const colors = product.colors || [];
            const sizes = product.sizes || ['S', 'M', 'L'];
            const price = parseFloat(product.price);
            const vendor = product.vendor || 'MARY HUMPHREY AFRICAN WEAR';

            // Selected variables state
            layout.dataset.selectedSize = sizes[0] || 'M';
            layout.dataset.selectedColor = colors[0] ? colors[0].label : '';
            layout.dataset.quantity = '1';

            layout.innerHTML = `
              <!-- Left Side: Images & Thumbnails -->
              <div class="botm-layout__image">
                  <div class="botm-image-wrap">
                      <img id="botm-main-image" alt="${product.title}" class="botm-image" src="${primaryImage}" />
                  </div>
                  <!-- Thumbnails list -->
                  ${imagesList.length > 1 ? `
                  <div class="botm-thumbnails">
                      ${imagesList.map((img, idx) => `
                          <div class="botm-thumb-item ${idx === 0 ? 'active' : ''}"
                               onclick="selectBotmThumbnail(this, '${img}')">
                              <img src="${img}" />
                          </div>
                      `).join('')}
                  </div>` : ''}
              </div>

              <!-- Right Side: Details & Actions -->
              <div class="botm-layout__content botm-content">
                  <span class="botm-vendor">${vendor}</span>
                  <h3 class="botm-title">${product.title}</h3>
                  <div class="botm-price">
                      ${window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(product.price) : `KSh ${price.toLocaleString()}`}
                  </div>
                  <span class="botm-tax">Tax included. Shipping calculated at checkout.</span>

                  <!-- Color Selection -->
                  ${colors.length > 0 ? `
                  <div class="botm-option botm-color">
                      <div class="botm-option-label">Colour: <span id="botm-selected-color-label" class="botm-option-value">${colors[0].label}</span></div>
                      <div class="botm-color-options">
                          ${colors.map((c, i) => `
                              <span class="botm-color-swatch ${i === 0 ? 'active' : ''}"
                                    data-hex="${c.hex}"
                                    title="${c.label}"
                                    onclick="selectBotmColor(this, '${c.label.replace(/'/g, "\\'")}', '${c.image || primaryImage}')"
                              ></span>
                          `).join('')}
                      </div>
                  </div>` : ''}

                  <!-- Size Selection -->
                  <div class="botm-option botm-size">
                      <div class="botm-option-label">Size: <span id="botm-selected-size-label" class="botm-option-value">${sizes[0]}</span></div>
                      <div class="botm-size-options">
                          ${sizes.map((sz, i) => `
                              <button class="botm-size-btn ${i === 0 ? 'active' : ''}"
                                      onclick="selectBotmSize(this, '${sz}')"
                              >${sz}</button>
                          `).join('')}
                      </div>
                  </div>

                  <!-- Quantity Stepper -->
                  <div class="botm-qty">
                      <span class="botm-qty-label">Quantity</span>
                      <div class="botm-qty-stepper">
                          <button class="botm-qty-btn" onclick="changeBotmQty(-1)">-</button>
                          <input id="botm-qty-input" type="number" value="1" min="1" readonly />
                          <button class="botm-qty-btn" onclick="changeBotmQty(1)">+</button>
                      </div>
                  </div>

                  <!-- Call To Actions -->
                  <div class="botm-actions">
                      <button class="botm-atc-btn" onclick="addBotmToCart(false)">Add to Bag</button>
                      <button class="botm-bin-btn" onclick="addBotmToCart(true)">Buy It Now</button>
                  </div>
              </div>
            `;

            layout.querySelectorAll('.botm-color-swatch').forEach(s => {
              s.style.backgroundColor = s.dataset.hex;
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load featured style product details:', err);
    }
  },

  fabrics(el, settings) {
    if (settings.bg_color) {
      el.style.backgroundColor = settings.bg_color;
    }
    const sub = el.querySelector('.botm-header-subtitle');
    if (sub && settings.subtitle) sub.textContent = settings.subtitle;
    const h = el.querySelector('.section__heading--maintitle');
    if (h && settings.title) h.textContent = settings.title;
    const images = settings.images || [];
    const container = el.querySelector('.fabrics-grid');
    if (container) {
      container.innerHTML = images.map((imgUrl, i) => `
        <div style="aspect-ratio: 1/1; overflow: hidden; border-radius: 4px;">
          <img src="${escapeHtml(imgUrl)}" alt="Fabric ${i+1}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'" loading="lazy">
        </div>
      `).join('');
    }
    const btn = el.querySelector('.view-all-center a');
    if (btn && settings.button_text) btn.textContent = settings.button_text + ' →';
    if (btn && settings.button_link) btn.href = settings.button_link;
  },

  heritage(el, settings) {
    const sub = el.querySelector('.hc-subtitle');
    if (sub && settings.subtitle) sub.textContent = settings.subtitle;
    const segments = settings.segments || [];
    const container = el.querySelector('.hc-segments');
    if (container && segments.length > 0) {
      container.innerHTML = segments.map((seg, i) => `
        <div class="hc-segment ${i === 0 ? 'active' : ''} js-hc-segment"
          data-desc="${escapeHtml(seg.desc || '')}"
          data-image="${escapeHtml(seg.image || '')}" data-title="${escapeHtml(seg.title || '')}">
          <div class="hc-segment-bar"></div>
          <span class="hc-segment-label">${escapeHtml(seg.label || '')}</span>
        </div>
      `).join('');

      container.querySelectorAll('.js-hc-segment').forEach(segEl => {
        segEl.addEventListener('click', () => {
          container.querySelectorAll('.js-hc-segment').forEach(s => s.classList.remove('active'));
          segEl.classList.add('active');
          const img = el.querySelector('.hc-image');
          if (img && segEl.dataset.image) img.src = segEl.dataset.image;
          const title = el.querySelector('.hc-title');
          if (title && segEl.dataset.title) title.textContent = segEl.dataset.title;
          const desc = el.querySelector('.hc-desc');
          if (desc && segEl.dataset.desc) desc.textContent = segEl.dataset.desc;
        });
      });
    }
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
    const grid = el.querySelector('.style-grid');
    if (grid) {
      grid.innerHTML = blocks.map(b => `
        <div class="style-block">
          <a href="${escapeHtml(b.link || '/shop')}">
            <img alt="${escapeHtml(b.label || '')}" loading="lazy" decoding="async" src="${escapeHtml(b.image || '')}" />
            <div class="style-overlay">
              <span>${escapeHtml(b.label || '')}</span>
            </div>
          </a>
        </div>
      `).join('');
    }
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
    const wrapper = el.querySelector('.swiper-wrapper');
    if (wrapper) {
      wrapper.innerHTML = items.map(t => `
        <div class="swiper-slide">
          <div class="testimonial-card">
            <div class="stars">${'★'.repeat(t.rating || 5)}${'☆'.repeat(5 - (t.rating || 5))}</div>
            <p>"${escapeHtml(t.quote || '')}"</p>
            <h4>${escapeHtml(t.author || '')}</h4>
          </div>
        </div>
      `).join('');

      if (typeof Swiper !== 'undefined') {
        new Swiper('.testimonial__swiper', {
          slidesPerView: 1,
          spaceBetween: 30,
          pagination: { el: '.swiper-pagination', clickable: true },
          breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
        });
      }
    }
  },

  services(el, settings) {
    const items = settings.items || [];
    const grid = el.querySelector('.services-grid');
    const icons = {
      truck: `<svg fill="none" height="40" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" width="40"><path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
      lock: `<svg fill="none" height="40" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" width="40"><path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
      heart: `<svg fill="none" height="40" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" width="40"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" stroke-linecap="round" stroke-linejoin="round"></path></svg>`
    };
    if (grid) {
      grid.innerHTML = items.map(svc => `
        <div class="service-item">
          ${icons[svc.icon] || icons.truck}
          <h3>${escapeHtml(svc.title || '')}</h3>
          <p>${escapeHtml(svc.description || '')}</p>
        </div>
      `).join('');
    }
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
  },

  outlet(el, settings) {
    const subtitle = el.querySelector('.outlet-subtitle');
    if (subtitle && settings.subtitle) subtitle.textContent = settings.subtitle;
    const h = el.querySelector('.outlet-title');
    if (h && settings.title) h.textContent = settings.title;
    const desc = el.querySelector('.outlet-desc');
    if (desc && settings.description) desc.textContent = settings.description;
    const btn = el.querySelector('.outlet-cta');
    if (btn) {
      if (settings.button_text) btn.textContent = settings.button_text;
      if (settings.button_link) btn.href = settings.button_link;
    }
    const slides = settings.slides || (settings.images || []).map(url => ({ type: 'image', url }));
    const wrapper = el.querySelector('.outlet-slides');
    if (wrapper && slides.length) {
      wrapper.innerHTML = slides.map(sl => {
        if (sl.type === 'video') {
          return `<div class="swiper-slide outlet-slide">
            <video class="outlet-video" src="${escapeHtml(sl.url)}" muted playsinline loop preload="metadata"></video>
          </div>`;
        }
        return `<div class="swiper-slide outlet-slide">
          <img alt="" loading="lazy" decoding="async" src="${escapeHtml(sl.url)}" />
        </div>`;
      }).join('');
      if (window._outletSwiper && typeof window._outletSwiper.destroy === 'function') {
        try { window._outletSwiper.destroy(true, true); } catch(e){}
      }
      if (typeof Swiper !== 'undefined') {
        window._outletSwiper = new Swiper('.outlet-swiper', {
          slidesPerView: 1.2,
          spaceBetween: 16,
          loop: slides.length > 3,
          autoplay: { delay: 4500, disableOnInteraction: false },
          pagination: { el: '.outlet-pagination', clickable: true },
          navigation: { prevEl: '.outlet-prev', nextEl: '.outlet-next' },
          breakpoints: {
            576: { slidesPerView: 2, spaceBetween: 20 },
            992: { slidesPerView: 3, spaceBetween: 24 }
          },
          on: {
            slideChangeTransitionStart: function () {
              const activeSlide = this.slides[this.activeIndex];
              if (activeSlide) {
                const video = activeSlide.querySelector('video');
                if (video) video.play();
              }
            },
            slideChangeTransitionEnd: function () {
              this.slides.forEach((slide, i) => {
                if (i !== this.activeIndex) {
                  const v = slide.querySelector('video');
                  if (v) { v.pause(); v.currentTime = 0; }
                }
              });
            }
          }
        });
        const firstVideo = wrapper.querySelector('.swiper-slide-active video');
        if (firstVideo) firstVideo.play();
      }
    }
  },

  custom_css(el, settings) {
    if (settings.primary_color) document.documentElement.style.setProperty('--primary-color', settings.primary_color);
    if (settings.secondary_color) document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
    if (settings.bg_color) document.documentElement.style.setProperty('--body-background-color', settings.bg_color);
    if (settings.custom_css) {
      let styleTag = document.getElementById('dynamic-theme-custom-css');
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-theme-custom-css';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = settings.custom_css;
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
    const allSections = document.querySelectorAll('[data-section-id]');
    allSections.forEach(el => {
      if (el.id === 'site-footer') return;
      el.style.display = 'none';
    });
    const order = theme.order || Object.keys(theme.sections);
    order.forEach(key => {
      const sec = theme.sections[key];
      if (!sec || sec.enabled === false) return;
      const el = document.querySelector(`[data-section-id="${key}"]`);
      if (!el) return;
      el.style.display = '';
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

// =============================================
// STYLE OF THE MONTH (Featured Product) Handlers
// =============================================
window.selectBotmThumbnail = function(thumbEl, imgUrl) {
  const mainImg = document.getElementById('botm-main-image');
  if (mainImg) mainImg.src = imgUrl;

  const parent = thumbEl.parentNode;
  if (parent) {
    parent.querySelectorAll('.botm-thumb-item').forEach(item => {
      item.classList.remove('active');
    });
  }
  thumbEl.classList.add('active');
};

window.selectBotmColor = function(swatchEl, colorLabel, imgUrl) {
  const labelEl = document.getElementById('botm-selected-color-label');
  if (labelEl) labelEl.textContent = colorLabel;

  const mainImg = document.getElementById('botm-main-image');
  if (mainImg) mainImg.src = imgUrl;

  const parent = swatchEl.parentNode;
  if (parent) {
    parent.querySelectorAll('.botm-color-swatch').forEach(s => {
      s.classList.remove('active');
    });
  }
  swatchEl.classList.add('active');

  const layout = document.querySelector('.botm-layout');
  if (layout) layout.dataset.selectedColor = colorLabel;
};

window.selectBotmSize = function(btnEl, sizeVal) {
  const labelEl = document.getElementById('botm-selected-size-label');
  if (labelEl) labelEl.textContent = sizeVal;

  const parent = btnEl.parentNode;
  if (parent) {
    parent.querySelectorAll('.botm-size-btn').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  btnEl.classList.add('active');

  const layout = document.querySelector('.botm-layout');
  if (layout) layout.dataset.selectedSize = sizeVal;
};

window.changeBotmQty = function(delta) {
  const input = document.getElementById('botm-qty-input');
  if (input) {
    let current = parseInt(input.value) || 1;
    current += delta;
    if (current < 1) current = 1;
    input.value = current;

    const layout = document.querySelector('.botm-layout');
    if (layout) layout.dataset.quantity = current.toString();
  }
};

window.addBotmToCart = function(isBuyNow) {
  const product = window._botmProduct;
  if (!product) return;

  const layout = document.querySelector('.botm-layout');
  if (!layout) return;

  const qty = parseInt(layout.dataset.quantity) || 1;
  const size = layout.dataset.selectedSize || 'M';
  const color = layout.dataset.selectedColor || '';

  // Get current main image
  const mainImg = document.getElementById('botm-main-image');
  const finalImage = mainImg ? mainImg.src : (product.images && product.images[0]) || '';

  if (typeof window.addToCart === 'function') {
    window.addToCart({
      id: product.handle,
      title: product.title,
      price: product.price,
      image: finalImage,
      qty: qty,
      size: size,
      color: color
    });

    if (isBuyNow) {
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 300);
    }
  }
};
