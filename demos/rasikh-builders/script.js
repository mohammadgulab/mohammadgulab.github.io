(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // header state on scroll
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  function closeMenu() {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      document.body.classList.toggle('menu-open', !open);
    });
    nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  // smooth scroll for in-page links (CSS handles most; this offsets for the fixed header)
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      if (history.replaceState) history.replaceState(null, '', id);
    });
  });

  // scroll reveal
  var items = document.querySelectorAll('.reveal');
  if (!reduce && 'IntersectionObserver' in window) {
    doc.classList.add('reveal-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  }

  // tabs (menu)
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = list.querySelectorAll('[role="tab"]');
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); n.focus(); select(n); }
      });
    });
  });

  // demo-only forms / buttons
  document.querySelectorAll('form[data-demo]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = f.querySelector('.demo-note');
      if (note) { note.textContent = 'This is a demo site \u2014 nothing was sent.'; note.classList.add('show'); }
    });
  });
  document.querySelectorAll('[data-demo-btn]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      var note = document.getElementById(b.getAttribute('data-demo-btn'));
      if (note) { note.textContent = 'This is a demo site \u2014 reservations are not taken here.'; note.classList.add('show'); }
    });
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
