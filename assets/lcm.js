/* Los Cabos Motors — interacción v5 */
(function () {
  "use strict";
  var WA = '526241181978';
  var SITE = 'https://loscabosmotors.com/';

  /* ---------- Barra de progreso ---------- */
  function initProgress() {
    var bar = document.getElementById('page-progress');
    if (!bar) return;
    var p = 10; bar.style.width = p + '%';
    var t = setInterval(function () { p += (90 - p) * 0.12; bar.style.width = Math.min(p, 90) + '%'; }, 120);
    window.addEventListener('load', function () {
      clearInterval(t); bar.style.width = '100%';
      setTimeout(function () { bar.style.opacity = '0'; }, 300);
    });
  }

  /* ---------- Encabezado, menú y pestaña activa ---------- */
  function initNav() {
    var top = document.querySelector('.topbar');
    if (top) {
      var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 30); };
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }
    var page = document.body.getAttribute('data-page') || '';
    function setActive(key) {
      document.querySelectorAll('[data-nav]').forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('data-nav') === key);
      });
    }
    var map = { vendidos: 'vendidos', accesorios: 'accesorios', detalle: 'autos', index: 'autos' };
    setActive(map[page] || '');
    if (page === 'index' && 'IntersectionObserver' in window) {
      var secs = [['autos', 'autos'], ['recientes', 'vendidos'], ['vender', 'vender'], ['preguntas', 'faq'], ['contacto', '']];
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) {
            secs.forEach(function (s) { if (s[0] === en.target.id) setActive(s[1]); });
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(function (s) { var el = document.getElementById(s[0]); if (el) io.observe(el); });
    }
    // menú antiguo (por compatibilidad)
    var burger = document.querySelector('.lcm-burger');
    var links = document.querySelector('.lcm-links');
    if (burger && links) burger.addEventListener('click', function () { links.classList.toggle('open'); });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 2200);
  }

  /* ---------- Video de portada ---------- */
  function initVideo() {
    var v = document.querySelector('.hero-video');
    if (!v) return;
    var btn = document.querySelector('.video-toggle');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var save = navigator.connection && navigator.connection.saveData;
    function setBtn() { if (btn) btn.innerHTML = v.paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>'; }
    if (reduce || save) { v.removeAttribute('autoplay'); v.pause(); }
    else { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { setBtn(); }); }
    if (btn) btn.addEventListener('click', function () { if (v.paused) v.play(); else v.pause(); setBtn(); });
    v.addEventListener('play', setBtn); v.addEventListener('pause', setBtn); setBtn();
  }

  /* ---------- Precarga ---------- */
  var cache = {};
  function preload(src) { if (!src || cache[src]) return; var im = new Image(); im.src = src; cache[src] = im; }

  /* ---------- Carrusel en tarjetas ---------- */
  function initCardCarousels() {
    var visible = new WeakMap();
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { visible.set(en.target, en.isIntersecting); });
    }, { threshold: 0.4 }) : null;

    document.querySelectorAll('.thumb-stage').forEach(function (stage, k) {
      var imgs = Array.prototype.slice.call(stage.querySelectorAll('img'));
      var dots = stage.querySelector('.thumb-dots');
      if (imgs.length <= 1) { stage.querySelectorAll('.thumb-nav').forEach(function (b) { b.remove(); }); return; }
      var i = 0, hover = false;
      if (dots) imgs.forEach(function (_, n) { var d = document.createElement('span'); if (!n) d.className = 'on'; dots.appendChild(d); });
      function show(n) {
        imgs[i].classList.remove('on');
        i = (n + imgs.length) % imgs.length;
        imgs[i].classList.add('on');
        if (imgs[(i + 1) % imgs.length]) preload(imgs[(i + 1) % imgs.length].src);
        if (dots) dots.querySelectorAll('span').forEach(function (d, n) { d.classList.toggle('on', n === i); });
      }
      var p = stage.querySelector('.thumb-nav.prev'), nx = stage.querySelector('.thumb-nav.next');
      if (p) p.addEventListener('click', function (e) { e.stopPropagation(); show(i - 1); });
      if (nx) nx.addEventListener('click', function (e) { e.stopPropagation(); show(i + 1); });
      stage.addEventListener('mouseenter', function () { hover = true; });
      stage.addEventListener('mouseleave', function () { hover = false; });
      if (io) io.observe(stage);
      setTimeout(function () {
        setInterval(function () { if (!hover && (!io || visible.get(stage)) && !document.hidden) show(i + 1); }, 3600);
      }, (k % 4) * 700);
      var sx = null;
      stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
        sx = null;
      }, { passive: true });
    });
  }

  /* ---------- Compartir ---------- */
  function shareLink(title, url) {
    var text = title + ' en venta en Los Cabos Motors';
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
      return;
    }
    copy(url, 'Enlace copiado. Pégalo en WhatsApp, Facebook o Instagram.');
  }
  function copy(text, msg) {
    var done = function () { toast(msg || 'Copiado'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  }
  function carUrl(car) { return car.dataset.url ? SITE + car.dataset.url : location.href.split('#')[0] + '#' + car.id; }

  /* ---------- Modal de vehículo ---------- */
  var modalState = { index: 0, car: null };
  function buildModal() {
    if (document.getElementById('lcmModal')) return;
    var o = document.createElement('div');
    o.className = 'lcm-modal-overlay'; o.id = 'lcmModal';
    o.innerHTML =
      '<div class="lcm-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
        '<button class="modal-close" aria-label="Cerrar"><i class="fas fa-xmark"></i></button>' +
        '<div class="modal-grid">' +
          '<div class="modal-stage" id="modalStage">' +
            '<button class="modal-nav prev" aria-label="Foto anterior"><i class="fas fa-chevron-left"></i></button>' +
            '<button class="modal-nav next" aria-label="Foto siguiente"><i class="fas fa-chevron-right"></i></button>' +
            '<div class="modal-thumbs" id="modalThumbs"></div>' +
          '</div>' +
          '<div class="modal-info">' +
            '<div class="badge-row"></div>' +
            '<h2 id="modalTitle"></h2>' +
            '<div class="modal-price" id="modalPrice"></div>' +
            '<p class="modal-desc" id="modalDesc"></p>' +
            '<div class="modal-spec-grid" id="modalSpecs"></div>' +
            '<div class="modal-cta" id="modalCta"></div>' +
            '<div class="modal-extra" id="modalExtra"></div>' +
            '<div class="modal-commission"><i class="fas fa-circle-info"></i>Los Cabos Motors funciona como intermediario de venta: promovemos el vehículo y te conectamos directo con el propietario para formalizar la compra.</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(o);
    o.querySelector('.modal-close').addEventListener('click', closeModal);
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(); });
    o.querySelector('.modal-nav.prev').addEventListener('click', function () { showImg(modalState.index - 1); });
    o.querySelector('.modal-nav.next').addEventListener('click', function () { showImg(modalState.index + 1); });
    document.addEventListener('keydown', function (e) {
      if (!o.classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') showImg(modalState.index - 1);
      if (e.key === 'ArrowRight') showImg(modalState.index + 1);
    });
    var st = o.querySelector('#modalStage'), sx = null;
    st.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    st.addEventListener('touchend', function (e) {
      if (sx === null) return; var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) showImg(dx < 0 ? modalState.index + 1 : modalState.index - 1); sx = null;
    }, { passive: true });
  }
  function showImg(n) {
    var imgs = document.querySelectorAll('#modalStage img.mimg');
    if (!imgs.length) return;
    imgs[modalState.index].classList.remove('on');
    modalState.index = (n + imgs.length) % imgs.length;
    imgs[modalState.index].classList.add('on');
    document.querySelectorAll('#modalThumbs button').forEach(function (b, k) { b.classList.toggle('on', k === modalState.index); });
  }
  function openModal(car) {
    buildModal();
    var o = document.getElementById('lcmModal');
    var images = (car.dataset.images || '').split('|').filter(Boolean);
    var isSold = !!car.querySelector('.sold-tag');
    modalState.index = 0; modalState.car = car;

    document.getElementById('modalTitle').textContent = car.dataset.title || '';
    var mxn = car.dataset.price, usd = car.dataset.priceUsd, base = car.dataset.priceBase || 'mxn';
    var pe = document.getElementById('modalPrice');
    if (isSold) pe.innerHTML = '<span style="color:#ff7580;font-size:1rem">Vehículo vendido</span>';
    else if (base === 'usd' && usd) pe.innerHTML = '$' + usd + ' <small>USD</small>' + (mxn ? '<span class="price-alt">≈ $' + mxn + ' MXN</span>' : '');
    else if (mxn) pe.innerHTML = '$' + mxn + ' <small>MXN</small>' + (usd ? '<span class="price-alt">≈ $' + usd + ' USD</span>' : '');
    else pe.innerHTML = '<span class="price-ask">Precio a consultar</span>';
    document.getElementById('modalDesc').textContent = car.dataset.desc || '';

    var badge = car.querySelector('.vc-flag, .car-badge');
    o.querySelector('.badge-row').innerHTML = isSold
      ? '<span class="car-badge" style="position:static;color:#ff7580;border-color:rgba(226,34,47,.5)">Vendido</span>'
      : '<span class="car-badge" style="position:static">' + (badge ? badge.textContent : 'Disponible') + '</span>';

    var sw = document.getElementById('modalSpecs'); sw.innerHTML = '';
    try { JSON.parse(car.dataset.specs || '[]').forEach(function (s) {
      var d = document.createElement('div'); d.className = 'modal-spec';
      d.innerHTML = '<span>' + s[0] + '</span><b>' + s[1] + '</b>'; sw.appendChild(d);
    }); } catch (e) {}

    var cta = document.getElementById('modalCta'), extra = document.getElementById('modalExtra');
    var note = o.querySelector('.modal-commission');
    if (isSold) {
      cta.innerHTML = '<a class="btn btn-ghost btn-block" href="index.html#vender"><i class="fas fa-bullhorn"></i> Quiero vender mi auto</a>';
      extra.innerHTML = ''; note.style.display = 'none';
    } else {
      var msg = encodeURIComponent('Hola, me interesa el ' + (car.dataset.title || 'vehículo') + ' que vi en Los Cabos Motors');
      cta.innerHTML = '<a class="btn btn-wa btn-block" target="_blank" rel="noopener" href="https://wa.me/' + WA + '?text=' + msg + '"><i class="fab fa-whatsapp"></i> Me interesa, escribir por WhatsApp</a>';
      extra.innerHTML = '<button class="btn btn-ghost" type="button" data-mshare><i class="fas fa-share-nodes"></i> Compartir</button>' +
        (car.dataset.url ? '<a class="btn btn-ghost" href="' + car.dataset.url + '"><i class="fas fa-up-right-from-square"></i> Ficha completa</a>' : '');
      var sb = extra.querySelector('[data-mshare]');
      if (sb) sb.addEventListener('click', function () { shareLink(car.dataset.title, carUrl(car)); });
      note.style.display = '';
    }

    var stage = document.getElementById('modalStage');
    stage.querySelectorAll('img.mimg').forEach(function (x) { x.remove(); });
    var th = document.getElementById('modalThumbs'); th.innerHTML = '';
    images.forEach(function (src, n) {
      var im = document.createElement('img');
      im.src = src; im.className = 'mimg' + (n === 0 ? ' on' : ''); im.alt = (car.dataset.title || '') + ' foto ' + (n + 1);
      if (n > 0) im.loading = 'lazy';
      stage.insertBefore(im, stage.querySelector('.modal-nav'));
      if (images.length > 1) {
        var b = document.createElement('button'); b.className = n === 0 ? 'on' : ''; b.setAttribute('aria-label', 'Foto ' + (n + 1));
        b.innerHTML = '<img src="' + src + '" alt="" loading="lazy">';
        b.addEventListener('click', function () { showImg(n); });
        th.appendChild(b);
      }
    });
    stage.querySelectorAll('.modal-nav').forEach(function (b) { b.style.display = images.length > 1 ? 'grid' : 'none'; });

    o.classList.add('open');
    document.documentElement.classList.add('modal-open'); document.body.classList.add('modal-open');
    if (car.id && history.replaceState) history.replaceState(null, '', '#' + car.id);
  }
  function closeModal() {
    var o = document.getElementById('lcmModal'); if (!o) return;
    o.classList.remove('open');
    document.documentElement.classList.remove('modal-open'); document.body.classList.remove('modal-open');
    if (modalState.car && modalState.car.id && location.hash === '#' + modalState.car.id && history.replaceState)
      history.replaceState(null, '', location.pathname + location.search);
  }

  function initCars() {
    document.querySelectorAll('.car[data-title]').forEach(function (car) {
      car.setAttribute('tabindex', '0');
      car.addEventListener('click', function (e) {
        var sh = e.target.closest('[data-share]');
        if (sh) { e.preventDefault(); e.stopPropagation(); shareLink(car.dataset.title, carUrl(car)); return; }
        if (e.target.closest('a') || e.target.closest('.thumb-nav')) return;
        openModal(car);
      });
      car.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === car) { e.preventDefault(); openModal(car); }
      });
    });
    document.querySelectorAll('[data-open]').forEach(function (b) {
      b.addEventListener('click', function () { var c = document.getElementById(b.getAttribute('data-open')); if (c) openModal(c); });
    });
    var h = location.hash.replace('#', '');
    if (h) { var c = document.getElementById(h); if (c && c.classList.contains('car')) setTimeout(function () { openModal(c); }, 250); }
  }

  /* ---------- Filtros y orden del inventario ---------- */
  function initInventory() {
    var grid = document.getElementById('vgrid');
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.car'));
    var empty = document.getElementById('invEmpty');
    var current = 'all';
    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = current === 'all' || c.dataset.cat === current;
        c.classList.toggle('hide', !ok); if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }
    document.querySelectorAll('.fbtn').forEach(function (b) {
      b.addEventListener('click', function () {
        current = b.dataset.filter;
        document.querySelectorAll('.fbtn').forEach(function (x) { x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', x === b); });
        apply();
      });
    });
    var sel = document.getElementById('sortSel');
    if (sel) sel.addEventListener('change', function () {
      var v = sel.value;
      var key = function (c) {
        if (v === 'reciente') return +c.dataset.order;
        if (v === 'km-asc') return c.dataset.km ? +c.dataset.km : 1e12;
        var p = +c.dataset.sortPrice;
        if (!p) return 1e12; // sin precio, al final
        return v === 'precio-desc' ? -p : p;
      };
      cards.sort(function (a, b) { return key(a) - key(b); }).forEach(function (c) { grid.appendChild(c); });
    });
    apply();
  }

  /* ---------- Botones de copiar en fichas ---------- */
  function initCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () { copy(b.getAttribute('data-copy'), 'Enlace copiado'); });
    });
    document.querySelectorAll('[data-native-share]').forEach(function (b) {
      if (!navigator.share) { b.style.display = 'none'; return; }
      b.addEventListener('click', function () { navigator.share({ title: document.title, url: b.getAttribute('data-native-share') }).catch(function () {}); });
    });
    // galería de ficha individual
    var main = document.getElementById('dgalMain');
    if (main) document.querySelectorAll('.dgal-thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        main.src = b.getAttribute('data-src');
        document.querySelectorAll('.dgal-thumbs button').forEach(function (x) { x.classList.toggle('on', x === b); });
      });
    });
  }

  /* ---------- Aviso flotante ---------- */
  function toast(msg, icon) {
    var el = document.querySelector('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = '<i class="fas fa-' + (icon || 'circle-check') + '"></i> ' + msg;
    el.classList.add('show'); clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  window.lcmToast = toast;

  document.addEventListener('DOMContentLoaded', function () {
    initProgress(); initNav(); initReveal(); initVideo();
    initCardCarousels(); initInventory(); initCars(); initCopy();
  });
})();
