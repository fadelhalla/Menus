// "Build your bowl": a step-by-step pasta builder with a live, animated plate.
// Plugs into the menu engine through RESTAURANT.builder(host, api).
window.RESTAURANT.builder = (host, api) => {
  const { R, items, money, esc, addToCart, unitPrice } = api;
  const item = items.get('bowl');
  const G = Object.fromEntries(item.options.map((g) => [g.id, g]));
  const choices = api.defaultChoices(item);
  const find = (gid, cid) => G[gid].choices.find((c) => c.id === cid);
  const pick = (gid) => find(gid, choices[gid][0]);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => host.querySelector(s);
  const $$ = (s) => [...host.querySelectorAll(s)];

  const STEPS = [
    { id: 'shape', title: 'Pasta' },
    { id: 'sauce', title: 'Sauce' },
    { id: 'extras', title: 'Toppings' },
    { id: 'finish', title: 'Finish' },
  ];
  const MATCHES = {
    'spaghetti|cacio': 'A Roman classic',
    'spaghetti|pomodoro': 'Simple and perfect',
    'pappardelle|ragu': 'The Bologna way',
    'rigatoni|vodka': 'The new-school favorite',
    'gnocchi|burro': 'A northern classic',
    'gnocchi|pomodoro': 'Sorrento style',
    'orecchiette|aglio': 'Straight from Puglia',
    'fusilli|pesto': 'A Ligurian lunch',
  };
  let step = 0;

  // ---------- seeded randomness so toppings don't jump around ----------
  const rng = (seed) => {
    let a = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761), 1779033703);
    return () => { a = Math.imul(a ^ (a >>> 15), a | 1); a ^= a + Math.imul(a ^ (a >>> 7), a | 61); return ((a ^ (a >>> 14)) >>> 0) / 4294967296; };
  };
  const scatter = (seed, n, rMax = 62) => {
    const r = rng(seed);
    return Array.from({ length: n }, () => {
      const ang = r() * Math.PI * 2; const d = Math.sqrt(r()) * rMax;
      return [120 + Math.cos(ang) * d, 120 + Math.sin(ang) * d, r() * 360, r()];
    });
  };

  // ---------- plate art ----------
  const PIECES = [[120, 118, 10], [92, 96, -30], [148, 92, 45], [84, 140, 80], [154, 146, -60], [118, 158, 20], [120, 80, -80], [72, 112, 120], [168, 118, 160]];
  const pastaSvg = (shape) => PIECES.map(([x, y, rot]) => `
    <g transform="translate(${x} ${y}) rotate(${rot})"><g class="pop">
      <g transform="scale(.62) translate(-32 -32)" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g stroke="var(--pasta-edge)" stroke-width="7.5">${R.iconPaths[shape]}</g>
        <g stroke="var(--pasta)" stroke-width="4.5">${R.iconPaths[shape]}</g>
      </g></g></g>`).join('');

  const EXTRA_ART = {
    burrata: () => `<circle cx="138" cy="108" r="24" fill="#FBF8F0" stroke="#E5DCC6" stroke-width="2"/><path d="M126 104c4-8 18-8 22 0" fill="none" stroke="#E5DCC6" stroke-width="2"/><ellipse cx="132" cy="100" rx="7" ry="4" fill="#FFFFFF"/>`,
    guanciale: () => scatter('guanciale', 8).map(([x, y, rot]) => `<rect x="${x - 6}" y="${y - 3.5}" width="12" height="7" rx="2.5" transform="rotate(${rot} ${x} ${y})" fill="#EBA78F" stroke="#B0604A" stroke-width="1.5"/>`).join(''),
    salsiccia: () => scatter('salsiccia', 9).map(([x, y, , s]) => `<circle cx="${x}" cy="${y}" r="${4 + s * 3}" fill="#8C5133" stroke="#5E3420" stroke-width="1.2"/>`).join(''),
    pomodorini: () => scatter('pomodorini', 5, 56).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="#D23A26" stroke="#9E2516" stroke-width="1.2"/><circle cx="${x - 3}" cy="${y - 3}" r="2.4" fill="#F49A82"/>`).join(''),
    funghi: () => scatter('funghi', 6).map(([x, y, rot]) => `<path d="M${x - 8} ${y}a8 6 0 0 1 16 0z" transform="rotate(${rot} ${x} ${y})" fill="#9A6A3E" stroke="#6B4524" stroke-width="1.2"/>`).join(''),
    chili: () => scatter('chili', 12).map(([x, y, rot]) => `<rect x="${x - 3.5}" y="${y - 1.2}" width="7" height="2.4" rx="1" transform="rotate(${rot} ${x} ${y})" fill="#C3261B"/>`).join(''),
  };
  const FINISH_ART = {
    parmigiano: () => scatter('parm', 46, 70).map(([x, y, , s]) => `<circle cx="${x}" cy="${y}" r="${0.9 + s * 1.6}" fill="#FFF4CF"/>`).join(''),
    pecorino: () => scatter('peco', 46, 70).map(([x, y, , s]) => `<circle cx="${x}" cy="${y}" r="${0.9 + s * 1.6}" fill="#FAFAF2"/>`).join(''),
    pangrattato: () => scatter('crumbs', 54, 70).map(([x, y, , s]) => `<circle cx="${x}" cy="${y}" r="${0.8 + s * 1.4}" fill="#C98B3A"/>`).join(''),
    none: () => '',
  };
  const basil = `<g fill="#3F8A3A" stroke="#2C6A2A" stroke-width="1"><path d="M112 128c-6-16 4-26 18-26-2 14-8 24-18 26z"/><path d="M114 130c12-8 26-4 30 8-12 4-24 2-30-8z"/></g>`;

  // ---------- markup ----------
  host.innerHTML = `
    <div class="bld">
      <div class="bld-stage">
        <div class="bld-plate">
          <svg class="steam" viewBox="0 0 120 60" aria-hidden="true"><path d="M30 58c-8-12 8-18 0-30s8-18 0-28"/><path d="M60 58c-8-12 8-18 0-30s8-18 0-28"/><path d="M90 58c-8-12 8-18 0-30s8-18 0-28"/></svg>
          <svg class="bld-svg" viewBox="0 0 240 240" role="img" aria-labelledby="bld-summary">
            <circle cx="120" cy="120" r="116" style="fill:var(--plate);stroke:var(--ring)" stroke-width="2"/>
            <circle cx="120" cy="120" r="104" fill="none" style="stroke:var(--ring)" stroke-width="7" stroke-dasharray="1.5 9.5"/>
            <circle cx="120" cy="120" r="96" fill="none" style="stroke:var(--ring)" stroke-width="1.5"/>
            <circle cx="120" cy="120" r="88" fill="none" style="stroke:var(--line)" stroke-width="1"/>
            <g class="sauce"><circle cx="120" cy="120" r="76"/><circle cx="74" cy="104" r="20"/><circle cx="160" cy="150" r="22"/><circle cx="150" cy="80" r="16"/></g>
            <g class="pasta"></g><g class="extras"></g><g class="garnish"></g><g class="finish"></g>
          </svg>
        </div>
        <p class="bld-match" hidden></p>
        <p class="bld-summary" id="bld-summary"></p>
        <div class="bld-diet"></div>
      </div>
      <div class="bld-panel">
        <div class="bld-steps" role="tablist" aria-label="Build your bowl">
          ${STEPS.map((s, i) => `<button type="button" role="tab" class="bld-tab" data-step="${i}" id="bld-tab-${s.id}" aria-controls="bld-body"><span class="n">${i + 1}</span><span class="t">${s.title}<small data-pick="${s.id}"></small></span></button>`).join('')}
        </div>
        <div class="bld-body" id="bld-body" role="tabpanel" aria-live="polite"></div>
        <div class="bld-portion"><span class="block-title">Portion</span>
          <div class="seg" role="group" aria-label="Portion">${G.portion.choices.map((c) => `<button type="button" data-portion="${c.id}">${esc(c.name.replace(/\s*\(.*\)/, ''))}${c.price ? ` <small>${c.price > 0 ? '+' : '−'}${money(Math.abs(c.price))}</small>` : ''}</button>`).join('')}</div>
        </div>
        <div class="bld-foot">
          <button type="button" class="ghost" id="bld-surprise">Surprise me</button>
          <button type="button" class="ghost" id="bld-next"></button>
          <button type="button" class="primary" id="bld-add" data-fly=".bld-svg"><span class="lbl">Add bowl</span><span class="num bld-price"></span></button>
        </div>
      </div>
    </div>`;

  // ---------- rendering ----------
  function renderBody() {
    const g = G[STEPS[step].id];
    const multi = g.type === 'multi';
    const n = choices[g.id].length;
    $('#bld-body').innerHTML = `
      <p class="bld-q">${esc({ shape: 'Which shape today?', sauce: 'What sauce?', extras: 'Anything on top?', finish: 'How do we finish it?' }[g.id])}
        ${multi ? `<span class="hint">${n} of ${g.max} chosen</span>` : ''}</p>
      <div class="bld-chips ${g.id}">
        ${g.choices.map((c) => {
          const on = choices[g.id].includes(c.id);
          const art = c.icon ? R.icons[c.icon]
            : c.color ? `<span class="swatch" style="--sw:${c.color}"></span>`
            : EXTRA_ART[c.id] ? `<svg viewBox="50 50 140 140" aria-hidden="true">${EXTRA_ART[c.id]()}</svg>`
            : FINISH_ART[c.id] ? `<svg viewBox="70 70 100 100" aria-hidden="true"><circle cx="120" cy="120" r="48" fill="${pick('sauce').color}"/>${FINISH_ART[c.id]()}</svg>` : '';
          return `<button type="button" class="bld-chip" data-c="${c.id}" aria-pressed="${on}" ${multi && !on && n >= g.max ? 'disabled' : ''}>
            <span class="art">${art}</span>
            <span class="txt"><b>${esc(c.name)}</b><small>${esc(c.about || '')}</small></span>
            ${c.price ? `<span class="delta">+${money(c.price)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>`;
    $$('.bld-tab').forEach((t, i) => { t.setAttribute('aria-selected', i === step); t.classList.toggle('done', i < step); });
    const next = $('#bld-next');
    next.hidden = step === STEPS.length - 1;
    if (!next.hidden) next.textContent = `Next: ${STEPS[step + 1].title} →`;
  }

  let prevShape = null; let prevExtras = new Set(); let prevFinish = null; let shownPrice = null;
  function renderPlate() {
    const shape = pick('shape').id; const sauce = pick('sauce'); const finish = pick('finish').id;
    $('.sauce').style.fill = sauce.color;
    if (shape !== prevShape) {
      $('.pasta').innerHTML = pastaSvg(shape);
      if (prevShape && !reduce) $$('.pasta .pop').forEach((el, i) => el.animate([{ transform: 'scale(0) rotate(-40deg)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 480, delay: i * 35, easing: 'cubic-bezier(.3,1.4,.6,1)', fill: 'backwards' }));
      prevShape = shape;
    }
    const ex = choices.extras;
    $('.extras').innerHTML = ex.map((id) => `<g class="drop" data-x="${id}">${EXTRA_ART[id]()}</g>`).join('');
    if (!reduce) ex.filter((id) => !prevExtras.has(id)).forEach((id) => $(`.extras [data-x="${id}"]`).animate([{ transform: 'translateY(-46px)', opacity: 0 }, { transform: 'translateY(4px)', opacity: 1, offset: 0.7 }, { transform: 'none' }], { duration: 520, easing: 'ease-out' }));
    prevExtras = new Set(ex);
    $('.garnish').innerHTML = ['pomodoro', 'pesto'].includes(sauce.id) ? basil : '';
    if (finish !== prevFinish) {
      $('.finish').innerHTML = FINISH_ART[finish]();
      if (prevFinish && !reduce) $('.finish').animate([{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'ease-out' });
      prevFinish = finish;
    }
  }

  function renderInfo() {
    const shape = pick('shape'); const sauce = pick('sauce'); const finish = pick('finish');
    const ex = choices.extras.map((id) => find('extras', id).name);
    $('#bld-summary').textContent = [shape.name, sauce.name, ...ex, finish.id === 'none' ? null : finish.name].filter(Boolean).join(' · ');
    $$('[data-pick]').forEach((el) => { const id = el.dataset.pick; el.textContent = id === 'extras' ? (choices.extras.length ? `${choices.extras.length} added` : 'None') : pick(id).name.split(' ')[0]; });

    const m = MATCHES[`${shape.id}|${sauce.id}`];
    const badge = $('.bld-match');
    const was = badge.hidden ? null : badge.textContent;
    badge.hidden = !m;
    if (m) {
      badge.textContent = `Chef’s match: ${m}`;
      if (was !== badge.textContent && !reduce) badge.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.06)' }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'ease-out' });
    }

    const meat = choices.extras.some((id) => ['guanciale', 'salsiccia'].includes(id)) || sauce.id === 'ragu';
    const dairy = choices.extras.includes('burrata') || ['parmigiano', 'pecorino'].includes(finish.id);
    const diet = [];
    if (sauce.vegan && !meat && !dairy && shape.id === 'fusilli') diet.push('Vegan');
    else if (!meat) diet.push('Vegetarian');
    if (shape.gf) diet.push('Gluten-free');
    if (choices.extras.includes('chili') || sauce.id === 'aglio') diet.push('Piccante');
    $('.bld-diet').innerHTML = diet.map((d) => `<span class="tag ${d === 'Piccante' ? 'spicy' : 'veg'}">${d}</span>`).join('');

    $$('[data-portion]').forEach((b) => b.setAttribute('aria-pressed', choices.portion[0] === b.dataset.portion));
    tweenPrice(unitPrice(item, choices));
  }

  function tweenPrice(to) {
    const el = $('.bld-price');
    const from = shownPrice ?? to;
    shownPrice = to;
    if (reduce || from === to) { el.textContent = money(to); return; }
    const t0 = performance.now();
    const frame = (t) => {
      const k = Math.min(1, (t - t0) / 350);
      el.textContent = money(from + (to - from) * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const renderAll = () => { renderBody(); renderPlate(); renderInfo(); };

  // ---------- interaction ----------
  host.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-step]');
    if (tab) { step = Number(tab.dataset.step); renderBody(); return; }
    const chip = e.target.closest('[data-c]');
    if (chip && !chip.disabled) {
      const g = G[STEPS[step].id];
      const id = chip.dataset.c;
      if (g.type === 'single') choices[g.id] = [id];
      else choices[g.id] = choices[g.id].includes(id) ? choices[g.id].filter((x) => x !== id) : [...choices[g.id], id];
      renderAll();
      $(`[data-c="${id}"]`)?.focus();
      return;
    }
    const por = e.target.closest('[data-portion]');
    if (por) { choices.portion = [por.dataset.portion]; renderInfo(); return; }
    if (e.target.closest('#bld-next')) { step = Math.min(STEPS.length - 1, step + 1); renderBody(); $(`#bld-tab-${STEPS[step].id}`).focus(); return; }
    if (e.target.closest('#bld-surprise')) {
      const keys = Object.keys(MATCHES);
      const [shape, sauce] = keys[Math.floor(Math.random() * keys.length)].split('|');
      const pool = G.extras.choices.map((c) => c.id).sort(() => Math.random() - 0.5);
      choices.shape = [shape]; choices.sauce = [sauce];
      choices.extras = pool.slice(0, Math.floor(Math.random() * 3));
      choices.finish = [sauce === 'aglio' ? 'pangrattato' : ['parmigiano', 'pecorino'][Math.floor(Math.random() * 2)]];
      renderAll();
      if (!reduce) $('.bld-svg').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 700, easing: 'cubic-bezier(.5,0,.3,1)' });
      return;
    }
    if (e.target.closest('#bld-add')) {
      addToCart(item, structuredClone(choices), 1, '', true, $('.bld-svg'));
      api.toast(`Added your ${pick('shape').name.toLowerCase()} bowl`);
      const lbl = $('#bld-add .lbl');
      lbl.textContent = 'Added ✓ Add another?';
      setTimeout(() => { lbl.textContent = 'Add bowl'; }, 1800);
    }
  });

  // Gentle parallax on the plate for mouse users.
  const plate = $('.bld-plate');
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    plate.addEventListener('pointermove', (e) => {
      const r = plate.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5; const y = (e.clientY - r.top) / r.height - 0.5;
      plate.style.transform = `perspective(700px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`;
    });
    plate.addEventListener('pointerleave', () => { plate.style.transform = ''; });
  }

  renderAll();
};
