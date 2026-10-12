// Minimal responsive line chart on canvas.
import { fitCanvas, fmt } from './util.js';

export class LineChart {
  constructor(canvas, { yLabel = '', xLabel = '', log = false } = {}) {
    this.canvas = canvas;
    this.series = [];
    this.yLabel = yLabel;
    this.xLabel = xLabel;
    this.log = log;
    this.markers = []; // vertical markers {x, color, label}
    this.xRange = null; // optional fixed [x0, x1]
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(canvas);
  }
  /** series: [{ color, points: [[x,y],...] } | { color, ys: [...] }] */
  setSeries(series) { this.series = series; this.draw(); }
  draw() {
    if (this.canvas.offsetParent === null) return;
    const { w, h, ctx } = fitCanvas(this.canvas);
    ctx.clearRect(0, 0, w, h);
    const padL = 46, padR = 10, padT = 10, padB = 22;
    const tr = (y) => (this.log ? Math.log10(Math.max(y, 1e-6)) : y);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const all = this.series.map((s) => s.points || s.ys.map((y, i) => [i, y]));
    for (const pts of all)
      for (const [x, y] of pts) {
        if (!isFinite(y)) continue;
        const ty = tr(y);
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (ty < y0) y0 = ty; if (ty > y1) y1 = ty;
      }
    if (this.xRange) [x0, x1] = this.xRange;
    ctx.strokeStyle = 'rgba(233,216,166,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padL, padT, w - padL - padR, h - padT - padB);
    ctx.fillStyle = 'rgba(233,216,166,0.55)';
    ctx.font = '11px "Spline Sans Mono Variable", monospace';
    if (!isFinite(x0) || !isFinite(y0)) {
      ctx.textAlign = 'center';
      ctx.fillText('—', w / 2, h / 2);
      return;
    }
    if (y1 - y0 < 1e-9) { y0 -= 0.5; y1 += 0.5; }
    if (x1 - x0 < 1e-9) x1 = x0 + 1;
    const pad = (y1 - y0) * 0.06;
    y0 -= pad; y1 += pad;
    const X = (x) => padL + ((x - x0) / (x1 - x0)) * (w - padL - padR);
    const Y = (y) => padT + (1 - (tr(y) - y0) / (y1 - y0)) * (h - padT - padB);
    // y ticks
    ctx.textAlign = 'right';
    for (let k = 0; k <= 3; k++) {
      const ty = y0 + ((y1 - y0) * k) / 3;
      const py = padT + (1 - k / 3) * (h - padT - padB);
      ctx.fillText(this.log ? sig(Math.pow(10, ty)) : fmt(ty, 2), padL - 4, py + 4);
      ctx.strokeStyle = 'rgba(233,216,166,0.06)';
      ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(w - padR, py); ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.fillText(fmt(x0, x0 % 1 ? 2 : 0), padL + 8, h - 6);
    ctx.fillText(fmt(x1, x1 % 1 ? 2 : 0), w - padR - 12, h - 6);
    if (this.xLabel) ctx.fillText(this.xLabel, (padL + w) / 2, h - 6);
    if (this.yLabel) { ctx.textAlign = 'left'; ctx.fillText(this.yLabel, padL + 6, padT + 12); }
    for (const m of this.markers) {
      const px = X(m.x);
      ctx.strokeStyle = m.color || '#E9D8A6';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, h - padB); ctx.stroke();
      ctx.setLineDash([]);
      if (m.label) { ctx.fillStyle = m.color || '#E9D8A6'; ctx.textAlign = 'center'; ctx.fillText(m.label, px, padT + 24); }
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(padL, padT, w - padL - padR, h - padT - padB); ctx.clip();
    all.forEach((pts, si) => {
      ctx.strokeStyle = this.series[si].color;
      ctx.lineWidth = this.series[si].width || 2;
      ctx.beginPath();
      let started = false;
      for (const [x, y] of pts) {
        if (!isFinite(y)) { started = false; continue; }
        const px = X(x), py = Y(y);
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      if (this.series[si].dots) {
        ctx.fillStyle = this.series[si].color;
        for (const [x, y] of pts) if (isFinite(y)) { ctx.beginPath(); ctx.arc(X(x), Y(y), 3, 0, 7); ctx.fill(); }
      }
    });
    ctx.restore();
  }
}

function sig(v) {
  if (v >= 0.01 && v < 1000) return +v.toPrecision(2) + '';
  return v.toExponential(0).replace('-', '−');
}
