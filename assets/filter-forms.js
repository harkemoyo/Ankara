// // Filter section renderng Ajax

class FiltersForms extends HTMLElement {
  constructor() {
    super();
    
    // input selectors
    this.selectors = {
      checkInputWrapper: ".js-form-input-check-wrapper",
      checkInput: ".js-check-input",
      collectionGrid: ".js-collection-grid",
      priceFilter: ".js-price-filter",
      
    };
    // Input classes
    this.classes = {
      checkInputWrapper: "js-form-input-check-wrapper",
      checkInput: "js-check-input",
      collectionGrid: "js-collection-grid",
      priceFilter: "js-price-filter",
    };

    // Query selectors
    this.checkInputWrapper = this.querySelector(
      this.selectors.checkInputWrapper
    );
    this.checkInput = this.querySelector(this.selectors.checkInput);
    this.collectionGrid = this.querySelector(this.selectors.collectionGrid);
    this.priceFilter = this.querySelectorAll(this.selectors.priceFilter);
    
    
   
    // Event handler bound to 'change' event
    this.addEventListener("change", (e) => {
      this.sectionListFilter(e);
      this.priceRangeChange(e);
    });
  }

  // Function to find the closest ancestor element that matches the given selector
  sectionListFilter(ev) {
    const target = ev.target;
    // Target the input element
    if (target) {
      // Finding the closest ancestor of the target that matches the selector
      const inputWrapper = target.closest(this.selectors.checkInput);
      // Exit if inputWrapper not found
      if (!inputWrapper) return;
      // Extract the properties from the inputWrapper
      const name = inputWrapper.name;
      const value = inputWrapper.value;
      // Create a new URL object from the current window location
      const url = new URL(window.location.href);

      // Check if input is checked
      if (inputWrapper.checked) {
        // Append the name and value of the element to search input
        url.searchParams.append(name, value);
      } else {
        // filtering name/value pair from the URL's query parameters
        const filteredParams = url.searchParams
          .getAll(name)
          .filter((param) => param != value);
        url.searchParams.delete(name);

        //iterating through Filtered  name/value pairs in the URL's query parameters and add them to the search input
        for (const key of filteredParams) {
          url.searchParams.append(name, key);
        }
      }
      //  Fetch data based on the updated URL

      this.domFetchUrl(url);
    }
  }

  // Section rendering function
  domFetchUrl(url) {
    // Fetch URL from server
    fetch(url)
    .then((response) => response.text())
    .then((responseText) => {

      // Parse the DOM
      const new_html = new DOMParser().parseFromString( responseText, "text/html");

      // Get the new HTML of the DOM
      const parsedData = new_html.documentElement.querySelector( this.selectors.collectionGrid);

      // Change the to current selected
      document.querySelector(this.selectors.collectionGrid).innerHTML = parsedData.innerHTML;

      // Push the new URL to the browser history without reloading.
      window.history.pushState({}, "", url);
      });
  }

 // Updating the URL with the new min and max price parameters.
  // whenever a change occurs in the price range inputs
  priceRangeChange(ev) {
    // Finding the target price range input
    let target = ev.target;
  
    // Getting the price NodeList 
    const priceRangeInputs = this.priceFilter;
  
    // Check if priceFilter contains exactly two elements
    if (priceRangeInputs.length === 2) {
      // Separating price range input first element from second element
      const minPriceInput = priceRangeInputs[0];
      const maxPriceInput = priceRangeInputs[1];
  
      // Check if the targeted input is the correct price range
      if (target === minPriceInput || target === maxPriceInput) {
        // Extract the price range from the price range input
        const minPrice = minPriceInput.value;
        const maxPrice = maxPriceInput.value;
  
        // Check if minPrice is a negative number, set it to 0
        if (parseFloat(minPrice) < 0) {
          minPriceInput.value = 0;
        }
  
        // Check if maxPrice is a negative number, set it to 0
        if (parseFloat(maxPrice) < 0) {
          maxPriceInput.value = 0;
        }
  
        // Ensure that maxPrice is always larger than minPrice
        if (parseFloat(maxPrice) < parseFloat(minPrice)) {
          maxPriceInput.value = minPrice;
        }
  
        // Check if maxPrice exceeds the maximum value specified by the 'max' attribute
        if (parseFloat(maxPrice) > parseFloat(maxPriceInput.dataset.max)) {
          maxPriceInput.value = maxPriceInput.dataset.max;
        }
  
        // Update the 'min' attribute of maxPriceInput if minPrice is not empty
        if (minPrice) {
          maxPriceInput.min = minPrice;
        }
  
        // Update the 'max' attribute of minPriceInput if maxPrice is not empty
        if (maxPrice) {
          minPriceInput.max = maxPrice;
        }
  
        // Create a new URL object from the current window location
        const url = new URL(window.location.href);
  
        // Remove existing min and max price parameters from the URL search params
        url.searchParams.delete(minPriceInput.name);
        url.searchParams.delete(maxPriceInput.name);
  
        // Append new min and max price parameters to the URL search params
        if (minPrice) {
          url.searchParams.append(minPriceInput.name, minPrice);
        }
        if (maxPrice) {
          url.searchParams.append(maxPriceInput.name, maxPrice);
        }
  
        // Fetch data based on the updated URL
        this.domFetchUrl(url);
      }
    }
  }
  
  
  
  
}

customElements.define("filter-forms", FiltersForms);
