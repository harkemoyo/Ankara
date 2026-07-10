const fs = require('fs');
let html = fs.readFileSync('shop.html', 'utf8');

// 1. Clear the shop-product-grid content keeping outer wrapper
const GRID_OPEN = '<div class="shop-product-grid">';
const PAGN_COMMENT = 'class="pagination__area"';
const gridStart = html.indexOf(GRID_OPEN);
const gridEnd   = html.indexOf(PAGN_COMMENT);

if (gridStart === -1) { console.error('Cannot find shop-product-grid'); process.exit(1); }
if (gridEnd === -1)   { console.error('Cannot find pagination comment'); process.exit(1); }

const before = html.substring(0, gridStart + GRID_OPEN.length);
const after  = html.substring(gridEnd);
html = before + '\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n' + after;

// 2. Add collection tabs before product_grid div
const GRID_DIV = '<div id="product_grid"';
const tabsInsert = '<div id="collection-tabs" style="padding:16px 0 12px;display:flex;flex-wrap:wrap;"></div>\n                            ';
const gdPos = html.indexOf(GRID_DIV);
if (gdPos !== -1) {
  html = html.substring(0, gdPos) + tabsInsert + html.substring(gdPos);
}

// 3. Update script to module
html = html.replace(
  '<script src="assets/storefront-api.js"></script>',
  '<script type="module" src="assets/storefront-api.js"></script>'
);

fs.writeFileSync('shop.html', html);
console.log('Done. Wrote shop.html');
