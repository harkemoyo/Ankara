// api/index.js — Re-exports handler for local development & backwards compatibility
const app = require('./handler.js');

// Start server if running locally
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || 'localhost';
    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
    });
}

module.exports = app;
