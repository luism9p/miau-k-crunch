(function () {
  'use strict';

  var CATS = ['Clásicos', 'Ramen', 'Flaming Hot', 'Papa', 'Bebidas'];
  var CREMAS = ['Mayonesa', 'Kétchup', 'Bbq', 'Mostaza', 'Rocoto'];
  var PRODUCTS = [
    { id: 'cl-s', cat: 'Clásicos', name: 'Salchicha', price: 10 },
    { id: 'cl-sq', cat: 'Clásicos', name: 'Salchicha y queso', price: 11 },
    { id: 'cl-q', cat: 'Clásicos', name: 'Queso', price: 12 },
    { id: 'ra-s', cat: 'Ramen', name: 'Salchicha', price: 11 },
    { id: 'ra-sq', cat: 'Ramen', name: 'Salchicha y queso', price: 12 },
    { id: 'ra-q', cat: 'Ramen', name: 'Queso', price: 13 },
    { id: 'fh-s', cat: 'Flaming Hot', name: 'Salchicha', price: 11 },
    { id: 'fh-sq', cat: 'Flaming Hot', name: 'Salchicha y queso', price: 12 },
    { id: 'fh-q', cat: 'Flaming Hot', name: 'Queso', price: 13 },
    { id: 'pa-s', cat: 'Papa', name: 'Salchicha', price: 12 },
    { id: 'pa-sq', cat: 'Papa', name: 'Salchicha y queso', price: 13 },
    { id: 'pa-q', cat: 'Papa', name: 'Queso', price: 14 },
    { id: 'be-inka', cat: 'Bebidas', name: 'Inka Cola 600ml', price: 4 },
    { id: 'be-coca', cat: 'Bebidas', name: 'Coca Cola 600ml', price: 4 },
    { id: 'be-sprite', cat: 'Bebidas', name: 'Sprite 500ml', price: 3 }
  ];
  // 0=Sun..6=Sat : [openMin, closeMin] or null
  var SCHEDULE = { 0: null, 1: [1080, 1350], 2: [1080, 1350], 3: [1080, 1350], 4: [1080, 1350], 5: [1080, 1350], 6: [1080, 1380] };
  var DAYNAME = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var WHATSAPP_NUMBER = '51934963187';
  var STEP_NAMES = { 1: 'Tu nombre', 2: 'Catálogo', 3: 'Cremas', 4: 'Entrega', 5: 'Resumen' };

  var state = {
    step: 0, name: '', qty: {}, cremas: [], mode: '', address: '',
    activeCat: 'Clásicos', nameError: '', catError: '', addrError: '', waLink: '#'
  };

  function setState(patch) {
    if (typeof patch === 'function') patch = patch(state);
    Object.assign(state, patch);
    render();
  }

  function soles(n) { return 'S/ ' + Number(n).toFixed(2); }

  function limaNow() {
    try {
      var s = new Date().toLocaleString('en-US', { timeZone: 'America/Lima' });
      return new Date(s);
    } catch (e) { return new Date(); }
  }

  function nextOpenMsg(d) {
    var day = d.getDay(), mins = d.getHours() * 60 + d.getMinutes();
    var todayWin = SCHEDULE[day];
    if (todayWin && mins < todayWin[0]) return 'Estamos cerrados en este momento. Abrimos hoy a las 6:00pm.';
    for (var i = 1; i <= 7; i++) {
      var nd = (day + i) % 7;
      if (SCHEDULE[nd]) {
        var label = i === 1 ? 'mañana' : ('el ' + DAYNAME[nd]);
        return 'Estamos cerrados en este momento. Abrimos ' + label + ' a las 6:00pm. Igual puedes armar y enviar tu pedido.';
      }
    }
    return 'Estamos cerrados en este momento.';
  }

  function statusInfo() {
    var d = limaNow();
    var day = d.getDay(), mins = d.getHours() * 60 + d.getMinutes();
    var win = SCHEDULE[day];
    if (win && mins >= win[0] && mins < win[1]) return { open: true };
    return { open: false, msg: nextOpenMsg(d) };
  }

  function itemCount() { return Object.values(state.qty).reduce(function (a, b) { return a + (b || 0); }, 0); }
  function total() { var t = 0; PRODUCTS.forEach(function (p) { t += (state.qty[p.id] || 0) * p.price; }); return t; }
  function chosen() { return PRODUCTS.filter(function (p) { return (state.qty[p.id] || 0) > 0; }); }

  function setStep(n) {
    setState({ step: n });
    var el = document.querySelector('.miau-scroll');
    if (el) el.scrollTop = 0;
  }

  function buildMessage() {
    var lines = ['CUÁL SERÍA TU ORDEN?', 'Nombre: ' + state.name.trim(), 'Pedido:'];
    chosen().forEach(function (p) { lines.push(state.qty[p.id] + 'x ' + p.name + ' (' + p.cat + ')'); });
    lines.push('Cremas: ' + (state.cremas.length ? state.cremas.join(', ') : 'Ninguna'));
    if (state.mode === 'Delivery') lines.push('Recojo o Delivery: Delivery - dirección: ' + state.address.trim());
    else lines.push('Recojo o Delivery: Recojo');
    lines.push('Total: ' + soles(total()));
    return lines.join('\n');
  }

  function primaryAction() {
    var st = state.step;
    if (st === 1) {
      if (!state.name.trim()) { setState({ nameError: 'Escribe tu nombre para continuar.' }); return; }
      setState({ nameError: '' }); setStep(2); return;
    }
    if (st === 2) {
      if (itemCount() === 0) { setState({ catError: 'Agrega al menos un producto para continuar.' }); return; }
      setState({ catError: '' }); setStep(3); return;
    }
    if (st === 3) { setStep(4); return; }
    if (st === 4) {
      if (!state.mode) { setState({ addrError: 'Elige Recojo o Delivery.' }); return; }
      if (state.mode === 'Delivery' && !state.address.trim()) { setState({ addrError: 'Ingresa tu dirección de entrega.' }); return; }
      setState({ addrError: '' }); setStep(5); return;
    }
    if (st === 5) {
      var msg = buildMessage();
      var link = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
      try { window.open(link, '_blank'); } catch (e) {}
      setState({ waLink: link });
      setStep(6);
      return;
    }
  }

  function back() {
    var st = state.step;
    if (st > 1) setStep(st - 1); else setStep(0);
  }

  function reset() {
    setState({ step: 0, name: '', qty: {}, cremas: [], mode: '', address: '', activeCat: 'Clásicos', nameError: '', catError: '', addrError: '', waLink: '#' });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- render helpers per section ----

  function renderStatus(status) {
    var el = document.getElementById('miau-status');
    var bg = status.open ? '#e7f7ec' : '#fdeaec';
    var fg = status.open ? '#1a8a4a' : '#C41E3A';
    el.style.background = bg;
    el.style.color = fg;
    el.innerHTML = '<span class="miau-status-dot" style="background:' + fg + '"></span>' + (status.open ? 'Abierto' : 'Cerrado');
  }

  function renderClosedBanner(status) {
    var el = document.getElementById('miau-closed-banner');
    if (status.open) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="miau-closed"><span>🌙</span><span>' + escapeHtml(status.msg || '') + '</span></div>';
  }

  function renderProgress(inFlow) {
    var el = document.getElementById('miau-progress');
    if (!inFlow) { el.innerHTML = ''; return; }
    var pct = (state.step / 5 * 100) + '%';
    el.innerHTML =
      '<div class="miau-progress-wrap">' +
      '<div class="miau-progress-row">' +
      '<span class="miau-progress-label">Paso ' + state.step + ' de 5</span>' +
      '<span class="miau-progress-step">' + (STEP_NAMES[state.step] || '') + '</span>' +
      '</div>' +
      '<div class="miau-progress-track"><div class="miau-progress-fill" style="width:' + pct + '"></div></div>' +
      '</div>';
  }

  function renderWelcome() {
    return (
      '<div class="miau-welcome">' +
      '<img src="assets/miau-logo.png" alt="" class="miau-welcome-logo">' +
      '<h1>¡Hola, gatito<br>hambriento! 🐾</h1>' +
      '<p>Arma tu pedido de banderillas coreanas en pocos taps y te lo mandamos por WhatsApp.</p>' +
      '<div class="miau-schedule-card">' +
      '<div class="miau-schedule-title">🕒 HORARIO DE ATENCIÓN</div>' +
      '<div class="miau-schedule-row"><span>Lunes a viernes</span><span>6:00pm – 10:30pm</span></div>' +
      '<div class="miau-schedule-row"><span>Sábado</span><span>6:00pm – 11:00pm</span></div>' +
      '<div class="miau-schedule-row closed"><span>Domingo</span><span>Cerrado</span></div>' +
      '</div>' +
      '<button class="miau-start-btn" id="miau-start-btn">Hacer pedido 🌭</button>' +
      '<div class="miau-social"><span>📷 @miau_kcrunch</span><span>▶ @miau.kcrunch</span></div>' +
      '</div>'
    );
  }

  function renderNameStep() {
    return (
      '<div class="miau-name-step">' +
      '<div class="miau-name-emoji">🐱</div>' +
      '<h2>¿Cómo te llamas?</h2>' +
      '<p>Así sabemos para quién es este festín.</p>' +
      '<input id="miau-name-input" class="miau-input' + (state.nameError ? ' error' : '') + '" value="' + escapeHtml(state.name) + '" placeholder="Tu nombre" autocomplete="name">' +
      (state.nameError ? '<div class="miau-error">⚠️ ' + escapeHtml(state.nameError) + '</div>' : '') +
      '</div>'
    );
  }

  function renderCatalogStep() {
    var pink = state.activeCat === 'Flaming Hot';
    var catsHtml = CATS.map(function (c) {
      var active = state.activeCat === c;
      var isPink = c === 'Flaming Hot';
      var style = active
        ? 'background:' + (isPink ? '#ff7a95' : '#C41E3A') + ';color:#fff;box-shadow:0 4px 12px rgba(196,30,58,.3)'
        : 'color:' + (isPink ? '#e0576d' : '#8a6a6e');
      return '<button class="miau-cat-btn' + (active ? ' active' : '') + '" data-cat="' + escapeHtml(c) + '" style="' + style + '">' + escapeHtml(c) + '</button>';
    }).join('');

    var productsHtml = PRODUCTS.filter(function (p) { return p.cat === state.activeCat; }).map(function (p) {
      var q = state.qty[p.id] || 0;
      var cardBorder = q > 0 ? '#C41E3A' : (pink ? '#ffd9e1' : '#ffe0e6');
      var cardExtra = pink ? ';box-shadow:0 4px 14px rgba(255,122,149,.12)' : '';
      var thumbBg = pink
        ? 'repeating-linear-gradient(45deg,#ffe3ea,#ffe3ea 6px,#ffd0dc 6px,#ffd0dc 12px)'
        : 'repeating-linear-gradient(45deg,#fff0d9,#fff0d9 6px,#ffe6c2 6px,#ffe6c2 12px)';
      return (
        '<div class="miau-product-card" style="border-color:' + cardBorder + cardExtra + '">' +
        '<div class="miau-product-thumb" style="background:' + thumbBg + '"><span>foto</span></div>' +
        '<div class="miau-product-info">' +
        '<div class="miau-product-name">' + escapeHtml(p.name) + '</div>' +
        '<div class="miau-product-price">' + soles(p.price) + '</div>' +
        '</div>' +
        '<div class="miau-product-controls">' +
        '<button class="miau-qty-btn' + (q > 0 ? ' active' : '') + '" data-dec="' + p.id + '">−</button>' +
        '<span class="miau-qty-val" style="color:' + (q > 0 ? '#C41E3A' : '#c9b3b6') + '">' + q + '</span>' +
        '<button class="miau-qty-inc" data-inc="' + p.id + '">+</button>' +
        '</div>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="miau-catalog">' +
      '<h2>Elige tus banderillas</h2>' +
      '<p>Usa + para agregar. Puedes mezclar categorías.</p>' +
      '<div class="miau-cats">' + catsHtml + '</div>' +
      '<div class="miau-products">' + productsHtml + '</div>' +
      (state.catError ? '<div class="miau-error-center">⚠️ ' + escapeHtml(state.catError) + '</div>' : '') +
      '</div>'
    );
  }

  function renderCremasStep() {
    var html = CREMAS.map(function (c) {
      var on = state.cremas.indexOf(c) !== -1;
      return (
        '<button class="miau-crema-btn' + (on ? ' on' : '') + '" data-crema="' + escapeHtml(c) + '">' +
        '<span class="miau-crema-box' + (on ? ' on' : '') + '">' + (on ? '✓' : '') + '</span>' +
        '<span class="miau-crema-name">' + escapeHtml(c) + '</span>' +
        '</button>'
      );
    }).join('');
    return (
      '<div class="miau-cremas-step">' +
      '<h2>Tus cremas 🥫</h2>' +
      '<p>¡Todas gratis! Elige las que quieras.</p>' +
      '<div class="miau-cremas-list">' + html + '</div>' +
      '</div>'
    );
  }

  function renderEntregaStep() {
    var isDelivery = state.mode === 'Delivery';
    return (
      '<div class="miau-entrega-step">' +
      '<h2>¿Cómo lo quieres?</h2>' +
      '<p>Recoge en tienda o te lo llevamos.</p>' +
      '<div class="miau-mode-row">' +
      '<button class="miau-mode-btn' + (state.mode === 'Recojo' ? ' selected' : '') + '" id="miau-mode-recojo">' +
      '<div class="miau-mode-icon">🏪</div><div class="miau-mode-label">Recojo</div><div class="miau-mode-sub">En tienda</div>' +
      '</button>' +
      '<button class="miau-mode-btn' + (isDelivery ? ' selected' : '') + '" id="miau-mode-delivery">' +
      '<div class="miau-mode-icon">🛵</div><div class="miau-mode-label">Delivery</div><div class="miau-mode-sub">A tu puerta</div>' +
      '</button>' +
      '</div>' +
      (isDelivery ?
        '<div class="miau-address-wrap">' +
        '<label class="miau-address-label">Dirección de entrega</label>' +
        '<textarea id="miau-address-input" class="miau-textarea' + (state.addrError ? ' error' : '') + '" rows="3" placeholder="Calle, número, referencia, distrito…">' + escapeHtml(state.address) + '</textarea>' +
        '<div class="miau-address-note">El costo de delivery se coordina por WhatsApp según tu zona.</div>' +
        (state.addrError ? '<div class="miau-error">⚠️ ' + escapeHtml(state.addrError) + '</div>' : '') +
        '</div>'
        : (state.addrError ? '<div class="miau-error">⚠️ ' + escapeHtml(state.addrError) + '</div>' : '')
      ) +
      '</div>'
    );
  }

  function renderResumenStep() {
    var cremasText = state.cremas.length ? state.cremas.join(', ') : 'Ninguna';
    var entregaText = '—';
    if (state.mode === 'Recojo') entregaText = 'Recojo en tienda';
    else if (state.mode === 'Delivery') entregaText = 'Delivery — ' + (state.address.trim() || '(sin dirección)');

    var itemsHtml = chosen().map(function (p) {
      var q = state.qty[p.id];
      return (
        '<div class="miau-order-item">' +
        '<span class="miau-order-item-label"><b>' + q + 'x</b> ' + escapeHtml(p.name) + ' (' + escapeHtml(p.cat) + ')</span>' +
        '<span class="miau-order-item-total">' + soles(q * p.price) + '</span>' +
        '</div>'
      );
    }).join('');

    return (
      '<div class="miau-resumen-step">' +
      '<h2>Revisa tu pedido</h2>' +
      '<p>Toca cualquier sección para editarla.</p>' +

      '<button class="miau-summary-block" id="miau-edit-name">' +
      '<div><div class="miau-summary-block-label">NOMBRE</div><div class="miau-summary-block-value">' + escapeHtml(state.name) + '</div></div>' +
      '<span class="miau-summary-edit">Editar ✏️</span>' +
      '</button>' +

      '<div class="miau-order-block">' +
      '<div class="miau-order-header">' +
      '<div class="miau-summary-block-label">PEDIDO</div>' +
      '<button class="miau-summary-edit" id="miau-edit-catalog">Editar ✏️</button>' +
      '</div>' + itemsHtml + '</div>' +

      '<button class="miau-summary-block" id="miau-edit-cremas">' +
      '<div><div class="miau-summary-block-label">CREMAS</div><div class="miau-summary-block-value small">' + escapeHtml(cremasText) + '</div></div>' +
      '<span class="miau-summary-edit">Editar ✏️</span>' +
      '</button>' +

      '<button class="miau-summary-block" id="miau-edit-entrega">' +
      '<div><div class="miau-summary-block-label">ENTREGA</div><div class="miau-summary-block-value small">' + escapeHtml(entregaText) + '</div></div>' +
      '<span class="miau-summary-edit">Editar ✏️</span>' +
      '</button>' +

      '<div class="miau-total-card"><span class="miau-total-label">Total</span><span class="miau-total-value">' + soles(total()) + '</span></div>' +
      '</div>'
    );
  }

  function renderSentStep() {
    return (
      '<div class="miau-sent-step">' +
      '<div class="miau-sent-check"><span>✅</span></div>' +
      '<img src="assets/miau-logo.png" alt="" class="miau-sent-logo">' +
      '<h2>¡Pedido enviado!</h2>' +
      '<p>Te contactaremos por WhatsApp muy pronto para confirmar. ¡Gracias, ' + escapeHtml(state.name) + '! 🐾</p>' +
      '<p class="miau-sent-hint">¿No se abrió WhatsApp?</p>' +
      '<a class="miau-wa-link" href="' + state.waLink + '" target="_blank" rel="noopener">Reenviar por WhatsApp</a>' +
      '<div><button class="miau-reset-btn" id="miau-reset-btn">Hacer otro pedido</button></div>' +
      '</div>'
    );
  }

  function renderBody() {
    var el = document.getElementById('miau-body');
    switch (state.step) {
      case 0: el.innerHTML = renderWelcome(); break;
      case 1: el.innerHTML = renderNameStep(); break;
      case 2: el.innerHTML = renderCatalogStep(); break;
      case 3: el.innerHTML = renderCremasStep(); break;
      case 4: el.innerHTML = renderEntregaStep(); break;
      case 5: el.innerHTML = renderResumenStep(); break;
      case 6: el.innerHTML = renderSentStep(); break;
    }
  }

  function renderCart(count) {
    var el = document.getElementById('miau-cart');
    var show = (state.step >= 2 && state.step <= 4) && count > 0;
    if (!show) { el.innerHTML = ''; return; }
    var label = count + (count === 1 ? ' producto' : ' productos');
    el.innerHTML =
      '<button class="miau-floating-cart" id="miau-go-resumen">' +
      '<span class="miau-cart-icon">🛒</span>' +
      '<span class="miau-cart-text">' + label + '<div class="miau-cart-sub">Ver resumen</div></span>' +
      '<span class="miau-cart-total">' + soles(total()) + '</span>' +
      '</button>';
  }

  function renderNav(inFlow) {
    var el = document.getElementById('miau-nav');
    if (!inFlow) { el.innerHTML = ''; return; }
    var count = itemCount();
    var primaryLabel = 'Continuar';
    if (state.step === 2) primaryLabel = count > 0 ? ('Continuar · ' + soles(total())) : 'Continuar';
    if (state.step === 4) primaryLabel = 'Ir al resumen';
    if (state.step === 5) primaryLabel = 'Enviar por WhatsApp';
    el.innerHTML =
      '<div class="miau-bottom-nav">' +
      (state.step >= 1 ? '<button class="miau-back-btn" id="miau-back-btn">‹</button>' : '') +
      '<button class="miau-primary-btn" id="miau-primary-btn">' + primaryLabel + '</button>' +
      '</div>';
  }

  // Event delegation: listeners are bound once on `document`, so they keep
  // working even when partial re-renders (syncStatusOnly) replace the nav/cart
  // DOM nodes without re-binding anything.
  function bindDelegatedEvents() {
    document.addEventListener('click', function (e) {
      var el;
      if ((el = e.target.closest('#miau-start-btn'))) { setStep(1); return; }
      if ((el = e.target.closest('[data-cat]'))) { setState({ activeCat: el.getAttribute('data-cat') }); return; }
      if ((el = e.target.closest('[data-inc]'))) {
        var incId = el.getAttribute('data-inc');
        state.qty[incId] = (state.qty[incId] || 0) + 1;
        setState({ catError: '' });
        return;
      }
      if ((el = e.target.closest('[data-dec]'))) {
        var decId = el.getAttribute('data-dec');
        state.qty[decId] = Math.max(0, (state.qty[decId] || 0) - 1);
        setState({});
        return;
      }
      if ((el = e.target.closest('[data-crema]'))) {
        var c = el.getAttribute('data-crema');
        var on = state.cremas.indexOf(c) !== -1;
        setState({ cremas: on ? state.cremas.filter(function (x) { return x !== c; }) : state.cremas.concat([c]) });
        return;
      }
      if ((el = e.target.closest('#miau-mode-recojo'))) { setState({ mode: 'Recojo', addrError: '' }); return; }
      if ((el = e.target.closest('#miau-mode-delivery'))) { setState({ mode: 'Delivery', addrError: '' }); return; }
      if ((el = e.target.closest('#miau-edit-name'))) { setStep(1); return; }
      if ((el = e.target.closest('#miau-edit-catalog'))) { setStep(2); return; }
      if ((el = e.target.closest('#miau-edit-cremas'))) { setStep(3); return; }
      if ((el = e.target.closest('#miau-edit-entrega'))) { setStep(4); return; }
      if ((el = e.target.closest('#miau-reset-btn'))) { reset(); return; }
      if ((el = e.target.closest('#miau-go-resumen'))) {
        if (itemCount() === 0) { setState({ catError: 'Agrega al menos un producto para continuar.' }); return; }
        setStep(5);
        return;
      }
      if ((el = e.target.closest('#miau-back-btn'))) { back(); return; }
      if ((el = e.target.closest('#miau-primary-btn'))) { primaryAction(); return; }
    });

    document.addEventListener('input', function (e) {
      if (e.target.id === 'miau-name-input') { state.name = e.target.value; state.nameError = ''; syncStatusOnly(); }
      else if (e.target.id === 'miau-address-input') { state.address = e.target.value; state.addrError = ''; syncStatusOnly(); }
    });
  }

  // Lightweight re-render that skips full body re-paint for pure text-input typing,
  // so the input keeps focus and cursor position while the user types.
  function syncStatusOnly() {
    var count = itemCount();
    renderCart(count);
    renderNav(true);
  }

  function render() {
    var status = statusInfo();
    var inFlow = state.step >= 1 && state.step <= 5;
    renderStatus(status);
    renderClosedBanner(status);
    renderProgress(inFlow);
    renderBody();
    renderCart(itemCount());
    renderNav(inFlow);
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindDelegatedEvents();
    render();
  });
})();
