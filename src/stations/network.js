// Station 5 – Train a multilayer perceptron live (a mini "TensorFlow Playground").
import { stationShell, slider, select, segmented, button, row, card, missions, explain } from '../lib/ui.js';
import { Plot2D } from '../lib/plot2d.js';
import { LineChart } from '../lib/linechart.js';
import { classColor, BLUE, ORANGE } from '../lib/colormap.js';
import { DATASETS } from '../lib/datasets.js';
import { lab } from '../lib/lab.js';
import { fmt, fitCanvas, h } from '../lib/util.js';
import { t, onLangChange } from '../i18n.js';

const DOMAIN = [-2.4, 2.4, -2.4, 2.4];
const TH = 22; // thumbnail resolution

export function create() {
  const { root, viz, panel } = stationShell(5, 'network');
  lab.ensure();
  const C = lab.config;
  const S = { playing: false, speed: 5, addClass: 1, frame: 0 };
  let visible = false;

  viz.classList.add('net-grid');
  viz.innerHTML = `
    <div class="plot-box netdiag-box"><canvas class="netdiag"></canvas><div class="plot-badge params"></div></div>
    <div class="plot-box square"><canvas class="map"></canvas><div class="plot-badge acc"></div>
      <div class="legend"><span><i style="background:${ORANGE}"></i>1</span><span><i style="background:${BLUE}"></i>0</span></div></div>
    <div class="below net-below">
      <div class="stats card"></div>
      <div class="chart-box"><canvas class="chart"></canvas></div>
    </div>`;
  const diag = viz.querySelector('.netdiag');
  const map = new Plot2D(viz.querySelector('.map'), DOMAIN);
  const chart = new LineChart(viz.querySelector('.chart'), { yLabel: 'Loss', log: true });
  const statsEl = viz.querySelector('.stats');

  // ---- controls ----
  const sData = select({
    label: 'common.dataset',
    options: DATASETS.map((d) => ({ value: d, label: `ds.${d}` })),
    value: C.dataset,
    onChange: (v) => { C.dataset = v; lab.newData(); },
  });
  const sNoise = slider({ label: 'network.noise', min: 0, max: 0.5, step: 0.01, value: C.noise, onInput: (v) => { C.noise = v; lab.newData(); } });
  const newDataBtn = button('common.newData', () => { C.dataSeed++; lab.newData(); });
  const clearBtn = button('network.clearData', () => { lab.data.length = 0; lab.reset(); });
  const sAdd = segmented({
    label: 'network.clickAdds',
    options: [{ value: 1, label: { raw: `<i class="dot" style="background:${ORANGE}"></i>` } }, { value: 0, label: { raw: `<i class="dot" style="background:${BLUE}"></i>` } }],
    value: 1,
    onChange: (v) => { S.addClass = v; },
  });
  panel.appendChild(card('network.data', sData, sNoise, row(newDataBtn, clearBtn), sAdd));

  const sLayers = slider({ label: 'network.layers', min: 0, max: 4, step: 1, value: C.layers, digits: 0, onInput: (v) => { C.layers = v; lab.reset(); } });
  const sNeurons = slider({ label: 'network.neurons', min: 1, max: 8, step: 1, value: C.neurons, digits: 0, onInput: (v) => { C.neurons = v; lab.reset(); } });
  const sAct = select({
    label: 'neuron.activation',
    options: [{ value: 'tanh', label: { raw: 'tanh' } }, { value: 'relu', label: { raw: 'ReLU' } }, { value: 'sigmoid', label: { raw: 'Sigmoid' } }],
    value: C.act,
    onChange: (v) => { C.act = v; lab.reset(); },
  });
  panel.appendChild(card('network.arch', sLayers, sNeurons, sAct));

  const sOpt = segmented({
    label: 'common.optimizer',
    options: [{ value: 'gd', label: { raw: 'SGD' } }, { value: 'momentum', label: { raw: 'Momentum' } }, { value: 'adam', label: { raw: 'Adam' } }],
    value: C.opt,
    onChange: (v) => { C.opt = v; lab.trainer.setOptimizer(v); },
  });
  const sLr = slider({ label: 'common.lr', min: 0.001, max: 3, log: true, value: C.lr, digits: 3, onInput: (v) => { C.lr = v; lab.trainer.setLr(v); } });
  const sBatch = select({
    label: 'network.batch',
    options: [{ value: 0, label: 'network.fullBatch' }, { value: 32, label: { raw: '32' } }, { value: 8, label: { raw: '8' } }, { value: 1, label: { raw: '1' } }],
    value: C.batch,
    onChange: (v) => { C.batch = +v; lab.trainer.batch = +v; },
  });
  const sSpeed = slider({ label: 'common.speed', min: 1, max: 40, step: 1, value: S.speed, digits: 0, format: (v) => `${v} ${t('network.perFrame')}`, onInput: (v) => { S.speed = v; } });
  const playBtn = button('common.train', () => setPlaying(!S.playing), 'primary');
  const stepBtn = button('common.step', () => { setPlaying(false); trainStep(1); });
  const resetBtn = button('network.reinit', () => { C.seed++; lab.reset(); });
  panel.appendChild(card('network.training', sOpt, sLr, sBatch, sSpeed, row(playBtn, stepBtn, resetBtn)));

  const M = missions(['network.m1', 'network.m2', 'network.m3', 'network.m4'], 'network');
  panel.appendChild(M.el);
  panel.appendChild(h('<a class="btn wide" href="#research" data-i18n="network.toResearch"></a>'));
  panel.appendChild(explain('network.explain'));

  function setPlaying(p) {
    S.playing = p;
    const k = p ? 'common.pause' : 'common.train';
    playBtn.innerHTML = `<span data-i18n="${k}">${t(k)}</span>`;
  }

  // ---- adding points ----
  map.canvas.addEventListener('click', (e) => {
    const [x, y] = map.eventToDomain(e);
    lab.data.push({ x, y, c: S.addClass });
    M.complete('network.m4');
    if (!S.playing) render(true);
  });

  function trainStep(k) {
    if (!lab.data.length) return;
    lab.trainer.step(k);
    checkMissions();
    render(true);
  }

  function checkMissions() {
    const acc = lab.net.accuracy(lab.data);
    if (lab.data.length < 20) return;
    if (C.dataset === 'circle' && C.layers === 1 && acc >= 0.97) M.complete('network.m1');
    if (C.dataset === 'xor' && acc >= 0.97) M.complete('network.m2');
    if (C.dataset === 'spiral' && acc >= 0.95) M.complete('network.m3');
  }

  // ---- decision map ----
  function updateField() {
    const n = 64, net = lab.net;
    const vals = new Float64Array(n * n);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++)
        vals[j * n + i] = net.predict(DOMAIN[0] + ((DOMAIN[1] - DOMAIN[0]) * i) / (n - 1), DOMAIN[2] + ((DOMAIN[3] - DOMAIN[2]) * j) / (n - 1));
    map.setField(vals, n, n, classColor);
    map.setContours(vals, n, n, [0.5]);
    map.contourStyle = 'rgba(233,216,166,0.9)';
  }
  map.onDraw = (ctx, p) => {
    p.drawAxes(ctx, { xLabel: 'x₁', yLabel: 'x₂' });
    for (const d of lab.data) {
      const [px, py] = p.toPx(d.x, d.y);
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7);
      ctx.fillStyle = d.c ? ORANGE : BLUE;
      ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#E9D8A6'; ctx.stroke();
    }
  };

  // ---- network diagram with neuron thumbnails ----
  const thumbs = [];
  function thumbCanvas(k) {
    if (!thumbs[k]) { const c = document.createElement('canvas'); c.width = TH; c.height = TH; thumbs[k] = c; }
    return thumbs[k];
  }
  function drawDiagram() {
    if (diag.offsetParent === null) return;
    const net = lab.net, sizes = net.sizes;
    const { w, h: H, ctx } = fitCanvas(diag);
    ctx.clearRect(0, 0, w, H);
    const L = sizes.length;
    const maxN = Math.max(...sizes);
    const box = Math.max(16, Math.min(46, (H - 30) / maxN - 8, (w - 40) / L / 2.2));
    const xs = sizes.map((_, l) => 24 + box / 2 + (l * (w - 48 - box)) / Math.max(1, L - 1));
    const ys = sizes.map((n) => Array.from({ length: n }, (_, k) => H / 2 + (k - (n - 1) / 2) * (box + 8)));
    // activations on a small grid
    const acts = sizes.map((n) => Array.from({ length: n }, () => new Float32Array(TH * TH)));
    for (let j = 0; j < TH; j++)
      for (let i = 0; i < TH; i++) {
        const x = DOMAIN[0] + ((DOMAIN[1] - DOMAIN[0]) * i) / (TH - 1), y = DOMAIN[2] + ((DOMAIN[3] - DOMAIN[2]) * j) / (TH - 1);
        const z = net.forward(x, y);
        const k = (TH - 1 - j) * TH + i;
        for (let l = 0; l < L - 1; l++) for (let q = 0; q < sizes[l]; q++) acts[l][q][k] = net.A[l][q];
        acts[L - 1][0][k] = 1 / (1 + Math.exp(-z));
      }
    // edges
    for (let l = 0; l < L - 1; l++) {
      const Ly = net.layers[l];
      for (let j = 0; j < Ly.outN; j++)
        for (let i = 0; i < Ly.inN; i++) {
          const wv = net.params[Ly.wOff + j * Ly.inN + i];
          ctx.strokeStyle = wv >= 0 ? ORANGE : BLUE;
          ctx.globalAlpha = 0.2 + Math.min(Math.abs(wv) / 3, 0.75);
          ctx.lineWidth = Math.min(0.6 + Math.abs(wv) * 1.2, 6);
          const x1 = xs[l] + box / 2, y1 = ys[l][i], x2 = xs[l + 1] - box / 2, y2 = ys[l + 1][j];
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
          ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
    // neurons
    let tk = 0;
    for (let l = 0; l < L; l++) {
      for (let q = 0; q < sizes[l]; q++) {
        const a = acts[l][q];
        let lo = Infinity, hi = -Infinity;
        for (const v of a) { if (v < lo) lo = v; if (v > hi) hi = v; }
        const c = thumbCanvas(tk++);
        const cctx = c.getContext('2d');
        const img = cctx.createImageData(TH, TH);
        for (let k = 0; k < TH * TH; k++) {
          let u;
          if (l === 0) u = (a[k] - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0]);
          else if (l === L - 1) u = a[k];
          else if (net.act === 'tanh') u = (a[k] + 1) / 2;
          else if (net.act === 'sigmoid') u = a[k];
          else u = hi > 1e-9 ? 0.5 + (0.5 * a[k]) / hi : 0.5;
          const col = classColor(u);
          img.data[k * 4] = col[0]; img.data[k * 4 + 1] = col[1]; img.data[k * 4 + 2] = col[2]; img.data[k * 4 + 3] = 255;
        }
        cctx.putImageData(img, 0, 0);
        const x = xs[l] - box / 2, y = ys[l][q] - box / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(c, x, y, box, box);
        ctx.strokeStyle = l === L - 1 ? '#E9D8A6' : 'rgba(233,216,166,0.7)';
        ctx.lineWidth = l === L - 1 ? 2.5 : 1.2;
        ctx.strokeRect(x, y, box, box);
      }
    }
    ctx.fillStyle = 'rgba(233,216,166,0.65)';
    ctx.font = '12px "Spline Sans Mono Variable", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t('network.input'), xs[0], 16);
    ctx.fillText(t('network.output'), xs[L - 1], 16);
    if (L > 2) ctx.fillText(t('network.hidden'), (xs[1] + xs[L - 2]) / 2, 16);
    ctx.font = '11px "Spline Sans Mono Variable", monospace';
    ctx.fillText('x₁', xs[0], ys[0][0] - box / 2 - 4);
    ctx.fillText('x₂', xs[0], ys[0][1] + box / 2 + 13);
    ctx.textAlign = 'left';
  }

  function render(full) {
    if (full || S.frame % 3 === 0) { updateField(); drawDiagram(); }
    map.draw();
    const tr = lab.trainer;
    const loss = tr.lossHistory.length ? tr.lossHistory[tr.lossHistory.length - 1] : lab.net.loss(lab.data);
    const acc = lab.data.length ? lab.net.accuracy(lab.data) : 0;
    viz.querySelector('.acc').innerHTML = `${t('common.accuracy')}: <b>${Math.round(acc * 100)} %</b>`;
    viz.querySelector('.params').innerHTML = t('network.paramCount', { n: lab.net.nParams });
    statsEl.innerHTML = `
      <div><span class="muted" data-i18n="common.steps">${t('common.steps')}</span><b>${tr.steps}</b></div>
      <div><span class="muted">Loss</span><b>${lab.data.length ? fmt(loss, 3) : '—'}</b></div>
      <div><span class="muted">${t('common.accuracy')}</span><b>${Math.round(acc * 100)} %</b></div>
      <div class="small muted">${t('network.dims', { n: lab.net.nParams })}</div>`;
    chart.setSeries([{ color: '#94D2BD', ys: tr.lossHistory }]);
  }

  // ---- loop ----
  let raf = null;
  function loop() {
    if (!visible) { raf = null; return; }
    raf = requestAnimationFrame(loop);
    S.frame++;
    if (S.playing && lab.data.length) {
      lab.trainer.step(S.speed);
      if (S.frame % 10 === 0) checkMissions();
      render();
    }
  }

  lab.listeners.add(() => {
    lab.trainer.batch = C.batch;
    if (visible) render(true);
  });
  onLangChange(() => render(true));

  return {
    root,
    show() {
      visible = true;
      sData.value = C.dataset; sLayers.value = C.layers; sNeurons.value = C.neurons; sAct.value = C.act;
      render(true);
      if (!raf) raf = requestAnimationFrame(loop);
    },
    hide() { visible = false; setPlaying(false); },
  };
}
