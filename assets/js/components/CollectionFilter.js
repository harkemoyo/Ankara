export default class CollectionFilter {
    constructor(el) {
        this.el = el;
        
        // Listen to facets update from ProductGrid
        window.addEventListener('facets:updated', (e) => {
            this.renderFacets(e.detail);
        });

        // Listen for internal popstate so checkboxes sync with URL if user clicks Back
        window.addEventListener('popstate', () => {
            this.syncUIWithURL();
        });

        this.init();
    }

    init() {
        // Find existing inputs and bind them
        this.el.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"]')) {
                this.updateFiltersFromUI();
            }
        });

        // Price form
        const priceForm = this.el.querySelector('.price__filter--form');
        if (priceForm) {
            priceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateFiltersFromUI();
            });
        }

        this.syncUIWithURL();

        // Sort dropdown
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.updateFiltersFromUI();
            });
        }
    }

    syncUIWithURL() {
        const params = new URLSearchParams(window.location.search);
        
        // Sync checkboxes
        const checkboxes = this.el.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            const paramName = cb.getAttribute('data-filter-name'); // e.g. "sizes"
            const values = params.getAll(paramName);
            cb.checked = values.includes(cb.value);
        });

        // Sync price
        const minPrice = this.el.querySelector('input[name="priceGte"]');
        const maxPrice = this.el.querySelector('input[name="priceLte"]');
        if (minPrice) minPrice.value = params.get('priceGte') || '';
        if (maxPrice) maxPrice.value = params.get('priceLte') || '';

        // Sync sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.value = params.get('sort') || '';
        }
    }

    updateFiltersFromUI() {
        const params = new URLSearchParams();

        // Checkboxes
        const checkboxes = this.el.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => {
            const paramName = cb.getAttribute('data-filter-name');
            params.append(paramName, cb.value);
        });

        // Price
        const minPrice = this.el.querySelector('input[name="priceGte"]');
        const maxPrice = this.el.querySelector('input[name="priceLte"]');
        if (minPrice && minPrice.value) params.set('priceGte', minPrice.value);
        if (maxPrice && maxPrice.value) params.set('priceLte', maxPrice.value);

        // Sort
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect && sortSelect.value) {
            params.set('sort', sortSelect.value);
        }

        // Retain collection if it exists in URL
        const oldParams = new URLSearchParams(window.location.search);
        if (oldParams.has('collection')) params.set('collection', oldParams.get('collection'));

        // Update URL without reload
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newUrl);

        // Tell ProductGrid to fetch
        window.dispatchEvent(new Event('filter:changed'));
    }

    renderFacets(facets) {
        // Update counts next to checkboxes
        // We expect HTML like:
        // <label for="size-M">M <span class="facet-count" data-facet="sizes" data-value="M"></span></label>
        
        const countSpans = this.el.querySelectorAll('.facet-count');
        countSpans.forEach(span => {
            const facetCategory = span.getAttribute('data-facet'); // e.g., "sizes"
            const facetValue = span.getAttribute('data-value');    // e.g., "M"
            
            const categoryData = facets[facetCategory] || [];
            const match = categoryData.find(f => f.value === facetValue);
            
            const count = match ? match.count : 0;
            span.textContent = `(${count})`;
            
            // Optionally disable checkbox if count is 0 and it's not currently checked
            const cb = this.el.querySelector(`input[data-filter-name="${facetCategory}"][value="${facetValue}"]`);
            if (cb) {
                if (count === 0 && !cb.checked) {
                    cb.disabled = true;
                    cb.parentElement.classList.add('disabled-filter');
                } else {
                    cb.disabled = false;
                    cb.parentElement.classList.remove('disabled-filter');
                }
            }
        });
    }
}
