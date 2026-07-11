const fs = require('fs');
let html = fs.readFileSync('shop.html', 'utf8');

// Normalize all line endings to LF to avoid CRLF mismatch on Windows
html = html.replace(/\r\n/g, '\n');

// 1. Update script tag
html = html.replace(
  '<script src="assets/storefront-api.js"></script>',
  '<script type="module" src="assets/storefront-api.js"></script>'
);

// 2. Clear shop-product-grid and keep outer tags balanced
const gridStartTag = '<div class="shop-product-grid">';
const gridStartIdx = html.indexOf(gridStartTag);
// Anchor on class="pagination__area"> because <div was cut off
const paginationStartTag = 'class="pagination__area">';
const paginationStartIdx = html.indexOf(paginationStartTag);

if (gridStartIdx === -1 || paginationStartIdx === -1) {
  console.error('Error finding grid or pagination positions! Grid:', gridStartIdx, 'Pagination:', paginationStartIdx);
  process.exit(1);
}

const beforeGrid = html.substring(0, gridStartIdx + gridStartTag.length);
const afterGrid = html.substring(paginationStartIdx + paginationStartTag.length);

// Construct clean grid container and correctly close outer tags, then open pagination__area
html = beforeGrid + '\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                        <div class="pagination__area">\n' + afterGrid;

// 3. Add collection tabs container before product_grid if not already added
if (html.indexOf('id="collection-tabs"') === -1) {
  const productGridDiv = '<div id="product_grid"';
  const tabsHtml = '<div id="collection-tabs" style="padding:16px 0 12px;display:flex;flex-wrap:wrap;"></div>\n                            ';
  html = html.replace(productGridDiv, tabsHtml + productGridDiv);
}

// 4. Locate and replace sidebar widgets in one block
const categoriesStart = '<div class="single__widget widget__bg">\n                            <h2 class="widget__title h3">Categories</h2>';
const priceFilterStart = '<div class="single__widget price__filter widget__bg">';

const catIdx = html.indexOf(categoriesStart);
const priceIdx = html.indexOf(priceFilterStart);

if (catIdx === -1 || priceIdx === -1) {
  console.error('Error finding Categories or Price Filter in sidebar! Cat:', catIdx, 'Price:', priceIdx);
  process.exit(1);
}

const categoriesAndSizeWidget = `
                        <div class="single__widget widget__bg">
                            <h2 class="widget__title h3">Categories</h2>
                            <ul class="widget__categories--menu" id="sidebar-categories">
                                <!-- Dynamic collections will load here -->
                            </ul>
                        </div>
                        <div class="single__widget widget__bg">
                            <h2 class="widget__title h3">Filter By Size</h2>
                            <ul class="widget__form--check">
                                <li class="widget__form--check__list">
                                    <label class="widget__form--check__label" for="size-S">S</label>
                                    <input class="widget__form--check__input size-filter" id="size-S" type="checkbox" value="S">
                                    <span class="widget__form--checkmark"></span>
                                </li>
                                <li class="widget__form--check__list">
                                    <label class="widget__form--check__label" for="size-M">M</label>
                                    <input class="widget__form--check__input size-filter" id="size-M" type="checkbox" value="M">
                                    <span class="widget__form--checkmark"></span>
                                </li>
                                <li class="widget__form--check__list">
                                    <label class="widget__form--check__label" for="size-L">L</label>
                                    <input class="widget__form--check__input size-filter" id="size-L" type="checkbox" value="L">
                                    <span class="widget__form--checkmark"></span>
                                </li>
                                <li class="widget__form--check__list">
                                    <label class="widget__form--check__label" for="size-XL">XL</label>
                                    <input class="widget__form--check__input size-filter" id="size-XL" type="checkbox" value="XL">
                                    <span class="widget__form--checkmark"></span>
                                </li>
                                <li class="widget__form--check__list">
                                    <label class="widget__form--check__label" for="size-2X">2X</label>
                                    <input class="widget__form--check__input size-filter" id="size-2X" type="checkbox" value="2X">
                                    <span class="widget__form--checkmark"></span>
                                </li>
                            </ul>
                        </div>
`;

html = html.substring(0, catIdx) + categoriesAndSizeWidget + html.substring(priceIdx);

// 5. Replace currency symbols in Price Filter (both $ to £)
html = html.replace('<span class="price__filter--currency">$</span>', '<span class="price__filter--currency">£</span>');
html = html.replace('<span class="price__filter--currency">$</span>', '<span class="price__filter--currency">£</span>');

// 6. Replace Top Rated Product with Featured Products
const topRatedStart = '<div class="single__widget widget__bg">\n                            <h2 class="widget__title h3">Top Rated Product</h2>';
const topRatedStartIdx = html.indexOf(topRatedStart);

if (topRatedStartIdx === -1) {
  console.error('Error finding Top Rated Product widget!');
  process.exit(1);
}

// Find the collection_wrapper to determine where the sidebar ends
const colWrapperIdx = html.indexOf('<div class="collection_wrapper">');
if (colWrapperIdx === -1) {
  console.error('Error finding collection_wrapper!');
  process.exit(1);
}

// Find the last closing div of the sidebar
const beforeColWrapper = html.substring(0, colWrapperIdx);
const lastDivIdx = beforeColWrapper.lastIndexOf('</div>');

const featuredProductsWidget = `
                        <div class="single__widget widget__bg">
                            <h2 class="widget__title h3">Featured Products</h2>
                            <div class="shop__sidebar--product">
                                <div class="small__product--card d-flex">
                                    <div class="small__product--thumbnail">
                                        <a class="display-block" href="product.html?handle=ankara-print-dress"><img src="assets/IMG-20260622-WA0081.webp" alt="Ankara Print Dress"></a>
                                    </div>
                                    <div class="small__product--content">
                                        <h3 class="small__product--card__title">
                                            <a href="product.html?handle=ankara-print-dress">Ankara Print Dress</a>
                                        </h3>
                                        <div class="small__product--card__price mb_5">
                                            <span class="current__price">£85.00</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="small__product--card d-flex">
                                    <div class="small__product--thumbnail">
                                        <a class="display-block" href="product.html?handle=traditional-kente-skirt"><img src="assets/IMG-20260622-WA0011.webp" alt="Traditional Kente Skirt"></a>
                                    </div>
                                    <div class="small__product--content">
                                        <h3 class="small__product--card__title">
                                            <a href="product.html?handle=traditional-kente-skirt">Traditional Kente Skirt</a>
                                        </h3>
                                        <div class="small__product--card__price mb_5">
                                            <span class="current__price">£120.00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
`;

html = html.substring(0, topRatedStartIdx) + featuredProductsWidget + html.substring(lastDivIdx);

// Convert line endings back to CRLF for consistency
html = html.replace(/\n/g, '\r\n');

fs.writeFileSync('shop.html', html);
console.log('Successfully updated shop.html!');
