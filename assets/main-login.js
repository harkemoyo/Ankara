// Login js

class Mainlogin extends HTMLElement{

    constructor(){
        super();
        // selectors
        this.selector ={
            mainloginform: ".js-main-login",
            forgotPassword: ".js-forgot-password",
            recoverPassword: ".js-recover-password",

        }

        // classes
        this.class = {
            hide: "hide",
        }

        // Elements

        this.mainloginform = this.querySelector(this.selector.mainloginform);
        this.button = this.querySelector(this.selector.forgotPassword);
        this.recoverPassword = this.querySelector(this.selector.recoverPassword);

        // I want to show the recoveryPassword form when the user clicks on forgot password
        this.button.addEventListener("click", this.showHideForms.bind(this));

    }

    // Listening for for click event when forgortPasword is click to trigger  ShowRecoverPassword function
        showHideForms(){
            //// Show the recoverPassword form when the user clicks on forgot password
            this.showRecoverPassword();
            // hide the recoverPassword form when the user clicks on login button
            this.hideMainloginForm();
        }
    

    // Show the recoverPassword
    showRecoverPassword(){
        if(this.recoverPassword.classList.contains(this.class.hide)){
            this.recoverPassword.classList.remove(this.class.hide);
          }
      
    }
    // Hide the recoveryPassword
    hideMainloginForm(){
     
      if(this.mainloginform.classList.contains(this.class.hide) == false){
        this.mainloginform.classList.add(this.class.hide);
       
    }
    }

}
customElements.define('main-login',Mainlogin);