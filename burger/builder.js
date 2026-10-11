// "Build your burger": pick each layer and watch the burger stack up.
// Plugs into the menu engine through RESTAURANT.builder(host, api).
window.RESTAURANT.builder = (host, api) => {
  const { money, esc, addToCart, unitPrice } = api;
  const item = api.items.get('custom');
  const G = Object.fromEntries(item.options.map((g) => [g.id, g]));
  const choices = api.defaultChoices(item);
  const pick = (gid) => G[gid].choices.find((c) => c.id === choices[gid][0]);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => host.querySelector(s);
  const $$ = (s) => [...host.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';

  const STEPS = [
    { id: 'bun', title: 'Bun', q: 'Pick your bun' },
    { id: 'patty', title: 'Patty', q: 'What goes inside?' },
    { id: 'cheese', title: 'Cheese', q: 'Which cheese?' },
    { id: 'toppings', title: 'Toppings', q: 'Add your toppings' },
    { id: 'sauce', title: 'Sauce', q: 'And the sauce?' },
  ];
  let step = 0;

  // ---------- layer drawings (side view, 300 wide, each drawn from y = 0 down) ----------
  const BUN = { sesame: ['#E9A84C', '#C9822C'], classic: ['#EDB560', '#C98E3A'], brioche: ['#D9822B', '#A95E17'], gf: ['#E8CB8C', '#BF9F5E'] };
  const segs = (x0, x1, amp, n) => {
    const w = (x1 - x0) / n;
    let d = '';
    for (let i = 0; i < n; i++) d += ` q${w / 2} ${i % 2 ? amp : -amp} ${w} 0`;
    return d;
  };
  const wave = (x0, x1, y, amp, n) => `M${x0} ${y}${segs(x0, x1, amp, n)}`;
  const leaf = (y, h) => `<path d="M28 ${y + 3}${segs(28, 272, 5, 12)} L270 ${y + h}${segs(270, 30, 3, 10)} Z" fill="#8BC34A" stroke="#5E8F2A" stroke-width="2" stroke-linejoin="round"/>`;
  const L = {
    bunTop: (b) => b === 'lettuce'
      ? { h: 26, svg: `<path d="M34 26C40 4 90 0 150 0s110 4 116 26z" fill="#8BC34A" stroke="#5E8F2A" stroke-width="2.5"/><path d="M70 22c10-10 30-14 40-6M150 4v20M190 16c10-8 30-6 40 6" fill="none" stroke="#5E8F2A" stroke-width="2"/>` }
      : { h: 76, svg: `<path d="M34 72C34 22 88 0 150 0s116 22 116 72z" fill="${BUN[b][0]}" stroke="${BUN[b][1]}" stroke-width="2.5"/><path d="M60 44c8-18 30-30 52-32" fill="none" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="7" stroke-linecap="round"/><rect x="34" y="64" width="232" height="12" rx="4" fill="${BUN[b][1]}"/>${b === 'sesame' ? [[96, 26, -20], [130, 16, 10], [168, 18, -8], [204, 30, 25], [116, 40, 30], [150, 34, -15], [186, 46, 5], [82, 50, 15], [222, 52, -25]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" transform="rotate(${r} ${x} ${y})" fill="#FFF6DD"/>`).join('') : ''}` },
    bunBottom: (b) => b === 'lettuce'
      ? { h: 18, svg: `<path d="M34 0h232c-6 14-50 18-116 18S40 14 34 0z" fill="#8BC34A" stroke="#5E8F2A" stroke-width="2.5"/>` }
      : { h: 30, svg: `<rect x="36" y="0" width="228" height="30" rx="12" fill="${BUN[b][0]}" stroke="${BUN[b][1]}" stroke-width="2.5"/><rect x="40" y="2" width="220" height="7" rx="3.5" fill="#FBE3B6"/>` },
    patty: (p) => ({
      beef: { h: 26, svg: `<rect x="30" y="0" width="240" height="26" rx="13" fill="#6B3A22" stroke="#3F2112" stroke-width="2.5"/>${[56, 92, 130, 170, 208, 242].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 8 : 15}" r="3" fill="#4A2715"/>`).join('')}` },
      double: { h: 26, svg: `<rect x="30" y="0" width="240" height="26" rx="13" fill="#6B3A22" stroke="#3F2112" stroke-width="2.5"/>${[62, 104, 148, 190, 236].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 9 : 16}" r="3" fill="#4A2715"/>`).join('')}` },
      chicken: { h: 30, svg: `<path d="M32 15c0-9 6-15 18-15h200c12 0 18 6 18 15s-6 15-18 15H50c-12 0-18-6-18-15z" fill="#D9993A" stroke="#A86A1C" stroke-width="2.5"/>${[50, 78, 108, 140, 172, 204, 236].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 9 : 19}" r="4" fill="#E9B65C"/>`).join('')}` },
      veggie: { h: 24, svg: `<rect x="32" y="0" width="236" height="24" rx="12" fill="#7A8F3C" stroke="#55682A" stroke-width="2.5"/>${[60, 98, 140, 182, 224].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? 8 : 15}" r="3.5" fill="#C9A13B"/>`).join('')}` },
      halloumi: { h: 20, svg: `<rect x="40" y="0" width="220" height="20" rx="6" fill="#F3E7C4" stroke="#C8B07A" stroke-width="2.5"/>${[70, 110, 150, 190, 230].map((x) => `<path d="M${x - 12} 17l18-14" stroke="#9C6A2E" stroke-width="3.5" stroke-linecap="round"/>`).join('')}` },
    })[p],
    cheese: (c) => {
      const col = { cheddar: '#F5B731', swiss: '#F4E3A1', pepperjack: '#F2D27A', vegan: '#F0C96B' }[c];
      const extra = c === 'swiss' ? '<circle cx="90" cy="4" r="2.5" fill="#D8C27A"/><circle cx="190" cy="5" r="2" fill="#D8C27A"/>' : c === 'pepperjack' ? '<circle cx="80" cy="4" r="1.6" fill="#D2402E"/><circle cx="150" cy="5" r="1.6" fill="#3E8E3E"/><circle cx="215" cy="4" r="1.6" fill="#D2402E"/>' : '';
      return { h: 9, svg: `<path d="M26 0h248v9h-22l-9 14-9-14h-70l-8 11-8-11H90l-10 17-10-17H26z" fill="${col}" stroke="#D99A1E" stroke-width="1.5" stroke-linejoin="round"/>${extra}` };
    },
    lettuce: () => ({ h: 13, svg: leaf(0, 13) }),
    tomato: () => ({ h: 11, svg: [[44, 104], [156, 104]].map(([x, w]) => `<rect x="${x}" y="0" width="${w}" height="11" rx="5.5" fill="#E53935" stroke="#B71C1C" stroke-width="2"/><rect x="${x + 8}" y="3" width="${w - 16}" height="4" rx="2" fill="#F48A80"/>`).join('') }),
    onion: () => ({ h: 8, svg: [70, 130, 190, 236].map((x) => `<ellipse cx="${x}" cy="4" rx="28" ry="4" fill="none" stroke="#C7A2DF" stroke-width="3"/>`).join('') }),
    pickles: () => ({ h: 9, svg: [66, 118, 170, 222].map((x) => `<ellipse cx="${x}" cy="4.5" rx="24" ry="4.5" fill="#7CB342" stroke="#4E7A22" stroke-width="2"/>`).join('') }),
    bacon: () => ({ h: 10, svg: `<path d="${wave(34, 266, 5, 4, 10)}" fill="none" stroke="#A63D32" stroke-width="8" stroke-linecap="round"/><path d="${wave(34, 266, 5, 4, 10)}" fill="none" stroke="#F0A69A" stroke-width="2.5" stroke-linecap="round"/>` }),
    egg: () => ({ h: 14, svg: `<path d="M38 8c0-6 40-8 112-8s112 2 112 8-40 6-112 6-112 0-112-6z" fill="#FFFFFF" stroke="#E0D6C2" stroke-width="2"/><ellipse cx="160" cy="5" rx="20" ry="6" fill="#F9A825" stroke="#E08A00" stroke-width="1.5"/>` }),
    avocado: () => ({ h: 10, svg: [80, 150, 220].map((x) => `<path d="M${x - 32} 0h64c0 6-14 10-32 10s-32-4-32-10z" fill="#AED581" stroke="#5E8F2A" stroke-width="2"/>`).join('') }),
    jalapeno: () => ({ h: 8, svg: [62, 100, 138, 176, 214, 246].map((x) => `<ellipse cx="${x}" cy="4" rx="11" ry="3.5" fill="#C5E1A5" stroke="#3E8E3E" stroke-width="2.5"/>`).join('') }),
    caramelized: () => ({ h: 8, svg: `<path d="${wave(40, 260, 3, 3, 14)}" fill="none" stroke="#9C5A24" stroke-width="3.5" stroke-linecap="round"/><path d="${wave(50, 250, 6, 3, 12)}" fill="none" stroke="#B9732F" stroke-width="3" stroke-linecap="round"/>` }),
    sauce: (s) => ({ h: 5, svg: `<path d="M40 0h220v4c-10 0-12 7-18 7s-6-7-16-7H130c-8 0-8 6-14 6s-8-6-16-6H40z" fill="${{ house: '#F0A35E', ketchup: '#D32F2F', mayo: '#FFF1CF', bbq: '#6D2E1A', spicy: '#F06A3B' }[s]}"/>` }),
  };

  // Layers from bottom to top.
  function stack() {
    const bun = pick('bun').id; const patty = pick('patty').id; const cheese = pick('cheese').id; const sauce = pick('sauce').id;
    const out = [['bun-bottom', L.bunBottom(bun), bun]];
    if (sauce !== 'none') out.push(['sauce', L.sauce(sauce), sauce]);
    out.push(['patty-1', L.patty(patty), patty]);
    if (cheese !== 'none') out.push(['cheese-1', L.cheese(cheese), cheese]);
    if (patty === 'double') {
      out.push(['patty-2', L.patty('double'), 'double']);
      if (cheese !== 'none') out.push(['cheese-2', L.cheese(cheese), cheese]);
    }
    G.toppings.choices.forEach((c) => { if (choices.toppings.includes(c.id)) out.push([`top-${c.id}`, L[c.id](), c.id]); });
    out.push(['bun-top', L.bunTop(bun), bun]);
    return out;
  }

  // ---------- markup ----------
  host.innerHTML = `
    <div class="bb">
      <div class="bb-stage">
        <svg class="bb-svg" viewBox="0 72 300 288" role="img" aria-labelledby="bb-summary">
          <ellipse cx="150" cy="346" rx="128" ry="10" class="bb-shadow"/>
          <g class="bb-layers"></g>
        </svg>
        <p class="bb-summary" id="bb-summary"></p>
      </div>
      <div class="bb-panel">
        <div class="bb-steps" role="tablist" aria-label="Build your burger">
          ${STEPS.map((s, i) => `<button type="button" role="tab" class="bb-tab" data-step="${i}" id="bb-tab-${s.id}"><span class="n">${i + 1}</span><span class="t">${s.title}</span></button>`).join('')}
        </div>
        <div class="bb-body" role="tabpanel" aria-live="polite"></div>
        <div class="bb-meal"><span class="block-title">${esc(G.meal.name)}</span>
          <div class="seg" role="group" aria-label="${esc(G.meal.name)}">${G.meal.choices.map((c) => `<button type="button" data-meal="${c.id}">${esc(c.name.replace(/^With /, ''))}${c.price ? ` <small>+${money(c.price)}</small>` : ''}</button>`).join('')}</div>
        </div>
        <div class="bb-foot">
          <button type="button" class="ghost" id="bb-back">←</button>
          <button type="button" class="ghost" id="bb-next"></button>
          <button type="button" class="primary" id="bb-add" data-fly=".bb-svg"><span class="lbl">Add to order</span><span class="num bb-price"></span></button>
        </div>
      </div>
    </div>`;

  // ---------- rendering ----------
  const miniFor = (gid, c) => {
    let layers;
    if (gid === 'bun') layers = [L.bunTop(c.id), L.bunBottom(c.id)];
    else if (gid === 'patty') layers = c.id === 'double' ? [L.patty('double'), L.patty('double')] : [L.patty(c.id)];
    else if (c.id === 'none') return '<span class="bb-none">—</span>';
    else layers = [gid === 'cheese' ? L.cheese(c.id) : gid === 'sauce' ? L.sauce(c.id) : L[c.id]()];
    let y = 0;
    const g = layers.map((l) => { const s = `<g transform="translate(0 ${y})">${l.svg}</g>`; y += l.h + 2; return s; }).join('');
    const pad = Math.max(0, (60 - y) / 2);
    return `<svg viewBox="20 ${-pad - 6} 260 ${y + pad * 2 + 18}" aria-hidden="true">${g}</svg>`;
  };

  function renderBody() {
    const s = STEPS[step]; const g = G[s.id];
    const multi = g.type === 'multi'; const n = choices[g.id].length;
    $('.bb-body').innerHTML = `
      <p class="bb-q">${esc(s.q)}${multi ? ` <span class="hint">${n} of ${g.max}</span>` : ''}</p>
      <div class="bb-chips">${g.choices.map((c) => {
        const on = choices[g.id].includes(c.id);
        return `<button type="button" class="bb-chip" data-c="${c.id}" aria-pressed="${on}" ${multi && !on && n >= g.max ? 'disabled' : ''}>
          <span class="art">${miniFor(g.id, c)}</span><b>${esc(c.name)}</b>${c.price ? `<small>+${money(c.price)}</small>` : ''}</button>`;
      }).join('')}</div>`;
    $$('.bb-tab').forEach((t, i) => { t.setAttribute('aria-selected', i === step); t.classList.toggle('done', i < step); });
    $('#bb-back').hidden = step === 0;
    const next = $('#bb-next');
    next.hidden = step === STEPS.length - 1;
    if (!next.hidden) next.textContent = `Next: ${STEPS[step + 1].title} →`;
  }

  const layerEls = new Map(); // key -> { el, variant }
  let first = true;
  function renderBurger() {
    const list = stack();
    const root = $('.bb-layers');
    let y = 340; // the stack sits on the board and grows upward
    const keep = new Set(list.map(([k]) => k));
    // remove layers that are gone: they lift off and fade
    layerEls.forEach((v, k) => {
      if (keep.has(k)) return;
      layerEls.delete(k);
      if (reduce) { v.el.remove(); return; }
      v.inner.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(0, -40px) rotate(-4deg)', opacity: 0 }], { duration: 260, easing: 'ease-in' }).finished.then(() => v.el.remove());
    });
    let i = 0;
    for (const [k, l, variant] of list) {
      y -= l.h - 2;
      let v = layerEls.get(k);
      const isNew = !v;
      if (isNew) {
        const el = document.createElementNS(NS, 'g');
        el.setAttribute('class', 'bb-layer');
        const inner = document.createElementNS(NS, 'g');
        el.append(inner);
        v = { el, inner, variant: null };
        layerEls.set(k, v);
      }
      if (v.variant !== variant) { v.inner.innerHTML = l.svg; v.variant = variant; }
      v.el.style.transform = `translate(0px, ${y}px)`;
      root.append(v.el); // keep paint order bottom → top
      if (isNew && !reduce) {
        v.el.style.transition = 'none';
        requestAnimationFrame(() => { v.el.style.transition = ''; });
        v.inner.animate(
          [{ transform: 'translate(0, -150px)', opacity: 0 }, { transform: 'translate(0, 6px)', opacity: 1, offset: 0.7 }, { transform: 'none' }],
          { duration: first ? 520 : 460, delay: first ? i * 90 : 0, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'backwards' },
        );
      }
      i++;
    }
    first = false;
  }

  let shown = null;
  function renderInfo() {
    const parts = [pick('bun').name, pick('patty').name, pick('cheese').id === 'none' ? null : pick('cheese').name,
      ...choices.toppings.map((id) => G.toppings.choices.find((c) => c.id === id).name), pick('sauce').id === 'none' ? null : pick('sauce').name];
    $('#bb-summary').textContent = parts.filter(Boolean).join(' · ');
    $$('[data-meal]').forEach((b) => b.setAttribute('aria-pressed', choices.meal[0] === b.dataset.meal));
    const to = unitPrice(item, choices); const from = shown ?? to; shown = to;
    const el = $('.bb-price');
    if (reduce || from === to) { el.textContent = money(to); return; }
    const t0 = performance.now();
    const frame = (t) => { const k = Math.min(1, (t - t0) / 320); el.textContent = money(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }
  const renderAll = () => { renderBody(); renderBurger(); renderInfo(); };

  // ---------- interaction ----------
  host.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-step]');
    if (tab) { step = Number(tab.dataset.step); renderBody(); return; }
    const chip = e.target.closest('[data-c]');
    if (chip && !chip.disabled) {
      const g = G[STEPS[step].id]; const id = chip.dataset.c;
      if (g.type === 'single') choices[g.id] = [id];
      else choices[g.id] = choices[g.id].includes(id) ? choices[g.id].filter((x) => x !== id) : [...choices[g.id], id];
      renderAll();
      $(`[data-c="${id}"]`)?.focus();
      return;
    }
    const meal = e.target.closest('[data-meal]');
    if (meal) { choices.meal = [meal.dataset.meal]; renderInfo(); return; }
    if (e.target.closest('#bb-next')) { step = Math.min(STEPS.length - 1, step + 1); renderBody(); return; }
    if (e.target.closest('#bb-back')) { step = Math.max(0, step - 1); renderBody(); return; }
    if (e.target.closest('#bb-add')) {
      addToCart(item, structuredClone(choices), 1, '', true, $('.bb-svg'));
      api.toast('Your burger is in the order');
      const lbl = $('#bb-add .lbl');
      lbl.textContent = 'Added ✓';
      setTimeout(() => { lbl.textContent = 'Add to order'; }, 1600);
    }
  });

  // Pin the burger just below the sticky menu bar on phones.
  const setTop = () => host.style.setProperty('--bb-top', `${document.querySelector('.nav')?.offsetHeight || 150}px`);
  setTop();
  addEventListener('resize', setTop, { passive: true });

  renderAll();
};
