// Hero illustration: a majolica plate where a nest of spaghetti draws itself,
// circled by slowly orbiting pasta shapes.
(() => {
  const R = window.RESTAURANT;
  const C = 160;
  const strand = (phase, wobble) => {
    let d = '';
    for (let i = 0; i <= 150; i++) {
      const t = (i / 34) * Math.PI * 2 + phase;
      const r = 5 + i * 0.42 + Math.sin(t * 3 + phase) * wobble;
      d += `${i ? 'L' : 'M'}${(C + Math.cos(t) * r).toFixed(1)} ${(C + Math.sin(t) * r * 0.92).toFixed(1)}`;
    }
    return `<path d="${d}" pathLength="1" stroke-dasharray="1"/>`;
  };
  const ring = ['rigatoni', 'orecchiette', 'pappardelle', 'gnocchi', 'ravioli', 'fusilli', 'tortellini', 'bucatini'];
  const orbit = ring.map((k, i) => {
    const a = (i / ring.length) * Math.PI * 2;
    const x = C + Math.cos(a) * 146; const y = C + Math.sin(a) * 146;
    return `<g transform="translate(${(x - 17).toFixed(1)} ${(y - 17).toFixed(1)}) rotate(${(a * 180 / Math.PI + 90).toFixed(0)} 17 17)"><g transform="scale(.53)" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${R.iconPaths[k]}</g></g>`;
  }).join('');

  R.heroArt = `
    <svg class="hplate" viewBox="-10 -10 340 340">
      <g class="orbit">${orbit}</g>
      <circle cx="${C}" cy="${C}" r="112" style="fill:var(--plate)"/>
      <circle cx="${C}" cy="${C}" r="102" fill="none" style="stroke:var(--brand)" stroke-width="8" stroke-dasharray="1.5 10.5"/>
      <circle cx="${C}" cy="${C}" r="93" fill="none" style="stroke:var(--brand)" stroke-width="1.5"/>
      <g class="twirl" fill="none" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round">
        ${strand(0, 2.5)}${strand(2.1, 3.2)}${strand(4.2, 2)}
      </g>
      <g transform="translate(176 120) rotate(30)" fill="#3F8A3A"><path d="M0 0c-6-14 4-22 16-22-2 12-7 20-16 22z"/></g>
    </svg>`;
})();
