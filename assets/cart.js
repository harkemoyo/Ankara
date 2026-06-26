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
  updateCartUI();
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
  
  // Open minicart drawer automatically to show success
  const minicart = document.querySelector('.offCanvas__minicart');
  if (minicart) {
    minicart.classList.add('open');
  }
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
  const emptyState = document.querySelector('.minicart__empty--text');
  const itemsContainer = document.getElementById('minicart-items-list');
  const subtotalEl = document.getElementById('minicart-subtotal');
  const checkoutContainer = document.querySelector('.minicart__button');
  const amountContainer = document.querySelector('.minicart__amount');

  // Create items list container if not exists
  let listEl = document.getElementById('minicart-items-list');
  if (!listEl) {
    const minicartDesc = document.querySelector('.minicart__header--desc');
    if (minicartDesc) {
      listEl = document.createElement('div');
      listEl.id = 'minicart-items-list';
      listEl.className = 'minicart__product';
      minicartDesc.parentNode.insertBefore(listEl, minicartDesc.nextSibling);
    }
  }

  if (cart.length === 0) {
    // Show empty state
    if (emptyState) emptyState.style.display = 'block';
    if (listEl) listEl.style.display = 'none';
    if (amountContainer) amountContainer.style.display = 'none';
    if (checkoutContainer) checkoutContainer.style.display = 'none';
  } else {
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    if (listEl) {
      listEl.style.display = 'block';
      // Render items
      listEl.innerHTML = cart.map((item, index) => `
        <div class="minicart__product--items d-flex">
          <div class="minicart__thumb">
            <a href="product.html?id=${item.id}"><img src="${item.image}" alt="${item.title}"></a>
          </div>
          <div class="minicart__text">
            <h4 class="minicart__subtitle"><a href="product.html?id=${item.id}">${item.title}</a></h4>
            <span class="color__variant"><b>Size:</b> ${item.size}</span>
            <div class="minicart__price">
              <span class="minicart__current--price">£${item.price.toFixed(2)}</span>
            </div>
            <div class="minicart__quantity d-flex align-items-center">
              <div class="quantity__box">
                <button type="button" class="quantity__value decrease" aria-label="decrease quantity" onclick="changeMinicartQty(${index}, -1)">-</button>
                <label>
                  <input type="number" class="quantity__number" value="${item.qty}" readonly>
                </label>
                <button type="button" class="quantity__value increase" aria-label="increase quantity" onclick="changeMinicartQty(${index}, 1)">+</button>
              </div>
              <button class="minicart__product--remove" type="button" onclick="removeFromMinicart(${index})" style="margin-left: 15px;">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    // Show subtotal and checkout buttons
    if (amountContainer) amountContainer.style.display = 'block';
    if (checkoutContainer) checkoutContainer.style.display = 'flex';
    if (subtotalEl) {
      subtotalEl.innerHTML = `<b>£${subtotal.toFixed(2)}</b>`;
    }
  }
}

// Trigger checkout with Paystack
function triggerCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your shopping bag is empty!');
    return;
  }
  
  const subtotal = getCartSubtotal();
  
  // Paystack Integration Placeholder
  // Prompt for email address to start payment
  const email = prompt('Please enter your email to complete checkout:', '');
  if (!email) return;
  
  alert(`Proceeding to Paystack checkout for £${subtotal.toFixed(2)} with email ${email}...`);
  // Here you'll initialize Paystack Pop
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartUI();
});
