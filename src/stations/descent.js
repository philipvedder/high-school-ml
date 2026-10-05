// Station 3 – Gradient descent explorer: 3D landscapes, rolling balls, optimizers, rain / basins of attraction.
import { stationShell, slider, select, segmented, button, row, card, missions, explain, toggle } from '../lib/ui.js';
import { Plot2D, sampleGrid, autoLevels } from '../lib/plot2d.js';
import { Surface3D } from '../lib/surface3d.js';
import { LineChart } from '../lib/linechart.js';
import { terrain, BALL_COLORS, OPT_COLORS } from '../lib/colormap.js';
import { getLandscape, LANDSCAPE_IDS } from '../lib/landscapes.js';
import { Optimizer } from '../lib/optim.js';
import { makeRng, fmt, drawArrow, h } from '../lib/util.js';
import { t, onLangChange } from '../i18n.js';

const CLUSTER_COLORS = ['#facc15', '#22d3ee', '#f43f5e', '#a78bfa', '#4ade80', '#fb923c', '#f472b6', '#60a5fa', '#e879f9', '#a3e635'];
const MAX_BALLS = 8;
const OPT_NAMES = { gd: 'GD', momentum: 'Momentum', adam: 'Adam' };

export function create() {
  const { root, viz, panel } = stationShell(3, 'descent');
  const rng = makeRng(42);
  const S = {
    lsId: 'twovalleys', seed: 7, lr: 0.05, beta: 0.9, noise: 0, speed: 20, opt: 'gd', race: false,
    playing: true, showGrad: true, showField: false, colorIdx: 0,
  };
  let ls = null;
  let balls = [];
  let visible = false;

  viz.classList.add('descent-grid');
  viz.innerHTML = `
    <div class="three-box"><div class="hint3d" data-i18n="descent.hint"></div></div>
    <div class="plot-box square"><canvas class="map"></canvas></div>
    <div class="below chart-box"><canvas class="chart"></canvas></div>`;
  const s3d = new Surface3D(viz.querySelector('.three-box'));
  const map = new Plot2D(viz.querySelector('.map'), [-1, 1, -1, 1]);
  const chart = new LineChart(viz.querySelector('.chart'), { yLabel: 'Loss' });
  chart.xLabel = '';

  // ---- controls ----
  const sLs = select({
    label: 'descent.landscape',
    options: LANDSCAPE_IDS.map((id) => ({ value: id, label: `ls.${id}` })),
    value: S.lsId,
    onChange: (v) => { S.lsId = v; loadLandscape(); },
  });
  const mysteryBtn = button('descent.newMystery', () => { S.seed = Math.floor(Math.random() * 1e5); loadLandscape(); });
  const sOpt = segmented({
    label: 'common.optimizer',
    options: [{ value: 'gd', label: { raw: 'GD' } }, { value: 'momentum', label: { raw: 'Momentum' } }, { value: 'adam', label: { raw: 'Adam' } }],
    value: S.opt,
    onChange: (v) => { S.opt = v; updateVisibility(); },
  });
  const tRace = toggle({ label: 'descent.race', value: false, onChange: (v) => { S.race = v; } });
  const sLr = slider({ label: 'common.lr', min: 0.001, max: 3, log: true, value: S.lr, digits: 3, onInput: (v) => { S.lr = v; } });
  const sBeta = slider({ label: 'descent.beta', min: 0, max: 0.99, step: 0.01, value: S.beta, onInput: (v) => { S.beta = v; } });
  const sNoise = slider({ label: 'descent.noise', min: 0, max: 3, step: 0.05, value: S.noise, onInput: (v) => { S.noise = v; } });
  const sSpeed = slider({ label: 'common.speed', min: 1, max: 200, log: true, value: S.speed, format: (v) => `${Math.round(v)}/s`, onInput: (v) => { S.speed = v; } });
  const playBtn = button('common.pause', () => setPlaying(!S.playing), 'primary');
  const stepBtn = button('common.step', () => { setPlaying(false); stepAll(); render(); });
  const clearBtn = button('common.clear', () => clearBalls());
  const rainBtn = button('descent.rain', () => rain());
  const tGrad = toggle({ label: 'descent.showGrad', value: S.showGrad, onChange: (v) => { S.showGrad = v; map.draw(); } });
  const tField = toggle({ label: 'descent.showField', value: S.showField, onChange: (v) => { S.showField = v; map.draw(); } });

  panel.appendChild(card(null, sLs, row(mysteryBtn)));
  panel.appendChild(card('descent.optTitle', sOpt, tRace, sLr, sBeta.el, sNoise, sSpeed));
  panel.appendChild(card(null, row(playBtn, stepBtn, clearBtn), row(rainBtn), tGrad, tField));
  const ballList = h('<div class="card ball-list"><h3 data-i18n="descent.balls"></h3><div class="list"></div></div>');
  panel.appendChild(ballList);
  const M = missions(['descent.m1', 'descent.m2', 'descent.m3', 'descent.m4'], 'descent');
  panel.appendChild(M.el);
  panel.appendChild(explain('descent.explain'));

  function updateVisibility() {
    sBeta.el.style.display = S.opt === 'momentum' || S.race ? '' : 'none';
    mysteryBtn.style.display = S.lsId === 'mystery' ? '' : 'none';
  }
  tRace.el.querySelector('input').addEventListener('change', updateVisibility);

  function setPlaying(p) {
    S.playing = p;
    playBtn.innerHTML = `<span data-i18n="${p ? 'common.pause' : 'common.play'}">${t(p ? 'common.pause' : 'common.play')}</span>`;
  }

  // ---- landscape ----
  function loadLandscape() {
    clearBalls();
    ls = getLandscape(S.lsId, S.seed);
    S.lr = ls.lr; sLr.value = ls.lr;
    s3d.setFunction(ls.f, ls.domain, { transform: ls.display, res: 120 });
    map.setDomain(ls.domain);
    const N = 140;
    const vals = sampleGrid((x, y) => ls.display(ls.f(x, y)), ls.domain, N);
    let lo = Infinity, hi = -Infinity;
    for (const v of vals) { if (v < lo) lo = v; if (v > hi) hi = v; }
    map.setField(vals, N, N, (v) => terrain((v - lo) / (hi - lo)));
    map.setContours(vals, N, N, autoLevels(vals, 16));
    updateVisibility();
    render();
  }

  // ---- balls ----
  function addBall(x, y, type, color, { rain = false } = {}) {
    const ball = {
      x, y, type, color, rain, start: [x, y],
      opt: new Optimizer(type, 2, { lr: S.lr, beta: S.beta }),
      hist: [[x, y]], losses: [ls.f(x, y)], status: 'rolling', steps: 0, nearMin: 0,
      s: s3d.addBall(color, rain ? { radius: 0.11, trail: false } : {}),
    };
    s3d.moveBall(ball.s, x, y, ls.f(x, y));
    balls.push(ball);
    if (!rain) {
      const normal = balls.filter((b) => !b.rain);
      if (normal.length > MAX_BALLS) removeBall(normal[0]);
    }
    return ball;
  }
  function removeBall(b) { s3d.removeBall(b.s); balls = balls.filter((x) => x !== b); }
  function clearBalls() { for (const b of balls) s3d.removeBall(b.s); balls = []; render(); }

  function drop(x, y) {
    if (S.race) {
      for (const type of ['gd', 'momentum', 'adam']) addBall(x, y, type, OPT_COLORS[type]);
    } else {
      addBall(x, y, S.opt, BALL_COLORS[S.colorIdx++ % BALL_COLORS.length]);
    }
    if (!S.playing) setPlaying(true);
    render();
  }
  s3d.onPick = (x, y) => drop(x, y);
  map.canvas.addEventListener('click', (e) => drop(...map.eventToDomain(e)));

  function rain() {
    for (const b of balls.filter((b) => b.rain)) removeBall(b);
    const [x0, x1, y0, y1] = ls.domain;
    for (let k = 0; k < 80; k++) addBall(x0 + (x1 - x0) * (0.03 + 0.94 * rng()), y0 + (y1 - y0) * (0.03 + 0.94 * rng()), S.opt, '#ffffff', { rain: true });
    M.complete('descent.m4');
    setPlaying(true);
  }

  /** Would plain GD (no momentum, no noise) from this start end in the global minimum? */
  function plainGdFinds(x, y) {
    for (let k = 0; k < 4000; k++) {
      const [gx, gy] = ls.g(x, y);
      x -= 0.01 * gx; y -= 0.01 * gy;
    }
    return ls.f(x, y) - ls.fmin < 0.05;
  }

  function stepAll() {
    const [x0, x1, y0, y1] = ls.domain;
    const span = Math.max(x1 - x0, y1 - y0);
    const p = new Float64Array(2), g = new Float64Array(2);
    for (const b of balls) {
      if (b.status !== 'rolling') continue;
      let [gx, gy] = ls.g(b.x, b.y);
      if (S.noise > 0) { gx += S.noise * rng.normal(); gy += S.noise * rng.normal(); }
      p[0] = b.x; p[1] = b.y; g[0] = gx; g[1] = gy;
      b.opt.lr = S.lr; b.opt.beta = S.beta;
      const len = b.opt.step(p, g);
      b.x = p[0]; b.y = p[1]; b.steps++;
      const f = ls.f(b.x, b.y);
      b.hist.push([b.x, b.y]);
      b.losses.push(f);
      if (b.hist.length > 3000) { b.hist.shift(); b.losses.shift(); }
      const far = Math.abs(b.x - (x0 + x1) / 2) > span * 3 || Math.abs(b.y - (y0 + y1) / 2) > span * 3;
      if (!isFinite(f) || far || f > 1e6) {
        b.status = 'boom';
        if (!b.rain) M.complete('descent.m1');
        continue;
      }
      s3d.moveBall(b.s, b.x, b.y, f, !b.rain);
      const [tx, ty] = ls.g(b.x, b.y);
      const gnorm = Math.hypot(tx, ty);
      if (S.noise === 0 && len < 1e-5 && gnorm < 2e-3) b.status = 'done';
      if (b.steps > 5000) b.status = 'done';
      // missions
      if (b.rain) continue;
      const atGlobal = f - ls.fmin < 0.05 && Math.hypot(b.x - ls.argmin[0], b.y - ls.argmin[1]) < span * 0.06;
      if (b.status === 'done' && !atGlobal && f - ls.fmin > 0.1 && gnorm < 2e-3) M.complete('descent.m2');
      b.nearMin = atGlobal ? b.nearMin + 1 : 0;
      if (b.nearMin > 40 && (b.type !== 'gd' || S.noise > 0) && ['twovalleys', 'bumpy', 'mystery'].includes(ls.id)) {
        if (b.gdFinds === undefined) b.gdFinds = plainGdFinds(...b.start);
        if (!b.gdFinds) M.complete('descent.m3');
      }
    }
  }

  function clusterRain() {
    const rb = balls.filter((b) => b.rain && b.status !== 'boom');
    if (!rb.length) return;
    const [x0, x1] = ls.domain;
    const r = (x1 - x0) * 0.06;
    const sorted = rb.slice().sort((a, b) => ls.f(a.x, a.y) - ls.f(b.x, b.y));
    const centers = [];
    for (const b of sorted) {
      let c = centers.find((c) => Math.hypot(c.x - b.x, c.y - b.y) < r);
      if (!c) { c = { x: b.x, y: b.y, idx: centers.length }; centers.push(c); }
      b.cluster = c.idx;
      const col = CLUSTER_COLORS[c.idx % CLUSTER_COLORS.length];
      if (b.color !== col) { b.color = col; s3d.setBallColor(b.s, col); }
    }
  }

  // ---- 2D overlay ----
  map.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'w₁', yLabel: 'w₂' });
    const [x0, x1, y0, y1] = p.domain;
    if (S.showField) {
      ctx.globalAlpha = 0.55;
      const n = 15;
      for (let j = 0; j < n; j++)
        for (let i = 0; i < n; i++) {
          const x = x0 + ((i + 0.5) / n) * (x1 - x0), y = y0 + ((j + 0.5) / n) * (y1 - y0);
          const [gx, gy] = ls.g(x, y);
          const L = Math.hypot(gx, gy) || 1;
          const [px, py] = p.toPx(x, y);
          const len = 6 + Math.min(10, L * 4);
          drawArrow(ctx, px, py, px - (gx / L) * len, py + (gy / L) * len, '#ffffff', 1.3, 5);
        }
      ctx.globalAlpha = 1;
    }
    // rain start points = basin map
    for (const b of balls) {
      if (!b.rain) continue;
      const [px, py] = p.toPx(...b.start);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(px - 4, py - 4, 8, 8);
      ctx.globalAlpha = 1;
    }
    for (const b of balls) {
      if (!b.rain && b.hist.length > 1) {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        b.hist.forEach(([x, y], i) => { const q = p.toPx(x, y); i ? ctx.lineTo(...q) : ctx.moveTo(...q); });
        ctx.stroke();
      }
      if (b.status === 'boom') continue;
      const [px, py] = p.toPx(b.x, b.y);
      ctx.fillStyle = b.color;
      ctx.strokeStyle = '#0b1020';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, b.rain ? 4 : 7, 0, 7); ctx.fill(); ctx.stroke();
      if (S.showGrad && !b.rain && b.status === 'rolling') {
        const [gx, gy] = ls.g(b.x, b.y);
        const L = Math.hypot(gx, gy);
        if (L > 0.02) drawArrow(ctx, px, py, px - (gx / L) * 40, py + (gy / L) * 40, '#ffffff', 2.5, 9);
      }
    }
  };

  function render() {
    clusterRain();
    map.draw();
    const normal = balls.filter((b) => !b.rain);
    chart.setSeries(normal.map((b) => ({ color: b.color, ys: b.losses })));
    const list = ballList.querySelector('.list');
    if (!normal.length) list.innerHTML = `<div class="muted small">${t('descent.noBalls')}</div>`;
    else list.innerHTML = normal.map((b) => {
      const st = b.status === 'boom' ? '💥' : b.status === 'done' ? '🏁' : '⏳';
      return `<div class="ball-row"><i style="background:${b.color}"></i><span>${OPT_NAMES[b.type]}</span><span class="mono">L=${fmt(b.losses[b.losses.length - 1], 3)}</span><span class="mono">${b.steps}</span><span>${st}</span></div>`;
    }).join('');
  }

  // ---- animation loop ----
  let last = 0, accum = 0, raf = null;
  function loop(ts) {
    if (!visible) { raf = null; return; }
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (ts - (last || ts)) / 1000);
    last = ts;
    if (S.playing && balls.some((b) => b.status === 'rolling')) {
      accum += dt * S.speed;
      let k = 0;
      while (accum >= 1 && k++ < 60) { stepAll(); accum -= 1; }
      render();
    }
  }

  onLangChange(() => render());
  loadLandscape();

  return {
    root,
    show() { visible = true; s3d.setActive(true); s3d.resize(); last = 0; if (!raf) raf = requestAnimationFrame(loop); render(); },
    hide() { visible = false; s3d.setActive(false); },
  };
}
