// app.js — Mary Humphrey Wear

// ── Preloader hide (runs on window load) ────────────────────
window.addEventListener('load', function () {
  var preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.style.transition = 'opacity 0.5s ease';
    preloader.style.opacity   = '0';
    setTimeout(function () { preloader.style.display = 'none'; }, 600);
  }
});

document.addEventListener('DOMContentLoaded', function () {

  // ── Hero Slider ────────────────────────────────────────────
  if (document.querySelector('.hero__slider--activation')) {
    new Swiper('.hero__slider--activation', {
      slidesPerView: 1,
      loop: true,
      speed: 700,
      spaceBetween: 0,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    });
  }

  // ── Offcanvas (hamburger / search / minicart) ──────────────
  const offcanvasBtns = document.querySelectorAll('[data-offcanvas]');
  const offcanvasHeader = document.querySelector('.offcanvas__header');
  const minicart       = document.querySelector('.offCanvas__minicart');
  const searchBox      = document.querySelector('.predictive__search--box');

  offcanvasBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();

      // hamburger / offcanvas menu
      if (btn.closest('.offcanvas__header--menu__open') || btn.closest('.offcanvas__menu')) {
        if (offcanvasHeader) offcanvasHeader.classList.toggle('open');
      }

      // search toggle
      if (btn.classList.contains('search__open--btn') || btn.closest('.predictive__search--box')) {
        if (searchBox) searchBox.classList.toggle('open');
      }

      // minicart toggle
      if (btn.classList.contains('minicart__open--btn') || btn.closest('.offCanvas__minicart')) {
        if (minicart) minicart.classList.toggle('open');
      }

      // close btn inside offcanvas
      if (btn.classList.contains('offcanvas__close--btn') || btn.classList.contains('minicart__close--btn') || btn.classList.contains('predictive__search--close__btn')) {
        if (offcanvasHeader) offcanvasHeader.classList.remove('open');
        if (minicart)        minicart.classList.remove('open');
        if (searchBox)       searchBox.classList.remove('open');
      }
    });
  });

  // ── Header sticky on scroll ────────────────────────────────
  const mainHeader = document.querySelector('.header__sticky');
  if (mainHeader) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 80) {
        mainHeader.classList.add('sticky');
      } else {
        mainHeader.classList.remove('sticky');
      }
    });
  }

  // ── Footer accordion (mobile) ──────────────────────────────
  const footerTitles = document.querySelectorAll('.footer__widget--button');
  if (window.innerWidth < 768) {
    footerTitles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const widget = btn.closest('.footer__widget');
        const inner  = widget ? widget.querySelector('.footer__widget--inner') : null;
        if (!inner) return;
        const isOpen = widget.classList.contains('active');
        // close all
        document.querySelectorAll('.footer__widget').forEach(function (w) {
          w.classList.remove('active');
          const i = w.querySelector('.footer__widget--inner');
          if (i) i.style.display = 'none';
        });
        if (!isOpen) {
          widget.classList.add('active');
          inner.style.display = 'block';
        }
      });
    });
    // hide all inner lists initially on mobile
    document.querySelectorAll('.footer__widget--inner').forEach(function (el) {
      el.style.display = 'none';
    });
  }

});
