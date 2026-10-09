(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navbar: scroll elevation + mobile menu ---------- */
  function initNav() {
    var nav = document.querySelector('[data-nav]');
    if (!nav) return;
    var toggle = nav.querySelector('[data-nav-toggle]');
    var menu = document.getElementById('mobile-menu');
    var isOpen = false;

    function sync() {
      nav.classList.toggle('is-elevated', isOpen || window.scrollY > 24);
    }

    function setOpen(next) {
      isOpen = next;
      menu.hidden = !next;
      toggle.setAttribute('aria-expanded', String(next));
      toggle.setAttribute('aria-label', next ? 'Fechar menu' : 'Abrir menu');
      sync();
    }

    toggle.addEventListener('click', function () { setOpen(!isOpen); });
    nav.querySelectorAll('[data-nav-close]').forEach(function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches && isOpen) setOpen(false);
    });
    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  /* ---------- Hero parallax ---------- */
  function initParallax() {
    if (reducedMotion) return;
    var layers = document.querySelectorAll('[data-parallax]');
    if (!layers.length) return;
    var frame = 0;

    function update() {
      frame = 0;
      var y = Math.min(window.scrollY, window.innerHeight * 1.2);
      layers.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        el.style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
      });
    }

    window.addEventListener('scroll', function () {
      if (!frame) frame = requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ---------- Reveal on scroll (also triggers chart animations) ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    items.forEach(function (el) {
      var delay = el.getAttribute('data-delay');
      if (delay) el.style.transitionDelay = delay + 'ms';
    });

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.setAttribute('data-visible', 'true'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-visible', 'true');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- SVG charts from data-series ---------- */
  function toPath(data, w, h, max) {
    var step = w / (data.length - 1);
    return data.map(function (v, i) {
      return (i === 0 ? 'M' : 'L') + (i * step).toFixed(1) + ',' + (h - (v / max) * h).toFixed(1);
    }).join(' ');
  }

  function initCharts() {
    document.querySelectorAll('[data-chart]').forEach(function (path) {
      var data = path.getAttribute('data-series').split(',').map(Number);
      var w = Number(path.getAttribute('data-w'));
      var h = Number(path.getAttribute('data-h'));
      var max = Number(path.getAttribute('data-max')) || 100;
      var d = toPath(data, w, h, max);
      if (path.getAttribute('data-chart') === 'area') {
        d += ' L' + w + ',' + h + ' L0,' + h + ' Z';
      }
      path.setAttribute('d', d);
    });
  }

  /* ---------- Subtle telemetry drift (illustrative values) ---------- */
  function initTelemetry() {
    if (reducedMotion) return;
    var nodes = document.querySelectorAll('[data-jitter]');
    if (!nodes.length) return;
    setInterval(function () {
      if (document.hidden) return;
      nodes.forEach(function (node) {
        var base = Number(node.getAttribute('data-jitter'));
        var value = base + Math.round((Math.random() - 0.5) * 4);
        node.textContent = String(value);
        var meter = node.closest('.telemetry__cell').querySelector('.meter span');
        if (meter) meter.style.width = value + '%';
      });
    }, 2600);
  }

  initNav();
  initParallax();
  initCharts();
  initReveal();
  initTelemetry();
})();
