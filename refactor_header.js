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

    // Replace header__topbar container
    html = html.replace(
        /<div class="header__topbar bg__primary">[\s\r\n]*<div class="container">[\s\r\n]*<div class="header__topbar--inner text-center">/g,
        '<div class="header__topbar bg__primary">\n            <div class="header__topbar--inner">'
    );

    // Replace main__header container
    html = html.replace(
        /<div class="main__header position__relative header__sticky">[\s\r\n]*<div class="container">[\s\r\n]*<div[\s\r\n]*class="main__header--inner d-flex justify-content-between align-items-center">/g,
        '<div class="main__header header__sticky">\n            <div class="main__header--inner">'
    );

    // Replace main__header container (if without position__relative, e.g. in index)
    html = html.replace(
        /<div class="main__header header__sticky">[\s\r\n]*<div class="container">[\s\r\n]*<div[\s\r\n]*class="main__header--inner d-flex justify-content-between align-items-center">/g,
        '<div class="main__header header__sticky">\n            <div class="main__header--inner">'
    );
    
    // Replace main__header container (transparent version)
    html = html.replace(
        /<div class="main__header transparent__header header__sticky">[\s\r\n]*<div class="container">[\s\r\n]*<div[\s\r\n]*class="main__header--inner d-flex justify-content-between align-items-center">/g,
        '<div class="main__header transparent__header header__sticky">\n            <div class="main__header--inner">'
    );

    // Cleanup menu and account classes
    html = html.replace(/class="header__menu d-none d-lg-block"/g, 'class="header__menu"');
    html = html.replace(/class="header__menu--wrapper d-flex"/g, 'class="header__menu--wrapper"');
    html = html.replace(/class="header__account--wrapper d-flex align-items-center"/g, 'class="header__account--wrapper"');
    html = html.replace(/class="header__account--items header__account--search__items d-none d-lg-block"/g, 'class="header__account--items header__account--search__items"');

    // Remove the closing </div> of container for topbar
    html = html.replace(
        /<\/p>[\s\r\n]*<\/div>[\s\r\n]*<\/div>[\s\r\n]*<\/div>[\s\r\n]*<!-- ── Main Header ────────────────────────────── -->/g,
        '</p>\n                </div>\n        </div>\n\n        <!-- ── Main Header ────────────────────────────── -->'
    );

    // Remove the closing </div> of container for main__header
    html = html.replace(
        /<\/div>[\s\r\n]*<\/div>[\s\r\n]*<\/div>[\s\r\n]*<!-- ── Offcanvas Mobile Menu ──────────────────── -->/g,
        '</div>\n            </div>\n\n        <!-- ── Offcanvas Mobile Menu ──────────────────── -->'
    );

    fs.writeFileSync(file, html, isUtf16 ? 'utf16le' : 'utf8');
    console.log(`Updated ${file}`);
});
