const productService = require('../services/productService');

class ProductController {
    async getProducts(req, res) {
        try {
            // Parse query params into filters
            // Express handles array query params correctly if they use ?colors=red&colors=blue
            // Or we can comma-split them if they pass ?colors=red,blue
            
            const parseArrayParam = (param) => {
                if (!param) return [];
                if (Array.isArray(param)) return param;
                return param.split(',');
            };

            const filters = {
                collection: req.query.collection || 'all',
                colors: parseArrayParam(req.query.colors),
                sizes: parseArrayParam(req.query.sizes),
                vendor: parseArrayParam(req.query.vendor),
                availability: parseArrayParam(req.query.availability),
                priceGte: req.query.priceGte,
                priceLte: req.query.priceLte,
                sort: req.query.sort,
                q: req.query.q,
                page: req.query.page
            };

            const result = await productService.getProducts(filters);
            res.json(result);
        } catch (error) {
            console.error('Error in getProducts:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    async getCollections(req, res) {
        try {
            const collections = await productService.getCollections();
            res.json({ collections });
        } catch (error) {
            console.error('Error in getCollections:', error);
            res.status(500).json({ error: 'Failed to fetch collections' });
        }
    }

    async getProductByHandle(req, res) {
        try {
            const product = await productService.getProductByHandle(req.params.handle);
            if (!product) return res.status(404).json({ error: 'Product not found' });
            res.json(product);
        } catch (error) {
            console.error('Error in getProductByHandle:', error);
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    }
}

module.exports = new ProductController();
