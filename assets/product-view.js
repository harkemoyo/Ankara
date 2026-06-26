class ProductView extends HTMLElement {
    constructor() {
      super();
    
      // selector Elements
    this.selectors = {
       
        quickViewContainer: ".js-quick-view-container",
        productUrl: ".js-modal-view"
    };
    
    // classes Elements
    this.classes = { 
        quickViewContainer: "js-quickview-container"
    };

    // Locating tool Elements
    this.quickViewContainer = this.querySelector(this.selectors.quickViewContainer)
 
    this.productUrl = this.querySelector(this.selectors.productUrl)
    
    // Click listeners for QuickView element
    this.addEventListener("click", (e) =>{
      
        this.showQuickView(e)
    });
    }
    // Find quick view container from DOM
    showQuickView(ev){
       // target element in quick view wrapper
        let target = ev.target

       // Find the closest ancestor element that matches the productUrl selector
      const targetEl = target.closest(this.selectors.productUrl);
       // Get the value of the "data-url" attribute from the target element
      const productPath = targetEl.dataset.url

       // Create the full URL by combining the origin of the current window and the productPath
      const url = window.location.origin + productPath;

        this.domFetchUrl(url)
   
    }
    // Section parse function
  domFetchUrl(url) {
      // Fetch URL from server
      fetch(url)
      .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.text();
    })
    .then((responseText) => {

      // Parse the DOM
      const new_html = new DOMParser().parseFromString( responseText, "text/html");
      // Get the new HTML of the DOM
      const parsedData = new_html.querySelector( this.selectors.productUrl);
      // Change the to current selected
      document.querySelector(this.selectors.quickViewContainer).innerHTML = parsedData.innerHTML;

      });
  }
}
      customElements.define("product-view", ProductView);
