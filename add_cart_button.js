const fs = require('fs');

const files = ['index.html', 'shop.html', 'product.html', 'about.html', 'contact.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let html = fs.readFileSync(file, 'utf8');
  const normalized = html.replace(/\r\n/g, '\n');
  
  const searchStr = '<div class="minicart__button" style="padding-bottom: 2rem;">\n                <a class="minicart__button--link" href="javascript:void(0)" onclick="triggerCheckout()" style="display: block; width: 100%; padding: 1.6rem; background: var(--bg-black-color); color: #fff; font-size: 1.4rem; letter-spacing: 0.15em; text-transform: uppercase; text-align: center; border: 2px solid var(--bg-black-color); cursor: pointer; transition: all 0.3s ease; font-weight: 600;">Check Out</a>\n            </div>';
  
  const replacement = '<div class="minicart__button" style="padding-bottom: 2rem; display: flex; gap: 1rem;">\n                <a class="minicart__button--link" href="cart.html" style="display: block; flex: 1; padding: 1.6rem; background: #fff; color: var(--primary-color); font-size: 1.4rem; letter-spacing: 0.15em; text-transform: uppercase; text-align: center; border: 2px solid var(--border-color); cursor: pointer; transition: all 0.3s ease; font-weight: 600;">View Cart</a>\n                <a class="minicart__button--link" href="javascript:void(0)" onclick="triggerCheckout()" style="display: block; flex: 1; padding: 1.6rem; background: var(--bg-black-color); color: #fff; font-size: 1.4rem; letter-spacing: 0.15em; text-transform: uppercase; text-align: center; border: 2px solid var(--bg-black-color); cursor: pointer; transition: all 0.3s ease; font-weight: 600;">Check Out</a>\n            </div>';

  if (normalized.indexOf(searchStr) !== -1) {
    const updated = normalized.replace(searchStr, replacement).replace(/\n/g, '\r\n');
    fs.writeFileSync(file, updated);
    console.log(`Successfully added View Cart button to ${file}`);
  } else {
    // Try to search without style tags or slightly different indentation in case
    console.log(`Could not find standard minicart button block in ${file}`);
  }
});
