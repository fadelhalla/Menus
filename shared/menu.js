/*
 * Menu engine: renders an interactive menu with dine-in / pickup / delivery
 * ordering from a single data object, window.RESTAURANT (see burger/data.js).
 *
 * Dine-in tables are read from the URL, so a QR code on each table can point at
 *   burger/?table=12   or   burger/#table-12
 *
 * Orders go to RESTAURANT.orderEndpoint (POST JSON) when it is set. Without it
 * the engine runs in demo mode and simulates the kitchen.
 */
(() => {
  const R = window.RESTAURANT;
  const root = document.getElementById('app');

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const fmt = new Intl.NumberFormat(R.locale || 'en-US', { style: 'currency', currency: R.currency || 'USD' });
  const money = (n) => fmt.format(Math.round(n * 100) / 100);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(`${R.id}:${k}`); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(`${R.id}:${k}`, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  const TAGS = Object.assign({
    popular: 'Popular', new: 'New', veg: 'Vegetarian', vegan: 'Vegan', spicy: 'Spicy', gf: 'Gluten-free',
  }, R.tagLabels);
  const FILTERS = R.filters || ['veg', 'spicy', 'gf'];

  const ICONS = {
    dinein: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 10h18M5 10v10M19 10v10M8 6h8"/></svg>',
    pickup: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    delivery: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-3-8h4l2 5M12 9H8"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  };
  const MODES = {
    dinein: { label: 'Dine in', blurb: 'Order from your table. We bring it to you.' },
    pickup: { label: 'Pickup', blurb: `Order ahead and collect at the counter. Ready in ${R.prepTime?.pickup || '15–20 min'}.` },
    delivery: { label: 'Delivery', blurb: `Delivered to your door in ${R.prepTime?.delivery || '30–45 min'}.` },
  };
  const enabledModes = Object.keys(MODES).filter((m) => R.modes?.[m] !== false);

  // ---------- data ----------
  const items = new Map();
  R.categories.forEach((c) => c.items.forEach((i) => items.set(i.id, { ...i, cat: c.id })));

  const tableFromUrl = (() => {
    const q = new URLSearchParams(location.search).get('table');
    const h = location.hash.match(/^#table-([A-Za-z0-9]+)$/);
    return q || (h && h[1]) || null;
  })();

  const state = {
    mode: tableFromUrl ? 'dinein' : store.get('mode', null),
    table: tableFromUrl || store.get('table', ''),
    cart: store.get('cart', []).filter((l) => items.has(l.id)),
    filters: new Set(),
    query: '',
    tip: 0.15,
    promo: null,
    rounds: store.get('rounds', []), // dine-in orders sent this visit
    guests: store.get('guests', 2),
    editing: null, // cart line key being edited
  };
  if (!enabledModes.includes(state.mode)) state.mode = null;

  const save = () => {
    store.set('cart', state.cart);
    store.set('mode', state.mode);
    store.set('table', state.table);
    store.set('rounds', state.rounds);
    store.set('guests', state.guests);
  };

  function unitPrice(item, choices) {
    let p = item.price;
    (item.options || []).forEach((g) => (choices[g.id] || []).forEach((cid) => {
      const c = g.choices.find((x) => x.id === cid);
      if (c) p += c.price || 0;
    }));
    return p;
  }
  function choiceSummary(item, choices) {
    return (item.options || []).flatMap((g) => (choices[g.id] || [])
      .map((cid) => g.choices.find((x) => x.id === cid))
      .filter((c) => c && !c.hidden)
      .map((c) => (g.prefix ? `${g.prefix} ${c.name.toLowerCase()}` : c.name)));
  }
  const lineKey = (id, choices, note) => `${id}|${JSON.stringify(choices)}|${note || ''}`;
  const cartCount = () => state.cart.reduce((n, l) => n + l.qty, 0);
  const qtyOf = (id) => state.cart.filter((l) => l.id === id).reduce((n, l) => n + l.qty, 0);

  function defaultChoices(item) {
    const out = {};
    (item.options || []).forEach((g) => {
      const def = g.choices.filter((c) => c.default).map((c) => c.id);
      if (def.length) out[g.id] = def;
      else if (g.type === 'single' && g.required) out[g.id] = [g.choices[0].id];
      else out[g.id] = [];
    });
    return out;
  }

  function totals() {
    const subtotal = state.cart.reduce((s, l) => s + l.unit * l.qty, 0);
    let discount = 0;
    if (state.promo) {
      const p = R.promos[state.promo];
      discount = p.type === 'percent' ? subtotal * p.value / 100 : Math.min(p.value, subtotal);
    }
    const net = subtotal - discount;
    const delivery = state.mode === 'delivery' && subtotal > 0
      ? (R.freeDeliveryOver && subtotal >= R.freeDeliveryOver ? 0 : R.deliveryFee || 0) : 0;
    const tax = net * (R.taxRate || 0);
    const tip = state.mode === 'dinein' || R.tips === false ? 0 : net * state.tip;
    const cover = state.mode === 'dinein' && R.cover && !state.rounds.length && subtotal > 0 ? R.cover.price * state.guests : 0;
    return { subtotal, discount, delivery, tax, tip, cover, total: net + delivery + tax + tip + cover };
  }

  // ---------- shell ----------
  root.innerHTML = `
    <header class="top">
      <div class="wrap">
        <h1 class="logo">${esc(R.name)}<small>${esc(R.kicker || '')}</small></h1>
        ${R.skins ? '<button class="skin-btn" id="skin-btn" type="button" aria-label="Change the restaurant style"></button>' : ''}
        <button class="mode-btn" id="mode-btn" type="button"></button>
      </div>
    </header>
    <section class="hero">
      <div class="wrap${R.heroArt ? ' has-art' : ''}">
        <div class="hero-copy">
          <h2>${R.taglineHtml || esc(R.tagline)}</h2>
          <p>${esc(R.intro || '')}</p>
          <div class="facts">${(R.facts || []).map((f) => `<span>${esc(f)}</span>`).join('')}</div>
        </div>
        ${R.heroArt ? `<div class="hero-art" aria-hidden="true">${R.heroArt}</div>` : ''}
      </div>
    </section>
    <div class="table-bar" id="table-bar" hidden></div>
    <nav class="nav" aria-label="Menu sections">
      <div class="wrap">
        <div class="search-row">
          <label class="search">${ICONS.search}<span class="sr-only">Search the menu</span>
            <input id="q" type="search" placeholder="Search ${esc(R.searchHint || 'the menu')}" autocomplete="off">
          </label>
          <div class="filters">${FILTERS.map((f) => `<button type="button" class="filter" data-filter="${f}" aria-pressed="false">${esc(TAGS[f])}</button>`).join('')}</div>
        </div>
        <div class="cats" id="cats"></div>
      </div>
    </nav>
    <main class="wrap" id="menu"></main>
    <footer class="wrap foot">
      <span><b>${esc(R.name)}</b> · ${esc(R.address || '')}</span>
      <span>${esc(R.hours || '')}</span>
      <span>${esc(R.phone || '')}${R.allergyNote ? ` · ${esc(R.allergyNote)}` : ''}</span>
    </footer>
    <div class="cartbar" id="cartbar" hidden><button type="button" id="open-cart"></button></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
    <dialog class="sheet" id="sheet-mode" aria-labelledby="mode-title"></dialog>
    <dialog class="sheet" id="sheet-item" aria-labelledby="item-title"></dialog>
    <dialog class="sheet" id="sheet-cart" aria-labelledby="cart-title"></dialog>
    <dialog class="sheet" id="sheet-checkout" aria-labelledby="co-title"></dialog>
    <dialog class="sheet" id="sheet-done" aria-labelledby="done-title"></dialog>
    <dialog class="sheet" id="sheet-skin" aria-labelledby="skin-title"></dialog>
  `;

  const sheets = Object.fromEntries(['mode', 'item', 'cart', 'checkout', 'done', 'skin'].map((k) => [k, $(`#sheet-${k}`)]));
  Object.values(sheets).forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d && (d !== sheets.mode || state.mode)) d.close(); }); // backdrop tap
  });
  sheets.mode.addEventListener('close', () => { save(); renderHeader(); renderCartBar(); });
  const open = (k) => { Object.entries(sheets).forEach(([n, d]) => n !== k && d.open && d.close()); if (!sheets[k].open) sheets[k].showModal(); };

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- header / table bar ----------
  function renderHeader() {
    const m = state.mode;
    $('#mode-btn').innerHTML = m
      ? `<span class="dot"></span>${esc(MODES[m].label)}${m === 'dinein' && state.table ? ` · Table ${esc(state.table)}` : ''} <span aria-hidden="true">▾</span>`
      : 'How are you eating? ▾';
    const bar = $('#table-bar');
    bar.hidden = m !== 'dinein';
    if (m === 'dinein') {
      const sent = state.rounds.length;
      bar.innerHTML = `<div class="wrap">
        <span>${state.table ? `Table <strong>${esc(state.table)}</strong>` : 'Dine in'}${sent ? ` · ${sent} order${sent > 1 ? 's' : ''} sent to the kitchen` : ' · Order here, we bring it to your table'}</span>
        <span class="actions">
          <button type="button" class="chip-btn" data-act="waiter">Call a server</button>
          ${sent ? '<button type="button" class="chip-btn" data-act="bill">Ask for the bill</button>' : ''}
        </span></div>`;
    }
  }
  $('#table-bar').addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'waiter') toast(`A server is on the way${state.table ? ` to table ${state.table}` : ''}.`);
    if (act === 'bill') {
      const sum = state.rounds.reduce((s, r) => s + r.totals.total, 0);
      toast(`Bill requested: ${money(sum)}. A server will bring it over.`);
    }
  });

  // ---------- style picker (optional: RESTAURANT.skins) ----------
  function applySkin(id) {
    const skin = R.skins.find((x) => x.id === id) || R.skins[0];
    document.documentElement.dataset.skin = skin.id;
    const b = $('#skin-btn');
    skin.colors.forEach((c, i) => b.style.setProperty(`--c${i + 1}`, c));
    return skin;
  }
  if (R.skins) {
    applySkin(R.defaultSkin || R.skins[0].id); // every visit opens in the house style
    $('#skin-btn').addEventListener('click', () => {
      const cur = document.documentElement.dataset.skin;
      sheets.skin.innerHTML = `
        <div class="sheet-head"><h2 id="skin-title">Choose a style</h2><button class="x" type="button" data-close aria-label="Close">✕</button></div>
        <div class="sheet-body"><div class="skins">${R.skins.map((k) => `
          <button type="button" class="skin-opt" data-skin="${esc(k.id)}" aria-pressed="${k.id === cur}">
            <span class="skin-strip">${k.colors.map((c) => `<i style="background:${esc(c)}"></i>`).join('')}</span>
            <span class="skin-txt"><b>${esc(k.name)}</b><small>${esc(k.about)}</small></span>
          </button>`).join('')}</div></div>`;
      open('skin');
    });
    sheets.skin.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) return sheets.skin.close();
      const o = e.target.closest('[data-skin]');
      if (!o) return;
      const skin = applySkin(o.dataset.skin);
      $$('[data-skin]', sheets.skin).forEach((x) => x.setAttribute('aria-pressed', x === o));
      toast(`Style: ${skin.name}`);
      setTimeout(() => sheets.skin.close(), 350);
    });
  }

  // ---------- mode chooser ----------
  function renderModeSheet(force) {
    sheets.mode.innerHTML = `
      <div class="sheet-head"><h2 id="mode-title">How are you eating today?</h2>
        ${force ? '' : '<button class="x" type="button" data-close aria-label="Close">✕</button>'}</div>
      <div class="sheet-body">
        <div class="modes">${enabledModes.map((m) => `
          <button type="button" class="mode" data-mode="${m}" aria-pressed="${state.mode === m}">
            <span class="ico">${ICONS[m]}</span><b>${MODES[m].label}</b><span>${esc(MODES[m].blurb)}</span>
          </button>`).join('')}
        </div>
        <div class="field" id="table-field" ${state.mode === 'dinein' ? '' : 'hidden'}>
          <label for="table-input">Table number</label>
          <input id="table-input" inputmode="numeric" placeholder="Printed on the table card" value="${esc(state.table)}">
        </div>
        ${R.modes?.delivery !== false && R.minDelivery ? `<p class="hint">Delivery minimum ${money(R.minDelivery)}${R.freeDeliveryOver ? ` · free delivery over ${money(R.freeDeliveryOver)}` : ''}.</p>` : ''}
      </div>
      <div class="sheet-foot"><button type="button" class="primary center" id="mode-go" ${state.mode ? '' : 'disabled'}>Start my order</button></div>`;
  }
  sheets.mode.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mode]');
    if (b) {
      state.mode = b.dataset.mode;
      $$('[data-mode]', sheets.mode).forEach((x) => x.setAttribute('aria-pressed', x === b));
      $('#table-field').hidden = state.mode !== 'dinein';
      $('#mode-go').disabled = false;
      if (state.mode === 'dinein') $('#table-input').focus();
    }
    if (e.target.closest('[data-close]')) sheets.mode.close();
    if (e.target.closest('#mode-go')) {
      if (state.mode === 'dinein') state.table = $('#table-input').value.trim();
      save(); renderHeader(); renderCartBar();
      sheets.mode.close();
    }
  });
  sheets.mode.addEventListener('cancel', (e) => { if (!state.mode) e.preventDefault(); });
  $('#mode-btn').addEventListener('click', () => { renderModeSheet(false); open('mode'); });

  // ---------- menu ----------
  function matches(item) {
    for (const f of state.filters) {
      if (f === 'veg' ? !(item.tags || []).some((t) => t === 'veg' || t === 'vegan') : !(item.tags || []).includes(f)) return false;
    }
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.desc || '').toLowerCase().includes(q);
  }

  const tileHtml = (item) => {
    const art = item.img ? `<img src="${esc(item.img)}" alt="" loading="lazy">` : (item.icon && R.icons?.[item.icon]) || esc(item.emoji || '');
    return `<div class="tile${item.icon ? ' has-icon' : ''}" style="--tile:${esc(item.tile || 'var(--brand)')}" aria-hidden="true">${art}</div>`;
  };
  const tagsHtml = (item) => (item.tags || []).map((t) => `<span class="tag ${esc(t)}">${esc(TAGS[t] || t)}</span>`).join('');

  function cardHtml(item) {
    const q = qtyOf(item.id);
    return `<article class="card${item.soldOut ? ' sold' : ''}" data-id="${esc(item.id)}">
      <button type="button" class="card-open" data-open="${esc(item.id)}" aria-label="${esc(item.name)}, ${money(item.price)}${item.soldOut ? ', sold out' : ''}"></button>
      <div class="card-body">
        <h4>${esc(item.name)}</h4>
        <p class="desc">${esc(item.desc)}</p>
        <div class="meta"><span class="price">${item.soldOut ? 'Sold out' : money(item.price)}</span>${tagsHtml(item)}${item.left && !item.soldOut ? `<span class="tag left">Only ${item.left} left today</span>` : ''}</div>
      </div>
      ${tileHtml(item)}
      ${q ? `<span class="in-cart" aria-label="${q} in your order">${q}</span>` : ''}
      ${item.soldOut ? '' : `<button type="button" class="add" data-quick="${esc(item.id)}" aria-label="Add ${esc(item.name)}">+</button>`}
    </article>`;
  }

  let builderEl = null;
  function renderMenu() {
    const browsing = !state.query && !state.filters.size;
    const secs = R.categories
      .map((c) => ({ ...c, list: c.type === 'builder' ? (browsing ? c.items : []) : c.items.map((i) => items.get(i.id)).filter(matches) }))
      .filter((c) => c.list.length);
    $('#cats').innerHTML = secs.map((c, i) => `<button type="button" class="cat" data-cat="${esc(c.id)}" aria-current="${i === 0}">${esc(c.name)}</button>`).join('');
    $('#menu').innerHTML = secs.length
      ? secs.map((c) => `<section class="section" id="sec-${esc(c.id)}" data-sec="${esc(c.id)}">
          ${c.kicker ? `<span class="kicker">${esc(c.kicker)}</span>` : ''}<h3>${esc(c.name)}</h3>${c.blurb ? `<p>${esc(c.blurb)}</p>` : ''}
          ${c.type === 'builder' ? '<div data-builder-slot></div>' : `<div class="grid">${c.list.map(cardHtml).join('')}</div>`}</section>`).join('')
      : `<div class="empty"><strong>Nothing matches that</strong>Try another word or clear the filters.</div>`;
    const slot = $('[data-builder-slot]');
    if (slot && R.builder) {
      if (!builderEl) { builderEl = document.createElement('div'); builderEl.className = 'builder-host'; R.builder(builderEl, api); }
      slot.replaceWith(builderEl); // same node every time, so the builder keeps its state
    }
    observeSections();
  }

  // Update the "in your order" counters without re-rendering the menu.
  function updateBadges() {
    $$('.card[data-id]').forEach((card) => {
      const q = qtyOf(card.dataset.id);
      let b = $('.in-cart', card);
      if (!q) { b?.remove(); return; }
      if (!b) { b = document.createElement('span'); b.className = 'in-cart'; card.append(b); }
      if (b.textContent !== String(q)) { b.textContent = q; b.setAttribute('aria-label', `${q} in your order`); b.animate?.([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' }); }
    });
    builderEl?.dispatchEvent(new CustomEvent('cartchange'));
  }

  // Fly a copy of the dish tile into the cart bar.
  let lastTile = null;
  document.addEventListener('pointerdown', (e) => {
    const src = e.target.closest('[data-fly]');
    const host = e.target.closest('.card, .mini, dialog.sheet');
    lastTile = src ? $(src.dataset.fly) || src : host ? $('.tile', host) : null;
  }, true);
  function fly(src) {
    const target = $('#open-cart .count');
    if (!src || !target || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const a = src.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || a.bottom < 0 || a.top > innerHeight) return;
    const ghost = src.cloneNode(true);
    ghost.removeAttribute('id');
    Object.assign(ghost.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: 0, zIndex: 100, pointerEvents: 'none' });
    document.body.append(ghost);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    ghost.animate([
      { transform: 'translate(0, 0) scale(1) rotate(0)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 90}px) scale(.55) rotate(-12deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.1) rotate(8deg)`, opacity: 0.4 },
    ], { duration: 700, easing: 'cubic-bezier(.45, 0, .55, 1)' }).finished.then(() => {
      ghost.remove();
      const bar = $('#cartbar');
      bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump');
    });
  }

  // Highlight the section in view. This only ever scrolls the category strip
  // sideways (never the page), so it can't interrupt the guest's own scrolling.
  let spyLock = 0;
  function currentSection() {
    const navBottom = $('.nav').getBoundingClientRect().bottom;
    let id = null;
    for (const sec of $$('.section')) {
      if (sec.getBoundingClientRect().top - navBottom <= 24) id = sec.dataset.sec; else break;
    }
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    return atEnd ? $$('.section').at(-1)?.dataset.sec : id || $('.section')?.dataset.sec;
  }
  function setCurrent(id) {
    const cats = $('#cats');
    const btn = $(`.cat[data-cat="${CSS.escape(id || '')}"]`);
    if (!btn || btn.getAttribute('aria-current') === 'true') return;
    $$('.cat').forEach((b) => b.setAttribute('aria-current', b === btn));
    cats.scrollTo({ left: btn.offsetLeft - (cats.clientWidth - btn.offsetWidth) / 2, behavior: 'smooth' });
  }
  let spyFrame = 0;
  addEventListener('scroll', () => {
    if (spyFrame) return;
    spyFrame = requestAnimationFrame(() => { spyFrame = 0; if (Date.now() > spyLock) setCurrent(currentSection()); });
  }, { passive: true });
  function observeSections() { setCurrent(currentSection()); }

  $('#cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    const sec = $(`#sec-${CSS.escape(b.dataset.cat)}`);
    if (!sec) return;
    setCurrent(b.dataset.cat);
    spyLock = Date.now() + 900; // keep the tapped chip lit while the page glides there
    const top = sec.getBoundingClientRect().top + scrollY - $('.nav').offsetHeight - 8;
    scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
  $('#q').addEventListener('input', (e) => { state.query = e.target.value.trim(); renderMenu(); });
  $$('.filter').forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    state.filters.has(f) ? state.filters.delete(f) : state.filters.add(f);
    b.setAttribute('aria-pressed', state.filters.has(f));
    renderMenu();
  }));
  $('#menu').addEventListener('click', (e) => {
    const quick = e.target.closest('[data-quick]');
    if (quick) {
      const item = items.get(quick.dataset.quick);
      const needsChoice = (item.options || []).some((g) => g.required && g.type === 'multi');
      if ((item.options || []).length && (needsChoice || item.askOptions)) return openItem(item.id);
      addToCart(item, defaultChoices(item), 1, '');
      return;
    }
    const o = e.target.closest('[data-open]');
    if (o) openItem(o.dataset.open);
  });

  // ---------- item sheet ----------
  function openItem(id, editKey = null) {
    const item = items.get(id);
    if (!item || item.soldOut) return;
    const line = editKey ? state.cart.find((l) => l.key === editKey) : null;
    state.editing = editKey;
    const choices = line ? structuredClone(line.choices) : defaultChoices(item);
    let qty = line ? line.qty : 1;

    sheets.item.innerHTML = `
      <div class="sheet-head"><h2 id="item-title">${esc(item.name)}</h2><button class="x" type="button" data-close aria-label="Close">✕</button></div>
      <form class="sheet-body" id="item-form" novalidate>
        <div class="item-hero">
          ${tileHtml(item)}
          <p>${esc(item.desc)}</p>
          <div class="meta"><span class="price">${money(item.price)}</span>${tagsHtml(item)}${item.cal ? `<span class="hint">${esc(item.cal)} kcal</span>` : ''}</div>
        </div>
        ${(item.options || []).map((g) => `
          <fieldset data-group="${esc(g.id)}">
            <legend>${esc(g.name)} <span class="req" data-req>${g.required ? 'Required' : g.max ? `Up to ${g.max}` : 'Optional'}</span></legend>
            ${g.choices.map((c) => `
              <label class="choice">
                <input type="${g.type === 'single' ? 'radio' : 'checkbox'}" name="${esc(g.id)}" value="${esc(c.id)}" ${(choices[g.id] || []).includes(c.id) ? 'checked' : ''}>
                <span>${esc(c.name)}</span>
                ${c.price ? `<span class="delta">${c.price > 0 ? '+' : '−'}${money(Math.abs(c.price))}</span>` : ''}
              </label>`).join('')}
          </fieldset>`).join('')}
        <div class="field">
          <label for="item-note">Notes for the kitchen <span class="opt">(optional)</span></label>
          <textarea id="item-note" maxlength="140" placeholder="${esc(R.notePlaceholder || 'Allergies, sauce on the side…')}">${esc(line?.note || '')}</textarea>
        </div>
        ${item.pair && items.get(item.pair) ? (() => { const p = items.get(item.pair); return `
          <div class="pair"><span class="block-title">${esc(R.pairTitle || 'Pairs well with')}</span>
            <button type="button" class="mini pair-btn" data-pair="${esc(p.id)}">${tileHtml(p)}<span><b>${esc(p.name)}</b><small>${p.pairNote ? `${esc(p.pairNote)} ` : ''}${money(unitPrice(p, defaultChoices(p)))}</small></span><span class="pair-add">Add</span></button>
          </div>`; })() : ''}
      </form>
      <div class="sheet-foot">
        <div class="stepper" aria-label="Quantity">
          <button type="button" data-step="-1" aria-label="One less">−</button>
          <output id="item-qty">${qty}</output>
          <button type="button" data-step="1" aria-label="One more">+</button>
        </div>
        <button type="button" class="primary" id="item-add"></button>
      </div>`;

    const form = $('#item-form');
    const read = () => {
      (item.options || []).forEach((g) => { choices[g.id] = $$(`input[name="${CSS.escape(g.id)}"]:checked`, form).map((i) => i.value); });
    };
    const refresh = () => {
      read();
      let ok = true;
      (item.options || []).forEach((g) => {
        const fs = $(`[data-group="${CSS.escape(g.id)}"]`, form);
        const n = choices[g.id].length;
        if (g.max && g.type === 'multi') $$('input', fs).forEach((i) => { i.disabled = !i.checked && n >= g.max; });
        const missing = g.required && n === 0;
        $('[data-req]', fs).classList.toggle('need', missing);
        if (missing) ok = false;
      });
      const btn = $('#item-add');
      btn.disabled = !ok;
      btn.innerHTML = `<span>${ok ? (editKey ? 'Update item' : 'Add to order') : 'Choose the required options'}</span><span class="num">${money(unitPrice(item, choices) * qty)}</span>`;
      $('#item-qty').textContent = qty;
    };
    form.addEventListener('change', refresh);
    sheets.item.onclick = (e) => {
      if (e.target === sheets.item || e.target.closest('[data-close]')) return sheets.item.close();
      const st = e.target.closest('[data-step]');
      if (st) { qty = Math.max(1, Math.min(20, qty + Number(st.dataset.step))); refresh(); }
      const pr = e.target.closest('[data-pair]');
      if (pr && !pr.disabled) {
        const p = items.get(pr.dataset.pair);
        addToCart(p, defaultChoices(p), 1, '', true, $('.tile', pr));
        pr.disabled = true;
        $('.pair-add', pr).textContent = 'Added ✓';
      }
      if (e.target.closest('#item-add')) {
        read();
        const note = $('#item-note').value.trim();
        if (editKey) state.cart = state.cart.filter((l) => l.key !== editKey);
        addToCart(item, choices, qty, note, !!editKey);
        sheets.item.close();
        if (editKey) { renderCart(); open('cart'); }
      }
    };
    refresh();
    open('item');
  }

  function addToCart(item, choices, qty, note, silent = false, src = lastTile) {
    const key = lineKey(item.id, choices, note);
    const existing = state.cart.find((l) => l.key === key);
    if (existing) existing.qty += qty;
    else state.cart.push({ key, id: item.id, qty, choices: structuredClone(choices), note, unit: unitPrice(item, choices) });
    save(); updateBadges(); renderCartBar();
    fly(src);
    lastTile = null;
    if (!silent) toast(`Added ${qty > 1 ? `${qty} × ` : ''}${item.name}`);
  }

  // ---------- cart ----------
  function renderCartBar(bump = false) {
    const n = cartCount();
    const bar = $('#cartbar');
    bar.hidden = n === 0;
    $('#open-cart').innerHTML = `<span class="count">${n}</span><span>View order</span><span class="total">${money(totals().subtotal)}</span>`;
    if (bump) { bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump'); }
  }
  $('#open-cart').addEventListener('click', () => { renderCart(); open('cart'); });

  function totalsHtml(t) {
    const row = (label, v, cls = '') => `<div class="${cls}"><dt>${label}</dt><dd>${v}</dd></div>`;
    return `<dl class="totals">
      ${row('Subtotal', money(t.subtotal))}
      ${t.discount ? row(`Promo ${esc(state.promo)}`, `−${money(t.discount)}`, 'save') : ''}
      ${state.mode === 'delivery' ? row('Delivery', t.delivery ? money(t.delivery) : 'Free') : ''}
      ${R.taxRate ? row(`Tax (${(R.taxRate * 100).toFixed(R.taxRate * 100 % 1 ? 2 : 0)}%)`, money(t.tax)) : ''}
      ${t.cover ? row(`${esc(R.cover.label)} × ${state.guests}`, money(t.cover)) : ''}
      ${state.mode !== 'dinein' && t.tip ? row('Tip', money(t.tip)) : ''}
      ${row('Total', money(t.total), 'grand')}
    </dl>${R.taxNote ? `<p class="hint">${esc(R.taxNote)}</p>` : ''}`;
  }

  function renderCart() {
    const t = totals();
    const upsell = (R.upsell || []).map((id) => items.get(id)).filter((i) => i && !i.soldOut && !qtyOf(i.id));
    const belowMin = state.mode === 'delivery' && R.minDelivery && t.subtotal < R.minDelivery;
    sheets.cart.innerHTML = `
      <div class="sheet-head"><h2 id="cart-title">Your order</h2><button class="x" type="button" data-close aria-label="Close">✕</button></div>
      <div class="sheet-body">
        ${enabledModes.length > 1 ? `<div class="seg" role="group" aria-label="Order type">${enabledModes.map((m) => `<button type="button" data-setmode="${m}" aria-pressed="${state.mode === m}">${MODES[m].label}</button>`).join('')}</div>` : ''}
        ${state.cart.length ? `<div class="lines">${state.cart.map((l) => {
          const item = items.get(l.id);
          const opts = choiceSummary(item, l.choices);
          return `<div class="line">
            <div><h4>${esc(item.name)}</h4>
              ${opts.length ? `<p class="opts">${esc(opts.join(' · '))}</p>` : ''}
              ${l.note ? `<p class="opts">“${esc(l.note)}”</p>` : ''}</div>
            <div class="row">
              <div class="stepper sm"><button type="button" data-dec="${esc(l.key)}" aria-label="One less">${l.qty === 1 ? '🗑' : '−'}</button><output>${l.qty}</output><button type="button" data-inc="${esc(l.key)}" aria-label="One more">+</button></div>
              ${item.options?.length ? `<button type="button" class="edit" data-edit="${esc(l.key)}">Edit</button>` : ''}
              <span class="price">${money(l.unit * l.qty)}</span>
            </div></div>`;
        }).join('')}</div>` : '<div class="empty"><strong>Your order is empty</strong>Add something from the menu.</div>'}
        ${upsell.length && state.cart.length ? `<div class="upsell"><h5>${esc(R.upsellTitle || 'Goes well with')}</h5><div class="upsell-row">${upsell.map((i) => `
          <button type="button" class="mini" data-up="${esc(i.id)}">${tileHtml(i)}<span><b>${esc(i.name)}</b><small>+ ${money(i.price)}</small></span></button>`).join('')}</div></div>` : ''}
        ${state.cart.length ? `
          ${state.mode === 'dinein' && R.cover && !state.rounds.length ? `<div class="field"><span class="block-title">Guests at the table</span>
            <div class="guests-row"><div class="stepper sm"><button type="button" data-guests="-1" aria-label="One guest less">−</button><output>${state.guests}</output><button type="button" data-guests="1" aria-label="One guest more">+</button></div>
            <span class="hint">${esc(R.cover.label)}: ${money(R.cover.price)} per person</span></div></div>` : ''}
          ${state.mode && state.mode !== 'dinein' && R.tips !== false ? `<div class="field"><span class="block-title">${esc(R.tipTitle || 'Tip')}</span>
            <div class="seg" role="group" aria-label="Tip">${[0, 0.1, 0.15, 0.2].map((p) => `<button type="button" data-tip="${p}" aria-pressed="${state.tip === p}">${p ? `${p * 100}%` : 'No tip'}</button>`).join('')}</div></div>` : ''}
          ${R.promos ? `<div class="field"><label class="block-title" for="promo-input">Promo code</label>
            <div class="promo"><input id="promo-input" placeholder="${esc(R.promoHint || 'Code')}" value="${esc(state.promo || '')}" autocomplete="off"><button type="button" id="promo-apply">${state.promo ? 'Remove' : 'Apply'}</button></div>
            <p class="hint" id="promo-msg">${state.promo ? `<span class="hint ok">${esc(R.promos[state.promo].label)} applied</span>` : ''}</p></div>` : ''}
          ${totalsHtml(t)}
          ${belowMin ? `<p class="hint err">Delivery minimum is ${money(R.minDelivery)}. Add ${money(R.minDelivery - t.subtotal)} more, or switch to pickup.</p>` : ''}
          ${state.mode === 'delivery' && R.freeDeliveryOver && t.subtotal < R.freeDeliveryOver && !belowMin ? `<p class="hint">Add ${money(R.freeDeliveryOver - t.subtotal)} more for free delivery.</p>` : ''}
        ` : ''}
      </div>
      <div class="sheet-foot">
        ${state.cart.length
          ? `<button type="button" class="primary" id="to-checkout" ${belowMin ? 'disabled' : ''}><span>${state.mode ? (state.mode === 'dinein' ? 'Review & send to kitchen' : 'Go to checkout') : 'Choose how you’re eating'}</span><span class="num">${money(t.total)}</span></button>`
          : '<button type="button" class="primary center" data-close>Browse the menu</button>'}
      </div>`;
  }

  sheets.cart.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-close]')) return sheets.cart.close();
    const find = (k) => state.cart.find((l) => l.key === k);
    const inc = t.closest('[data-inc]'); const dec = t.closest('[data-dec]');
    if (inc) find(inc.dataset.inc).qty++;
    if (dec) {
      const l = find(dec.dataset.dec);
      l.qty--;
      if (l.qty <= 0) state.cart = state.cart.filter((x) => x !== l);
    }
    const edit = t.closest('[data-edit]');
    if (edit) return openItem(find(edit.dataset.edit).id, edit.dataset.edit);
    const up = t.closest('[data-up]');
    if (up) {
      const item = items.get(up.dataset.up);
      if ((item.options || []).some((g) => g.required && g.type === 'multi') || item.askOptions) return openItem(item.id);
      addToCart(item, defaultChoices(item), 1, '', true);
    }
    const sm = t.closest('[data-setmode]');
    if (sm) {
      state.mode = sm.dataset.setmode;
      if (state.mode === 'dinein' && !state.table) { renderModeSheet(false); open('mode'); return; }
    }
    const tip = t.closest('[data-tip]');
    if (tip) state.tip = Number(tip.dataset.tip);
    const gu = t.closest('[data-guests]');
    if (gu) state.guests = Math.max(1, Math.min(20, state.guests + Number(gu.dataset.guests)));
    if (t.closest('#promo-apply')) {
      if (state.promo) state.promo = null;
      else {
        const code = $('#promo-input').value.trim().toUpperCase();
        if (R.promos[code]) { state.promo = code; toast(`${R.promos[code].label} applied`); } else {
          $('#promo-msg').innerHTML = '<span class="hint err">That code isn’t valid. Check the spelling and try again.</span>';
          return;
        }
      }
    }
    if (t.closest('#to-checkout')) {
      if (!state.mode) { renderModeSheet(false); open('mode'); return; }
      renderCheckout(); open('checkout'); return;
    }
    if (inc || dec || up || sm || tip || gu || t.closest('#promo-apply')) {
      save(); renderCart(); renderCartBar(); updateBadges(); renderHeader();
    }
  });

  // ---------- checkout ----------
  function timeSlots() {
    const out = [];
    const d = new Date();
    d.setMinutes(Math.ceil((d.getMinutes() + 30) / 15) * 15, 0, 0);
    for (let i = 0; i < 12; i++) {
      out.push(d.toLocaleTimeString(R.locale || 'en-US', { hour: 'numeric', minute: '2-digit' }));
      d.setMinutes(d.getMinutes() + 15);
    }
    return out;
  }

  function renderCheckout() {
    const m = state.mode;
    const c = store.get('customer', {});
    const t = totals();
    const pay = {
      dinein: [['table', 'Pay at the table'], ['counter', 'Pay at the counter']],
      pickup: [['online', 'Pay online now'], ['counter', 'Pay at pickup']],
      delivery: [['online', 'Pay online now'], ['card-door', 'Card on delivery'], ['cash', 'Cash on delivery']],
    }[m];
    sheets.checkout.innerHTML = `
      <div class="sheet-head"><h2 id="co-title">${m === 'dinein' ? 'Send to the kitchen' : MODES[m].label + ' details'}</h2><button class="x" type="button" data-close aria-label="Close">✕</button></div>
      <form class="sheet-body form" id="co-form" novalidate>
        ${m === 'dinein' ? `
          <div class="two">
            <div class="field"><label for="co-table">Table number</label><input id="co-table" name="table" required inputmode="numeric" value="${esc(state.table)}" placeholder="e.g. 12"></div>
            <div class="field"><label for="co-name">Your name <span class="opt">(optional)</span></label><input id="co-name" name="name" autocomplete="given-name" value="${esc(c.name || '')}" placeholder="So we know who ordered"></div>
          </div>
          ${R.courseTiming ? `<div class="field"><label for="co-timing">When should we bring it?</label>
            <select id="co-timing" name="timing">${R.courseTiming.map((o) => `<option>${esc(o)}</option>`).join('')}</select></div>` : ''}` : `
          <div class="two">
            <div class="field"><label for="co-name">Name</label><input id="co-name" name="name" required autocomplete="name" value="${esc(c.name || '')}" placeholder="Name for the order"></div>
            <div class="field"><label for="co-phone">Phone</label><input id="co-phone" name="phone" required type="tel" autocomplete="tel" value="${esc(c.phone || '')}" placeholder="We text you when it’s ready"></div>
          </div>
          ${m === 'delivery' ? `
            <div class="field"><label for="co-address">Delivery address</label><input id="co-address" name="address" required autocomplete="street-address" value="${esc(c.address || '')}" placeholder="Street and number"></div>
            <div class="field"><label for="co-drop">Apartment, buzzer, instructions <span class="opt">(optional)</span></label><input id="co-drop" name="drop" value="${esc(c.drop || '')}" placeholder="e.g. 3rd floor, ring twice"></div>` : ''}
          <div class="field"><label for="co-when">${m === 'delivery' ? 'Deliver' : 'Pick up'}</label>
            <select id="co-when" name="when"><option value="asap">As soon as possible (${esc(R.prepTime?.[m] || '')})</option>${timeSlots().map((s) => `<option>${s}</option>`).join('')}</select></div>`}
        <div class="field"><span class="lbl">Payment</span>
          ${pay.map(([v, l], i) => `<label class="choice"><input type="radio" name="pay" value="${v}" ${i === 0 ? 'checked' : ''}><span>${l}</span></label>`).join('')}
        </div>
        <p class="notice" id="pay-note" ${pay[0][0] === 'online' ? '' : 'hidden'}>Online payment is a placeholder in this demo. Connect a provider such as Stripe or Square to take real payments. No card is charged.</p>
        <div class="field"><label for="co-note">Note for the restaurant <span class="opt">(optional)</span></label><textarea id="co-note" name="note" maxlength="200" placeholder="${m === 'dinein' ? 'e.g. Bring the fries first' : 'e.g. Extra napkins'}"></textarea></div>
        ${totalsHtml(t)}
        <p class="hint err" id="co-err" hidden></p>
      </form>
      <div class="sheet-foot">
        <button type="button" class="ghost" data-back>Back</button>
        <button type="button" class="primary" id="co-submit"><span>${m === 'dinein' ? 'Send order' : 'Place order'}</span><span class="num">${money(t.total)}</span></button>
      </div>`;
  }

  sheets.checkout.addEventListener('change', (e) => {
    if (e.target.name === 'pay') $('#pay-note').hidden = e.target.value !== 'online';
  });
  sheets.checkout.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) return sheets.checkout.close();
    if (e.target.closest('[data-back]')) { renderCart(); return open('cart'); }
    if (!e.target.closest('#co-submit')) return;

    const form = $('#co-form');
    const bad = $$('input[required]', form).find((i) => !i.value.trim() || !i.checkValidity());
    if (bad) {
      const label = $(`label[for="${bad.id}"]`).childNodes[0].textContent.trim();
      const err = $('#co-err');
      err.hidden = false;
      err.textContent = `Please fill in “${label}” to continue.`;
      bad.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const btn = $('#co-submit');
    btn.disabled = true;
    btn.firstElementChild.textContent = 'Sending…';

    if (state.mode === 'dinein') state.table = data.table.trim();
    store.set('customer', { ...store.get('customer', {}), ...['name', 'phone', 'address', 'drop'].reduce((o, k) => (data[k] ? { ...o, [k]: data[k] } : o), {}) });

    const order = {
      restaurant: R.id,
      number: `${R.orderPrefix || ''}${Math.floor(100 + Math.random() * 900)}`,
      placedAt: new Date().toISOString(),
      mode: state.mode,
      table: state.mode === 'dinein' ? state.table : undefined,
      customer: { name: data.name || '', phone: data.phone || '', address: data.address || '', drop: data.drop || '' },
      when: data.when || 'asap',
      payment: data.pay,
      note: data.note || '',
      timing: data.timing || undefined,
      promo: state.promo,
      lines: state.cart.map((l) => {
        const item = items.get(l.id);
        return { id: l.id, name: item.name, qty: l.qty, unit: l.unit, options: choiceSummary(item, l.choices), note: l.note };
      }),
      totals: totals(),
    };

    try {
      if (R.orderEndpoint) {
        const res = await fetch(R.orderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json().catch(() => ({}));
        if (body.number) order.number = body.number;
      } else {
        await new Promise((r) => setTimeout(r, 700)); // demo mode
      }
    } catch (err) {
      btn.disabled = false;
      btn.firstElementChild.textContent = 'Try again';
      const el = $('#co-err');
      el.hidden = false;
      el.textContent = `We couldn’t reach the restaurant (${err.message}). Check your connection and try again, or call ${R.phone || 'us'}.`;
      return;
    }

    if (state.mode === 'dinein') state.rounds.push({ number: order.number, totals: order.totals });
    state.cart = [];
    state.promo = null;
    save();
    updateBadges(); renderCartBar(); renderHeader();
    showConfirmation(order);
  });

  // ---------- confirmation ----------
  let progressTimer;
  function showConfirmation(o) {
    const steps = {
      dinein: [['Sent to the kitchen', 'The kitchen has your ticket'], [R.cookingStep || 'Cooking', 'Fresh, made to order'], ['On its way to your table', `Table ${o.table}`]],
      pickup: [['Order received', 'We have your order'], [R.cookingStep || 'Cooking', 'Fresh, made to order'], ['Ready for pickup', `Ask for order #${o.number} at the counter`]],
      delivery: [['Order received', 'We have your order'], [R.cookingStep || 'Cooking', 'Fresh, made to order'], ['Out for delivery', 'Your rider is on the way'], ['Delivered', 'Enjoy!']],
    }[o.mode];
    const when = o.when === 'asap' ? (R.prepTime?.[o.mode] || '') : o.when;
    sheets.done.innerHTML = `
      <div class="sheet-head"><h2 id="done-title">${o.mode === 'dinein' ? 'Order sent!' : 'Order placed!'}</h2><button class="x" type="button" data-close aria-label="Close">✕</button></div>
      <div class="sheet-body">
        <div class="ticket">
          <div class="tl"><span>${esc(R.name.toUpperCase())}</span><span>${new Date(o.placedAt).toLocaleTimeString(R.locale || 'en-US', { hour: 'numeric', minute: '2-digit' })}</span></div>
          <div class="big">#${esc(o.number)}</div>
          <div class="tl"><span>${esc(MODES[o.mode].label.toUpperCase())}${o.table ? ` · TABLE ${esc(o.table)}` : ''}</span><span>${when ? esc(when) : ''}</span></div>
          ${o.customer.name ? `<div>${esc(o.customer.name)}</div>` : ''}
          ${o.timing ? `<div>${esc(o.timing.toUpperCase())}</div>` : ''}
          <hr>
          ${o.lines.map((l) => `<div class="tl"><span>${l.qty}× ${esc(l.name)}</span><span>${money(l.unit * l.qty)}</span></div>
            ${l.options.map((x) => `<div class="sub">${esc(x)}</div>`).join('')}${l.note ? `<div class="sub">“${esc(l.note)}”</div>` : ''}`).join('')}
          <hr>
          <div class="tl"><b>TOTAL</b><b>${money(o.totals.total)}</b></div>
        </div>
        <div><span class="block-title">Live status${R.orderEndpoint ? '' : ' (simulated in this demo)'}</span></div>
        <ol class="steps" id="steps">${steps.map(([b, s]) => `<li><span><b>${esc(b)}</b><small>${esc(s)}</small></span></li>`).join('')}</ol>
      </div>
      <div class="sheet-foot"><button type="button" class="primary center" data-close>${o.mode === 'dinein' ? 'Order something else' : 'Back to the menu'}</button></div>`;
    open('done');

    clearTimeout(progressTimer);
    let i = 0;
    const lis = $$('#steps li');
    const tick = () => {
      lis.forEach((li, j) => { li.className = j < i ? 'done' : j === i ? 'now' : ''; });
      if (i === lis.length - 1) lis[i].className = 'done';
      if (i < lis.length - 1 && !R.orderEndpoint) { i++; progressTimer = setTimeout(tick, 4000); }
    };
    tick();
  }
  sheets.done.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) sheets.done.close(); });
  sheets.done.addEventListener('close', () => clearTimeout(progressTimer));

  // ---------- public API (used by plug-ins such as a custom builder) ----------
  const api = { R, items, state, money, esc, toast, addToCart, openItem, defaultChoices, unitPrice, qtyOf, tileHtml };
  window.MenuAPI = api;

  // ---------- boot ----------
  renderHeader();
  renderMenu();
  renderCartBar();
  if (!state.mode) { renderModeSheet(true); open('mode'); }
  else if (tableFromUrl) toast(`Welcome! You’re ordering for table ${tableFromUrl}.`);
})();
