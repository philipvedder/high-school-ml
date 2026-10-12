// Small helpers shared across the app.

export function makeRng(seed = 1) {
  let s = seed >>> 0 || 1;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let spare = null;
  rand.normal = () => {
    if (spare !== null) { const v = spare; spare = null; return v; }
    let u = 0, v = 0;
    while (u === 0) u = rand();
    v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    spare = r * Math.sin(2 * Math.PI * v);
    return r * Math.cos(2 * Math.PI * v);
  };
  rand.range = (a, b) => a + (b - a) * rand();
  return rand;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/** Create a DOM element from an HTML string. */
export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function fmt(v, d = 2) {
  if (!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) return v.toExponential(1).replace('-', '−');
  return v.toFixed(d).replace('-', '−');
}

/** Run `work(i)` for i in [0,n) in time-sliced chunks so the UI stays responsive. */
export async function chunked(n, work, onProgress, budgetMs = 25) {
  let i = 0;
  while (i < n) {
    const t0 = performance.now();
    while (i < n && performance.now() - t0 < budgetMs) work(i++);
    onProgress?.(i / n);
    await new Promise((r) => setTimeout(r, 0));
  }
}

/** Resize a canvas to its CSS size times devicePixelRatio. Returns {w,h} in CSS px. */
export function fitCanvas(canvas) {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(r.width));
  const hh = Math.max(1, Math.round(r.height));
  if (canvas.width !== w * dpr || canvas.height !== hh * dpr) {
    canvas.width = w * dpr;
    canvas.height = hh * dpr;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h: hh, ctx };
}

export function drawArrow(ctx, x1, y1, x2, y2, color, width = 2.5, head = 9) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1) return;
  const ux = dx / len, uy = dy / len;
  const hd = Math.min(head, len * 0.6);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * hd * 0.8, y2 - uy * hd * 0.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hd - uy * hd * 0.55, y2 - uy * hd + ux * hd * 0.55);
    ctx.lineTo(x2 - ux * hd + uy * hd * 0.55, y2 - uy * hd - ux * hd * 0.55);
    ctx.closePath();
    ctx.fill();
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // dark outline first, so the arrow reads on any background
  ctx.strokeStyle = 'rgba(0,18,25,0.75)';
  ctx.fillStyle = 'rgba(0,18,25,0.75)';
  ctx.lineWidth = width + 3;
  shape();
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  shape();
  ctx.restore();
}

export function onVisibleResize(el, cb) {
  const ro = new ResizeObserver(() => cb());
  ro.observe(el);
  return ro;
}
