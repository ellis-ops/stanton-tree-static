/* Clean, hand-written JS for the static Stanton Tree Service site.
   Builds a custom mobile menu (the original Elementor menu JS was stripped during
   malware cleanup). Clones the existing menu links into our own overlay panel so it
   always works, regardless of Elementor's internal CSS. No external calls — safe. */
(function () {
  function onReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  var css =
    '#stanton-mm{display:none;position:fixed;inset:0;background:#fff;z-index:99999;overflow-y:auto;padding:74px 0 40px;-webkit-overflow-scrolling:touch;}' +
    '#stanton-mm.open{display:block;}' +
    '#stanton-mm ul{list-style:none;margin:0;padding:0;}' +
    '#stanton-mm li{border-bottom:1px solid #eef0ee;}' +
    '#stanton-mm a{display:block;padding:14px 24px;color:#243b2e;text-decoration:none;font-size:17px;font-weight:600;}' +
    '#stanton-mm .sub-menu{background:#f7faf8;}' +
    '#stanton-mm .sub-menu a{padding-left:42px;font-size:15px;font-weight:500;color:#4a5f53;}' +
    '#stanton-mm .sub-menu .sub-menu a{padding-left:60px;}' +
    '#stanton-mm-close{position:fixed;top:18px;right:20px;width:40px;height:40px;border:none;background:#e8f0ea;border-radius:8px;font-size:26px;line-height:40px;color:#243b2e;z-index:100000;cursor:pointer;display:none;}' +
    '#stanton-mm.open ~ #stanton-mm-close,#stanton-mm-close.show{display:block;}' +
    // Desktop dropdown on hover (Elementor's toggle JS was stripped).
    '.elementor-nav-menu--main .menu-item-has-children{position:relative;}' +
    '.elementor-nav-menu--main .menu-item-has-children:hover>.sub-menu{display:block !important;top:100% !important;left:0 !important;opacity:1 !important;visibility:visible !important;}' +
    '.elementor-nav-menu--main .sub-menu .menu-item-has-children:hover>.sub-menu{display:block !important;top:0 !important;left:100% !important;}' +
    // Blog/post card thumbnails: fill the card area (no gray gap).
    '.elementor-post__thumbnail img{position:absolute !important;left:0 !important;top:0 !important;inset:0 !important;width:100% !important;height:100% !important;object-fit:cover !important;transform:none !important;max-height:none !important;}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  onReady(function () {
    // Find the richest menu list to clone (the one with the most links).
    var lists = Array.from(document.querySelectorAll('ul.elementor-nav-menu'));
    var source = lists.sort(function (a, b) {
      return b.querySelectorAll('a').length - a.querySelectorAll('a').length;
    })[0];
    if (!source) return;

    var panel = document.createElement('div');
    panel.id = 'stanton-mm';
    var cloned = source.cloneNode(true);
    // strip elementor classes that might carry weird styles, keep structure
    panel.appendChild(cloned);
    document.body.appendChild(panel);

    var close = document.createElement('button');
    close.id = 'stanton-mm-close';
    close.setAttribute('aria-label', 'Close menu');
    close.innerHTML = '&times;';
    document.body.appendChild(close);

    function setOpen(open) {
      panel.classList.toggle('open', open);
      close.classList.toggle('show', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    document.querySelectorAll('.elementor-menu-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!panel.classList.contains('open'));
      });
    });
    close.addEventListener('click', function () { setOpen(false); });
    // close when a real link is tapped
    panel.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && a.getAttribute('href') && a.getAttribute('href') !== '#') setOpen(false);
    });

    // Align the homepage "Why Stanton" reasons grid: the original has an empty
    // leading + trailing grid cell that pushes the reasons out of line. Hide the
    // empty cells so the 7 reasons flow cleanly from the left.
    var whyGrid = document.querySelector('.elementor-element-ff14548');
    if (whyGrid) {
      Array.prototype.forEach.call(whyGrid.children, function (cell) {
        if (cell.textContent.trim().length < 2 && !cell.querySelector('img')) {
          cell.style.display = 'none';
        }
      });
    }

    // Smooth-scroll for in-page anchor links.
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
