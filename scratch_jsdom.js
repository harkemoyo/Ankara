const jsdom = require("jsdom");
const { JSDOM } = jsdom;

JSDOM.fromURL("http://localhost:3000/", {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  const window = dom.window;

  // override fetch and console for logging
  window.console.error = (...args) => console.log('ERROR:', ...args);
  window.console.warn = (...args) => console.log('WARN:', ...args);
  window.console.log = (...args) => console.log('LOG:', ...args);
  
  window.addEventListener("load", () => {
    setTimeout(() => {
        const header = window.document.getElementById('site-header');
        if (header) {
            console.log("HEADER HTML:");
            console.log(header.outerHTML);
        } else {
            console.log("NO HEADER FOUND!");
        }
    }, 2000);
  });
}).catch(err => console.error(err));
