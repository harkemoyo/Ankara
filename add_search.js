const fs = require('fs');

const searchIcon = `              <li class="header__account--items header__account--search__items">
                <a class="header__account--btn search__open--btn" href="javascript:void(0)" data-offcanvas>
                  <span class="header__account--btn__icon">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 16L11 11M12.6667 6.83333C12.6667 10.3333 9.33333 12.6667 6.83333 12.6667C4.33333 12.6667 1 10.3333 1 6.83333C1 3.33333 3.33333 1 6.83333 1C10.3333 1 12.6667 3.33333 12.6667 6.83333Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="visually-hidden">Search</span>
                </a>
              </li>`;

const searchBox = `  <!-- Search Overlay -->
  <div class="predictive__search--box">
    <div class="predictive__search--box__inner">
      <h2 class="predictive__search--title">Search Products</h2>
      <form class="predictive__search--form" action="shop.html" method="get" role="search">
        <label for="Search">
          <input class="predictive__search--input" id="Search" name="q" placeholder="Search Here" type="search">
        </label>
        <button class="predictive__search--button text-white" aria-label="search button">
          <svg width="20" height="20" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 16L11 11M12.6667 6.83333C12.6667 10.3333 9.33333 12.6667 6.83333 12.6667C4.33333 12.6667 1 10.3333 1 6.83333C1 3.33333 3.33333 1 6.83333 1C10.3333 1 12.6667 3.33333 12.6667 6.83333Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
    <button class="predictive__search--close__btn" aria-label="close search" data-offcanvas>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 512 512">
        <path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144M368 144L144 368"/>
      </svg>
    </button>
  </div>`;

['cart.html', 'checkout.html'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('predictive__search--box')) {
    c = c.replace(/<ul class="header__account--wrapper d-flex align-items-center">/, `<ul class="header__account--wrapper d-flex align-items-center">\n${searchIcon}`);
    c = c.replace(/<\/body>/, `${searchBox}\n</body>`);
    fs.writeFileSync(f, c);
    console.log('Added search to ' + f);
  }
});
