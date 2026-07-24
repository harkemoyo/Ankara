// api/index.js — Re-exports handler for local development & backwards compatibility
const app = require('./handler.js');

// Start server if running locally
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
