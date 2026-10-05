// Station 6 – Research: visualise the loss landscape of the real network from station 5.
import { stationShell, slider, segmented, button, row, card, toggle, select } from '../lib/ui.js';
import { Plot2D, autoLevels } from '../lib/plot2d.js';
import { Surface3D } from '../lib/surface3d.js';
import { LineChart } from '../lib/linechart.js';
import { terrain, classColor, BLUE, ORANGE } from '../lib/colormap.js';
import { lab, Trainer } from '../lib/lab.js';
import { MLP } from '../lib/nn.js';
import { makeRng, fmt, chunked, h } from '../lib/util.js';
import { t, onLangChange } from '../i18n.js';

export function create() {
  const { root, viz, panel } = stationShell(6, 'research');
  lab.ensure();
  const S = { tab: 'slice', range: 1, res: 41, seed: 1, filterNorm: true, log: true, busy: false, interpMode: 'twoRuns', tScrub: 0.5 };
  let visible = false;
  let surfaceData = null; // {values, n, domain, path?}
  let interp = null; // {ts, losses, accs, th0, th1}

  viz.classList.add('research-viz');
  viz.innerHTML = `
    <div class="cta card" hidden>
      <div><b data-i18n="research.untrained"></b><div class="muted small" data-i18n="research.untrainedHint"></div></div>
      <div class="btn-row"><a class="btn" href="#network" data-i18n="research.goTrain"></a><button class="btn primary quick" data-i18n="research.quickTrain"></button></div>
    </div>
    <div class="progress" hidden><div class="bar"></div><span class="ptext"></span></div>
    <div class="rgroup g3d two">
      <div class="three-box"></div>
      <div class="plot-box square"><canvas class="rmap"></canvas><div class="plot-badge rbadge"></div></div>
      <div class="below card rinfo"></div>
    </div>
    <div class="rgroup ginterp two" hidden>
      <div class="chart-box tall"><canvas class="ichart"></canvas></div>
      <div class="plot-box square"><canvas class="imap"></canvas><div class="plot-badge ibadge"></div></div>
      <div class="below card iinfo"></div>
    </div>`;
  const cta = viz.querySelector('.cta');
  const prog = viz.querySelector('.progress');
  const g3d = viz.querySelector('.g3d'), ginterp = viz.querySelector('.ginterp');
  const s3d = new Surface3D(viz.querySelector('.three-box'));
  const rmap = new Plot2D(viz.querySelector('.rmap'), [-1, 1, -1, 1]);
  const ichart = new LineChart(viz.querySelector('.ichart'), { yLabel: 'Loss', log: true });
  const imap = new Plot2D(viz.querySelector('.imap'), [-2.4, 2.4, -2.4, 2.4]);
  const rinfo = viz.querySelector('.rinfo'), iinfo = viz.querySelector('.iinfo');

  // ---- controls ----
  const sTab = segmented({
    options: [{ value: 'slice', label: 'research.tab.slice' }, { value: 'traj', label: 'research.tab.traj' }, { value: 'interp', label: 'research.tab.interp' }],
    value: S.tab,
    onChange: (v) => { S.tab = v; switchTab(); },
  });
  panel.appendChild(card('research.view', sTab));

  const sRange = slider({ label: 'research.range', min: 0.2, max: 3, step: 0.05, value: S.range, onInput: (v) => { S.range = v; } });
  const sRes = select({
    label: 'research.resolution',
    options: [{ value: 21, label: { raw: '21 × 21' } }, { value: 41, label: { raw: '41 × 41' } }, { value: 61, label: { raw: '61 × 61' } }],
    value: S.res,
    onChange: (v) => { S.res = +v; },
  });
  const tFilter = toggle({ label: 'research.filterNorm', value: true, onChange: (v) => { S.filterNorm = v; } });
  const tLog = toggle({ label: 'research.log', value: true, onChange: (v) => { S.log = v; showSurface(); } });
  const computeBtn = button('research.compute', () => compute(), 'primary');
  const newDirBtn = button('research.newDirs', () => { S.seed++; compute(); });
  const sliceCard = card('research.sliceSettings', sRange, sRes, tFilter, tLog, row(computeBtn, newDirBtn));
  panel.appendChild(sliceCard);

  const sMode = select({
    label: 'research.interpMode',
    options: [{ value: 'twoRuns', label: 'research.mode.twoRuns' }, { value: 'init', label: 'research.mode.init' }, { value: 'perm', label: 'research.mode.perm' }],
    value: S.interpMode,
    onChange: (v) => { S.interpMode = v; },
  });
  const interpBtn = button('research.compute', () => computeInterp(), 'primary');
  const sT = slider({ label: { raw: 't' }, min: -0.25, max: 1.25, step: 0.01, value: S.tScrub, onInput: (v) => { S.tScrub = v; drawInterp(); } });
  const interpCard = card('research.interpSettings', sMode, row(interpBtn), sT);
  panel.appendChild(interpCard);

  const notes = h('<details class="card explain" open><summary data-i18n="research.notesTitle"></summary><div class="explain-body notes-body"></div></details>');
  panel.appendChild(notes);

  viz.querySelector('.quick').addEventListener('click', () => quickTrain());

  function switchTab() {
    g3d.hidden = S.tab === 'interp';
    ginterp.hidden = S.tab !== 'interp';
    sliceCard.style.display = S.tab === 'slice' ? '' : 'none';
    interpCard.style.display = S.tab === 'interp' ? '' : 'none';
    const nb = notes.querySelector('.notes-body');
    nb.dataset.i18n = `research.notes.${S.tab}`;
    nb.innerHTML = t(nb.dataset.i18n);
    s3d.setActive(visible && S.tab !== 'interp');
    if (S.tab === 'interp') { if (!interp) iinfo.innerHTML = t('research.interpIntro'); drawInterp(); }
    else compute();
  }

  function trained() { return lab.trainer && lab.trainer.steps >= 30 && lab.data.length > 0; }
  function updateCta() { cta.hidden = trained(); }

  function setProgress(p, text = '') {
    prog.hidden = p >= 1;
    prog.querySelector('.bar').style.width = `${Math.round(p * 100)}%`;
    prog.querySelector('.ptext').textContent = text;
  }

  async function quickTrain() {
    if (S.busy) return;
    S.busy = true;
    Object.assign(lab.config, { opt: 'adam', lr: 0.03, batch: 0 });
    lab.reset();
    await chunked(60, () => lab.trainer.step(25), (p) => setProgress(p, t('research.training')));
    lab.changed();
    S.busy = false;
    updateCta();
    switchTab();
  }

  // ---------- 2D slice & trajectory ----------
  function randomDirection(net, rng) {
    const d = new Float64Array(net.nParams);
    for (let i = 0; i < d.length; i++) d[i] = rng.normal();
    if (S.filterNorm) {
      for (const g of net.neuronGroups()) {
        let nd = 0, nt = 0;
        for (const i of g) { nd += d[i] * d[i]; nt += net.params[i] * net.params[i]; }
        const s = Math.sqrt(nt) / (Math.sqrt(nd) || 1);
        for (const i of g) d[i] *= s;
      }
    } else {
      let nd = 0, nt = 0;
      for (let i = 0; i < d.length; i++) { nd += d[i] * d[i]; nt += net.params[i] ** 2; }
      const s = Math.sqrt(nt / nd);
      for (let i = 0; i < d.length; i++) d[i] *= s;
    }
    return d;
  }

  /** Top-2 PCA directions of the trajectory (relative to the final point). */
  function pcaDirections(traj, final) {
    const T = traj.length, P = final.length;
    const X = traj.map((th) => { const r = new Float64Array(P); for (let i = 0; i < P; i++) r[i] = th[i] - final[i]; return r; });
    const C = Array.from({ length: T }, () => new Float64Array(T));
    for (let a = 0; a < T; a++)
      for (let b = a; b < T; b++) {
        let s = 0;
        for (let i = 0; i < P; i++) s += X[a][i] * X[b][i];
        C[a][b] = C[b][a] = s;
      }
    let trace = 0;
    for (let a = 0; a < T; a++) trace += C[a][a];
    const rng = makeRng(5);
    const eig = (deflate) => {
      let u = new Float64Array(T).map(() => rng.normal());
      let lam = 0;
      for (let it = 0; it < 200; it++) {
        const v = new Float64Array(T);
        for (let a = 0; a < T; a++) { let s = 0; for (let b = 0; b < T; b++) s += C[a][b] * u[b]; v[a] = s; }
        if (deflate) { const [u1, l1] = deflate; let dot = 0; for (let a = 0; a < T; a++) dot += u1[a] * u[a]; for (let a = 0; a < T; a++) v[a] -= l1 * u1[a] * dot; }
        let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1;
        lam = n;
        u = v.map((x) => x / n);
      }
      return [u, lam];
    };
    const e1 = eig(null);
    const e2 = eig(e1);
    const dirs = [e1, e2].map(([u]) => {
      const d = new Float64Array(P);
      for (let a = 0; a < T; a++) for (let i = 0; i < P; i++) d[i] += u[a] * X[a][i];
      let n = 0; for (const x of d) n += x * x; n = Math.sqrt(n) || 1;
      return d.map((x) => x / n);
    });
    // make the second direction exactly orthogonal to the first
    let dot = 0; for (let i = 0; i < P; i++) dot += dirs[0][i] * dirs[1][i];
    for (let i = 0; i < P; i++) dirs[1][i] -= dot * dirs[0][i];
    let n2 = 0; for (const x of dirs[1]) n2 += x * x; n2 = Math.sqrt(n2) || 1;
    dirs[1] = dirs[1].map((x) => x / n2);
    const coords = X.map((r) => dirs.map((d) => { let s = 0; for (let i = 0; i < P; i++) s += r[i] * d[i]; return s; }));
    return { dirs, coords, explained: [e1[1] / (trace || 1), e2[1] / (trace || 1)] };
  }

  let computeToken = 0;
  async function compute() {
    updateCta();
    if (!lab.data.length || S.tab === 'interp') return;
    const token = ++computeToken;
    const net = lab.net.clone();
    const theta = new Float64Array(lab.net.params);
    const data = lab.data;
    let d1, d2, domain, path = null, explained = null;
    if (S.tab === 'traj') {
      const traj = lab.trainer.trajectory.concat([theta]);
      if (traj.length < 6) { surfaceData = null; rinfo.innerHTML = t('research.noTraj'); s3d.clearObjects(); rmap.draw(); return; }
      const pca = pcaDirections(traj, theta);
      [d1, d2] = pca.dirs;
      explained = pca.explained;
      path = pca.coords;
      let a0 = 0, a1 = 0, b0 = 0, b1 = 0;
      for (const [a, b] of path) { a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
      const span = Math.max(a1 - a0, b1 - b0, 0.2);
      const ca = (a0 + a1) / 2, cb = (b0 + b1) / 2;
      const half = span * 0.65;
      domain = [ca - half, ca + half, cb - half, cb + half];
    } else {
      const rng = makeRng(S.seed * 101 + 7);
      d1 = randomDirection(lab.net, rng);
      d2 = randomDirection(lab.net, rng);
      domain = [-S.range, S.range, -S.range, S.range];
    }
    const n = S.tab === 'traj' ? 41 : S.res;
    const values = new Float64Array(n * n);
    const tmp = new Float64Array(theta.length);
    await chunked(n, (j) => {
      const b = domain[2] + ((domain[3] - domain[2]) * j) / (n - 1);
      for (let i = 0; i < n; i++) {
        const a = domain[0] + ((domain[1] - domain[0]) * i) / (n - 1);
        for (let k = 0; k < tmp.length; k++) tmp[k] = theta[k] + a * d1[k] + b * d2[k];
        values[j * n + i] = net.loss(data, tmp);
      }
    }, (p) => { if (token === computeToken) setProgress(p, t('research.computing')); });
    if (token !== computeToken) return;
    setProgress(1);
    const center = net.loss(data, theta);
    surfaceData = { values, n, domain, path, explained, center, mode: S.tab, nParams: theta.length };
    showSurface();
  }

  function showSurface() {
    if (!surfaceData) return;
    const { values, n, domain, path, explained, center, mode, nParams } = surfaceData;
    const tr = S.log ? (v) => Math.log(v + 1e-3) : (v) => v;
    s3d.clearObjects();
    s3d.setGrid(values, n, n, domain, { transform: tr, clipQuantile: S.log ? 1 : 0.9 });
    const disp = values.map(tr);
    const sorted = Array.from(disp).sort((a, b) => a - b);
    const lo = sorted[0], hi = sorted[Math.floor((sorted.length - 1) * (S.log ? 1 : 0.9))];
    rmap.setDomain(domain);
    rmap.setField(disp, n, n, (v) => terrain((v - lo) / (hi - lo || 1)));
    rmap.setContours(disp.map((v) => Math.min(v, hi)), n, n, autoLevels(disp.map((v) => Math.min(v, hi)), 16));
    s3d.addMarker(0, 0, center, 0xfacc15, '★');
    if (path) {
      const pts = path.map(([a, b]) => [a, b]);
      s3d.addPath(pts, 0xffffff);
      s3d.addMarker(...pts[0], s3d.valueAt(...pts[0]), 0x22d3ee, 'Start');
    }
    rmap.onDraw = (ctx, p) => {
      p.drawAxes(ctx, { xLabel: mode === 'traj' ? 'PC 1' : 'α', yLabel: mode === 'traj' ? 'PC 2' : 'β' });
      if (path) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        path.forEach(([a, b], i) => { const q = p.toPx(a, b); i ? ctx.lineTo(...q) : ctx.moveTo(...q); });
        ctx.stroke();
        ctx.fillStyle = '#22d3ee';
        const [sx, sy] = p.toPx(...path[0]);
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
      }
      const [cx, cy] = p.toPx(0, 0);
      ctx.fillStyle = '#facc15'; ctx.font = '22px system-ui'; ctx.textAlign = 'center';
      ctx.fillText('★', cx, cy + 8);
      ctx.textAlign = 'left';
    };
    rmap.draw();
    viz.querySelector('.rbadge').innerHTML = `Loss(★) = <b>${fmt(center, 3)}</b>`;
    rinfo.innerHTML = mode === 'traj'
      ? t('research.trajInfo', { n: nParams, e1: Math.round(explained[0] * 100), e2: Math.round(explained[1] * 100) })
      : t('research.sliceInfo', { n: nParams, arch: lab.net.sizes.join('–') });
  }

  // ---------- interpolation ----------
  async function computeInterp() {
    if (S.busy || !lab.data.length) return;
    S.busy = true;
    const net = lab.net;
    const thA = new Float64Array(net.params);
    let th0 = thA, th1, labels = ['A', 'B'];
    if (S.interpMode === 'init') {
      th0 = new Float64Array(lab.trainer.initParams);
      th1 = thA;
      labels = [t('research.init'), t('research.trained')];
    } else if (S.interpMode === 'perm') {
      if (!net.sizes.slice(1, -1).some((k) => k >= 2)) { iinfo.innerHTML = t('research.permNeedsHidden'); S.busy = false; return; }
      th1 = net.permuted(thA, makeRng(Date.now() % 1e6));
      labels = ['A', 'π(A)'];
    } else {
      const other = new MLP(net.sizes, net.act, lab.config.seed + 1000 + Math.floor(Math.random() * 1000));
      const tr = new Trainer(other, lab.data, { opt: 'adam', lr: 0.03 });
      await chunked(60, () => tr.step(25), (p) => setProgress(p, t('research.trainingB')));
      th1 = new Float64Array(other.params);
    }
    const evalNet = net.clone();
    const ts = [], losses = [];
    const tmp = new Float64Array(thA.length);
    for (let k = 0; k <= 150; k++) {
      const tt = -0.25 + (1.5 * k) / 150;
      for (let i = 0; i < tmp.length; i++) tmp[i] = (1 - tt) * th0[i] + tt * th1[i];
      ts.push(tt);
      losses.push(evalNet.loss(lab.data, tmp));
    }
    setProgress(1);
    interp = { ts, losses, th0, th1, labels, evalNet, mode: S.interpMode };
    S.busy = false;
    drawInterp();
  }

  function paramsAt(tt) {
    const { th0, th1 } = interp;
    const p = new Float64Array(th0.length);
    for (let i = 0; i < p.length; i++) p[i] = (1 - tt) * th0[i] + tt * th1[i];
    return p;
  }

  function drawInterp() {
    if (!interp) { ichart.setSeries([]); imap.clearField(); imap.onDraw = null; imap.draw(); return; }
    const { ts, losses, labels, evalNet, mode } = interp;
    ichart.markers = [{ x: 0, color: '#22d3ee', label: labels[0] }, { x: 1, color: '#f97316', label: labels[1] }, { x: S.tScrub, color: '#facc15' }];
    ichart.xRange = [-0.25, 1.25];
    ichart.setSeries([{ color: '#a78bfa', points: ts.map((tt, i) => [tt, losses[i]]), width: 3 }]);
    const p = paramsAt(S.tScrub);
    const n = 56, D = imap.domain;
    const vals = new Float64Array(n * n);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) vals[j * n + i] = evalNet.predict(D[0] + ((D[1] - D[0]) * i) / (n - 1), D[2] + ((D[3] - D[2]) * j) / (n - 1), p);
    imap.setField(vals, n, n, classColor);
    imap.setContours(vals, n, n, [0.5]);
    imap.contourStyle = 'rgba(255,255,255,0.9)';
    imap.onDraw = (ctx) => {
      for (const d of lab.data) {
        const [px, py] = imap.toPx(d.x, d.y);
        ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 7);
        ctx.fillStyle = d.c ? ORANGE : BLUE; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      }
    };
    imap.draw();
    const L = evalNet.loss(lab.data, p), acc = evalNet.accuracy(lab.data, p);
    viz.querySelector('.ibadge').innerHTML = `t = <b>${fmt(S.tScrub)}</b> · Loss <b>${fmt(L, 3)}</b> · ${Math.round(acc * 100)} %`;
    const lMid = Math.max(...losses.filter((_, i) => ts[i] >= 0 && ts[i] <= 1));
    const lEnds = Math.max(losses[ts.findIndex((x) => x >= 0)], losses[ts.findIndex((x) => x >= 1)]);
    iinfo.innerHTML = t(`research.interpInfo.${mode}`, { barrier: fmt(lMid - lEnds, 3) });
  }

  lab.listeners.add(() => { surfaceData = null; interp = null; });
  onLangChange(() => { if (S.tab === 'interp') drawInterp(); else showSurface(); switchTabNotes(); });
  function switchTabNotes() { const nb = notes.querySelector('.notes-body'); nb.innerHTML = t(nb.dataset.i18n || 'research.notes.slice'); }

  let lastVersion = -1;
  return {
    root,
    show() {
      visible = true;
      updateCta();
      if (lab.version !== lastVersion) { lastVersion = lab.version; surfaceData = null; interp = null; }
      switchTab();
    },
    hide() { visible = false; s3d.setActive(false); },
  };
}
