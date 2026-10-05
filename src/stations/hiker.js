// Station 4 – The blindfolded hiker: find the lowest valley in the fog with only local information.
import { stationShell, segmented, button, row, card, missions, explain, confetti } from '../lib/ui.js';
import { Plot2D, sampleGrid, autoLevels } from '../lib/plot2d.js';
import { Surface3D } from '../lib/surface3d.js';
import { LineChart } from '../lib/linechart.js';
import { terrain } from '../lib/colormap.js';
import { getLandscape } from '../lib/landscapes.js';
import { makeRng, drawArrow, h } from '../lib/util.js';
import { t, onLangChange } from '../i18n.js';

const BUDGET = 12;
const MAX_STEP = 1.3;
const DIFF = { easy: { reveal: 0.85, arrow: true }, hard: { reveal: 0.4, arrow: false } };
const alt = (f) => Math.round(100 * (f + 3.5));

function loadScores() { try { return JSON.parse(localStorage.getItem('hiker-scores') || '[]'); } catch { return []; } }
function saveScores(s) { try { localStorage.setItem('hiker-scores', JSON.stringify(s)); } catch { /* ignore */ } }

export function create() {
  const { root, viz, panel } = stationShell(4, 'hiker');
  const G = { diff: 'easy', ls: null, path: [], over: false, gdPath: null, score: 0, verdict: '' };
  let visible = false;

  viz.classList.add('two');
  viz.innerHTML = `
    <div class="plot-box square"><canvas class="map"></canvas><div class="plot-badge alt"></div><div class="plot-badge steps right"></div></div>
    <div class="three-box"><div class="lock"><div>🔒</div><div data-i18n="hiker.locked"></div></div></div>
    <div class="below hiker-below">
      <div class="result card"></div>
      <div class="chart-box"><canvas class="chart"></canvas></div>
    </div>`;
  const map = new Plot2D(viz.querySelector('.map'), [-4, 4, -4, 4]);
  const s3d = new Surface3D(viz.querySelector('.three-box'));
  const lock = viz.querySelector('.lock');
  const chart = new LineChart(viz.querySelector('.chart'), { yLabel: t('hiker.altitude') });
  const resultEl = viz.querySelector('.result');

  // ---- controls ----
  const sDiff = segmented({
    label: 'hiker.difficulty',
    options: [{ value: 'easy', label: 'hiker.easy' }, { value: 'hard', label: 'hiker.hard' }],
    value: G.diff,
    onChange: (v) => { G.diff = v; newGame(); },
  });
  const nameInput = h(`<label class="ctl"><div class="ctl-top"><span data-i18n="hiker.team"></span></div><input type="text" maxlength="20" class="text-input"></label>`);
  const newBtn = button('hiker.newGame', () => newGame(), 'primary');
  const doneBtn = button('hiker.done', () => endGame());
  const gdBtn = button('hiker.gd', () => runGd());
  panel.appendChild(card('hiker.rulesTitle', h('<div class="muted small" data-i18n="hiker.rules"></div>'), sDiff, nameInput, row(newBtn, doneBtn), row(gdBtn)));
  const scoreCard = h('<div class="card"><h3 data-i18n="hiker.highscores"></h3><ol class="scores"></ol><button class="btn small-btn clear-scores" data-i18n="hiker.clearScores"></button></div>');
  panel.appendChild(scoreCard);
  scoreCard.querySelector('.clear-scores').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.dataset.armed) { saveScores([]); renderScores(); delete b.dataset.armed; b.innerHTML = t('hiker.clearScores'); }
    else { b.dataset.armed = '1'; b.innerHTML = t('hiker.clearConfirm'); setTimeout(() => { delete b.dataset.armed; b.innerHTML = t('hiker.clearScores'); }, 3000); }
  });
  const M = missions(['hiker.m1', 'hiker.m2', 'hiker.m3'], 'hiker');
  panel.appendChild(M.el);
  panel.appendChild(explain('hiker.explain'));

  function newGame() {
    const seed = Math.floor(Math.random() * 1e5);
    const ls = getLandscape('mystery', seed);
    const rng = makeRng(seed + 1);
    let start;
    for (let k = 0; k < 500; k++) {
      const p = [rng.range(-3.5, 3.5), rng.range(-3.5, 3.5)];
      const f = ls.f(...p);
      if (Math.hypot(p[0] - ls.argmin[0], p[1] - ls.argmin[1]) > 3 && f > ls.fmin + 0.75 * (ls.fmax - ls.fmin) - 0.6) { start = p; break; }
      start = p;
    }
    Object.assign(G, { ls, path: [start], over: false, gdPath: null, score: 0, verdict: '' });
    gdBtn.disabled = true;
    doneBtn.disabled = false;
    // field for revealed areas
    const N = 140;
    const vals = sampleGrid(ls.f, ls.domain, N);
    map.setField(vals, N, N, (v) => terrain((v - ls.fmin) / (ls.fmax - ls.fmin)));
    map.setContours(vals, N, N, autoLevels(vals, 14));
    s3d.clearObjects();
    s3d.setFunction(ls.f, ls.domain, { res: 110 });
    s3d.surfaceGroup.visible = false;
    lock.style.display = '';
    render();
  }

  const pos = () => G.path[G.path.length - 1];

  map.canvas.addEventListener('click', (e) => {
    if (G.over) return;
    let [x, y] = map.eventToDomain(e);
    const [px, py] = pos();
    const d = Math.hypot(x - px, y - py);
    if (d < 0.05) return;
    if (d > MAX_STEP) { x = px + ((x - px) / d) * MAX_STEP; y = py + ((y - py) / d) * MAX_STEP; }
    G.path.push([x, y]);
    if (G.path.length - 1 >= BUDGET) endGame();
    else render();
  });

  function endGame() {
    if (G.over) return;
    G.over = true;
    const ls = G.ls;
    const f0 = ls.f(...G.path[0]);
    const f = ls.f(...pos());
    G.score = Math.max(0, Math.min(1000, Math.round((1000 * (f0 - f)) / (f0 - ls.fmin))));
    // classify the end point
    let [x, y] = pos();
    for (let k = 0; k < 1500; k++) { const [gx, gy] = ls.g(x, y); x -= 0.02 * gx; y -= 0.02 * gy; }
    const fLocal = ls.f(x, y);
    if (f - ls.fmin < 0.05 * (f0 - ls.fmin)) G.verdict = 'global';
    else if (f - fLocal < 0.12) G.verdict = 'local';
    else G.verdict = 'slope';
    if (G.verdict === 'global') confetti(resultEl);
    M.complete('hiker.m1');
    if (G.score > 900) M.complete('hiker.m2');
    const name = nameInput.querySelector('input').value.trim() || t('hiker.anon');
    const scores = loadScores();
    scores.push({ name, score: G.score, diff: G.diff });
    scores.sort((a, b) => b.score - a.score);
    saveScores(scores.slice(0, 10));
    // reveal 3D
    s3d.surfaceGroup.visible = true;
    lock.style.display = 'none';
    s3d.addPath(G.path, 0x22d3ee, ls.f);
    s3d.addMarker(...G.path[0], f0, 0xffffff, t('hiker.start'));
    s3d.addMarker(...ls.argmin, ls.fmin, 0xfacc15, t('hiker.globalMin'));
    gdBtn.disabled = false;
    doneBtn.disabled = true;
    render();
  }

  function runGd() {
    if (!G.over || G.gdPath) return;
    const ls = G.ls;
    let [x, y] = G.path[0];
    const p = [[x, y]];
    for (let k = 0; k < 400; k++) {
      const [gx, gy] = ls.g(x, y);
      x -= 0.15 * gx; y -= 0.15 * gy;
      if (k % 4 === 0) p.push([x, y]);
      if (Math.hypot(gx, gy) < 1e-4) break;
    }
    p.push([x, y]);
    G.gdPath = p;
    s3d.addPath(p, 0xf43f5e, ls.f);
    if (ls.f(...pos()) < ls.f(x, y) - 0.01) M.complete('hiker.m3');
    render();
  }

  // ---- drawing ----
  map.customBackground = (ctx, p) => {
    if (G.over) { p.drawBackground(ctx); p.drawContours(ctx); return; }
    // fog
    const g = ctx.createLinearGradient(0, 0, p.w, p.h);
    g.addColorStop(0, '#141a33'); g.addColorStop(1, '#0c1024');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    for (let k = 0; k < 140; k++) {
      const x = ((k * 97) % 100) / 100 * p.w, y = ((k * 61) % 100) / 100 * p.h;
      ctx.beginPath(); ctx.arc(x, y, 18 + (k % 5) * 6, 0, 7); ctx.fill();
    }
    // revealed patches
    const r = (DIFF[G.diff].reveal / (p.domain[1] - p.domain[0])) * p.w;
    ctx.save();
    ctx.beginPath();
    for (const q of G.path) { const [px, py] = p.toPx(...q); ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, Math.PI * 2); }
    ctx.clip();
    p.drawBackground(ctx);
    p.drawContours(ctx);
    ctx.restore();
  };
  map.onDraw = (ctx, p) => {
    if (!G.ls) return;
    const ls = G.ls;
    const drawPath = (path, color, dots = true) => {
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath();
      path.forEach((q, i) => { const s = p.toPx(...q); i ? ctx.lineTo(...s) : ctx.moveTo(...s); });
      ctx.stroke();
      if (dots) {
        ctx.fillStyle = color;
        path.forEach((q, i) => {
          const [px, py] = p.toPx(...q);
          ctx.beginPath(); ctx.arc(px, py, 4, 0, 7); ctx.fill();
          if (i > 0) { ctx.fillStyle = '#fff'; ctx.font = 'bold 11px system-ui'; ctx.fillText(i, px + 6, py - 6); ctx.fillStyle = color; }
        });
      }
    };
    if (G.gdPath) drawPath(G.gdPath, '#f43f5e', false);
    drawPath(G.path, '#22d3ee');
    const [cx, cy] = p.toPx(...pos());
    if (!G.over) {
      const R = (MAX_STEP / (p.domain[1] - p.domain[0])) * p.w;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
      if (DIFF[G.diff].arrow) {
        const [gx, gy] = ls.g(...pos());
        const L = Math.hypot(gx, gy);
        if (L > 1e-4) {
          const len = Math.min(R, 18 + L * 40);
          drawArrow(ctx, cx, cy, cx - (gx / L) * len, cy + (gy / L) * len, '#f97316', 3.5, 12);
        }
      }
    } else {
      const [mx, my] = p.toPx(...ls.argmin);
      ctx.font = '22px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#facc15';
      ctx.fillText('★', mx, my + 8);
      ctx.textAlign = 'left';
    }
    // hiker
    ctx.font = '26px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('🧍', cx, cy + 9);
    ctx.textAlign = 'left';
  };

  function renderScores() {
    const s = loadScores();
    scoreCard.querySelector('.scores').innerHTML = s.length
      ? s.map((e) => `<li><span>${escapeHtml(e.name)}</span><b>${e.score}</b><span class="muted small">${e.diff === 'hard' ? '🔥' : ''}</span></li>`).join('')
      : `<li class="muted small">${t('hiker.noScores')}</li>`;
  }

  function render() {
    if (!G.ls) return;
    const ls = G.ls;
    const f = ls.f(...pos());
    const used = G.path.length - 1;
    viz.querySelector('.alt').innerHTML = `${t('hiker.altitude')}: <b>${alt(f)} m</b>`;
    viz.querySelector('.steps').innerHTML = `${t('common.steps')}: <b>${used}/${BUDGET}</b>`;
    const series = [{ color: '#22d3ee', ys: G.path.map((q) => alt(ls.f(...q))), dots: true }];
    if (G.gdPath) series.push({ color: '#f43f5e', points: G.gdPath.map((q, i) => [(i / (G.gdPath.length - 1)) * Math.max(used, 1), alt(ls.f(...q))]) });
    chart.yLabel = t('hiker.altitude') + ' (m)';
    chart.setSeries(series);
    if (!G.over) {
      resultEl.innerHTML = `<div class="muted" data-i18n="hiker.playing">${t('hiker.playing')}</div>`;
    } else {
      const emoji = { global: '🏆', local: '🕳️', slope: '⛰️' }[G.verdict];
      let gdInfo = '';
      if (G.gdPath) {
        const fg = ls.f(...G.gdPath[G.gdPath.length - 1]);
        const win = f < fg - 0.01, tie = Math.abs(f - fg) <= 0.01;
        gdInfo = `<div class="gd-info">🤖 ${t('hiker.gdResult', { alt: alt(fg) })} ${win ? t('hiker.youWin') : tie ? t('hiker.tie') : t('hiker.gdWins')}</div>`;
      }
      resultEl.innerHTML = `<div class="big-score">${emoji} ${G.score} <span class="muted small">/ 1000</span></div><div>${t('hiker.verdict.' + G.verdict)}</div>${gdInfo}`;
    }
    renderScores();
    map.draw();
  }

  onLangChange(() => render());
  newGame();

  return {
    root,
    show() { visible = true; s3d.setActive(true); render(); },
    hide() { visible = false; s3d.setActive(false); },
  };
}

function escapeHtml(s) { return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
