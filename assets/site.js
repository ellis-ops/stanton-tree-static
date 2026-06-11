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
    '.stanton-menu-open nav.elementor-nav-menu--dropdown{display:block !important;position:absolute !important;top:100% !important;left:0 !important;right:0 !important;width:100% !important;max-height:85vh !important;overflow-y:auto !important;visibility:visible !important;opacity:1 !important;background:#ffffff !important;z-index:9999 !important;box-shadow:0 10px 28px rgba(0,0,0,.16) !important;}' +
    '.stanton-menu-open nav.elementor-nav-menu--dropdown *{max-height:none !important;height:auto !important;overflow:visible !important;visibility:visible !important;opacity:1 !important;}' +
    '.stanton-menu-open nav.elementor-nav-menu--dropdown ul,.stanton-menu-open nav.elementor-nav-menu--dropdown li{display:block !important;}' +
    '.stanton-menu-open nav.elementor-nav-menu--dropdown a{display:block !important;padding:13px 22px !important;line-height:1.4 !important;}';
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
