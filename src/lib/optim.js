// Optimizers working on Float64Array parameter vectors.

export const OPTIMIZERS = ['gd', 'momentum', 'adam'];

export class Optimizer {
  constructor(type, n, { lr = 0.1, beta = 0.9 } = {}) {
    this.type = type;
    this.lr = lr;
    this.beta = beta;
    this.v = new Float64Array(n);
    this.m = new Float64Array(n);
    this.t = 0;
  }
  reset() { this.v.fill(0); this.m.fill(0); this.t = 0; }
  /** In-place update of params given grads. Returns the step vector length. */
  step(p, g) {
    const n = p.length;
    let sq = 0;
    this.t++;
    if (this.type === 'momentum') {
      for (let i = 0; i < n; i++) {
        this.v[i] = this.beta * this.v[i] + g[i];
        const d = this.lr * this.v[i];
        p[i] -= d; sq += d * d;
      }
    } else if (this.type === 'adam') {
      const b1 = 0.9, b2 = 0.999, eps = 1e-8;
      const c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
      for (let i = 0; i < n; i++) {
        this.m[i] = b1 * this.m[i] + (1 - b1) * g[i];
        this.v[i] = b2 * this.v[i] + (1 - b2) * g[i] * g[i];
        const d = (this.lr * (this.m[i] / c1)) / (Math.sqrt(this.v[i] / c2) + eps);
        p[i] -= d; sq += d * d;
      }
    } else {
      for (let i = 0; i < n; i++) {
        const d = this.lr * g[i];
        p[i] -= d; sq += d * d;
      }
    }
    return Math.sqrt(sq);
  }
}
