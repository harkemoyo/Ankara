export default class CartDrawer {
    constructor() {
        // Listen for global cart addition requests from any component
        window.addEventListener('cart:add', (e) => {
            this.handleAddToCart(e.detail);
        });
    }

    handleAddToCart(item) {
        // item: { id, title, price, image, qty, size, color }
        if (typeof window.addToCart === 'function') {
            window.addToCart({
                id: item.id,
                title: item.title,
                price: item.price,
                image: item.image,
                qty: item.qty || 1,
                size: item.size || 'M',
                color: item.color || ''
            });
            
            // Open minicart UI
            const minicart = document.querySelector(".offCanvas__minicart");
            if (minicart) minicart.classList.add("active");
            document.body.classList.add("offCanvas__minicart_active");
        } else {
            console.error('addToCart function not found globally. Make sure assets/cart.js is loaded.');
        }
    }
}
