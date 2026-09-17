/* Los Cabos Motors — motor de interacción v2 */
(function () {
  "use strict";

  /* ---- Barra de progreso de carga ---- */
  function initProgress() {
    var bar = document.getElementById('page-progress');
    if (!bar) return;
    var p = 10; bar.style.width = p + '%';
    var t = setInterval(function () {
      p += (90 - p) * 0.12;
      bar.style.width = Math.min(p, 90) + '%';
    }, 120);
    window.addEventListener('load', function () {
      clearInterval(t);
      bar.style.width = '100%';
      setTimeout(function () { bar.style.opacity = '0'; }, 300);
    });
  }

  /* ---- Menú móvil ---- */
  function initNav() {
    var burger = document.querySelector('.lcm-burger');
    var links = document.querySelector('.lcm-links');
    if (burger && links) {
      burger.addEventListener('click', function () {
        var isOpen = links.classList.toggle('open');
        burger.setAttribute('aria-expanded', isOpen);
        burger.innerHTML = isOpen ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          burger.innerHTML = '<i class="fas fa-bars"></i>';
        });
      });
    }
  }

  /* ---- Reveal orquestado: una sola vez, respeta reduced-motion ---- */
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
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('in'); }); }, 2500);
  }

  /* ---- Precarga de imágenes: hace que el carrusel cambie instantáneo ---- */
  var preloadCache = {};
  function preload(src) {
    if (!src || preloadCache[src]) return;
    var im = new Image();
    im.src = src;
    preloadCache[src] = im;
  }

  /* ---- Carrusel de tarjeta (catálogo): rápido, con precarga total ---- */
  function initCardCarousels() {
    document.querySelectorAll('.thumb-stage').forEach(function (stage) {
      var imgs = Array.prototype.slice.call(stage.querySelectorAll('img'));
      if (imgs.length <= 1) return;
      // precargar TODAS las imágenes de la tarjeta de inmediato
      imgs.forEach(function (im) { preload(im.src); });

      var dotsWrap = stage.querySelector('.thumb-dots');
      var i = 0;
      if (dotsWrap) {
        imgs.forEach(function (_, idx) {
          var d = document.createElement('span');
          if (idx === 0) d.className = 'on';
          dotsWrap.appendChild(d);
        });
      }
      function show(n) {
        imgs[i].classList.remove('on');
        i = (n + imgs.length) % imgs.length;
        imgs[i].classList.add('on');
        if (dotsWrap) {
          dotsWrap.querySelectorAll('span').forEach(function (d, idx) { d.classList.toggle('on', idx === i); });
        }
      }
      var timer = setInterval(function () { show(i + 1); }, 3200);
      stage.addEventListener('mouseenter', function () { clearInterval(timer); });
      stage.addEventListener('mouseleave', function () { timer = setInterval(function () { show(i + 1); }, 3200); });

      // swipe táctil
      var sx = null;
      stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
        sx = null;
      }, { passive: true });
    });
  }

  /* ============================================================
     MODAL DE VEHÍCULO
     Lee data-* del .car clicado y construye la ficha ampliada.
  ============================================================ */
  var modalState = { images: [], index: 0 };

  function buildModal() {
    if (document.getElementById('lcmModal')) return;
    var overlay = document.createElement('div');
    overlay.className = 'lcm-modal-overlay';
    overlay.id = 'lcmModal';
    overlay.innerHTML =
      '<div class="lcm-modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">' +
        '<button class="modal-close" aria-label="Cerrar"><i class="fas fa-xmark"></i></button>' +
        '<div class="modal-grid">' +
          '<div class="modal-stage" id="modalStage">' +
            '<button class="modal-nav prev" aria-label="Anterior"><i class="fas fa-chevron-left"></i></button>' +
            '<button class="modal-nav next" aria-label="Siguiente"><i class="fas fa-chevron-right"></i></button>' +
            '<div class="modal-thumbs" id="modalThumbs"></div>' +
          '</div>' +
          '<div class="modal-info">' +
            '<div class="badge-row"><span class="car-badge" style="position:static">Disponible</span></div>' +
            '<h2 id="modalTitle"></h2>' +
            '<div class="modal-price" id="modalPrice"></div>' +
            '<p class="modal-desc" id="modalDesc"></p>' +
            '<div class="modal-spec-grid" id="modalSpecs"></div>' +
            '<div class="modal-cta" id="modalCta"></div>' +
            '<div class="modal-commission"><i class="fas fa-circle-info"></i>Los Cabos Motors funciona como intermediario de venta: promovemos tu vehículo hasta encontrar al comprador correcto. Al concretarse la venta aplica una comisión sobre el valor final, que se acuerda antes de publicar.</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-close').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    overlay.querySelector('.modal-nav.prev').addEventListener('click', function () { showModalImg(modalState.index - 1); });
    overlay.querySelector('.modal-nav.next').addEventListener('click', function () { showModalImg(modalState.index + 1); });
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') showModalImg(modalState.index - 1);
      if (e.key === 'ArrowRight') showModalImg(modalState.index + 1);
    });
  }

  function showModalImg(n) {
    var stage = document.getElementById('modalStage');
    var imgs = stage.querySelectorAll('img.mimg');
    if (!imgs.length) return;
    imgs[modalState.index].classList.remove('on');
    modalState.index = (n + imgs.length) % imgs.length;
    imgs[modalState.index].classList.add('on');
    document.querySelectorAll('#modalThumbs button').forEach(function (b, idx) {
      b.classList.toggle('on', idx === modalState.index);
    });
  }

  function openModal(car) {
    buildModal();
    var overlay = document.getElementById('lcmModal');
    var images = (car.dataset.images || car.dataset.image || '').split('|').filter(Boolean);
    modalState.images = images; modalState.index = 0;

    var isSold = car.querySelector('.sold-tag') !== null;

    document.getElementById('modalTitle').textContent = car.dataset.title || '';
    var priceVal = car.dataset.price;
    var priceEl = document.getElementById('modalPrice');
    if (isSold) {
      priceEl.innerHTML = '<span style="color:#ff7580;font-size:1rem">Vehículo vendido</span>';
    } else {
      priceEl.innerHTML = priceVal ? ('$' + priceVal + ' <small>MXN</small>') : 'Consultar precio';
    }
    document.getElementById('modalDesc').textContent = car.dataset.desc || '';

    var badgeRow = overlay.querySelector('.badge-row');
    badgeRow.innerHTML = isSold
      ? '<span class="car-badge" style="position:static;color:#ff7580;border-color:rgba(226,34,47,.5)">Vendido</span>'
      : '<span class="car-badge" style="position:static">Disponible</span>';

    var specsWrap = document.getElementById('modalSpecs');
    specsWrap.innerHTML = '';
    try {
      var specs = JSON.parse(car.dataset.specs || '[]');
      specs.forEach(function (s) {
        var d = document.createElement('div');
        d.className = 'modal-spec';
        d.innerHTML = '<span>' + s[0] + '</span><b>' + s[1] + '</b>';
        specsWrap.appendChild(d);
      });
    } catch (e) {}

    var ctaWrap = document.getElementById('modalCta');
    var commissionNote = document.querySelector('.modal-commission');
    if (isSold) {
      ctaWrap.innerHTML = '<a class="btn btn-ghost btn-block" href="index.html#vender"><i class="fas fa-bullhorn"></i> Quiero publicar mi auto</a>';
      commissionNote.style.display = 'none';
    } else {
      var waMsg = encodeURIComponent('Hola, me interesa el ' + (car.dataset.title || 'vehículo') + ' publicado en Los Cabos Motors');
      ctaWrap.innerHTML = '<a class="btn btn-wa btn-block" id="modalWa" target="_blank" href="https://wa.me/526241181978?text=' + waMsg + '"><i class="fab fa-whatsapp"></i> Consultar por WhatsApp</a>';
      commissionNote.style.display = '';
    }

    var stage = document.getElementById('modalStage');
    stage.querySelectorAll('img.mimg').forEach(function (i) { i.remove(); });
    var thumbs = document.getElementById('modalThumbs');
    thumbs.innerHTML = '';

    images.forEach(function (src, idx) {
      var im = document.createElement('img');
      im.src = src; im.className = 'mimg' + (idx === 0 ? ' on' : '');
      im.alt = car.dataset.title || '';
      stage.insertBefore(im, stage.firstChild);
      preload(src);

      if (images.length > 1) {
        var tb = document.createElement('button');
        tb.className = idx === 0 ? 'on' : '';
        tb.innerHTML = '<img src="' + src + '" alt="">';
        tb.addEventListener('click', function () { showModalImg(idx); });
        thumbs.appendChild(tb);
      }
    });
    stage.querySelectorAll('.modal-nav').forEach(function (b) { b.style.display = images.length > 1 ? 'grid' : 'none'; });

    overlay.classList.add('open');
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    var overlay = document.getElementById('lcmModal');
    if (!overlay) return;
    overlay.classList.remove('open');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');
  }

  function initCarModals() {
    document.querySelectorAll('.car[data-title]').forEach(function (car) {
      car.setAttribute('tabindex', '0');
      car.setAttribute('role', 'button');
      car.addEventListener('click', function (e) {
        if (e.target.closest('a')) return; // no interceptar el botón de WhatsApp
        openModal(car);
      });
      car.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) { e.preventDefault(); openModal(car); }
      });
    });
  }

  /* ---- Toast genérico ---- */
  window.lcmToast = function (msg, icon) {
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.innerHTML = '<i class="fas fa-' + (icon || 'circle-check') + '"></i> ' + msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  };

  document.addEventListener('DOMContentLoaded', function () {
    initProgress();
    initNav();
    initReveal();
    initCardCarousels();
    initCarModals();
  });
})();
