// Product Options 

class ProductOptions extends HTMLElement {
    constructor(){
        super();
        console.log(this);
        // selectors
        this.selectors = {
            productForm: '.js-product-form',
            JSONProduct: '.js-product-json',
            variantRadioInputs: '.js-product-option input[type="radio"]',
            variantId: '#product-id',
            price: '.js-product-price',
            addToCart: '.js-add-to-cart',
            productCompareAtPrice: '.js-product-compare-at-price'
        }

        // classes
        this.classes = {
            price: 'js-product-price',
            productCompareAtPrice: 'js-product-compare-at-price'
        };
        // query for product variants 
        this.variantRadioInputs = this.querySelectorAll(this.selectors.variantRadioInputs)
        this.variantId = this.querySelector(this.selectors.variantId)
        this.JSONProduct = this.querySelector(this.selectors.JSONProduct)
        this.productForm = this.querySelector(this.selectors.productForm)
        this.price = this.querySelector(this.selectors.price)
        this.productCompareAtPrice = this.querySelector(this.selectors.productCompareAtPrice)
        
        // Add the product variant to listen for changes
        this.addEventListener("change", this.addProductVariant.bind(this))
    }
      // Variants function
    addProductVariant(ev){
      //   Target the product
        let productVariant = ev.target
        const productForm = productVariant.closest(this.selectors.productForm)
      // use selected option to get variants
        if(productForm){
        const variants = this.getProductVariant(productForm)
        this.upadateVariantsId(variants)
        this.upadateVariantsUrl(variants)
        this.updateVariantPrice(variants)
      
        }


    }


    // Get selected product option function
    getProductVariant(form){
        // Get  product json object
        const  productJSON = form.querySelector(this.selectors.JSONProduct)
        const product = JSON.parse(productJSON.textContent);
        // locate selected product option
           
        let selectedProduct = [];
        
        this.variantRadioInputs.forEach(input => {
            
            if (input.checked === true) {
            selectedProduct.push(input.value);
            }
            
        })
          // find Matched Variant product variants
        const matchedVariants = product.variants.find(variant =>{
            // Looping through options to find  all matched  variants
            
                // Initialize a flag to track whether the current variant matches all selected options
                let pass = true;
                for (let i = 0; i < selectedProduct.length; i++) {
                   if( selectedProduct.indexOf(variant.options[i]) === -1) {
                    pass = false;
                    break
                   }
                    
                }
              
                return pass;
              });
              
              return matchedVariants
    }
    // update the variant id 
     upadateVariantsId(variants){
        this.variantId.value = variants.id
        
        
    
    }
    // upadate the variant URLs
    upadateVariantsUrl(variant){
           // Check if the current page is a product page
    const isProductPage = window.location.href.includes('/products');
          // Get the query parameters from the current URL
    const urlParameters = window.location.search.replace("?", "");
         // Exit early if not on a product page
    if (!isProductPage) return;    

      // Initialize the new search string with the variant ID
    let search = `?variant=${variant.id}`;
      // Iterate over the existing query parameters
    for (const part of urlParameters.split("&")) {
        // Check if the current parameter is not the variant parameter
    if (part && !part.includes("variant=")) {
        // Append the parameter to the search string
        search += `&${part}`;
        }
    }
     // Construct the new URL with the updated search string
     const url = `${window.location.pathname}${search}`;
      // Replace the current URL in the history with the new URL
    window.history.replaceState({}, null, url);
    }

    // update the price
    updateVariantPrice(variant) {
         // Calculate product prices
        // Convert price from cents to dollars
    const productPrice = variant.price / 100;
    const productComparePrice = variant.compare_at_price / 100;
     // Get locale, country, and currency
     // Get the locale from Shopify
    const locale = window.Shopify.locale;
    // Get the country from Shopify
    const country = window.Shopify.country; 
    // Get the active currency from Shopify
    const currency = window.Shopify.currency.active; 
      // Format prices
      // Format product price as currency
      const price = new Intl.NumberFormat(`${locale}-${country}`, { style: 'currency', currency: `${currency}` }).format(productPrice); 
      // Format compare at price as currency
      const compareAtPrice = new Intl.NumberFormat(`${locale}-${country}`, { style: 'currency', currency: `${currency}` }).format(productComparePrice); 
          // Change price
      // Find and update the main product price
    this.querySelector(this.selectors.price).textContent = price;

        // Find and update the compare at price if it exists
        // Get the element with the productCompareAtPrice selector
    const comparePriceTags = this.productCompareAtPrice;

      // Check if the element has the productCompareAtPrice class
    if (comparePriceTags) {
      // Update the text content of the element to the compareAtPrice
    comparePriceTags.textContent = compareAtPrice;
    

    // Compare the compareAtPrice with the main price
    // If compareAtPrice is greater than the main price, remove the 'hide' class to show the element
    // Otherwise, add the 'hide' class to hide the element
    variant.compare_at_price > variant.price ? this.productCompareAtPrice.classList.remove('hide') : this.productCompareAtPrice.classList.add('hide');
}

    }

}
customElements.define('product-options', ProductOptions)