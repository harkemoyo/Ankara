const app = require('./api/handler');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Serve static assets and HTML files from the root folder
app.use(express.static(path.join(__dirname)));

// Route root request to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for html pages to support clean routes (e.g. /shop instead of /shop.html)
app.use((req, res, next) => {
    const filePath = path.join(__dirname, req.path + '.html');
    res.sendFile(filePath, (err) => {
        if (err) next();
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 Local server successfully running at:`);
    console.log(`   👉 http://localhost:${PORT}\n`);
});
