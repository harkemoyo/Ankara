const express = require('express');
const path = require('path');
const app = express();

// Serve assets folder
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve root static files (index.html, shop.html, about.html, contact.html, product.html)
app.use(express.static(__dirname));

// Clean URL route fallbacks for local development
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'shop.html'));
});
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});
app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'product.html'));
});

// Start static development server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Mary Humphrey Wear static server running at http://localhost:${PORT}`);
});
