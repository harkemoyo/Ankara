const fs = require('fs');

const files = ['index.html', 'shop.html', 'product.html', 'about.html', 'contact.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let html = fs.readFileSync(file, 'utf8');
  if (html.indexOf('action="search.html"') !== -1) {
    const updated = html.replace('action="search.html"', 'action="shop.html"');
    fs.writeFileSync(file, updated);
    console.log(`Successfully updated search action in ${file}`);
  }
});
