function toggleFilter() {
    const offcanvas = document.getElementById('filter-offcanvas');
    const backdrop = document.getElementById('filter-backdrop');
    offcanvas.classList.toggle('open');
    if (offcanvas.classList.contains('open')) {
        backdrop.style.display = 'block';
        setTimeout(() => backdrop.classList.add('open'), 10);
        document.body.style.overflow = 'hidden';
    } else {
        backdrop.classList.remove('open');
        setTimeout(() => backdrop.style.display = 'none', 300);
        document.body.style.overflow = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Offcanvas filter sidebar
    if (typeof offcanvsSidebar === 'function') {
        offcanvsSidebar(
            ".widget__filter--btn",
            ".offcanvas__filter--close",
            ".offcanvas__filter--sidebar"
        );
    }

    if (typeof customAccordion === 'function') {
        customAccordion(
            ".widget__categories--menu",
            ".widget__categories--menu__list",
            ".widget__categories--sub__menu"
        );
    }
});
