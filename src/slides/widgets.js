// Interactive figures embedded in the slides. Each widget: (el, opts) => { activate(), deactivate() }.
import { Plot2D, sampleGrid, autoLevels } from '../lib/plot2d.js';
import { Surface3D } from '../lib/surface3d.js';
import { classColor, terrain, BLUE, ORANGE } from '../lib/colormap.js';
import { makeRng, sigmoid, fmt, fitCanvas, drawArrow, clamp, h } from '../lib/util.js';
import { slider, segmented, toggle, button, row } from '../lib/ui.js';

/** Bilingual inline HTML. */
export const L = (en, de) => `<span class="en">${en}</span><span class="de">${de}</span>`;
const raw = (en, de = en) => ({ raw: L(en, de) });
const isDe = () => document.documentElement.dataset.lang === 'de';

// ---------------- data ----------------
function fruitData(seed = 4) {
  const rng = makeRng(seed);
  const pts = [];
  for (let k = 0; k < 36; k++) {
    const c = k % 2;
    const cx = c ? 0.9 : -0.9, cy = c ? 0.7 : -0.7;
    pts.push({ x: cx + rng.normal() * 0.6, y: cy + rng.normal() * 0.6, c });
  }
  return pts;
}
function xorData(seed = 2) {
  const rng = makeRng(seed);
  const pts = [];
  for (const [cx, cy, c] of [[0, 0, 0], [1, 1, 0], [1, 0, 1], [0, 1, 1]])
    for (let k = 0; k < 9; k++) pts.push({ x: cx + rng.normal() * 0.1, y: cy + rng.normal() * 0.1, c });
  return pts;
}
function overlapData(seed = 9) {
  const rng = makeRng(seed);
  const pts = [];
  for (let k = 0; k < 60; k++) {
    const c = k % 2;
    const s = c ? 1 : -1;
    pts.push({ x: s * 0.7 + rng.normal() * 0.8, y: s * 0.45 + rng.normal() * 0.8, c });
  }
  return pts;
}

function drawPoints(ctx, p, data, r = 6, judge = null) {
  for (const d of data) {
    const [px, py] = p.toPx(d.x, d.y);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, 7);
    ctx.fillStyle = d.c ? ORANGE : BLUE;
    ctx.fill();
    const wrong = judge && judge(d) !== d.c;
    ctx.lineWidth = wrong ? 3 : 1.6;
    ctx.strokeStyle = wrong ? '#001219' : '#E9D8A6';
    ctx.stroke();
  }
}

function canvasBox(cls = 'square') {
  return h(`<div class="w-plot ${cls}"><canvas></canvas><div class="w-badge"></div></div>`);
}

// ---------------- title animation ----------------
function hero(el) {
  const canvas = document.createElement('canvas');
  el.appendChild(canvas);
  const f = (x) => 0.35 * Math.sin(3 * x) + 0.25 * Math.sin(7.3 * x + 1) + 0.6 * (x - 0.3) ** 2;
  const df = (x) => 1.05 * Math.cos(3 * x) + 1.825 * Math.cos(7.3 * x + 1) + 1.2 * (x - 0.3);
  let balls = [], raf = null, frame = 0;
  function tick() {
    raf = requestAnimationFrame(tick);
    const { w, h: H, ctx } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, H);
    const X = (x) => ((x + 1.9) / 4.2) * w;
    const Y = (y) => H * 0.98 - ((y + 0.6) / 2.6) * H * 0.3;
    const path = () => { ctx.beginPath(); for (let k = 0; k <= 300; k++) { const x = -1.9 + (4.2 * k) / 300; k ? ctx.lineTo(X(x), Y(f(x))) : ctx.moveTo(X(x), Y(f(x))); } };
    const grd = 'rgba(238,155,0,0.08)';
    path(); ctx.lineTo(w, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fillStyle = grd; ctx.fill();
    path(); ctx.strokeStyle = '#EE9B00'; ctx.lineWidth = 2.5; ctx.stroke();
    if (frame++ % 60 === 0 && balls.length < 5) balls.push({ x: -1.6 + Math.random() * 3.6, v: 0, life: 0, c: Math.random() < 0.5 ? ORANGE : '#94D2BD' });
    for (const b of balls) {
      b.v = 0.9 * b.v - 0.004 * df(b.x); b.x += b.v; b.life++;
      ctx.globalAlpha = Math.min(1, b.life / 20, (420 - b.life) / 40);
      ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(X(b.x), Y(f(b.x)) - 9, 9, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    balls = balls.filter((b) => b.life < 420);
  }
  return { activate() { if (!raf) tick(); }, deactivate() { cancelAnimationFrame(raf); raf = null; } };
}

// ---------------- a single neuron ----------------
function neuron(el, o = {}) {
  const isXor = o.data === 'xor';
  const data = isXor ? xorData() : fruitData();
  const S = { w1: o.w?.[0] ?? 1.5, w2: o.w?.[1] ?? -0.4, b: o.w?.[2] ?? 0.3, act: o.act || 'step' };
  const dom = isXor ? [-0.5, 1.5, -0.5, 1.5] : [-3, 3, -3, 3];
  const box = canvasBox();
  const side = h('<div class="w-side"></div>');
  el.append(box, side);
  const plot = new Plot2D(box.querySelector('canvas'), dom);
  const badge = box.querySelector('.w-badge');
  const R = isXor ? 4 : 3;
  const s1 = slider({ label: raw('w₁'), min: -R, max: R, step: 0.05, value: S.w1, onInput: (v) => { S.w1 = v; draw(); } });
  const s2 = slider({ label: raw('w₂'), min: -R, max: R, step: 0.05, value: S.w2, onInput: (v) => { S.w2 = v; draw(); } });
  const s3 = slider({ label: raw('b'), min: -R, max: R, step: 0.05, value: S.b, onInput: (v) => { S.b = v; draw(); } });
  const formula = h('<div class="w-formula mono"></div>');
  side.append(s1.el, s2.el, s3.el, formula);
  if (o.scale) {
    const sc = slider({ label: raw('×k (scale all)', '×k (alle skalieren)'), min: 0.2, max: 4, step: 0.05, value: 1, onInput: (v) => { S.k = v; draw(); } });
    side.append(sc.el);
  }
  const z = (x, y) => (S.k || 1) * (S.w1 * x + S.w2 * y + S.b);
  const out = (x, y) => (S.act === 'sigmoid' ? sigmoid(z(x, y)) : z(x, y) > 0 ? 0.88 : 0.12);

  plot.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'x₁', yLabel: 'x₂', ticks: 4 });
    const [x0, x1] = [p.domain[0], p.domain[1]];
    ctx.save();
    ctx.setLineDash([8, 6]); ctx.lineWidth = 2.5; ctx.strokeStyle = '#E9D8A6';
    ctx.beginPath();
    if (Math.abs(S.w2) > 1e-6) { ctx.moveTo(...p.toPx(x0, -(S.w1 * x0 + S.b) / S.w2)); ctx.lineTo(...p.toPx(x1, -(S.w1 * x1 + S.b) / S.w2)); }
    else if (Math.abs(S.w1) > 1e-6) { const xv = -S.b / S.w1; ctx.moveTo(...p.toPx(xv, p.domain[2])); ctx.lineTo(...p.toPx(xv, p.domain[3])); }
    ctx.stroke(); ctx.restore();
    // normal vector w, drawn from the point of the line closest to the origin
    const n2 = S.w1 * S.w1 + S.w2 * S.w2;
    if (o.vector && n2 > 1e-4) {
      const fx = (-S.b * S.w1) / n2, fy = (-S.b * S.w2) / n2;
      const len = (dom[1] - dom[0]) * 0.16;
      const n = Math.sqrt(n2);
      const [ax, ay] = p.toPx(fx, fy), [bx, by] = p.toPx(fx + (S.w1 / n) * len, fy + (S.w2 / n) * len);
      drawArrow(ctx, ax, ay, bx, by, '#E9D8A6', 3.5, 13);
      ctx.fillStyle = '#E9D8A6'; ctx.font = 'bold 18px "Spline Sans Mono Variable", monospace';
      ctx.fillText('w', bx + 6, by - 6);
    }
    drawPoints(ctx, p, data, isXor ? 6 : 6.5, (d) => (z(d.x, d.y) > 0 ? 1 : 0));
  };
  function draw() {
    const n = 90;
    plot.setField(sampleGrid(out, dom, n), n, n, classColor);
    let ok = 0;
    for (const d of data) if ((z(d.x, d.y) > 0 ? 1 : 0) === d.c) ok++;
    const acc = Math.round((100 * ok) / data.length);
    badge.innerHTML = `${L('Accuracy', 'Genauigkeit')}: <b>${acc} %</b>`;
    badge.classList.toggle('good', acc === 100);
    const sg = (v) => (v < 0 ? ' − ' : ' + ') + fmt(Math.abs(v));
    const zf = `z = ${fmt(S.w1)}·x₁${sg(S.w2)}·x₂${sg(S.b)}`;
    formula.innerHTML = S.act === 'sigmoid' ? `${zf}<br>ŷ = σ(z)` : `${zf}<br>${L('z &gt; 0 → orange', 'z &gt; 0 → orange')}`;
    plot.draw();
  }
  return { activate: draw };
}

// ---------------- sigmoid vs step ----------------
function sigmoidPlot(el) {
  const box = canvasBox('wide');
  const side = h('<div class="w-side"></div>');
  el.append(box, side);
  const canvas = box.querySelector('canvas');
  const S = { z: 1, deriv: false };
  const sz = slider({ label: raw('z'), min: -6, max: 6, step: 0.05, value: S.z, onInput: (v) => { S.z = v; draw(); } });
  const td = toggle({ label: raw("show σ′(z)", "σ′(z) zeigen"), value: false, onChange: (v) => { S.deriv = v; draw(); } });
  const read = h('<div class="w-formula mono big"></div>');
  side.append(sz.el, td.el, read);
  function draw() {
    if (canvas.offsetParent === null) return;
    const { w, h: H, ctx } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, H);
    const X = (z) => ((z + 7) / 14) * w, Y = (v) => H - 30 - ((v + 0.1) / 1.25) * (H - 50);
    ctx.strokeStyle = 'rgba(233,216,166,0.15)'; ctx.lineWidth = 1;
    for (const v of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(0, Y(v)); ctx.lineTo(w, Y(v)); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
    ctx.fillStyle = 'rgba(233,216,166,0.6)'; ctx.font = '14px "Spline Sans Mono Variable", monospace';
    for (const v of [0, 0.5, 1]) ctx.fillText(String(v), X(0) + 6, Y(v) - 5);
    for (let k = -6; k <= 6; k += 2) if (k) ctx.fillText(String(k), X(k) - 4, H - 10);
    ctx.fillText('z', w - 16, H - 10);
    // step
    ctx.strokeStyle = 'rgba(233,216,166,0.45)'; ctx.setLineDash([7, 6]); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(0), Y(1)); ctx.lineTo(w, Y(1)); ctx.stroke();
    ctx.setLineDash([]);
    const curve = (f, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); for (let k = 0; k <= 300; k++) { const z = -7 + (14 * k) / 300; k ? ctx.lineTo(X(z), Y(f(z))) : ctx.moveTo(X(z), Y(f(z))); } ctx.stroke(); };
    if (S.deriv) curve((z) => sigmoid(z) * (1 - sigmoid(z)), ORANGE, 3);
    curve(sigmoid, '#94D2BD', 4);
    const s = sigmoid(S.z);
    ctx.setLineDash([4, 4]); ctx.strokeStyle = '#E9D8A6'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(S.z), Y(0)); ctx.lineTo(X(S.z), Y(s)); ctx.lineTo(X(0), Y(s)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#E9D8A6'; ctx.beginPath(); ctx.arc(X(S.z), Y(s), 8, 0, 7); ctx.fill();
    ctx.font = 'bold 15px "Spline Sans Mono Variable", monospace';
    ctx.fillStyle = '#94D2BD'; ctx.fillText('σ(z)', X(4.6), Y(sigmoid(4.6)) - 12);
    ctx.fillStyle = 'rgba(233,216,166,0.7)'; ctx.fillText(isDe() ? 'Stufe' : 'step', X(-6.6), Y(0) - 10);
    if (S.deriv) { ctx.fillStyle = ORANGE; ctx.fillText('σ′(z)', X(1.2), Y(0.25) - 8); }
    read.innerHTML = `σ(${fmt(S.z)}) = <b>${fmt(s, 3)}</b><br><span class="muted">≈ ${Math.round(s * 100)} % ${L('“orange”', '„orange“')}</span>${S.deriv ? `<br><span style="color:${ORANGE}">σ′ = σ(1−σ) = ${fmt(s * (1 - s), 3)}</span>` : ''}`;
  }
  return { activate: draw };
}

// ---------------- XOR network 2-2-1 ----------------
function xorNet(el, o = {}) {
  const data = xorData(5);
  const S = { act: o.act || 'none', t: 0 };
  const W1 = [[1, 1], [1, 1]], B1 = [0, -1], W2 = [1, -2], B2 = -0.5;
  const phi = (v) => (S.act === 'relu' ? Math.max(0, v) : v);
  const hid = (x, y) => [phi(W1[0][0] * x + W1[0][1] * y + B1[0]), phi(W1[1][0] * x + W1[1][1] * y + B1[1])];
  const outv = (x, y) => { const [a, b] = hid(x, y); return W2[0] * a + W2[1] * b + B2; };

  const diag = h(`<div class="w-diag">
    <svg viewBox="0 0 330 250" class="net-svg">
      <g class="edges">
        <line x1="45" y1="70" x2="160" y2="70"/><line x1="45" y1="70" x2="160" y2="180"/>
        <line x1="45" y1="180" x2="160" y2="70"/><line x1="45" y1="180" x2="160" y2="180"/>
        <line x1="185" y1="70" x2="285" y2="125" class="pos"/><line x1="185" y1="180" x2="285" y2="125" class="neg"/>
      </g>
      <text x="100" y="58" class="wt">1</text><text x="100" y="200" class="wt">1</text>
      <text x="80" y="108" class="wt">1</text><text x="80" y="152" class="wt">1</text>
      <text x="238" y="86" class="wt">1</text><text x="238" y="176" class="wt">−2</text>
      <circle cx="35" cy="70" r="20" class="nd"/><text x="35" y="76" class="nl">x₁</text>
      <circle cx="35" cy="180" r="20" class="nd"/><text x="35" y="186" class="nl">x₂</text>
      <circle cx="172" cy="70" r="24" class="nd hid"/><text x="172" y="76" class="nl">h₁</text>
      <circle cx="172" cy="180" r="24" class="nd hid"/><text x="172" y="186" class="nl">h₂</text>
      <text x="172" y="35" class="bl">b = 0</text><text x="172" y="225" class="bl">b = −1</text>
      <circle cx="298" cy="125" r="22" class="nd out"/><text x="298" y="131" class="nl">ŷ</text>
      <text x="298" y="168" class="bl">b = −½</text>
      <text x="172" y="250" class="actl"></text>
    </svg></div>`);
  const mapBox = canvasBox();
  const hidBox = canvasBox();
  el.append(diag, mapBox, hidBox);
  const svg = diag.querySelector('svg');
  if (o.toggle) {
    const seg = segmented({ options: [{ value: 'none', label: raw('no activation', 'ohne Aktivierung') }, { value: 'relu', label: raw('ReLU') }], value: S.act, onChange: (v) => { S.act = v; draw(); } });
    diag.appendChild(seg.el);
  }
  const ts = slider({ label: raw('input space → hidden space', 'Eingaberaum → versteckter Raum'), min: 0, max: 1, step: 0.01, value: 0, onInput: (v) => { S.t = v; hplot.draw(); } });
  diag.appendChild(ts.el);
  const map = new Plot2D(mapBox.querySelector('canvas'), [-0.5, 1.5, -0.5, 1.5]);
  const hplot = new Plot2D(hidBox.querySelector('canvas'), [-0.7, 2.7, -1.6, 1.8]);
  mapBox.querySelector('.w-badge').innerHTML = L('input space (x₁, x₂)', 'Eingaberaum (x₁, x₂)');
  hidBox.querySelector('.w-badge').innerHTML = L('hidden space (h₁, h₂)', 'versteckter Raum (h₁, h₂)');

  map.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'x₁', yLabel: 'x₂', ticks: 4 });
    drawPoints(ctx, p, data, 6, (d) => (outv(d.x, d.y) > 0 ? 1 : 0));
  };
  hplot.customBackground = (ctx, p) => {
    ctx.fillStyle = '#03202A'; ctx.fillRect(0, 0, p.w, p.h);
    p.drawAxes(ctx, { xLabel: S.t > 0.5 ? 'h₁' : 'x₁', yLabel: S.t > 0.5 ? 'h₂' : 'x₂', ticks: 4 });
  };
  hplot.onDraw = (ctx, p) => {
    // output neuron line in hidden space: h1 - 2 h2 - 0.5 = 0
    if (S.t > 0.6) {
      ctx.globalAlpha = (S.t - 0.6) / 0.4;
      const [x0, x1] = [p.domain[0], p.domain[1]];
      ctx.strokeStyle = '#E9D8A6'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(...p.toPx(x0, (x0 - 0.5) / 2)); ctx.lineTo(...p.toPx(x1, (x1 - 0.5) / 2)); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    const moved = data.map((d) => { const [a, b] = hid(d.x, d.y); return { x: (1 - S.t) * d.x + S.t * a, y: (1 - S.t) * d.y + S.t * b, c: d.c }; });
    drawPoints(ctx, p, moved, 6);
  };
  function draw() {
    svg.querySelector('.actl').textContent = S.act === 'relu' ? 'h = ReLU(w·x + b)' : 'h = w·x + b';
    svg.classList.toggle('relu', S.act === 'relu');
    const n = 90, vals = sampleGrid(outv, map.domain, n);
    map.setField(vals.map((v) => sigmoid(5 * v)), n, n, classColor);
    map.setContours(vals, n, n, [0]);
    map.contourStyle = 'rgba(233,216,166,0.95)';
    map.draw(); hplot.draw();
  }
  return { activate: draw };
}

// ---------------- sums of ReLUs approximate any curve ----------------
function bricks(el) {
  const box = canvasBox('wide');
  const side = h('<div class="w-side"></div>');
  el.append(box, side);
  const canvas = box.querySelector('canvas');
  const target = (x) => Math.sin(1.7 * x) * Math.exp(-x * x / 10) * 1.4 + 0.15 * x;
  const S = { k: 3, parts: true };
  const sk = slider({ label: raw('neurons', 'Neuronen'), min: 1, max: 30, step: 1, value: S.k, digits: 0, onInput: (v) => { S.k = v; draw(); } });
  const tp = toggle({ label: raw('show single neurons', 'einzelne Neuronen zeigen'), value: true, onChange: (v) => { S.parts = v; draw(); } });
  const read = h('<div class="w-formula mono"></div>');
  side.append(sk.el, tp.el, read);

  function fit(k) {
    const knots = Array.from({ length: k }, (_, i) => -3 + (6 * i) / k);
    const xs = Array.from({ length: 241 }, (_, i) => -3 + (6 * i) / 240);
    const m = k + 1;
    const A = Array.from({ length: m }, () => new Float64Array(m)), bvec = new Float64Array(m);
    const feat = (x) => [1, ...knots.map((c) => Math.max(0, x - c))];
    for (const x of xs) {
      const f = feat(x), y = target(x);
      for (let i = 0; i < m; i++) { bvec[i] += f[i] * y; for (let j = 0; j < m; j++) A[i][j] += f[i] * f[j]; }
    }
    for (let i = 0; i < m; i++) A[i][i] += 1e-6;
    // Gaussian elimination
    for (let c = 0; c < m; c++) {
      let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [bvec[c], bvec[p]] = [bvec[p], bvec[c]];
      for (let r = c + 1; r < m; r++) { const f = A[r][c] / A[c][c]; for (let j = c; j < m; j++) A[r][j] -= f * A[c][j]; bvec[r] -= f * bvec[c]; }
    }
    const a = new Float64Array(m);
    for (let i = m - 1; i >= 0; i--) { let s = bvec[i]; for (let j = i + 1; j < m; j++) s -= A[i][j] * a[j]; a[i] = s / A[i][i]; }
    const model = (x) => feat(x).reduce((s, f, i) => s + f * a[i], 0);
    let err = 0; for (const x of xs) err += (model(x) - target(x)) ** 2;
    return { knots, a, model, err: err / xs.length };
  }
  function draw() {
    if (canvas.offsetParent === null) return;
    const { w, h: H, ctx } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, H);
    const X = (x) => ((x + 3.1) / 6.2) * w, Y = (y) => H / 2 - (y / 3.2) * H;
    ctx.strokeStyle = 'rgba(233,216,166,0.15)'; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
    const { knots, a, model, err } = fit(S.k);
    const curve = (f, col, lw, dash = []) => { ctx.setLineDash(dash); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); for (let i = 0; i <= 300; i++) { const x = -3 + (6 * i) / 300; i ? ctx.lineTo(X(x), Y(f(x))) : ctx.moveTo(X(x), Y(f(x))); } ctx.stroke(); ctx.setLineDash([]); };
    if (S.parts) knots.forEach((c, i) => { ctx.globalAlpha = 0.45; curve((x) => a[i + 1] * Math.max(0, x - c), i % 2 ? '#CA6702' : ORANGE, 1.5); ctx.globalAlpha = 1; });
    curve(target, 'rgba(233,216,166,0.8)', 2.5, [7, 6]);
    curve(model, '#94D2BD', 4);
    ctx.fillStyle = '#E9D8A6';
    for (const c of knots) { ctx.beginPath(); ctx.arc(X(c), Y(model(c)), 4, 0, 7); ctx.fill(); }
    read.innerHTML = `ŷ(x) = a₀ + Σ aᵢ·ReLU(x − cᵢ)<br>${L('mean squared error', 'mittlerer quadr. Fehler')}: <b>${fmt(err, 4)}</b>`;
  }
  return { activate: draw };
}

// ---------------- loss landscape linked to the classifier ----------------
function lossLinked(el) {
  const data = overlapData();
  const PD = [-6, 6, -6, 6];
  const loss = (w1, w2) => { let s = 0; for (const d of data) s += (sigmoid(w1 * d.x + w2 * d.y) - d.c) ** 2; return s / data.length; };
  const S = { w1: -3, w2: 3.5 };
  const dataBox = canvasBox(), lsBox = canvasBox(), threeBox = h('<div class="w-three"></div>');
  el.append(dataBox, lsBox, threeBox);
  const read = h('<div class="w-readout mono"></div>');
  el.appendChild(read);
  dataBox.querySelector('.w-badge').innerHTML = L('data &amp; classifier', 'Daten &amp; Klassifikator');
  lsBox.querySelector('.w-badge').innerHTML = L('loss landscape (from above)', 'Verlustlandschaft (von oben)');
  const dplot = new Plot2D(dataBox.querySelector('canvas'), [-3, 3, -3, 3]);
  const lplot = new Plot2D(lsBox.querySelector('canvas'), PD);
  const s3d = new Surface3D(threeBox);
  const N = 81;
  const grid = sampleGrid(loss, PD, N);
  let best = [0, 0], bv = Infinity;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (grid[j * N + i] < bv) { bv = grid[j * N + i]; best = [PD[0] + (12 * i) / (N - 1), PD[2] + (12 * j) / (N - 1)]; }
  let lo = Infinity, hi = -Infinity; for (const v of grid) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  lplot.setField(grid, N, N, (v) => terrain((v - lo) / (hi - lo)));
  lplot.setContours(grid, N, N, autoLevels(grid, 14));
  s3d.setGrid(grid, N, N, PD, { contours: 14 });
  s3d.camera.position.set(9, 10, 11);
  s3d.addMarker(...best, bv, 0xe9d8a6, '★');
  const ball = s3d.addBall('#94D2BD', { radius: 0.22, trail: false });

  dplot.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'x₁', yLabel: 'x₂', ticks: 4 });
    drawPoints(ctx, p, data, 5.5, (d) => (S.w1 * d.x + S.w2 * d.y > 0 ? 1 : 0));
  };
  lplot.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'w₁', yLabel: 'w₂', ticks: 4 });
    const [bx, by] = p.toPx(...best);
    ctx.fillStyle = '#E9D8A6'; ctx.font = '20px "Spline Sans Mono Variable", monospace'; ctx.textAlign = 'center'; ctx.fillText('★', bx, by + 7); ctx.textAlign = 'left';
    const [cx, cy] = p.toPx(S.w1, S.w2);
    ctx.fillStyle = '#94D2BD'; ctx.strokeStyle = '#E9D8A6'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.fill(); ctx.stroke();
  };
  function set(w1, w2) {
    S.w1 = clamp(w1, PD[0], PD[1]); S.w2 = clamp(w2, PD[2], PD[3]);
    const n = 70;
    dplot.setField(sampleGrid((x, y) => sigmoid(S.w1 * x + S.w2 * y), dplot.domain, n), n, n, classColor);
    s3d.moveBall(ball, S.w1, S.w2, loss(S.w1, S.w2), false);
    read.innerHTML = `θ = (w₁, w₂) = (${fmt(S.w1)}, ${fmt(S.w2)}) &nbsp;⟶&nbsp; ŷ = σ(${fmt(S.w1)}·x₁ ${S.w2 < 0 ? '−' : '+'} ${fmt(Math.abs(S.w2))}·x₂) &nbsp;⟶&nbsp; <b>L(θ) = ${fmt(loss(S.w1, S.w2), 3)}</b>`;
    dplot.draw(); lplot.draw();
  }
  const lc = lplot.canvas;
  lc.addEventListener('pointermove', (e) => set(...lplot.eventToDomain(e)));
  lc.addEventListener('pointerdown', (e) => set(...lplot.eventToDomain(e)));
  s3d.onPick = (x, y) => set(x, y);
  return {
    activate() { s3d.setActive(true); s3d.resize(); set(S.w1, S.w2); },
    deactivate() { s3d.setActive(false); },
  };
}

// ---------------- gradient descent in 1D ----------------
function gd1d(el) {
  const f = (w) => 0.1 * w ** 4 - 0.8 * w * w + 0.3 * w + 2;
  const df = (w) => 0.4 * w ** 3 - 1.6 * w + 0.3;
  const S = { w: 2.9, eta: 0.05, hist: [2.9], timer: null, boom: false };
  const box = canvasBox('wide');
  const side = h('<div class="w-side"></div>');
  el.append(box, side);
  const canvas = box.querySelector('canvas');
  const se = slider({ label: raw('learning rate η', 'Lernrate η'), min: 0.01, max: 1.5, log: true, digits: 3, value: S.eta, onInput: (v) => { S.eta = v; draw(); } });
  const read = h('<div class="w-formula mono"></div>');
  const stepB = button(raw('→ step', '→ Schritt'), () => step(), 'primary');
  const runB = button(raw('▶ run', '▶ laufen'), () => run());
  const resetB = button(raw('↺', '↺'), () => reset(S.hist[0]));
  const preset = (en, de, eta, w0) => button(raw(en, de), () => { stop(); S.eta = eta; se.value = eta; reset(w0); run(); });
  side.append(se.el, row(stepB, runB, resetB),
    h(`<div class="w-label">${L('Try:', 'Probiere:')}</div>`),
    row(preset('η too small', 'η zu klein', 0.02, -0.4), preset('η good', 'η gut', 0.3, -0.4)),
    row(preset('η too big', 'η zu groß', 0.62, -0.4), preset('stuck!', 'festgefahren!', 0.3, 2.9)),
    read);
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    stop(); reset(clamp(-3.5 + ((e.clientX - r.left) / r.width) * 7, -3.3, 3.3));
  });
  function reset(w0) { S.w = w0; S.hist = [w0]; S.boom = false; draw(); }
  function step() {
    if (S.boom) return;
    S.w = S.w - S.eta * df(S.w);
    S.hist.push(S.w);
    if (!isFinite(S.w) || Math.abs(S.w) > 6) { S.boom = true; stop(); }
    draw();
  }
  function run() { if (S.timer) return stop(); S.timer = setInterval(() => { step(); if (S.hist.length > 120) stop(); }, 260); runB.innerHTML = L('⏸ pause', '⏸ Pause'); }
  function stop() { clearInterval(S.timer); S.timer = null; runB.innerHTML = L('▶ run', '▶ laufen'); }
  function draw() {
    if (canvas.offsetParent === null) return;
    const { w, h: H, ctx } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, H);
    const X = (v) => ((v + 3.5) / 7) * w, Y = (v) => H - 20 - ((v + 0.6) / 6) * (H - 30);
    ctx.strokeStyle = 'rgba(233,216,166,0.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.stroke();
    ctx.fillStyle = 'rgba(233,216,166,0.55)'; ctx.font = '13px "Spline Sans Mono Variable", monospace';
    for (let k = -3; k <= 3; k++) ctx.fillText(String(k), X(k) - 4, H - 4);
    ctx.fillText('w', w - 14, H - 4);
    ctx.fillText('f(w)', 8, 16);
    ctx.strokeStyle = '#CA6702'; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 300; i++) { const v = -3.5 + (7 * i) / 300; i ? ctx.lineTo(X(v), Y(f(v))) : ctx.moveTo(X(v), Y(f(v))); }
    ctx.stroke();
    // history
    ctx.strokeStyle = 'rgba(233,216,166,0.7)'; ctx.lineWidth = 2;
    ctx.beginPath();
    S.hist.forEach((v, i) => { const q = [X(v), Y(Math.min(f(v), 7))]; i ? ctx.lineTo(...q) : ctx.moveTo(...q); });
    ctx.stroke();
    ctx.fillStyle = 'rgba(233,216,166,0.8)';
    for (const v of S.hist) { ctx.beginPath(); ctx.arc(X(v), Y(Math.min(f(v), 7)), 4, 0, 7); ctx.fill(); }
    if (!S.boom) {
      const v = S.w, s0 = df(v), s = Math.abs(s0) < 1e-6 ? 0 : s0;
      // tangent
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(X(v - 0.7), Y(f(v) - 0.7 * s)); ctx.lineTo(X(v + 0.7), Y(f(v) + 0.7 * s)); ctx.stroke();
      // step preview on the axis
      const nv = v - S.eta * s;
      if (Math.abs(nv - v) > 1e-3) drawArrow(ctx, X(v), Y(-0.35), X(clamp(nv, -3.5, 3.5)), Y(-0.35), '#94D2BD', 3, 10);
      ctx.fillStyle = '#94D2BD'; ctx.strokeStyle = '#E9D8A6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(X(v), Y(f(v)), 10, 0, 7); ctx.fill(); ctx.stroke();
      read.innerHTML = `w = ${fmt(v, 3)}, &nbsp;f′(w) = ${fmt(s, 3)}<br>w<sub>${L('new', 'neu')}</sub> = ${fmt(v, 3)} − ${fmt(S.eta, 3)}·(${fmt(s, 3)}) = <b>${fmt(nv, 3)}</b><br><span class="muted">f(w) = ${fmt(f(v), 3)} · ${L('steps', 'Schritte')}: ${S.hist.length - 1}</span>`;
    } else {
      read.innerHTML = `💥 <b>${L('Exploded!', 'Explodiert!')}</b><br>${L('The steps overshoot more and more.', 'Die Schritte schießen immer weiter über.')}`;
    }
  }
  return { activate: draw, deactivate: stop };
}

// ---------------- partial derivatives & gradient in 2D ----------------
function gd2d(el, o = {}) {
  const f = (a, b) => 0.25 * a * a + 0.6 * b * b + 0.6 * Math.sin(1.5 * a) + 0.3 * a * b;
  const g = (a, b) => [0.5 * a + 0.9 * Math.cos(1.5 * a) + 0.3 * b, 1.2 * b + 0.3 * a];
  const D = [-3.5, 3.5, -3.5, 3.5];
  const gdMode = o.mode === 'gd';
  const S = { a: 2.6, b: 2.2, eta: 0.3, path: [[2.6, 2.2]], timer: null };
  const box = canvasBox();
  const side = h('<div class="w-side"></div>');
  el.append(box, side);
  const plot = new Plot2D(box.querySelector('canvas'), D);
  const N = 120, grid = sampleGrid(f, D, N);
  let lo = Infinity, hi = -Infinity; for (const v of grid) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  plot.setField(grid, N, N, (v) => terrain((v - lo) / (hi - lo)));
  plot.setContours(grid, N, N, autoLevels(grid, 16));
  const read = h('<div class="w-formula mono"></div>');
  let cs1, cs2;
  if (!gdMode) {
    cs1 = h('<div class="w-plot cs"><canvas></canvas></div>');
    cs2 = h('<div class="w-plot cs"><canvas></canvas></div>');
    side.append(cs1, cs2, read);
  } else {
    const se = slider({ label: raw('learning rate η', 'Lernrate η'), min: 0.02, max: 1.6, log: true, digits: 2, value: S.eta, onInput: (v) => { S.eta = v; draw(); } });
    const stepB = button(raw('→ step', '→ Schritt'), () => step(), 'primary');
    const runB = button(raw('▶ run', '▶ laufen'), () => { if (S.timer) stop(); else { S.timer = setInterval(() => { step(); if (S.path.length > 150) stop(); }, 120); } });
    const resetB = button(raw('↺', '↺'), () => { stop(); setPoint(...S.path[0]); });
    side.append(se.el, row(stepB, runB, resetB), h(`<div class="w-label muted">${L('Click on the map to choose a start.', 'Klicke auf die Karte, um einen Start zu wählen.')}</div>`), read);
  }
  function stop() { clearInterval(S.timer); S.timer = null; }
  function step() {
    const [ga, gb] = g(S.a, S.b);
    S.a -= S.eta * ga; S.b -= S.eta * gb;
    S.path.push([S.a, S.b]);
    if (Math.abs(S.a) > 50 || Math.abs(S.b) > 50) stop();
    draw();
  }
  function setPoint(a, b) { S.a = a; S.b = b; S.path = [[a, b]]; draw(); }
  const c = plot.canvas;
  let dragging = false;
  c.addEventListener('pointerdown', (e) => { dragging = true; c.setPointerCapture(e.pointerId); stop(); setPoint(...plot.eventToDomain(e)); });
  c.addEventListener('pointermove', (e) => { if (dragging && !gdMode) setPoint(...plot.eventToDomain(e)); });
  c.addEventListener('pointerup', () => { dragging = false; });

  plot.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'w₁', yLabel: 'w₂', ticks: 4 });
    const [px, py] = p.toPx(S.a, S.b);
    const [ga, gb] = g(S.a, S.b);
    const sc = 26;
    if (!gdMode) {
      ctx.setLineDash([6, 5]); ctx.lineWidth = 2;
      ctx.strokeStyle = '#94D2BD'; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(p.w, py); ctx.stroke();
      ctx.strokeStyle = '#BB3E03'; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, p.h); ctx.stroke();
      ctx.setLineDash([]);
      drawArrow(ctx, px, py, px + ga * sc, py, '#94D2BD', 3, 10);
      drawArrow(ctx, px, py, px, py - gb * sc, '#BB3E03', 3, 10);
      drawArrow(ctx, px, py, px + ga * sc, py - gb * sc, ORANGE, 4, 13);
      ctx.fillStyle = ORANGE; ctx.font = 'bold 16px "Spline Sans Mono Variable", monospace';
      ctx.fillText('∇f', px + ga * sc + 6, py - gb * sc - 6);
    } else {
      if (S.path.length > 1) {
        ctx.strokeStyle = '#E9D8A6'; ctx.lineWidth = 2.5; ctx.beginPath();
        S.path.forEach(([a, b], i) => { const q = p.toPx(a, b); i ? ctx.lineTo(...q) : ctx.moveTo(...q); }); ctx.stroke();
        ctx.fillStyle = '#E9D8A6'; for (const [a, b] of S.path) { const q = p.toPx(a, b); ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 7); ctx.fill(); }
      }
      const L2 = Math.hypot(ga, gb);
      if (L2 > 0.02) drawArrow(ctx, px, py, px - (ga / L2) * 50, py + (gb / L2) * 50, '#94D2BD', 4, 13);
    }
    ctx.fillStyle = '#E9D8A6'; ctx.strokeStyle = '#001219'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fill(); ctx.stroke();
  };

  function drawSection(box, fn, center, slope, color, label, varName) {
    const canvas = box.querySelector('canvas');
    if (canvas.offsetParent === null) return;
    const { w, h: H, ctx } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, H);
    let lo2 = Infinity, hi2 = -Infinity;
    for (let i = 0; i <= 200; i++) { const v = fn(-3.5 + (7 * i) / 200); lo2 = Math.min(lo2, v); hi2 = Math.max(hi2, v); }
    const X = (v) => ((v + 3.5) / 7) * w, Y = (v) => H - 14 - ((v - lo2) / (hi2 - lo2 || 1)) * (H - 40);
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= 200; i++) { const v = -3.5 + (7 * i) / 200; i ? ctx.lineTo(X(v), Y(fn(v))) : ctx.moveTo(X(v), Y(fn(v))); }
    ctx.stroke();
    const y0 = fn(center);
    ctx.strokeStyle = ORANGE; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(X(center - 0.8), Y(y0 - 0.8 * slope)); ctx.lineTo(X(center + 0.8), Y(y0 + 0.8 * slope)); ctx.stroke();
    ctx.fillStyle = '#E9D8A6'; ctx.beginPath(); ctx.arc(X(center), Y(y0), 6, 0, 7); ctx.fill();
    ctx.fillStyle = '#E9D8A6'; ctx.font = '14px "Spline Sans Mono Variable", monospace';
    ctx.fillText(label, 10, 18);
    ctx.fillStyle = ORANGE; ctx.font = 'bold 14px "Spline Sans Mono Variable", monospace';
    ctx.fillText(`${isDe() ? 'Steigung' : 'slope'} = ∂f/∂${varName} = ${fmt(slope)}`, 10, 36);
  }
  function draw() {
    const [ga, gb] = g(S.a, S.b);
    if (!gdMode) {
      const de = isDe();
      drawSection(cs1, (v) => f(v, S.b), S.a, ga, '#94D2BD', `f(w₁, ${fmt(S.b)})  — ${de ? 'w₂ eingefroren' : 'w₂ frozen'}`, 'w₁');
      drawSection(cs2, (v) => f(S.a, v), S.b, gb, '#BB3E03', `f(${fmt(S.a)}, w₂)  — ${de ? 'w₁ eingefroren' : 'w₁ frozen'}`, 'w₂');
      read.innerHTML = `∇f(${fmt(S.a)}, ${fmt(S.b)}) = (<span style="color:#22d3ee">${fmt(ga)}</span>, <span style="color:#f472b6">${fmt(gb)}</span>)`;
    } else {
      read.innerHTML = `∇f = (${fmt(ga)}, ${fmt(gb)})<br>θ ← θ − ${fmt(S.eta)}·∇f<br><span class="muted">f(θ) = ${fmt(f(S.a, S.b), 3)} · ${L('steps', 'Schritte')}: ${S.path.length - 1}</span>`;
    }
    plot.draw();
  }
  return { activate: draw, deactivate: stop };
}

export const WIDGETS = { hero, neuron, sigmoidPlot, xorNet, bricks, lossLinked, gd1d, gd2d };
