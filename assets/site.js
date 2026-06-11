/* Clean, hand-written JS for the static Stanton Tree Service site.
   Restores the mobile hamburger menu (stripped during malware cleanup) using a
   class + injected CSS we fully control, so it works without Elementor's JS.
   No external calls, no tracking — safe. */
(function () {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Inject CSS that force-opens the mobile dropdown when our class is present.
  var style = document.createElement('style');
  style.textContent =
    '.stanton-menu-open nav.elementor-nav-menu--dropdown{display:block !important;max-height:85vh !important;height:auto !important;overflow-y:auto !important;visibility:visible !important;opacity:1 !important;}' +
    '.stanton-menu-open nav.elementor-nav-menu--dropdown ul{display:block !important;}' +
    '.stanton-menu-open nav.elementor-nav-menu--dropdown li{display:block !important;}' +
    '.stanton-menu-open nav.elementor-nav-menu--dropdown a{display:block !important;}';
  document.head.appendChild(style);

  onReady(function () {
    document.querySelectorAll('.elementor-menu-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        var widget = toggle.closest('.elementor-widget-nav-menu') || toggle.parentElement;
        var open = widget.classList.toggle('stanton-menu-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        var dd = widget.querySelector('nav.elementor-nav-menu--dropdown');
        if (dd) dd.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
    });

    // Smooth-scroll for in-page anchor links (e.g. "How It Works").
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var id = link.getAttribute('href');
        if (id.length > 1) {
          var target = document.querySelector(id);
          if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        }
      });
    });
  });
})();
