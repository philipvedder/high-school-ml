// 2D toy classification data. Points: {x, y, c} with class c ∈ {0, 1}; coordinates roughly in [-2, 2].
import { makeRng } from './util.js';

export const DATASETS = ['circle', 'xor', 'moons', 'spiral', 'blobs'];

export function makeDataset(kind, { n = 200, noise = 0.15, seed = 1 } = {}) {
  const rng = makeRng(seed);
  const pts = [];
  const nz = () => rng.normal() * noise;
  for (let k = 0; k < n; k++) {
    const c = k % 2;
    let x, y;
    switch (kind) {
      case 'circle': {
        const r = c === 0 ? rng.range(0, 0.8) : rng.range(1.25, 1.9);
        const a = rng.range(0, 2 * Math.PI);
        x = r * Math.cos(a) + nz(); y = r * Math.sin(a) + nz();
        break;
      }
      case 'xor': {
        x = rng.range(-1.8, 1.8); y = rng.range(-1.8, 1.8);
        if (Math.abs(x) < 0.15) x += Math.sign(x || 1) * 0.15;
        if (Math.abs(y) < 0.15) y += Math.sign(y || 1) * 0.15;
        const cls = x * y > 0 ? 1 : 0;
        x += nz(); y += nz();
        pts.push({ x, y, c: cls });
        continue;
      }
      case 'moons': {
        const a = rng.range(0, Math.PI);
        if (c === 0) { x = Math.cos(a) * 1.3 - 0.6; y = Math.sin(a) * 1.3 - 0.3; }
        else { x = 0.6 - Math.cos(a) * 1.3; y = 0.3 - Math.sin(a) * 1.3; }
        x += nz(); y += nz();
        break;
      }
      case 'spiral': {
        const t = rng.range(0, 1);
        const r = 0.15 + t * 1.75;
        const a = t * 3.2 * Math.PI + c * Math.PI;
        x = r * Math.cos(a) + nz() * 0.6; y = r * Math.sin(a) + nz() * 0.6;
        break;
      }
      default: { // blobs
        const cx = c === 0 ? -0.9 : 0.9, cy = c === 0 ? -0.6 : 0.6;
        x = cx + rng.normal() * (0.35 + noise); y = cy + rng.normal() * (0.35 + noise);
      }
    }
    pts.push({ x, y, c });
  }
  return pts;
}
