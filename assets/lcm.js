/* Los Cabos Motors — comportamiento compartido */
(function () {
  /* ---- Menú móvil ---- */
  function initNav() {
    var burger = document.querySelector('.lcm-burger');
    var links = document.querySelector('.lcm-links');
    if (burger && links) {
      burger.addEventListener('click', function () {
        links.classList.toggle('open');
        burger.setAttribute('aria-expanded', links.classList.contains('open'));
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { links.classList.remove('open'); });
      });
    }
  }

  /* ---- Reveal on scroll ---- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(function (e) { e.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
    // Failsafe: nada debe quedar invisible permanentemente.
    setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 2500);
  }

  /* ---- Carrusel genérico (.lcm-carousel con .slide imgs y data-arrows) ---- */
  function initCarousels() {
    document.querySelectorAll('.lcm-carousel').forEach(function (car) {
      var slides = car.querySelectorAll('.slide');
      if (slides.length === 0) return;
      var i = 0;
      var prev = car.querySelector('.car-prev');
      var next = car.querySelector('.car-next');
      var dotsWrap = car.querySelector('.car-dots');

      // hide arrows/dots if single
      if (slides.length <= 1) {
        if (prev) prev.style.display = 'none';
        if (next) next.style.display = 'none';
        if (dotsWrap) dotsWrap.style.display = 'none';
        return;
      }

      // build dots
      if (dotsWrap) {
        slides.forEach(function (_, idx) {
          var d = document.createElement('button');
          d.className = 'car-dot' + (idx === 0 ? ' on' : '');
          d.setAttribute('aria-label', 'Imagen ' + (idx + 1));
          d.addEventListener('click', function () { go(idx); });
          dotsWrap.appendChild(d);
        });
      }

      function go(n) {
        slides[i].classList.remove('on');
        i = (n + slides.length) % slides.length;
        slides[i].classList.add('on');
        if (dotsWrap) {
          dotsWrap.querySelectorAll('.car-dot').forEach(function (d, idx) {
            d.classList.toggle('on', idx === i);
          });
        }
      }
      if (prev) prev.addEventListener('click', function () { go(i - 1); });
      if (next) next.addEventListener('click', function () { go(i + 1); });

      // swipe
      var sx = null;
      car.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      car.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
        sx = null;
      }, { passive: true });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initReveal();
    initCarousels();
  });
})();
