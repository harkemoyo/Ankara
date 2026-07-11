const fs = require('fs');
const css = `
/* ========================================================
   Custom Mini Cart Layout & Header Extras (Replacing Inline CSS)
   ======================================================== */
.offCanvas__minicart {
    display: flex;
    flex-direction: column;
}
.minicart__header--top {
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding-bottom: 1.5rem; 
    border-bottom: 1px solid var(--border-color); 
    margin-bottom: 2rem;
}
.minicart__title {
    font-family: var(--karma-fonts); 
    font-size: 2.4rem; 
    color: var(--primary-color); 
    font-weight: 500;
}
.minicart__close--btn {
    background: none; 
    border: none; 
    font-size: 2.4rem; 
    cursor: pointer; 
    color: var(--primary-color); 
    line-height: 1;
}
.minicart__product {
    flex: 1; 
    overflow-y: auto; 
    padding-right: 1rem;
}
.minicart__amount {
    border-top: 1px solid var(--border-color); 
    padding-top: 2rem; 
    margin-top: 2rem;
}
.cart__note {
    margin-bottom: 2rem;
}
.cart__note h4 {
    font-family: var(--karma-fonts); 
    font-size: 1.3rem; 
    font-weight: 600; 
    color: var(--primary-color); 
    text-transform: uppercase; 
    margin-bottom: 1rem; 
    letter-spacing: 0.2em;
}
.cart__note--input {
    width: 100%; 
    height: 80px; 
    padding: 1rem; 
    border: 1px solid var(--border-color); 
    font-family: var(--karma-fonts); 
    font-size: 1.3rem; 
    color: var(--primary-color); 
    resize: vertical; 
    outline: none;
}
.minicart__amount_list {
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 1rem;
}
.minicart__amount_list span:first-child {
    font-family: var(--karma-fonts); 
    font-size: 1.3rem; 
    font-weight: 600; 
    letter-spacing: 0.2em; 
    text-transform: uppercase;
}
#minicart-subtotal {
    font-size: 1.6rem; 
    font-weight: 700; 
    color: var(--primary-color);
}
.minicart__amount > p {
    font-size: 1.2rem; 
    color: var(--foreground-sub-color); 
    text-align: center; 
    margin-bottom: 2rem; 
    line-height: 1.6;
}
.minicart__button {
    padding-bottom: 2rem; 
    display: flex; 
    gap: 1rem;
}
.minicart__button--link {
    display: block; 
    flex: 1; 
    padding: 1.6rem; 
    font-size: 1.4rem; 
    letter-spacing: 0.15em; 
    text-transform: uppercase; 
    text-align: center; 
    cursor: pointer; 
    transition: all 0.3s ease; 
    font-weight: 600;
}
.minicart__button--link:not(.checkout__btn) {
    background: #fff; 
    color: var(--primary-color); 
    border: 2px solid var(--border-color); 
}
.minicart__button--link.checkout__btn {
    background: var(--bg-black-color); 
    color: #fff; 
    border: 2px solid var(--bg-black-color); 
}

/* Logos */
.main__logo--img {
    height: 60px; 
    width: auto; 
    object-fit: contain;
}
.offcanvas__logo--img {
    height: 50px; 
    width: auto; 
    object-fit: contain;
}
`;
fs.appendFileSync('assets/style.css', css, 'utf8');
console.log('Appended minicart css to style.css');
