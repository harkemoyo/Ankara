// main addresses js

class Mainaddress extends HTMLElement {
  constructor() {
    super();

    // selectors for the main address
    this.selectors = {
      addNewAddressBtn: ".js-add-new-address-btn",
      addNewAddressForm: ".js-add-new-address-form",
      editAddressForm: ".js-edit-address",
      editAddressBtn: ".js-edit-address-btn",
      cancelEditAddressBtn: ".js-cancel-edit-address",
      addNewAddressWrapper: ".add-new-address-wrapper",
      editAddressWrapper: ".edit-address-wrapper",
      cancelNewAddressFormBtn: ".cancel-new-address-form",
      countrySelector: ".js-country-selector",
      provinceSelector: ".js-province-selector",
    };

    // classes for the main address
    this.classes = {
      hide: "hide",
      addNewAddressBtn: "js-add-new-address-btn",
      addNewAddressForm: "js-add-new-address-form",
      editAddressForm: "js-edit-address",
      editAddressBtn: "js-edit-address-btn",
      cancelEditAddressBtn: "js-cancel-edit-address",
      cancelNewAddressFormBtn: "cancel-new-address-form",
      countrySelector: "js-country-selector",
      provinceSelector: "js-province-selector",
    };
    // Elements for the main address
    this.addNewAddressForm = this.querySelector(
      this.selectors.addNewAddressForm
    );
    this.editAddressForm = this.querySelector(this.selectors.editAddressForm);
    this.addNewAddressWrapper = this.querySelector(
      this.selectors.addNewAddressWrapper
    );
    this.editAddressWrapper = this.querySelector(
      this.selectors.editAddressWrapper
    );
    this.addNewAddressBtn = this.querySelector(this.selectors.addNewAddressBtn);
    this.cancelNewAddressFormBtn = this.querySelector(
      this.selectors.cancelNewAddressFormBtn
    );
    this.countrySelector = this.querySelector(this.selectors.countrySelector);

    this.provinceSelector = this.querySelector(this.selectors.provinceSelector);
    // console.log("this",this);
    // console.log("provinceSelector",this.provinceSelector);
    // // common ancestor for country selectors
    this.countrySelector = this;
    // // Add change event listeners for the countrySelector
    this.addEventListener("change", (e) => {
      // check for the targeted inputSelected
      if (e.target.classList.contains(this.classes.countrySelector)) {
        // Attach the countrySelector to the newForm
        // console.log("addnewaddress",this.selectors.addNewAddressForm);
        const newForm = e.target.closest(this.selectors.addNewAddressForm);
        if (newForm) {
          this.getCountryProvince(newForm);
        }

        const editForm = e.target.closest(this.selectors.editAddressForm)
        if (editForm) {
          this.getCountryProvince(editForm);
        }
      }
    });

    // Add click listeners for the buttons in the addresses field
    this.addEventListener("click", (ev) => {
      this.handleClickEvent(ev);
    });
  }

  // handle the click
  handleClickEvent(ev) {
    let target = ev.target;

    let newForm;
    let editForm;
    // show default form
    // onclickAddNewAddress button show the address form
    if (target.classList.contains(this.classes.addNewAddressBtn)) {
      ev.preventDefault();
      newForm = target
        .closest(this.selectors.addNewAddressWrapper)
        .querySelector(this.selectors.addNewAddressForm);
      this.showAddressForm(newForm);

      if (newForm) {
        this.getCountryProvince(newForm);
      }
    }

    //  Adding hide class to new address form when cancel button is clicked
    if (target.classList.contains(this.classes.cancelNewAddressFormBtn)) {
      ev.preventDefault();
      newForm = target
        .closest(this.selectors.addNewAddressWrapper)
        .querySelector(this.selectors.addNewAddressForm);
      this.hideAddressFormOnClickCancel(newForm);
    }

    /****     Edit form event handlers ***/
    //   //   Edit form button
    if (target.classList.contains(this.classes.editAddressBtn)) {
      ev.preventDefault();
      editForm = target
        .closest(this.selectors.editAddressWrapper)
        .querySelector(this.selectors.editAddressForm)
      this.showFormOnClickEditBtn(editForm);
    }
    if (target.classList.contains(this.classes.cancelEditAddressBtn)) {
      editForm = target
        .closest(this.selectors.editAddressWrapper)
        .querySelector(this.selectors.editAddressForm);

      this.hideFormOnClickCancelBtn(editForm);
    }
  }

  // show the new address form function
  showAddressForm(newForm) {
    newForm.classList.toggle(this.classes.hide);
  }
  //   hide the new address form when cancel button is clicked
  hideAddressFormOnClickCancel(newForm) {
    newForm.classList.add(this.classes.hide);
  }

  /*  Edit button functionalities */
  //  Show edit form function
  showFormOnClickEditBtn(editForm) {
  // Reset the form to its default state
  editForm.reset();

  // Finding dataset for edit form
  const countrySelector = editForm.querySelector(this.selectors.countrySelector);
  // Getting data-default
  const EditFormCountry = countrySelector.dataset.default

  // Set the default value for the countrySelector
  if ( EditFormCountry ) {
      countrySelector.value = EditFormCountry ;
  }

  // Toggle the hide class
  editForm.classList.toggle(this.classes.hide);

  // Call the getCountryProvince function to update the provinces based on the default country
  this.getCountryProvince(editForm);
}


  // Hide edit form function
  hideFormOnClickCancelBtn(editForm) {
    editForm.classList.add(this.classes.hide);
  }

  /**************** Country selectors functionalities*******************/
  // Show country and province

  getCountryProvince(form) {
    // check for the default country
    // (1) Get the country from the form
    // console.log("CountrySelector",this.selectors.countrySelector);
    const selectedCountry = form.querySelector(this.selectors.countrySelector);
    // console.log("selected country",selectedCountry);
    // provinces
    const selectedProvince = form.querySelector(
      this.selectors.provinceSelector
    );
    // (2)Get the selectors attributes from the selector
    const country =
      selectedCountry.options[selectedCountry.options.selectedIndex];
    // console.log("country",country)
    // (3)Get the province data attributes from the  selector
    const provincesOptions = country.dataset.provinces;
    // console.log("provincesOptions",provincesOptions)
    // (4)Json parse the province data attributes to get the object {Key, Value} pair
    const provinces = JSON.parse(provincesOptions);
    // clear the provincesSelector
    console.log();
    selectedProvince.innerHTML = "";
    // (5)Populate the province data attributes
    if (provinces && provinces.length === 0) {
      if (selectedProvince.classList.contains(this.classes.hide) === false) {
        selectedProvince.classList.add(this.classes.hide);
      }
    } else {
      provinces.forEach((province) => {
        const optEl = document.createElement("option");
        optEl.value = province[0];
        optEl.text = province[1];
        selectedProvince.appendChild(optEl);
      });

      if (selectedProvince.classList.contains(this.classes.hide)) {
        // console.log("provinceSelector with provinces",selectedProvince.va);
        selectedProvince.classList.remove(this.classes.hide);
      }
    }
  }
}

customElements.define("main-addresses", Mainaddress);
