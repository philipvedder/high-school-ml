// 2D canvas plot: a coloured scalar field + contour lines + custom overlay.
import { fitCanvas } from './util.js';

/** Sample f on an nx × ny grid over domain. values[j*nx+i] at (x_i, y_j), j=0 is ymin. */
export function sampleGrid(f, domain, nx, ny = nx) {
  const [x0, x1, y0, y1] = domain;
  const v = new Float64Array(nx * ny);
  for (let j = 0; j < ny; j++) {
    const y = y0 + ((y1 - y0) * j) / (ny - 1);
    for (let i = 0; i < nx; i++) v[j * nx + i] = f(x0 + ((x1 - x0) * i) / (nx - 1), y);
  }
  return v;
}

/** Marching squares. Returns flat array of segments [x1,y1,x2,y2,...] in grid index coordinates. */
const CASES = [
  [], [3, 0], [0, 1], [3, 1], [1, 2], [3, 0, 1, 2], [0, 2], [3, 2],
  [2, 3], [0, 2], [0, 1, 2, 3], [1, 2], [1, 3], [0, 1], [3, 0], [],
];
export function marchingSquares(values, nx, ny, level, out = []) {
  const pt = (e, i, j, v0, v1, v2, v3) => {
    switch (e) {
      case 0: return [i + (level - v0) / (v1 - v0), j];
      case 1: return [i + 1, j + (level - v1) / (v2 - v1)];
      case 2: return [i + (level - v3) / (v2 - v3), j + 1];
      default: return [i, j + (level - v0) / (v3 - v0)];
    }
  };
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const v0 = values[j * nx + i], v1 = values[j * nx + i + 1];
      const v2 = values[(j + 1) * nx + i + 1], v3 = values[(j + 1) * nx + i];
      const c = (v0 > level ? 1 : 0) | (v1 > level ? 2 : 0) | (v2 > level ? 4 : 0) | (v3 > level ? 8 : 0);
      const es = CASES[c];
      for (let k = 0; k < es.length; k += 2) {
        const a = pt(es[k], i, j, v0, v1, v2, v3);
        const b = pt(es[k + 1], i, j, v0, v1, v2, v3);
        out.push(a[0], a[1], b[0], b[1]);
      }
    }
  }
  return out;
}

/** Evenly spaced levels between min and max of the values (excluding ends). */
export function autoLevels(values, n = 14) {
  let lo = Infinity, hi = -Infinity;
  for (const v of values) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const lv = [];
  for (let k = 1; k <= n; k++) lv.push(lo + ((hi - lo) * k) / (n + 1));
  return lv;
}

export class Plot2D {
  constructor(canvas, domain) {
    this.canvas = canvas;
    this.domain = domain;
    this.bg = null;
    this.segs = null;
    this.onDraw = null;
    this.contourStyle = 'rgba(255,255,255,0.28)';
    this.ro = new ResizeObserver(() => this.draw());
    this.ro.observe(canvas);
  }
  setDomain(d) { this.domain = d; }
  toPx(x, y) {
    const [x0, x1, y0, y1] = this.domain;
    return [((x - x0) / (x1 - x0)) * this.w, (1 - (y - y0) / (y1 - y0)) * this.h];
  }
  fromPx(px, py) {
    const [x0, x1, y0, y1] = this.domain;
    return [x0 + (px / this.w) * (x1 - x0), y0 + (1 - py / this.h) * (y1 - y0)];
  }
  /** Convert a pointer event to domain coordinates. */
  eventToDomain(e) {
    const r = this.canvas.getBoundingClientRect();
    return this.fromPx(e.clientX - r.left, e.clientY - r.top);
  }
  /** colorFn(value) -> [r,g,b]; values are sampled on grid nx×ny. */
  setField(values, nx, ny, colorFn) {
    const c = this.bg || document.createElement('canvas');
    c.width = nx; c.height = ny;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(nx, ny);
    for (let j = 0; j < ny; j++) {
      const row = ny - 1 - j; // flip: image row 0 is ymax
      for (let i = 0; i < nx; i++) {
        const col = colorFn(values[j * nx + i]);
        const o = (row * nx + i) * 4;
        img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    this.bg = c;
    this.fieldNx = nx; this.fieldNy = ny;
  }
  clearField() { this.bg = null; }
  setContours(values, nx, ny, levels) {
    const segs = [];
    for (const l of levels) marchingSquares(values, nx, ny, l, segs);
    // convert grid coords to domain coords
    const [x0, x1, y0, y1] = this.domain;
    for (let k = 0; k < segs.length; k += 2) {
      segs[k] = x0 + (segs[k] / (nx - 1)) * (x1 - x0);
      segs[k + 1] = y0 + (segs[k + 1] / (ny - 1)) * (y1 - y0);
    }
    this.segs = segs;
  }
  clearContours() { this.segs = null; }
  drawBackground(ctx) {
    if (this.bg) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(this.bg, 0, 0, this.w, this.h);
    }
  }
  drawContours(ctx) {
    if (!this.segs) return;
    ctx.strokeStyle = this.contourStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const s = this.segs;
    for (let k = 0; k < s.length; k += 4) {
      const a = this.toPx(s[k], s[k + 1]);
      const b = this.toPx(s[k + 2], s[k + 3]);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  }
  draw() {
    if (!this.canvas.isConnected || this.canvas.offsetParent === null) return;
    const { w, h, ctx } = fitCanvas(this.canvas);
    this.w = w; this.h = h;
    ctx.clearRect(0, 0, w, h);
    if (this.customBackground) this.customBackground(ctx, this);
    else { this.drawBackground(ctx); this.drawContours(ctx); }
    this.onDraw?.(ctx, this);
  }
  /** Light axes with tick labels. */
  drawAxes(ctx, { xLabel = '', yLabel = '', ticks = 5, color = 'rgba(255,255,255,0.55)' } = {}) {
    const [x0, x1, y0, y1] = this.domain;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.lineWidth = 1;
    const nice = (a, b) => {
      const raw = (b - a) / ticks;
      const p = Math.pow(10, Math.floor(Math.log10(raw)));
      const m = raw / p;
      return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
    };
    const sx = nice(x0, x1), sy = nice(y0, y1);
    ctx.textAlign = 'center';
    for (let x = Math.ceil(x0 / sx) * sx; x <= x1 + 1e-9; x += sx) {
      const [px] = this.toPx(x, 0);
      ctx.beginPath(); ctx.moveTo(px, this.h); ctx.lineTo(px, this.h - 5); ctx.stroke();
      ctx.fillText(+x.toFixed(6) + '', px, this.h - 8);
    }
    ctx.textAlign = 'left';
    for (let y = Math.ceil(y0 / sy) * sy; y <= y1 + 1e-9; y += sy) {
      const [, py] = this.toPx(0, y);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(5, py); ctx.stroke();
      ctx.fillText(+y.toFixed(6) + '', 8, py + 4);
    }
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    if (xLabel) ctx.fillText(xLabel, this.w - 8, this.h - 22);
    ctx.textAlign = 'left';
    if (yLabel) ctx.fillText(yLabel, 30, 16);
    ctx.restore();
  }
}
