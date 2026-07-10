const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve assets folder
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Serve root static files (index.html, shop.html, about.html, contact.html, product.html)
app.use(express.static(__dirname));

// Load mock database
const dbPath = path.join(__dirname, 'data', 'products.json');
let productsDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Helper to save DB
function saveDB() {
    fs.writeFileSync(dbPath, JSON.stringify(productsDB, null, 4));
}

// --- API Endpoints ---
app.get('/api/products', (req, res) => {
  res.json(productsDB);
});

app.get('/api/products/:handle', (req, res) => {
  const product = productsDB.find(p => p.handle === req.params.handle);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// --- Admin API Endpoints ---
app.post('/api/admin/products', (req, res) => {
    const newProduct = req.body;
    newProduct.id = productsDB.length > 0 ? Math.max(...productsDB.map(p => p.id)) + 1 : 1;
    productsDB.push(newProduct);
    saveDB();
    res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = productsDB.findIndex(p => p.id === id);
    if (index !== -1) {
        productsDB[index] = { ...productsDB[index], ...req.body, id };
        saveDB();
        res.json(productsDB[index]);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

app.delete('/api/admin/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    productsDB = productsDB.filter(p => p.id !== id);
    saveDB();
    res.json({ success: true });
});

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
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start static development server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Mary Humphrey Wear static server running at http://localhost:${PORT}`);
});
