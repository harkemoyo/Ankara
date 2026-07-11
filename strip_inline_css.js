const fs = require('fs');

const files = ['index.html', 'shop.html', 'product.html', 'about.html', 'contact.html'];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    let isUtf16 = false;
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes('\0')) {
        html = fs.readFileSync(file, 'utf16le');
        isUtf16 = true;
    }

    // Mini Cart Drawer replacements
    html = html.replace(/<div class="offCanvas__minicart js-cart-form" style="[^"]*">/g, '<div class="offCanvas__minicart js-cart-form">');
    html = html.replace(/<div class="minicart__header--top" style="[^"]*">/g, '<div class="minicart__header--top">');
    html = html.replace(/<h3 class="minicart__title" style="[^"]*">Cart<\/h3>/g, '<h3 class="minicart__title">Cart</h3>');
    html = html.replace(/<button type="button" class="minicart__close--btn" aria-label="close cart" data-offcanvas style="[^"]*">\&times;<\/button>/g, '<button type="button" class="minicart__close--btn" aria-label="close cart" data-offcanvas>&times;</button>');
    html = html.replace(/<div id="minicart-items-list" class="minicart__product" style="[^"]*"><\/div>/g, '<div id="minicart-items-list" class="minicart__product"></div>');
    html = html.replace(/<div class="minicart__amount" style="[^"]*">/g, '<div class="minicart__amount">');
    html = html.replace(/<div class="cart__note" style="[^"]*">/g, '<div class="cart__note">');
    html = html.replace(/<h4 style="[^"]*">Order Note<\/h4>/g, '<h4>Order Note</h4>');
    html = html.replace(/<textarea class="cart__note--input" placeholder="" style="[^"]*"><\/textarea>/g, '<textarea class="cart__note--input" placeholder=""></textarea>');
    html = html.replace(/<div class="minicart__amount_list" style="[^"]*">/g, '<div class="minicart__amount_list">');
    html = html.replace(/<span style="[^"]*">Subtotal<\/span>/g, '<span>Subtotal</span>');
    html = html.replace(/<span id="minicart-subtotal" style="[^"]*">/g, '<span id="minicart-subtotal">');
    html = html.replace(/<p style="font-size: 1\.2rem; color: var\(--foreground-sub-color\); text-align: center; margin-bottom: 2rem; line-height: 1\.6;">Shipping, taxes, and discount codes calculated at checkout\.<\/p>/g, '<p>Shipping, taxes, and discount codes calculated at checkout.</p>');
    html = html.replace(/<div class="minicart__button" style="[^"]*">/g, '<div class="minicart__button">');
    html = html.replace(/<a class="minicart__button--link" href="cart\.html" style="[^"]*">View Cart<\/a>/g, '<a class="minicart__button--link" href="cart.html">View Cart</a>');
    html = html.replace(/<a class="minicart__button--link" href="javascript:void\(0\)" onclick="triggerCheckout\(\)" style="[^"]*">Check Out<\/a>/g, '<a class="minicart__button--link checkout__btn" href="javascript:void(0)" onclick="triggerCheckout()">Check Out</a>');

    // Logo styles replacements
    html = html.replace(/<img src="assets\/IMG-20260622-WA0082\.webp" alt="Mary Humphrey African Wear" class="main__logo--img" style="[^"]*">/g, '<img src="assets/IMG-20260622-WA0082.webp" alt="Mary Humphrey African Wear" class="main__logo--img">');
    html = html.replace(/<img src="assets\/IMG-20260622-WA0082\.webp" alt="Mary Humphrey African Wear" style="[^"]*">/g, '<img src="assets/IMG-20260622-WA0082.webp" alt="Mary Humphrey African Wear" class="offcanvas__logo--img">');


    fs.writeFileSync(file, html, isUtf16 ? 'utf16le' : 'utf8');
    console.log(`Updated ${file}`);
});
