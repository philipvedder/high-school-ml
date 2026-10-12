// Station 2 – Loss: fit a line, see squared errors, explore the (w,b) loss landscape, take gradient steps by hand.
import { stationShell, slider, button, row, card, missions, explain, toggle } from '../lib/ui.js';
import { Plot2D, sampleGrid, autoLevels } from '../lib/plot2d.js';
import { terrain } from '../lib/colormap.js';
import { makeRng, fmt, drawArrow, h } from '../lib/util.js';
import { t, onLangChange } from '../i18n.js';

const DATA_DOMAIN = [-0.5, 4.8, -1, 5];
const LS_DOMAIN = [-1.4, 2.6, -1.2, 2.8];
const START = [1.9, -0.6];

export function create() {
  const { root, viz, panel } = stationShell(2, 'loss');
  const rng = makeRng(11);
  const data = [];
  for (let k = 0; k < 10; k++) {
    const x = 0.3 + (3.8 * k) / 9 + rng.range(-0.15, 0.15);
    data.push({ x, y: 0.6 * x + 0.8 + rng.normal() * 0.35 });
  }
  const n = data.length;
  const loss = (w, b) => data.reduce((s, d) => s + (w * d.x + b - d.y) ** 2, 0) / n;
  const grad = (w, b) => {
    let gw = 0, gb = 0;
    for (const d of data) { const r = w * d.x + b - d.y; gw += r * d.x; gb += r; }
    return [(2 * gw) / n, (2 * gb) / n];
  };
  // closed-form least squares optimum
  const mx = data.reduce((s, d) => s + d.x, 0) / n, my = data.reduce((s, d) => s + d.y, 0) / n;
  const wOpt = data.reduce((s, d) => s + (d.x - mx) * (d.y - my), 0) / data.reduce((s, d) => s + (d.x - mx) ** 2, 0);
  const bOpt = my - wOpt * mx;
  const Lmin = loss(wOpt, bOpt);
  const goal = Lmin + 0.06;

  const S = { w: START[0], b: START[1], lr: 0.05, hist: [START.slice()], steps: 0, fromStart: true, exploded: false, showGrad: true, showSq: true, auto: null };

  viz.classList.add('two');
  viz.innerHTML = `
    <div class="plot-box square"><canvas class="dataplot"></canvas><div class="plot-title" data-i18n="loss.dataTitle"></div></div>
    <div class="plot-box square"><canvas class="lsplot"></canvas><div class="plot-title" data-i18n="loss.lsTitle"></div><div class="plot-badge status"></div></div>
    <div class="below lossbar-wrap">
      <div class="lossbar-label"><span data-i18n="loss.lossLabel"></span> <b class="lossval"></b> <span class="muted small lossmin"></span></div>
      <div class="lossbar"><div class="goal"></div><div class="fill"></div></div>
    </div>`;
  const dataPlot = new Plot2D(viz.querySelector('.dataplot'), DATA_DOMAIN);
  const lsPlot = new Plot2D(viz.querySelector('.lsplot'), LS_DOMAIN);
  const statusEl = viz.querySelector('.status');

  // landscape field (log scale for nicer contrast)
  const N = 120;
  const raw = sampleGrid(loss, LS_DOMAIN, N);
  const logv = raw.map((v) => Math.log(v + 0.05));
  let lo = Infinity, hi = -Infinity;
  for (const v of logv) { if (v < lo) lo = v; if (v > hi) hi = v; }
  lsPlot.setField(logv, N, N, (v) => terrain((v - lo) / (hi - lo)));
  lsPlot.setContours(logv, N, N, autoLevels(logv, 16));

  // ---- controls ----
  const sw = slider({ label: { raw: 'w (slope)' }, min: LS_DOMAIN[0], max: LS_DOMAIN[1], step: 0.01, value: S.w, onInput: (v) => manualSet(v, S.b) });
  const sb = slider({ label: { raw: 'b (intercept)' }, min: LS_DOMAIN[2], max: LS_DOMAIN[3], step: 0.01, value: S.b, onInput: (v) => manualSet(S.w, v) });
  const tSq = toggle({ label: 'loss.showSquares', value: true, onChange: (v) => { S.showSq = v; render(); } });
  const tGr = toggle({ label: 'loss.showGrad', value: true, onChange: (v) => { S.showGrad = v; render(); } });
  panel.appendChild(card('loss.model', sw, sb, tSq, tGr));

  const slr = slider({ label: 'common.lr', min: 0.005, max: 0.3, log: true, value: S.lr, digits: 3, onInput: (v) => { S.lr = v; render(); } });
  const calc = h('<div class="calc mono"></div>');
  const stepBtn = button('loss.step', () => { stopAuto(); gdStep(); }, 'primary');
  const autoBtn = button('common.play', () => toggleAuto());
  const resetBtn = button('loss.resetStart', () => { stopAuto(); setPoint(...START, true); });
  panel.appendChild(card('loss.optimizer', slr, calc, row(stepBtn, autoBtn, resetBtn), h('<div class="muted small stepcount"></div>')));
  const M = missions(['loss.m1', 'loss.m2', 'loss.m3'], 'loss');
  panel.appendChild(M.el);
  panel.appendChild(explain('loss.explain'));
  const stepCountEl = panel.querySelector('.stepcount');

  function setPoint(w, b, resetTrail) {
    S.w = w; S.b = b;
    if (resetTrail) { S.hist = [[w, b]]; S.steps = 0; S.exploded = false; S.fromStart = w === START[0] && b === START[1]; }
    sw.value = Math.max(LS_DOMAIN[0], Math.min(LS_DOMAIN[1], w));
    sb.value = Math.max(LS_DOMAIN[2], Math.min(LS_DOMAIN[3], b));
    render();
  }
  function manualSet(w, b) {
    stopAuto();
    setPoint(w, b, true);
    if (loss(w, b) < goal) M.complete('loss.m1');
  }

  function gdStep() {
    if (S.exploded) return;
    const [gw, gb] = grad(S.w, S.b);
    const w = S.w - S.lr * gw, b = S.b - S.lr * gb;
    S.steps++;
    S.hist.push([w, b]);
    if (!isFinite(w) || Math.abs(w) > 1e4 || Math.abs(b) > 1e4) {
      S.exploded = true;
      M.complete('loss.m3');
      stopAuto();
    }
    setPoint(w, b, false);
    if (!S.exploded && S.fromStart && loss(w, b) < Lmin + 0.02 && S.steps <= 80) M.complete('loss.m2');
    if (loss(w, b) > 1e3 && !S.exploded) { S.exploded = true; M.complete('loss.m3'); stopAuto(); render(); }
  }

  function toggleAuto() { S.auto ? stopAuto() : startAuto(); }
  function startAuto() {
    S.auto = setInterval(() => { gdStep(); if (S.steps > 500) stopAuto(); }, 160);
    autoBtn.innerHTML = `<span data-i18n="common.pause">${t('common.pause')}</span>`;
  }
  function stopAuto() {
    clearInterval(S.auto); S.auto = null;
    autoBtn.innerHTML = `<span data-i18n="common.play">${t('common.play')}</span>`;
  }

  // ---- data plot drawing & dragging ----
  const HX = [0.3, 4.3];
  dataPlot.customBackground = (ctx, p) => {
    ctx.fillStyle = '#03202A';
    ctx.fillRect(0, 0, p.w, p.h);
    p.drawAxes(ctx, { xLabel: 'x', yLabel: 'y' });
  };
  dataPlot.onDraw = (ctx, p) => {
    const L = loss(S.w, S.b);
    // squares & residuals
    for (const d of data) {
      const yh = S.w * d.x + S.b;
      const [px, py] = p.toPx(d.x, d.y);
      const [, pyh] = p.toPx(d.x, yh);
      const side = pyh - py;
      if (S.showSq && Math.abs(side) < 2000) {
        ctx.fillStyle = 'rgba(238,155,0,0.18)';
        ctx.strokeStyle = 'rgba(238,155,0,0.6)';
        ctx.lineWidth = 1;
        const x0 = px, y0 = Math.min(py, pyh), s = Math.abs(side);
        ctx.fillRect(x0, y0, s, s);
        ctx.strokeRect(x0, y0, s, s);
      }
      ctx.strokeStyle = '#EE9B00';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, pyh); ctx.stroke();
    }
    // line
    const [x0, x1] = [p.domain[0], p.domain[1]];
    ctx.strokeStyle = '#94D2BD';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(...p.toPx(x0, S.w * x0 + S.b)); ctx.lineTo(...p.toPx(x1, S.w * x1 + S.b)); ctx.stroke();
    // points
    for (const d of data) {
      const [px, py] = p.toPx(d.x, d.y);
      ctx.fillStyle = '#E9D8A6';
      ctx.beginPath(); ctx.arc(px, py, 5.5, 0, 7); ctx.fill();
    }
    // handles
    for (const hx of HX) {
      const [px, py] = p.toPx(hx, S.w * hx + S.b);
      ctx.fillStyle = '#001219';
      ctx.strokeStyle = '#94D2BD';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(px, py, 9, 0, 7); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(233,216,166,0.8)';
    ctx.font = 'bold 14px "Spline Sans Mono Variable", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`ŷ = ${fmt(S.w)}·x + ${fmt(S.b)}`, p.w - 10, 22);
    ctx.textAlign = 'left';
    void L;
  };
  let drag = null;
  const dc = dataPlot.canvas;
  dc.addEventListener('pointerdown', (e) => {
    const r = dc.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    for (let k = 0; k < 2; k++) {
      const [px, py] = dataPlot.toPx(HX[k], S.w * HX[k] + S.b);
      if (Math.hypot(px - mx, py - my) < 22) { drag = { k }; break; }
    }
    if (!drag) {
      const [x, y] = dataPlot.fromPx(mx, my);
      const [, pyl] = dataPlot.toPx(x, S.w * x + S.b);
      if (Math.abs(pyl - my) < 25) drag = { shift: true, dy: y - (S.w * x + S.b) };
    }
    if (drag) { dc.setPointerCapture(e.pointerId); e.preventDefault(); }
  });
  dc.addEventListener('pointermove', (e) => {
    if (!drag) { dc.style.cursor = 'default'; return; }
    const [x, y] = dataPlot.eventToDomain(e);
    if (drag.shift) {
      manualSet(S.w, y - drag.dy - S.w * x);
    } else {
      const other = HX[1 - drag.k];
      const yo = S.w * other + S.b;
      const hx = HX[drag.k];
      const w = (y - yo) / (hx - other);
      manualSet(w, yo - w * other);
    }
  });
  dc.addEventListener('pointerup', () => { drag = null; });

  // ---- landscape drawing & clicking ----
  lsPlot.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'w', yLabel: 'b' });
    // optimum
    const [ox, oy] = p.toPx(wOpt, bOpt);
    ctx.fillStyle = 'rgba(233,216,166,0.9)';
    ctx.font = '16px "Spline Sans Mono Variable", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★', ox, oy + 6);
    // trail
    if (S.hist.length > 1) {
      ctx.strokeStyle = '#E9D8A6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      S.hist.forEach(([w, b], i) => { const q = p.toPx(w, b); i ? ctx.lineTo(...q) : ctx.moveTo(...q); });
      ctx.stroke();
      ctx.fillStyle = '#E9D8A6';
      for (const [w, b] of S.hist) { const q = p.toPx(w, b); ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 7); ctx.fill(); }
    }
    const [cx, cy] = p.toPx(S.w, S.b);
    if (S.showGrad && !S.exploded) {
      const [gw, gb] = grad(S.w, S.b);
      // preview of the next step
      const [nx, ny] = p.toPx(S.w - S.lr * gw, S.b - S.lr * gb);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#E9D8A6';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.beginPath(); ctx.arc(nx, ny, 8, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      // steepest-descent direction (fixed length)
      const gx = -gw, gy = gb; // pixel y is flipped
      const len = Math.hypot(gx, gy) || 1;
      drawArrow(ctx, cx, cy, cx + (gx / len) * 60, cy + (gy / len) * 60, '#EE9B00', 3, 12);
    }
    ctx.fillStyle = '#94D2BD';
    ctx.strokeStyle = '#E9D8A6';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.fill(); ctx.stroke();
  };
  let lsDrag = false;
  const lc = lsPlot.canvas;
  lc.addEventListener('pointerdown', (e) => { lsDrag = true; lc.setPointerCapture(e.pointerId); manualSet(...lsPlot.eventToDomain(e)); });
  lc.addEventListener('pointermove', (e) => { if (lsDrag) manualSet(...lsPlot.eventToDomain(e)); });
  lc.addEventListener('pointerup', () => { lsDrag = false; });

  function render() {
    const L = loss(S.w, S.b);
    const [gw, gb] = grad(S.w, S.b);
    viz.querySelector('.lossval').textContent = fmt(L, 3);
    viz.querySelector('.lossmin').textContent = `(${t('loss.best')}: ${fmt(Lmin, 3)})`;
    const scale = (v) => Math.min(1, Math.sqrt(v / 12));
    viz.querySelector('.lossbar .fill').style.width = `${scale(L) * 100}%`;
    viz.querySelector('.lossbar .fill').classList.toggle('good', L < goal);
    viz.querySelector('.lossbar .goal').style.width = `${scale(goal) * 100}%`;
    statusEl.innerHTML = S.exploded ? `💥 ${t('loss.exploded')}` : `${t('common.steps')}: <b>${S.steps}</b>`;
    statusEl.classList.toggle('bad', S.exploded);
    const lr = fmt(S.lr, 3);
    calc.innerHTML = S.exploded ? `<div>💥 ${t('loss.explodedHint')}</div>` : `
      <div class="grad-line"><span>∂L/∂w = <b>${fmt(gw, 3)}</b></span><span>∂L/∂b = <b>${fmt(gb, 3)}</b></span></div>
      <div>w ← w − η·∂L/∂w = ${fmt(S.w, 3)} − ${lr}·(${fmt(gw, 3)}) = <b>${fmt(S.w - S.lr * gw, 3)}</b></div>
      <div>b ← b − η·∂L/∂b = ${fmt(S.b, 3)} − ${lr}·(${fmt(gb, 3)}) = <b>${fmt(S.b - S.lr * gb, 3)}</b></div>`;
    stepCountEl.innerHTML = t('loss.stepInfo', { n: S.steps });
    dataPlot.draw();
    lsPlot.draw();
  }

  onLangChange(() => render());
  return { root, show() { render(); }, hide() { stopAuto(); } };
}
