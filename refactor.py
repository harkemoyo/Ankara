import re
import sys

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add CSS
css = """
        /* ══ Refactored Extracted CSS ══ */
        .product__card--swatches { display:flex; justify-content:center; gap:0.5rem; margin-top:0.8rem; }
        .swatch-item { width:1.5rem; height:1.5rem; border-radius:50%; border: 2px solid transparent; cursor: pointer; }
        .swatch-item.active { border-color: #fff; box-shadow: 0 0 0 1px var(--primary-color); }
        .swatch-item.large { width: 3rem; height: 3rem; }

        .quickview__header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color); margin-bottom: 3rem; }
        .quickview__title { font-family: var(--frank-ruhl-fonts); font-size: 2.2rem; color: var(--primary-color); font-weight: 600; }
        .quickview__product-info { display: flex; gap: 2rem; margin-bottom: 3rem; }
        .quickview__img-wrap { flex: 0 0 80px; height: 80px; background: #fff; padding: 0.5rem; border: 1px solid var(--border-color); }
        .quickview__img { width: 100%; height: 100%; object-fit: contain; }
        .quickview__brand-label { font-size: 1.1rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--foreground-sub-color); margin-bottom: 0.5rem; }
        .quickview__product-title { font-family: var(--frank-ruhl-fonts); font-size: 1.8rem; color: var(--primary-color); margin-bottom: 0.5rem; }
        .quickview__price-wrap { font-size: 1.4rem; color: var(--primary-color); }
        .quickview__price { margin-right: 1rem; }
        .quickview__details-link { text-decoration: underline; font-size: 1.2rem; color: var(--foreground-sub-color); }
        .quickview__color-wrap { margin-bottom: 2.5rem; }
        .quickview__color-label { font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem; }
        .quickview__color-value { color: var(--foreground-sub-color); }
        .quickview__swatches { display: flex; gap: 1.2rem; }
        .quickview__qty-wrap { margin-bottom: 3rem; }
        .quickview__qty-label { font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem; }
        .quickview__qty-selector { display: inline-flex; align-items: center; border: 1px solid var(--border-color); border-radius: 4px; background: #fff; padding: 0.5rem; }
        .qty-btn { border: none; background: transparent; padding: 0.8rem 1.5rem; font-size: 1.6rem; color: var(--primary-color); cursor: pointer; }
        .qty-input { width: 4rem; text-align: center; border: none; font-size: 1.4rem; color: var(--primary-color); outline: none; background: transparent; }
        .quickview__actions { display: flex; flex-direction: column; gap: 1.5rem; }
        
        .bag-of-the-month { padding: 8rem 0; background-color: var(--body-background-color); }
        .botm-header-subtitle { display: block; font-size: 1.25rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--foreground-sub-color); margin-bottom: 1rem; }
        .botm-image-wrap { background: #fff; padding: 4rem; text-align: center; }
        .botm-image { width: 100%; max-width: 400px; display: inline-block; }
        .botm-content { padding-left: 5rem; }
        .botm-title { font-family: var(--frank-ruhl-fonts); font-size: 3.2rem; margin-bottom: 1.5rem; color: var(--primary-color); line-height: 1.2; }
        .botm-price { font-size: 2.2rem; color: var(--primary-color); margin-bottom: 1.5rem; }
        .botm-reviews { font-size: 1.3rem; color: var(--foreground-sub-color); margin-bottom: 3rem; display: flex; align-items: center; gap: 0.5rem; }
        .botm-stars { color: #e5e5e5; }
        .botm-color-label { font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem; }
        .botm-color-val { font-weight: 500; }
        .botm-actions { display: flex; flex-direction: column; gap: 1.5rem; max-width: 450px; }
        .botm-btn { padding: 1.6rem; font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; border: none; font-weight: 600; cursor: pointer; transition: background 0.3s; }
        .botm-btn.large { padding: 1.8rem; font-size: 1.4rem; }
        .botm-btn-primary { background: var(--primary-color); color: #fff; }
        .botm-btn-secondary { background: var(--secondary-color); color: #fff; }

        .heritage-culture-section { padding: 8rem 0; background-color: var(--bg-offwhite-color); }
        .hc-image { width: 100%; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .hc-content { padding: 4rem 5rem; text-align: center; }
        .hc-subtitle { display: block; font-size: 1.25rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--primary-color); margin-bottom: 1.5rem; }
        .hc-title { font-family: var(--frank-ruhl-fonts); font-size: 4rem; color: var(--primary-color); margin-bottom: 2.5rem; line-height: 1.2; }
        .hc-desc { font-size: 1.6rem; color: var(--foreground-sub-color); line-height: 1.9; margin-bottom: 5rem; }
        .hc-segments { display: flex; justify-content: center; gap: 5rem; }
        .hc-segment { text-align: center; cursor: pointer; opacity: 0.6; transition: opacity 0.3s; }
        .hc-segment.active { opacity: 1; }
        .hc-segment-bar { height: 2px; width: 8rem; background: var(--border-color); margin: 0 auto 1.5rem; transition: background 0.3s; }
        .hc-segment.active .hc-segment-bar { background: var(--primary-color); }
        .hc-segment-label { font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; color: var(--foreground-sub-color); }
        .hc-segment.active .hc-segment-label { color: var(--primary-color); }

        /* .container__wrapper {
"""
content = content.replace("        /* .container__wrapper {", css)

# 2. Add JS class to quickview buttons
content = content.replace('onclick="document.querySelector(\'.js-quickview-panel\').classList.add(\'open\')"', 'class="quick-view-btn js-quickview-open"')
content = content.replace('class="quick-view-btn" class="quick-view-btn js-quickview-open"', 'class="quick-view-btn js-quickview-open"')


# 3. Quickview sidebar replacement
qv_old = '''<div class="offCanvas__quickview js-quickview-panel">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 2rem; border-bottom: 1px solid var(--border-color); margin-bottom: 3rem;">
                <h3 style="font-family: var(--frank-ruhl-fonts); font-size: 2.2rem; color: var(--primary-color); font-weight: 600;">Choose options</h3>
                <button type="button" class="quickview__close--btn" aria-label="close quickview" onclick="document.querySelector('.js-quickview-panel').classList.remove('open')">&times;</button>
            </div>
            
            <div style="display: flex; gap: 2rem; margin-bottom: 3rem;">
                <div style="flex: 0 0 80px; height: 80px; background: #fff; padding: 0.5rem; border: 1px solid var(--border-color);">
                    <img src="assets/IMG-20260622-WA0009.webp" style="width: 100%; height: 100%; object-fit: contain;" alt="Product">
                </div>
                <div>
                    <div style="font-size: 1.1rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--foreground-sub-color); margin-bottom: 0.5rem;">MARY HUMPHREY</div>
                    <div style="font-family: var(--frank-ruhl-fonts); font-size: 1.8rem; color: var(--primary-color); margin-bottom: 0.5rem;">Ankara Street Luxe Set</div>
                    <div style="font-size: 1.4rem; color: var(--primary-color);"><span style="margin-right: 1rem;">£120.00</span> <a href="product.html" style="text-decoration: underline; font-size: 1.2rem; color: var(--foreground-sub-color);">View details</a></div>
                </div>
            </div>

            <div style="margin-bottom: 2.5rem;">
                <div style="font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem;">Color: <span style="color: var(--foreground-sub-color);">Green, Made to Order</span></div>
                <div style="display:flex; gap:1.2rem;">
                    <span style="width:3rem; height:3rem; border-radius:50%; background-color:#7f8c85; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--primary-color); cursor: pointer;"></span>
                    <span style="width:3rem; height:3rem; border-radius:50%; background-color:#32353a; border: 2px solid transparent; cursor: pointer;"></span>
                </div>
            </div>

            <div style="margin-bottom: 3rem;">
                <div style="font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem;">Quantity:</div>
                <div style="display: inline-flex; align-items: center; border: 1px solid var(--border-color); border-radius: 4px; background: #fff;">
                    <button style="border: none; background: transparent; padding: 0.8rem 1.5rem; font-size: 1.6rem; color: var(--primary-color); cursor: pointer;">&minus;</button>
                    <input type="text" value="1" style="width: 4rem; text-align: center; border: none; font-size: 1.4rem; color: var(--primary-color); outline: none;">
                    <button style="border: none; background: transparent; padding: 0.8rem 1.5rem; font-size: 1.6rem; color: var(--primary-color); cursor: pointer;">+</button>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <button style="padding: 1.6rem; background: var(--secondary-color); color: #fff; font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; border: none; font-weight: 600; cursor: pointer;">Add to Cart</button>
                <button style="padding: 1.6rem; background: var(--primary-color); color: #fff; font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; border: none; font-weight: 600; cursor: pointer;">Buy It Now</button>
            </div>
        </div>'''

qv_new = '''<div class="offCanvas__quickview js-quickview-panel">
            <div class="quickview__header">
                <h3 class="quickview__title">Choose options</h3>
                <button type="button" class="quickview__close--btn js-quickview-close" aria-label="close quickview">&times;</button>
            </div>
            
            <div class="quickview__product-info">
                <div class="quickview__img-wrap">
                    <img src="assets/IMG-20260622-WA0009.webp" class="quickview__img" alt="Product">
                </div>
                <div class="quickview__details">
                    <div class="quickview__brand-label">MARY HUMPHREY</div>
                    <div class="quickview__product-title">Ankara Street Luxe Set</div>
                    <div class="quickview__price-wrap"><span class="quickview__price">£120.00</span> <a href="product.html" class="quickview__details-link">View details</a></div>
                </div>
            </div>

            <div class="quickview__color-wrap">
                <div class="quickview__color-label">Color: <span class="quickview__color-value">Green, Made to Order</span></div>
                <div class="quickview__swatches">
                    <span class="swatch-item swatch-item large active" style="background-color:#7f8c85;"></span>
                    <span class="swatch-item swatch-item large" style="background-color:#32353a;"></span>
                </div>
            </div>

            <div class="quickview__qty-wrap">
                <div class="quickview__qty-label">Quantity:</div>
                <div class="quickview__qty-selector">
                    <button class="qty-btn">&minus;</button>
                    <input type="text" value="1" class="qty-input">
                    <button class="qty-btn">+</button>
                </div>
            </div>

            <div class="quickview__actions">
                <button class="botm-btn botm-btn-secondary">Add to Cart</button>
                <button class="botm-btn botm-btn-primary">Buy It Now</button>
            </div>
        </div>'''
content = content.replace(qv_old, qv_new)

# 4. Product swatches inline styles replacement
content = content.replace('style="display:flex; justify-content:center; gap:0.5rem; margin-top:0.8rem;"', 'class="product__card--swatches"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#7f8c85; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--primary-color); cursor: pointer;"', 'class="swatch-item active" style="background-color:#7f8c85;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#9e6840; cursor: pointer;"', 'class="swatch-item" style="background-color:#9e6840;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#32353a; cursor: pointer;"', 'class="swatch-item" style="background-color:#32353a;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#1c1e21; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--primary-color); cursor: pointer;"', 'class="swatch-item active" style="background-color:#1c1e21;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#826c51; cursor: pointer;"', 'class="swatch-item" style="background-color:#826c51;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#b59a4c; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--primary-color); cursor: pointer;"', 'class="swatch-item active" style="background-color:#b59a4c;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#4a3f35; cursor: pointer;"', 'class="swatch-item" style="background-color:#4a3f35;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#a85a42; cursor: pointer;"', 'class="swatch-item" style="background-color:#a85a42;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#a33636; border: 2px solid #fff; box-shadow: 0 0 0 1px var(--primary-color); cursor: pointer;"', 'class="swatch-item active" style="background-color:#a33636;"')
content = content.replace('style="width:1.5rem; height:1.5rem; border-radius:50%; background-color:#354d73; cursor: pointer;"', 'class="swatch-item" style="background-color:#354d73;"')


# 5. Bag of the Month inline style removal
botm_old = """        <!-- Bag of the Month -->
        <section class="bag-of-the-month" style="padding: 8rem 0; background-color: var(--body-background-color);">
            <div class="container">
                <div class="section-header" style="margin-bottom: 5rem; text-align: center;">
                    <span style="display: block; font-size: 1.25rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--foreground-sub-color); margin-bottom: 1rem;">Signature Sandstorm</span>
                    <h2 class="section__heading--maintitle" style="font-size: 4.5rem; font-family: var(--frank-ruhl-fonts); color: var(--primary-color);">BAG OF THE MONTH</h2>
                </div>
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div style="background: #fff; padding: 4rem; text-align: center;">
                            <img src="assets/IMG-20260622-WA0009.webp" alt="Bag of the month" style="width: 100%; max-width: 400px; display: inline-block;">
                        </div>
                    </div>
                    <div class="col-md-6" style="padding-left: 5rem;">
                        <h3 style="font-family: var(--frank-ruhl-fonts); font-size: 3.2rem; margin-bottom: 1.5rem; color: var(--primary-color); line-height: 1.2;">Suede Cecilia Backpack (Mocha Leather)</h3>
                        <div style="font-size: 2.2rem; color: var(--primary-color); margin-bottom: 1.5rem;">KSh35,900</div>
                        <div style="font-size: 1.3rem; color: var(--foreground-sub-color); margin-bottom: 3rem; display: flex; align-items: center; gap: 0.5rem;">
                            <span style="color: #e5e5e5;">★★★★★</span> No reviews
                        </div>
                        
                        <div style="margin-bottom: 3rem;">
                            <div style="font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem;">Color: <span style="font-weight: 500;">Maroon</span></div>
                            <div style="display:flex; gap:1.2rem;">
                                <span style="width:3rem; height:3rem; border-radius:50%; background-color:#6e1d23; border: 2px solid #fff; box-shadow: 0 0 0 1px #422326; cursor: pointer;"></span>
                                <span style="width:3rem; height:3rem; border-radius:50%; background-color:#82871f; cursor: pointer;"></span>
                                <span style="width:3rem; height:3rem; border-radius:50%; background-color:#0b8783; cursor: pointer;"></span>
                            </div>
                        </div>

                        <div style="margin-bottom: 3.5rem;">
                            <div style="font-size: 1.4rem; color: var(--primary-color); margin-bottom: 1.5rem;">Quantity:</div>
                            <div style="display: inline-flex; align-items: center; border: 1px solid var(--border-color); border-radius: 4px; background: #fdfdfd; padding: 0.5rem;">
                                <button style="border: none; background: transparent; padding: 0.5rem 1.5rem; font-size: 1.8rem; color: var(--primary-color); cursor: pointer;">&minus;</button>
                                <input type="text" value="1" style="width: 4rem; text-align: center; border: none; font-size: 1.5rem; color: var(--primary-color); outline: none; background: transparent;">
                                <button style="border: none; background: transparent; padding: 0.5rem 1.5rem; font-size: 1.8rem; color: var(--primary-color); cursor: pointer;">+</button>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 450px;">
                            <button style="padding: 1.8rem; background: var(--secondary-color); color: #fff; font-size: 1.4rem; letter-spacing: 0.15em; text-transform: uppercase; border: none; font-weight: 600; cursor: pointer; transition: background 0.3s;">Add to Cart</button>
                            <button style="padding: 1.8rem; background: var(--primary-color); color: #fff; font-size: 1.4rem; letter-spacing: 0.15em; text-transform: uppercase; border: none; font-weight: 600; cursor: pointer; transition: background 0.3s;">Buy It Now</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>"""

botm_new = """        <!-- Bag of the Month -->
        <section class="bag-of-the-month">
            <div class="container">
                <div class="section-header">
                    <span class="botm-header-subtitle">Signature Sandstorm</span>
                    <h2 class="section__heading--maintitle">BAG OF THE MONTH</h2>
                </div>
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <div class="botm-image-wrap">
                            <img src="assets/IMG-20260622-WA0009.webp" alt="Bag of the month" class="botm-image">
                        </div>
                    </div>
                    <div class="col-md-6 botm-content">
                        <h3 class="botm-title">Suede Cecilia Backpack (Mocha Leather)</h3>
                        <div class="botm-price">KSh35,900</div>
                        <div class="botm-reviews">
                            <span class="botm-stars">★★★★★</span> No reviews
                        </div>
                        
                        <div class="quickview__color-wrap">
                            <div class="botm-color-label">Color: <span class="botm-color-val">Maroon</span></div>
                            <div class="quickview__swatches">
                                <span class="swatch-item large active" style="background-color:#6e1d23;"></span>
                                <span class="swatch-item large" style="background-color:#82871f;"></span>
                                <span class="swatch-item large" style="background-color:#0b8783;"></span>
                            </div>
                        </div>

                        <div class="quickview__qty-wrap">
                            <div class="botm-color-label">Quantity:</div>
                            <div class="quickview__qty-selector">
                                <button class="qty-btn">&minus;</button>
                                <input type="text" value="1" class="qty-input">
                                <button class="qty-btn">+</button>
                            </div>
                        </div>

                        <div class="botm-actions">
                            <button class="botm-btn botm-btn-secondary large">Add to Cart</button>
                            <button class="botm-btn botm-btn-primary large">Buy It Now</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>"""
content = content.replace(botm_old, botm_new)

# 6. Heritage & Culture inline style removal
hc_old = """        <!-- Heritage & Culture Segment Section -->
        <section class="heritage-culture-section" style="padding: 8rem 0; background-color: var(--bg-offwhite-color);">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <img src="assets/IMG-20260622-WA0081.webp" alt="Leather and Canvas" style="width: 100%; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                    </div>
                    <div class="col-md-6" style="padding: 4rem 5rem; text-align: center;">
                        <span style="display: block; font-size: 1.25rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--primary-color); margin-bottom: 1.5rem;">THE LOVE STORY OF</span>
                        <h2 style="font-family: var(--frank-ruhl-fonts); font-size: 4rem; color: var(--primary-color); margin-bottom: 2.5rem; line-height: 1.2;">LEATHER & CANVAS</h2>
                        <p style="font-size: 1.6rem; color: var(--foreground-sub-color); line-height: 1.9; margin-bottom: 5rem;">We started out making luxury safari tents and for the past 20 years we've been making beautiful canvas and leather bags that last. The romance of safari is woven into our fabric.</p>
                        
                        <div style="display: flex; justify-content: center; gap: 5rem;">
                            <div style="text-align: center; cursor: pointer; opacity: 1;">
                                <div style="height: 2px; width: 8rem; background: var(--primary-color); margin: 0 auto 1.5rem; transition: background 0.3s;"></div>
                                <span style="font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; color: var(--primary-color);">HERITAGE</span>
                            </div>
                            <div style="text-align: center; cursor: pointer; opacity: 0.6; transition: opacity 0.3s;">
                                <div style="height: 2px; width: 8rem; background: var(--border-color); margin: 0 auto 1.5rem; transition: background 0.3s;"></div>
                                <span style="font-size: 1.3rem; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; color: var(--foreground-sub-color);">CULTURE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>"""

hc_new = """        <!-- Heritage & Culture Segment Section -->
        <section class="heritage-culture-section">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <img src="assets/IMG-20260622-WA0081.webp" alt="Leather and Canvas" class="hc-image">
                    </div>
                    <div class="col-md-6 hc-content">
                        <span class="hc-subtitle">THE LOVE STORY OF</span>
                        <h2 class="hc-title">LEATHER & CANVAS</h2>
                        <p class="hc-desc">We started out making luxury safari tents and for the past 20 years we've been making beautiful canvas and leather bags that last. The romance of safari is woven into our fabric.</p>
                        
                        <div class="hc-segments">
                            <div class="hc-segment active js-hc-segment">
                                <div class="hc-segment-bar"></div>
                                <span class="hc-segment-label">HERITAGE</span>
                            </div>
                            <div class="hc-segment js-hc-segment">
                                <div class="hc-segment-bar"></div>
                                <span class="hc-segment-label">CULTURE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>"""
content = content.replace(hc_old, hc_new)

js = """    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const quickViewBtns = document.querySelectorAll('.js-quickview-open');
            const quickViewPanel = document.querySelector('.js-quickview-panel');
            const quickViewCloseBtn = document.querySelector('.js-quickview-close');

            if (quickViewPanel) {
                quickViewBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        quickViewPanel.classList.add('open');
                    });
                });
                
                if (quickViewCloseBtn) {
                    quickViewCloseBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        quickViewPanel.classList.remove('open');
                    });
                }
            }

            const hcSegments = document.querySelectorAll('.js-hc-segment');
            hcSegments.forEach(seg => {
                seg.addEventListener('click', () => {
                    hcSegments.forEach(s => s.classList.remove('active'));
                    seg.classList.add('active');
                });
            });
        });
    </script>
</body>"""
content = content.replace("</body>", js)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(content)
