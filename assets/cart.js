// assets/cart.js — Client-Side Shopping Cart for Mary Humphrey Wear

// Get cart from localStorage
function getCart() {
  try {
    const cart = localStorage.getItem('mhw-cart');
    return cart ? JSON.parse(cart) : [];
  } catch (e) {
    console.error('Failed to parse cart from localStorage:', e);
    return [];
  }
}

// Save cart to localStorage
function saveCart(cart) {
  try {
    localStorage.setItem('mhw-cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Failed to save cart to localStorage:', e);
  }
  // Delay UI update slightly so click events (like +/- buttons) can finish bubbling
  // before the DOM elements are destroyed, which prevents the drawer from hiding.
  setTimeout(() => updateCartUI(), 10);
}

// Add item to cart
function addToCart(product) {
  // product: { id, title, price, image, qty, size }
  const cart = getCart();
  const existingIndex = cart.findIndex(item => item.id === product.id && item.size === product.size);
  
  if (existingIndex > -1) {
    cart[existingIndex].qty += parseInt(product.qty || 1);
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: parseFloat(product.price),
      image: product.image,
      qty: parseInt(product.qty || 1),
      size: product.size || 'M'
    });
  }
  
  saveCart(cart);
  
  // Dispatch custom event for global.js minicart listener
  document.dispatchEvent(new CustomEvent('itemAddedToCart'));
  
  // Open minicart drawer automatically to show success
  setTimeout(() => {
    const minicartBtn = document.querySelector('.minicart__open--btn');
    const minicart = document.querySelector('.offCanvas__minicart');
    if (minicartBtn && minicart && !minicart.classList.contains('active')) {
      // We simulate a click on the inner SVG or button to ensure the event listener captures dataset.offcanvas correctly
      const clickTarget = minicartBtn.hasAttribute('data-offcanvas') ? minicartBtn : minicartBtn.querySelector('[data-offcanvas]');
      if (clickTarget) clickTarget.click();
      
      // Fallback: If global.js event listener didn't catch the click, manually open the drawer
      setTimeout(() => {
        if (!minicart.classList.contains('active')) {
          minicart.classList.add('active');
          document.body.classList.add('offCanvas__minicart_active');
        }
      }, 50);
    }
  }, 50);
}

// Remove item from minicart
function removeFromMinicart(index) {
  const cart = getCart();
  if (index > -1 && index < cart.length) {
    cart.splice(index, 1);
    saveCart(cart);
  }
}

// Change minicart quantity
function changeMinicartQty(index, delta) {
  const cart = getCart();
  if (index > -1 && index < cart.length) {
    cart[index].qty += delta;
    if (cart[index].qty <= 0) {
      cart.splice(index, 1);
    }
    saveCart(cart);
  }
}

// Calculate cart subtotal
function getCartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

// Get total items count
function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

// Update all badges and render list
function updateCartUI() {
  const cart = getCart();
  const totalCount = getCartCount();
  const subtotal = getCartSubtotal();

  // Update item count badges (e.g. header & mobile toolbar)
  const badges = document.querySelectorAll('.items__count, .js-item-count');
  badges.forEach(badge => {
    badge.textContent = totalCount;
  });

  // Target minicart components
  const emptyState = document.querySelector('.minicart__empty--text') || document.querySelector('.js-minicart-empty');
  const itemsContainer = document.getElementById('minicart-items-list') || document.querySelector('.js-minicart-items');
  const subtotalEl = document.getElementById('minicart-subtotal') || document.querySelector('.js-minicart-subtotal');
  const checkoutContainer = document.querySelector('.minicart__button') || document.querySelector('.js-minicart-actions');
  const amountContainer = document.querySelector('.minicart__amount') || document.querySelector('.js-minicart-amount');

  // Create items list container if not exists
  let listEl = itemsContainer;
  if (!listEl) {
    const minicartDesc = document.querySelector('.minicart__header');
    if (minicartDesc) {
      listEl = document.createElement('div');
      listEl.id = 'minicart-items-list';
      listEl.className = 'minicart__product js-minicart-items';
      minicartDesc.parentNode.insertBefore(listEl, minicartDesc.nextSibling);
    }
  }

  if (cart.length === 0) {
    // Show empty state
    if (emptyState) emptyState.classList.remove('is-hidden');
    if (listEl) listEl.classList.add('is-hidden');
    if (amountContainer) amountContainer.classList.add('is-hidden');
    if (checkoutContainer) checkoutContainer.classList.add('is-hidden');
  } else {
    // Hide empty state
    if (emptyState) emptyState.classList.add('is-hidden');
    if (listEl) {
      listEl.classList.remove('is-hidden');
      // Render items cleanly without inline styles
      listEl.innerHTML = cart.map((item, index) => `
        <div class="minicart__product--items js-minicart-item">
          <div class="minicart__thumb">
            <a href="product.html?handle=${item.id}"><img src="${item.image}" alt="${item.title}"></a>
          </div>
          <div class="minicart__text">
            <div class="minicart__text--top">
               <div>
                  <h4 class="minicart__subtitle"><a href="product.html?handle=${item.id}">${item.title}</a></h4>
                  <span class="color__variant"><b>Color:</b> ${item.color || 'As Shown'}</span>
                  <span class="color__variant"><b>Size:</b> ${item.size}</span>
               </div>
               <button class="minicart__product--remove js-item-remove" type="button" aria-label="remove" onclick="removeFromMinicart(${index})">&times;</button>
            </div>
            
            <div class="minicart__text--bottom">
                <div class="quantity__box">
                  <button type="button" class="quantity__value decrease js-qty-btn" aria-label="decrease quantity" onclick="changeMinicartQty(${index}, -1)">-</button>
                  <label>
                    <input type="number" class="quantity__number js-qty-input" value="${item.qty}" readonly>
                  </label>
                  <button type="button" class="quantity__value increase js-qty-btn" aria-label="increase quantity" onclick="changeMinicartQty(${index}, 1)">+</button>
                </div>
                <div class="minicart__price">
                  <span class="minicart__current--price">${window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(item.price * item.qty) : `KSh${(item.price * item.qty).toFixed(2)}`}</span>
                </div>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    // Show subtotal and checkout buttons
    if (amountContainer) amountContainer.classList.remove('is-hidden');
    if (checkoutContainer) checkoutContainer.classList.remove('is-hidden');
    if (subtotalEl) {
      subtotalEl.innerHTML = `<b>${window.AnkaraCurrency ? window.AnkaraCurrency.convertAndFormat(subtotal) : `KSh${subtotal.toFixed(2)}`}</b>`;
    }
  }
}

// Redirect checkout to checkout.html page
function triggerCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your shopping bag is empty!');
    return;
  }
  window.location.href = 'checkout.html';
}

// Simulate network loading state for add to cart buttons
function simulateAdding(btn, callback) {
  if (!btn) {
    callback();
    return;
  }
  
  const originalHTML = btn.innerHTML;
  const originalWidth = btn.offsetWidth;
  const originalPointerEvents = btn.style.pointerEvents;
  
  btn.style.width = originalWidth + 'px';
  btn.style.pointerEvents = 'none';
  // Use a miniature version of the site's main preloader spinner
  btn.innerHTML = `<div style="display: inline-block; vertical-align: middle; width: 1.8rem; height: 1.8rem; margin-right: 0.8rem; border-radius: 50%; border: 3px solid var(--border-color); border-top-color: var(--bg-light-dark-color); animation: spinner 1s infinite linear;"></div><span style="vertical-align: middle;">Adding...</span>`;

  // Fake network delay of 600ms
  setTimeout(() => {
    callback();
    // Restore original state
    btn.innerHTML = originalHTML;
    btn.style.pointerEvents = originalPointerEvents;
    btn.style.width = '';
  }, 600);
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartUI();
  
  // Re-render minicart when currency changes
  window.addEventListener('currency:changed', () => updateCartUI());
  window.addEventListener('settings:loaded', () => updateCartUI());
  
  // Wire up all 'Add to cart' buttons on the site to use the JS cart
  document.body.addEventListener('click', function(e) {
    // Handle close button and overlay clicks robustly to guarantee the drawer always closes
    if (e.target.closest('.minicart__close--btn') || (e.target.classList.contains('offCanvas__minicart_active') && !e.target.closest('.offCanvas__minicart'))) {
      const minicart = document.querySelector('.offCanvas__minicart');
      if (minicart) {
        minicart.classList.remove('active');
        document.body.classList.remove('offCanvas__minicart_active');
      }
    }
    
    if ((e.target.closest('.product__card--btn') || e.target.closest('.clean-card-add')) && !e.target.closest('[onclick*="addProductToCart"]') && !e.target.closest('[onclick*="quickAddToCart"]')) {
      e.preventDefault(); // Prevent navigating to cart.html
      
      const btn = e.target.closest('a') || e.target.closest('button');
      // Look for the closest product container
      const card = btn.closest('.product__card');
      
      if (card) {
        // Extract details from the DOM
        const titleEl = card.querySelector('.product__card--title a');
        const priceEl = card.querySelector('.current__price');
        const imgEl = card.querySelector('.product__card--thumbnail__img');
        
        const title = titleEl ? titleEl.textContent.trim() : 'Unknown Product';
        let priceStr = priceEl ? priceEl.textContent.trim() : '£0.00';
        const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0.00;
        const image = imgEl ? imgEl.src : 'assets/img/product/product1.png';
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        simulateAdding(btn, () => {
          addToCart({
            id: id,
            title: title,
            price: price,
            image: image,
            qty: 1,
            size: 'M' // Default size for demo
          });
        });
      }
    }
  });
});

// Handle 'Add to Cart' explicitly for product.html page
window.addProductToCart = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  const btn = document.querySelector('[onclick*="addProductToCart"]');
  const titleEl = document.getElementById('dyn-product-title');
  const priceEl = document.getElementById('dyn-product-price');
  const imgEl = document.getElementById('dyn-product-image');
  
  // Get currently selected size if available
  let selectedSize = 'M';
  const sizeInput = document.querySelector('input[name="variant_size"]:checked');
  if (sizeInput) selectedSize = sizeInput.value;
  
  // Get quantity if available
  let qty = 1;
  const qtyInput = document.querySelector('.quantity__number');
  if (qtyInput) qty = parseInt(qtyInput.value) || 1;
  
  const title = titleEl ? titleEl.textContent.trim() : 'Unknown Product';
  let priceStr = priceEl ? priceEl.textContent.trim() : '£0.00';
  const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0.00;
  const image = (imgEl && imgEl.src && imgEl.src !== window.location.href) ? imgEl.src : 'assets/img/product/product1.png';
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  simulateAdding(btn, () => {
    addToCart({
      id: id,
      title: title,
      price: price,
      image: image,
      qty: qty,
      size: selectedSize
    });
  });
};

// Explicitly attach functions to window object
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCart = addToCart;
window.removeFromMinicart = removeFromMinicart;
window.changeMinicartQty = changeMinicartQty;
window.getCartSubtotal = getCartSubtotal;
window.getCartCount = getCartCount;
window.updateCartUI = updateCartUI;
window.triggerCheckout = triggerCheckout;
