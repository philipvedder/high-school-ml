// Station 1 – a single neuron: weights, bias, activation, decision line.
import { stationShell, slider, select, button, row, card, missions, explain } from '../lib/ui.js';
import { Plot2D } from '../lib/plot2d.js';
import { classColor, BLUE, ORANGE } from '../lib/colormap.js';
import { h, makeRng, sigmoid, fmt, fitCanvas, clamp } from '../lib/util.js';
import { makeDataset } from '../lib/datasets.js';
import { t, onLangChange } from '../i18n.js';

const ACT = {
  step: (z) => (z > 0 ? 1 : 0),
  sigmoid: (z) => sigmoid(z),
  tanh: (z) => Math.tanh(z),
  relu: (z) => Math.max(0, z),
};
const ACT_SYMBOL = { step: 'step', sigmoid: 'σ', tanh: 'tanh', relu: 'ReLU' };
const toUnit = (act, a) => (act === 'tanh' ? (a + 1) / 2 : act === 'relu' ? clamp(a, 0, 1) : a);

function separable(seed) {
  const rng = makeRng(seed);
  const ang = rng.range(0, Math.PI * 2), off = rng.range(-0.5, 0.5);
  const nx = Math.cos(ang), ny = Math.sin(ang);
  const pts = [];
  while (pts.length < 40) {
    const x = rng.range(-2, 2), y = rng.range(-2, 2);
    const d = nx * x + ny * y - off;
    if (Math.abs(d) < 0.3) continue;
    pts.push({ x, y, c: d > 0 ? 1 : 0 });
  }
  return pts;
}

export function create() {
  const { root, viz, panel } = stationShell(1, 'neuron');
  const S = { w1: 1.2, w2: -0.6, b: 0.3, act: 'sigmoid', dataset: 'separable', seed: 3, probe: null };
  let data = separable(S.seed);

  viz.classList.add('split');
  viz.innerHTML = `
    <div class="plot-box"><canvas class="plot"></canvas><div class="plot-badge acc"></div>
      <div class="legend"><span><i style="background:${ORANGE}"></i><span data-i18n="neuron.classA"></span></span><span><i style="background:${BLUE}"></i><span data-i18n="neuron.classB"></span></span></div>
    </div>
    <div class="side">
      <div class="card diagram-card">
        <svg viewBox="0 0 380 210" class="neuron-svg">
          <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#9aa4c7"/></marker></defs>
          <line class="e1" x1="58" y1="50" x2="172" y2="100"/>
          <line class="e2" x1="58" y1="160" x2="172" y2="100"/>
          <line x1="190" y1="182" x2="190" y2="122" stroke="#9aa4c7" stroke-width="2" marker-end="url(#arr)"/>
          <line x1="212" y1="100" x2="248" y2="100" stroke="#9aa4c7" stroke-width="2" marker-end="url(#arr)"/>
          <line x1="312" y1="100" x2="330" y2="100" stroke="#9aa4c7" stroke-width="2" marker-end="url(#arr)"/>
          <circle cx="40" cy="50" r="22" class="node"/><text x="40" y="46" class="nl">x₁</text><text x="40" y="62" class="nv v-x1"></text>
          <circle cx="40" cy="160" r="22" class="node"/><text x="40" y="156" class="nl">x₂</text><text x="40" y="172" class="nv v-x2"></text>
          <text x="110" y="62" class="wl l-w1"></text>
          <text x="110" y="150" class="wl l-w2"></text>
          <text x="190" y="200" class="wl l-b"></text>
          <circle cx="190" cy="100" r="22" class="node sum"/><text x="190" y="96" class="nl">Σ</text><text x="190" y="112" class="nv v-z"></text>
          <rect x="250" y="76" width="60" height="48" rx="10" class="node"/><path class="act-icon" fill="none" stroke="#e6e9f5" stroke-width="2"/>
          <circle cx="352" cy="100" r="22" class="node out"/><text x="352" y="96" class="nl">ŷ</text><text x="352" y="112" class="nv v-y"></text>
        </svg>
        <div class="calc"></div>
      </div>
      <div class="card act-card"><canvas class="act-plot"></canvas></div>
    </div>`;
  const canvas = viz.querySelector('canvas.plot');
  const plot = new Plot2D(canvas, [-2.2, 2.2, -2.2, 2.2]);
  const actCanvas = viz.querySelector('canvas.act-plot');
  const svg = viz.querySelector('svg');
  const calc = viz.querySelector('.calc');
  const accBadge = viz.querySelector('.acc');

  // ---- controls ----
  const sw1 = slider({ label: { raw: 'w₁' }, min: -5, max: 5, step: 0.05, value: S.w1, onInput: (v) => { S.w1 = v; update(true); } });
  const sw2 = slider({ label: { raw: 'w₂' }, min: -5, max: 5, step: 0.05, value: S.w2, onInput: (v) => { S.w2 = v; update(true); } });
  const sb = slider({ label: { raw: 'b (bias)' }, min: -5, max: 5, step: 0.05, value: S.b, onInput: (v) => { S.b = v; update(true); } });
  const sact = select({
    label: 'neuron.activation',
    options: [{ value: 'step', label: 'neuron.act.step' }, { value: 'sigmoid', label: { raw: 'Sigmoid σ(z)' } }, { value: 'tanh', label: { raw: 'tanh(z)' } }, { value: 'relu', label: { raw: 'ReLU(z)' } }],
    value: S.act,
    onChange: (v) => { S.act = v; update(); },
  });
  const sdata = select({
    label: 'common.dataset',
    options: [{ value: 'separable', label: 'neuron.ds.separable' }, { value: 'xor', label: { raw: 'XOR' } }],
    value: S.dataset,
    onChange: (v) => { S.dataset = v; newData(); },
  });
  const randomBtn = button('neuron.random', () => {
    const r = makeRng(Date.now() % 1e6);
    setWeights(r.range(-3, 3), r.range(-3, 3), r.range(-2, 2));
  });
  const newDataBtn = button('common.newData', () => { S.seed++; newData(); });
  const learnBtn = button('neuron.learn', () => autoLearn(), 'primary');

  panel.appendChild(card('neuron.weights', sw1, sw2, sb, row(randomBtn)));
  panel.appendChild(card(null, sact, sdata, row(newDataBtn)));
  panel.appendChild(card(null, row(learnBtn)));
  const M = missions(['neuron.m1', 'neuron.m2', 'neuron.m3'], 'neuron');
  panel.appendChild(M.el);
  panel.appendChild(explain('neuron.explain'));

  function newData() {
    data = S.dataset === 'xor' ? makeDataset('xor', { n: 40, noise: 0, seed: S.seed }) : separable(S.seed);
    S.probe = null;
    update();
  }

  function setWeights(w1, w2, b) {
    S.w1 = w1; S.w2 = w2; S.b = b;
    sw1.value = w1; sw2.value = w2; sb.value = b;
    update();
  }

  let learning = null;
  function autoLearn() {
    M.complete('neuron.m3');
    cancelAnimationFrame(learning);
    let k = 0;
    const stepFn = () => {
      let g1 = 0, g2 = 0, gb = 0;
      for (const d of data) {
        const r = sigmoid(S.w1 * d.x + S.w2 * d.y + S.b) - d.c;
        g1 += r * d.x; g2 += r * d.y; gb += r;
      }
      const n = data.length, lr = 0.8;
      setWeights(clamp(S.w1 - (lr * g1) / n, -5, 5), clamp(S.w2 - (lr * g2) / n, -5, 5), clamp(S.b - (lr * gb) / n, -5, 5));
      if (++k < 160) learning = requestAnimationFrame(stepFn);
    };
    stepFn();
  }

  const out = (x, y) => ACT[S.act](S.w1 * x + S.w2 * y + S.b);

  function drawField() {
    const n = 90;
    const [x0, x1, y0, y1] = plot.domain;
    const vals = new Float64Array(n * n);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) vals[j * n + i] = toUnit(S.act, out(x0 + ((x1 - x0) * i) / (n - 1), y0 + ((y1 - y0) * j) / (n - 1)));
    plot.setField(vals, n, n, classColor);
  }

  plot.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'x₁', yLabel: 'x₂' });
    // decision line w1 x + w2 y + b = 0
    const [x0, x1, y0, y1] = p.domain;
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    if (Math.abs(S.w2) > 1e-6) {
      const a = p.toPx(x0, -(S.w1 * x0 + S.b) / S.w2), b = p.toPx(x1, -(S.w1 * x1 + S.b) / S.w2);
      ctx.moveTo(...a); ctx.lineTo(...b);
    } else if (Math.abs(S.w1) > 1e-6) {
      const xv = -S.b / S.w1;
      ctx.moveTo(...p.toPx(xv, y0)); ctx.lineTo(...p.toPx(xv, y1));
    }
    ctx.stroke();
    ctx.restore();
    for (const d of data) {
      const [px, py] = p.toPx(d.x, d.y);
      const pred = S.w1 * d.x + S.w2 * d.y + S.b > 0 ? 1 : 0;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, 7);
      ctx.fillStyle = d.c ? ORANGE : BLUE;
      ctx.fill();
      ctx.lineWidth = pred === d.c ? 2 : 3;
      ctx.strokeStyle = pred === d.c ? '#fff' : '#ff2d55';
      ctx.stroke();
      if (pred !== d.c) {
        ctx.strokeStyle = '#ff2d55';
        ctx.beginPath(); ctx.moveTo(px - 4, py - 4); ctx.lineTo(px + 4, py + 4); ctx.moveTo(px + 4, py - 4); ctx.lineTo(px - 4, py + 4); ctx.stroke();
      }
    }
    const pr = probe();
    const [qx, qy] = p.toPx(pr.x, pr.y);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(qx, qy, 12, 0, 7); ctx.stroke();
  };

  const probe = () => S.probe || data[0];

  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = plot.eventToDomain(e);
    S.probe = { x, y };
    updateDiagram();
    plot.draw();
  });
  canvas.addEventListener('pointerdown', (e) => {
    const [x, y] = plot.eventToDomain(e);
    S.probe = { x, y };
    updateDiagram();
    plot.draw();
  });

  function updateDiagram() {
    const pr = probe();
    const z = S.w1 * pr.x + S.w2 * pr.y + S.b;
    const a = ACT[S.act](z);
    const col = (w) => (w >= 0 ? ORANGE : BLUE);
    const setEdge = (cls, w) => {
      const e = svg.querySelector(cls);
      e.setAttribute('stroke', col(w));
      e.setAttribute('stroke-width', 1 + Math.abs(w) * 2);
      e.setAttribute('stroke-opacity', 0.35 + Math.min(Math.abs(w) / 5, 0.65));
    };
    setEdge('.e1', S.w1); setEdge('.e2', S.w2);
    svg.querySelector('.l-w1').textContent = `w₁ = ${fmt(S.w1)}`;
    svg.querySelector('.l-w2').textContent = `w₂ = ${fmt(S.w2)}`;
    svg.querySelector('.l-b').textContent = `+ b = ${fmt(S.b)}`;
    svg.querySelector('.v-x1').textContent = fmt(pr.x);
    svg.querySelector('.v-x2').textContent = fmt(pr.y);
    svg.querySelector('.v-z').textContent = fmt(z);
    svg.querySelector('.v-y').textContent = fmt(a);
    const u = toUnit(S.act, a);
    const c = classColor(u);
    svg.querySelector('.out').setAttribute('fill', `rgb(${c[0]},${c[1]},${c[2]})`);
    // activation icon
    const pts = [];
    for (let k = 0; k <= 30; k++) {
      const zz = -4 + (8 * k) / 30;
      const v = toUnit(S.act, ACT[S.act](zz));
      pts.push(`${256 + k * 1.6},${118 - v * 36}`);
    }
    svg.querySelector('.act-icon').setAttribute('d', 'M' + pts.join(' L'));
    const sym = ACT_SYMBOL[S.act];
    calc.innerHTML = `
      <div><b>z</b> = w₁·x₁ + w₂·x₂ + b = (${fmt(S.w1)})·(${fmt(pr.x)}) + (${fmt(S.w2)})·(${fmt(pr.y)}) + (${fmt(S.b)}) = <b>${fmt(z)}</b></div>
      <div><b>ŷ</b> = ${sym}(z) = <b>${fmt(a)}</b> → ${z > 0 ? `<span style="color:${ORANGE}">● ${t('neuron.classA')}</span>` : `<span style="color:${BLUE}">● ${t('neuron.classB')}</span>`}</div>`;
    drawAct(z);
  }

  function drawAct(z) {
    if (actCanvas.offsetParent === null) return;
    const { w, h: hh, ctx } = fitCanvas(actCanvas);
    ctx.clearRect(0, 0, w, hh);
    const X = (zz) => ((zz + 5) / 10) * w;
    const lo = S.act === 'tanh' ? -1.2 : -0.2, hi = S.act === 'relu' ? 3 : 1.2;
    const Y = (v) => hh - 16 - ((v - lo) / (hi - lo)) * (hh - 26);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), hh); ctx.stroke();
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k <= 200; k++) {
      const zz = -5 + k / 20;
      const v = ACT[S.act](zz);
      k ? ctx.lineTo(X(zz), Y(v)) : ctx.moveTo(X(zz), Y(v));
    }
    ctx.stroke();
    const zc = clamp(z, -5, 5);
    ctx.fillStyle = '#facc15';
    ctx.beginPath(); ctx.arc(X(zc), Y(ACT[S.act](zc)), 6, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px system-ui';
    ctx.fillText(`${ACT_SYMBOL[S.act]}(z)`, 8, 14);
    ctx.fillText('z', w - 12, Y(0) - 6);
  }

  function update(fromUser) {
    drawField();
    let ok = 0;
    for (const d of data) if ((S.w1 * d.x + S.w2 * d.y + S.b > 0 ? 1 : 0) === d.c) ok++;
    const acc = ok / data.length;
    accBadge.innerHTML = `${t('common.accuracy')}: <b>${Math.round(acc * 100)} %</b>`;
    accBadge.classList.toggle('perfect', acc === 1);
    if (acc === 1 && S.dataset === 'separable' && fromUser) M.complete('neuron.m1');
    if (acc >= 0.75 && S.dataset === 'xor' && fromUser !== undefined) M.complete('neuron.m2');
    updateDiagram();
    plot.draw();
  }

  onLangChange(() => update());

  return {
    root,
    show() { update(); },
    hide() { cancelAnimationFrame(learning); },
  };
}
