const fs = require('fs');
const css = `
/* ========================================================
   Custom Header Flexbox Layout (Replacing Bootstrap classes)
   ======================================================== */
.header__topbar, .main__header {
    display: flex;
    justify-content: center;
    padding-inline: 1.5rem;
}
.header__topbar.bg__primary {
    background-color: var(--primary-color);
}
.header__topbar--inner, .main__header--inner {
    width: 100%;
    max-width: 1200px;
    display: flex;
}
.header__topbar--inner {
    justify-content: center;
    align-items: center;
    text-align: center;
}
.main__header--inner {
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
}
.header__menu--wrapper, .header__account--wrapper {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

/* Ensure menu lists are horizontal without bullet points */
.header__menu--wrapper {
    list-style: none;
    margin: 0;
    padding: 0;
}
.header__account--wrapper {
    list-style: none;
    margin: 0;
    padding: 0;
}

/* Visibility controls based on viewport */
.header__menu, .header__account--search__items {
    display: none;
}

@media (min-width: 992px) {
    .header__menu, .header__account--search__items {
        display: block;
    }
    .offcanvas__header--menu__open {
        display: none;
    }
}
`;
fs.appendFileSync('assets/style.css', css, 'utf8');
console.log('Appended to style.css');
