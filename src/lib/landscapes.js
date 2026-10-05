// Synthetic 2D loss landscapes with analytic gradients.
import { makeRng } from './util.js';

const L = {};

L.bowl = {
  domain: [-3, 3, -3, 3],
  lr: 0.1,
  f: (x, y) => 0.5 * (x * x + y * y),
  g: (x, y) => [x, y],
};

L.valley = {
  domain: [-3, 3, -3, 3],
  lr: 0.3,
  f: (x, y) => 0.06 * x * x + 1.5 * y * y,
  g: (x, y) => [0.12 * x, 3 * y],
};

L.twovalleys = {
  domain: [-2.6, 2.6, -2.6, 2.6],
  lr: 0.05,
  f: (x, y) => 0.25 * (x * x - 2) ** 2 + 0.35 * x + 0.6 * y * y + 0.15 * x * y,
  g: (x, y) => [x * (x * x - 2) + 0.35 + 0.15 * y, 1.2 * y + 0.15 * x],
};

L.bumpy = {
  domain: [-4, 4, -4, 4],
  lr: 0.05,
  f: (x, y) => 0.12 * (x * x + y * y) + 0.7 * (2 - Math.cos(2.4 * x) - Math.cos(2.4 * y)),
  g: (x, y) => [0.24 * x + 1.68 * Math.sin(2.4 * x), 0.24 * y + 1.68 * Math.sin(2.4 * y)],
};

L.saddle = {
  domain: [-2.5, 2.5, -2.5, 2.5],
  lr: 0.05,
  f: (x, y) => 0.5 * x * x + 0.3 * (y * y - 1.5) ** 2 + 0.05 * y,
  g: (x, y) => [x, 1.2 * y * (y * y - 1.5) + 0.05],
};

L.banana = {
  domain: [-2, 2, -1, 3],
  lr: 0.01,
  log: true,
  f: (x, y) => (1 - x) ** 2 + 10 * (y - x * x) ** 2,
  g: (x, y) => [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)],
};

/** Random landscape: a gentle bowl with several Gaussian wells of different depth. */
export function makeMystery(seed = Date.now() % 100000, { wells = 7, size = 4 } = {}) {
  const rng = makeRng(seed);
  const W = [];
  for (let k = 0; k < wells; k++) {
    W.push({
      cx: rng.range(-size * 0.8, size * 0.8),
      cy: rng.range(-size * 0.8, size * 0.8),
      a: rng.range(0.6, 2.2),
      s: rng.range(0.45, 1.1),
    });
  }
  // make sure exactly one well is clearly the deepest
  W[0].a = 2.8; W[0].s = rng.range(0.4, 0.6);
  const c = 0.035;
  return {
    domain: [-size, size, -size, size],
    lr: 0.15,
    seed,
    f: (x, y) => {
      let v = c * (x * x + y * y);
      for (const w of W) {
        const dx = x - w.cx, dy = y - w.cy;
        v -= w.a * Math.exp(-(dx * dx + dy * dy) / (2 * w.s * w.s));
      }
      return v;
    },
    g: (x, y) => {
      let gx = 2 * c * x, gy = 2 * c * y;
      for (const w of W) {
        const dx = x - w.cx, dy = y - w.cy;
        const e = w.a * Math.exp(-(dx * dx + dy * dy) / (2 * w.s * w.s)) / (w.s * w.s);
        gx += e * dx; gy += e * dy;
      }
      return [gx, gy];
    },
  };
}

export const LANDSCAPE_IDS = ['bowl', 'valley', 'twovalleys', 'bumpy', 'saddle', 'banana', 'mystery'];

/** Returns a landscape object with precomputed stats (range, global minimum). */
export function getLandscape(id, seed) {
  const base = id === 'mystery' ? makeMystery(seed) : L[id];
  const ls = { id, ...base };
  analyze(ls);
  return ls;
}

export function analyze(ls) {
  const [x0, x1, y0, y1] = ls.domain;
  const n = 160;
  let lo = Infinity, hi = -Infinity, bx = 0, by = 0;
  for (let j = 0; j < n; j++) {
    const y = y0 + ((y1 - y0) * j) / (n - 1);
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1);
      const v = ls.f(x, y);
      if (v < lo) { lo = v; bx = x; by = y; }
      if (v > hi) hi = v;
    }
  }
  // refine the minimum with small gradient steps
  for (let k = 0; k < 3000; k++) {
    const [gx, gy] = ls.g(bx, by);
    const step = 0.002;
    bx -= step * gx; by -= step * gy;
  }
  ls.fmin = Math.min(lo, ls.f(bx, by));
  ls.fmax = hi;
  ls.argmin = [bx, by];
  ls.display = ls.log ? (v) => Math.log(v - ls.fmin + 0.05) : (v) => v;
  return ls;
}
