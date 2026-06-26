// // Ajax js
class AddToCart extends HTMLElement {
  constructor() {
    super();
    // Selectors
    this.selectors = {
      addToCartBtn: ".js-cart-form",
      itemCount: ".js-item-count",
      quantityButton: ".js-add-to-cart"
    };
    // classes
    this.classes = { 
      quantityButton: "js-add-to-cart",
     }

    // Query selectors
    this.addToCartBtn = this.querySelector(this.selectors.addToCartBtn);
    this.itemCount = this.querySelector(this.selectors.itemCount);
    this.quantityButton = this.querySelector(this.selectors.quantityButton);

    // Add event listener for form submission
    this.addEventListener('submit', (e) => {
      this.addToCartFormFunction(e);
    });
      // Add event listener for quantity buttons
      this.addEventListener('click', (e) => {
        if (e.target.classList.contains(this.classes.quantityButton)) {
          const message = e.target
            this.displayMessage(message);
        }
    });
  }

  // Add to cart function
  addToCartFormFunction(ev) {
    ev.preventDefault();
    const target = ev.target;
    const addToCartForm = target;
    console.log(addToCartForm)
    if (addToCartForm) {
      this.addToCart(addToCartForm);
    }
  }

  addToCart(addToCartForm) {

    // Extract data from the form
    const formData = {
       items: [{ 
        id: addToCartForm.querySelector('input[name="id"]').value,
        quantity: addToCartForm.querySelector('input[name="quantity"]').value,
        section: "js-cart-form" 
    }] 
  };

    // Send a POST request to add the item to the cart
    fetch(window.Shopify.routes.root + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    // Parse the response as JSON
    .then(response => response.json())
    // Fetch the current page after adding the item to the cart
    .then(() => fetch(window.location.origin))
    // Check if the response is ok
    .then(response => {
        if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
        return response.text();
    })
    // Parse the response text to update the cart details
    .then(responseText => {
        const parser = new DOMParser().parseFromString(responseText, "text/html");
        // Update the cart details and count in the DOM
        document.querySelector('.js-cart-form').innerHTML = parser.querySelector(this.selectors.addToCartBtn).innerHTML;
        document.querySelector('.js-item-count').textContent = parser.querySelector(this.selectors.itemCount).textContent;

        // Dispatch the custom event after the item is added to the cart
        const event = new CustomEvent('itemAddedToCart');
        document.dispatchEvent(event);
    
    })
    // Catch any errors that occur during the process
    .catch(error => console.error('Error:', error))
    
  
}
 // Display message function
 displayMessage(button) {
  // Display message on the add to cart button
  const confirmation = document.createElement('p');
  confirmation.classList.add('added-to-cart');
  confirmation.textContent = 'Added to cart!';
  button.appendChild(confirmation);

  // Hide the message after 2 seconds (adjust as needed)
  setTimeout(() => {
    confirmation.remove();
}, 2000);
}


}
customElements.define('add-to-cart', AddToCart);


  