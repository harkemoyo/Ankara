const { supabaseAnon } = require('../config/supabase');

class ProductService {
    /**
     * Fetch products and compute facets dynamically based on filters.
     */
    async getProducts(filters = {}) {
        let query = supabaseAnon.from('products').select('*');

        // Fetch all products (we'll filter in memory for complex facet logic)
        // If collection is specified and not 'all', filter by it
        if (filters.collection && filters.collection !== 'all') {
            query = query.eq('collection', filters.collection);
        }

        let { data: allProducts, error } = await query;
        if (error) throw new Error(error.message);

        // Filter out raw fabric materials (.webp / IMG-)
        let validProducts = (allProducts || []).filter(p => p.images && p.images[0] && !p.images[0].includes('IMG-') && !p.images[0].includes('.webp'));
        
        // If DB has no human model items, load full DSC human model catalog
        if (validProducts.length === 0) {
            const fs = require('fs');
            const path = require('path');
            try {
                const localData = fs.readFileSync(path.join(__dirname, '../../data/products.json'), 'utf8');
                validProducts = JSON.parse(localData);
            } catch (e) {
                validProducts = [];
            }
        }
        allProducts = validProducts;

        // Normalize filters
        const appliedColors = filters.colors ? (Array.isArray(filters.colors) ? filters.colors : [filters.colors]) : [];
        const appliedSizes = filters.sizes ? (Array.isArray(filters.sizes) ? filters.sizes : [filters.sizes]) : [];
        const appliedVendors = filters.vendor ? (Array.isArray(filters.vendor) ? filters.vendor : [filters.vendor]) : [];
        const appliedAvailability = filters.availability ? (Array.isArray(filters.availability) ? filters.availability : [filters.availability]) : [];
        const minPrice = filters.priceGte ? parseFloat(filters.priceGte) : 0;
        const maxPrice = filters.priceLte ? parseFloat(filters.priceLte) : Infinity;
        
        // Helper to check if a product passes a specific filter
        const passesColor = (p) => {
            if (appliedColors.length === 0) return true;
            if (!p.colors || !Array.isArray(p.colors)) return false;
            return p.colors.some(c => appliedColors.includes(c.label));
        };
        const passesSize = (p) => {
            if (appliedSizes.length === 0) return true;
            if (!p.sizes || !Array.isArray(p.sizes)) return false;
            return p.sizes.some(s => appliedSizes.includes(s));
        };
        const passesVendor = (p) => {
            if (appliedVendors.length === 0) return true;
            return appliedVendors.includes(p.vendor);
        };
        const passesAvailability = (p) => {
            if (appliedAvailability.length === 0) return true;
            const status = p.in_stock ? 'in_stock' : 'out_of_stock';
            return appliedAvailability.includes(status);
        };
        const passesPrice = (p) => {
            return p.price >= minPrice && p.price <= maxPrice;
        };
        const passesSearch = (p) => {
            if (!filters.q) return true;
            const search = filters.q.toLowerCase().trim();
            const title = (p.title || '').toLowerCase();
            const desc = (p.description || '').toLowerCase();
            return title.includes(search) || desc.includes(search);
        };

        // Filter the final products list
        const filteredProducts = allProducts.filter(p => 
            passesColor(p) && 
            passesSize(p) && 
            passesVendor(p) && 
            passesAvailability(p) && 
            passesPrice(p) &&
            passesSearch(p)
        );

        // Sort
        if (filters.sort) {
            if (filters.sort === 'price_asc') filteredProducts.sort((a, b) => a.price - b.price);
            if (filters.sort === 'price_desc') filteredProducts.sort((a, b) => b.price - a.price);
            // newness could rely on id or created_at
            if (filters.sort === 'newest') filteredProducts.sort((a, b) => b.id - a.id);
        }

        // Facet computation
        // Rule: When computing counts for a specific facet category (e.g. colors), 
        // we exclude the currently applied color filters, but keep all OTHER applied filters.
        const facets = {
            colors: {},
            sizes: {},
            vendor: {},
            availability: {
                in_stock: { value: 'in_stock', label: 'In Stock', count: 0 },
                out_of_stock: { value: 'out_of_stock', label: 'Out of Stock', count: 0 }
            }
        };

        allProducts.forEach(p => {
            // Check if product passes all filters EXCEPT the one we are aggregating
            const baseMatchesForColor = passesSize(p) && passesVendor(p) && passesAvailability(p) && passesPrice(p) && passesSearch(p);
            const baseMatchesForSize = passesColor(p) && passesVendor(p) && passesAvailability(p) && passesPrice(p) && passesSearch(p);
            const baseMatchesForVendor = passesColor(p) && passesSize(p) && passesAvailability(p) && passesPrice(p) && passesSearch(p);
            const baseMatchesForAvailability = passesColor(p) && passesSize(p) && passesVendor(p) && passesPrice(p) && passesSearch(p);

            if (baseMatchesForColor && Array.isArray(p.colors)) {
                p.colors.forEach(c => {
                    if (!facets.colors[c.label]) facets.colors[c.label] = { value: c.label, count: 0, image: c.image };
                    facets.colors[c.label].count++;
                });
            }

            if (baseMatchesForSize && Array.isArray(p.sizes)) {
                p.sizes.forEach(s => {
                    if (!facets.sizes[s]) facets.sizes[s] = { value: s, count: 0 };
                    facets.sizes[s].count++;
                });
            }

            if (baseMatchesForVendor && p.vendor) {
                if (!facets.vendor[p.vendor]) facets.vendor[p.vendor] = { value: p.vendor, count: 0 };
                facets.vendor[p.vendor].count++;
            }

            if (baseMatchesForAvailability) {
                if (p.in_stock) {
                    facets.availability.in_stock.count++;
                } else {
                    facets.availability.out_of_stock.count++;
                }
            }
        });

        const page = parseInt(filters.page) || 1;
        const limit = 12;
        const total = filteredProducts.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        // Convert facets maps to arrays
        return {
            products: paginatedProducts,
            facets: {
                colors: Object.values(facets.colors),
                sizes: Object.values(facets.sizes),
                vendor: Object.values(facets.vendor),
                availability: Object.values(facets.availability).filter(f => f.count > 0)
            },
            pagination: {
                total,
                page,
                totalPages
            }
        };
    }

    async getCollections() {
        const { data, error } = await supabaseAnon.from('collections').select('*').order('sort_order', { ascending: true });
        if (error) throw new Error(error.message);
        return data;
    }

    async getProductByHandle(handle) {
        const { data, error } = await supabaseAnon
            .from('products')
            .select('*')
            .eq('handle', handle)
            .single();
        if (error) throw new Error(error.message);
        return data;
    }
}

module.exports = new ProductService();
