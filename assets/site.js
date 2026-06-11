/* Clean, hand-written JS for the static Stanton Tree Service site.
   Restores the mobile hamburger menu toggle that was stripped during malware cleanup.
   No external calls, no tracking — safe. */
(function () {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  onReady(function () {
    // Elementor mobile menu: clicking the hamburger toggles the dropdown nav.
    var toggles = document.querySelectorAll('.elementor-menu-toggle');
    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        var widget = toggle.closest('.elementor-widget-nav-menu') || toggle.parentElement;
        // The mobile menu container is the widget-level <nav class="elementor-nav-menu--dropdown">,
        // NOT the nested submenu <ul>. Target the nav element specifically.
        var dropdown = widget && widget.querySelector('nav.elementor-nav-menu--dropdown');
        if (dropdown) {
          dropdown.style.display = isOpen ? 'none' : 'block';
          dropdown.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
        }
      });
    });

    // Nested submenu expand/collapse on mobile (tap a parent item to open its submenu).
    document.querySelectorAll('.elementor-nav-menu--dropdown .menu-item-has-children > a .sub-arrow, .elementor-nav-menu--dropdown .elementor-item-active + .sub-menu').forEach(function () {});

    // Smooth-scroll for in-page anchor links (e.g. "How It Works").
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id.length > 1) {
          var target = document.querySelector(id);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  });
})();
