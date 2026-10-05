// A tiny multilayer perceptron with manual backprop. All parameters live in ONE flat
// Float64Array, which makes it easy to explore the loss landscape (θ + α·δ + β·η).
import { makeRng, sigmoid } from './util.js';

export const ACTS = {
  tanh: { f: Math.tanh, df: (a) => 1 - a * a },
  relu: { f: (z) => (z > 0 ? z : 0), df: (a) => (a > 0 ? 1 : 0) },
  sigmoid: { f: sigmoid, df: (a) => a * (1 - a) },
};

export class MLP {
  /** sizes e.g. [2, 6, 6, 1]; output is a single logit, trained with sigmoid + cross-entropy. */
  constructor(sizes, act = 'tanh', seed = 1) {
    this.sizes = sizes.slice();
    this.act = act;
    this.layers = [];
    let off = 0;
    for (let l = 0; l < sizes.length - 1; l++) {
      const inN = sizes[l], outN = sizes[l + 1];
      this.layers.push({ inN, outN, wOff: off, bOff: off + inN * outN });
      off += inN * outN + outN;
    }
    this.nParams = off;
    this.params = new Float64Array(off);
    this.grad = new Float64Array(off);
    this.A = sizes.map((n) => new Float64Array(n));
    this.D = sizes.map((n) => new Float64Array(n));
    this.init(seed);
  }

  init(seed) {
    const rng = makeRng(seed);
    for (const L of this.layers) {
      const s = Math.sqrt(1 / L.inN) * (this.act === 'relu' ? Math.SQRT2 : this.act === 'sigmoid' ? 2 : 1.2);
      for (let i = 0; i < L.inN * L.outN; i++) this.params[L.wOff + i] = rng.normal() * s;
      for (let i = 0; i < L.outN; i++) this.params[L.bOff + i] = this.act === 'relu' ? 0.05 : 0;
    }
  }

  /** Returns the output logit; hidden activations are cached in this.A. */
  forward(x0, x1, p = this.params) {
    const A = this.A;
    A[0][0] = x0; A[0][1] = x1;
    const nL = this.layers.length;
    const f = ACTS[this.act].f;
    for (let l = 0; l < nL; l++) {
      const L = this.layers[l], inp = A[l], out = A[l + 1], last = l === nL - 1;
      for (let j = 0; j < L.outN; j++) {
        let z = p[L.bOff + j];
        const row = L.wOff + j * L.inN;
        for (let i = 0; i < L.inN; i++) z += p[row + i] * inp[i];
        out[j] = last ? z : f(z);
      }
    }
    return A[nL][0];
  }

  predict(x0, x1, p) { return sigmoid(this.forward(x0, x1, p)); }

  /** Mean binary cross-entropy. */
  loss(data, p = this.params) {
    let s = 0;
    for (const d of data) {
      const z = this.forward(d.x, d.y, p);
      s += Math.max(z, 0) - d.c * z + Math.log1p(Math.exp(-Math.abs(z)));
    }
    return s / data.length;
  }

  accuracy(data, p = this.params) {
    let ok = 0;
    for (const d of data) if ((this.forward(d.x, d.y, p) > 0 ? 1 : 0) === d.c) ok++;
    return ok / data.length;
  }

  /** Loss and gradient (into this.grad) over the given samples. */
  lossAndGrad(samples) {
    const p = this.params, g = this.grad, A = this.A, D = this.D;
    const nL = this.layers.length;
    const df = ACTS[this.act].df;
    g.fill(0);
    let loss = 0;
    for (const d of samples) {
      const z = this.forward(d.x, d.y, p);
      loss += Math.max(z, 0) - d.c * z + Math.log1p(Math.exp(-Math.abs(z)));
      D[nL][0] = sigmoid(z) - d.c;
      for (let l = nL - 1; l >= 0; l--) {
        const L = this.layers[l], inp = A[l], dl = D[l + 1];
        for (let j = 0; j < L.outN; j++) {
          const gj = dl[j];
          g[L.bOff + j] += gj;
          const row = L.wOff + j * L.inN;
          for (let i = 0; i < L.inN; i++) g[row + i] += gj * inp[i];
        }
        if (l > 0) {
          const dPrev = D[l];
          for (let i = 0; i < L.inN; i++) {
            let s = 0;
            for (let j = 0; j < L.outN; j++) s += p[L.wOff + j * L.inN + i] * dl[j];
            dPrev[i] = s * df(inp[i]);
          }
        }
      }
    }
    const n = samples.length;
    for (let i = 0; i < g.length; i++) g[i] /= n;
    return loss / n;
  }

  clone() {
    const m = new MLP(this.sizes, this.act, 1);
    m.params.set(this.params);
    return m;
  }

  /** Index ranges [start, end) of each neuron's incoming weights+bias ("filters") – for filter normalization. */
  neuronGroups() {
    const groups = [];
    for (const L of this.layers) {
      for (let j = 0; j < L.outN; j++) {
        const idx = [];
        for (let i = 0; i < L.inN; i++) idx.push(L.wOff + j * L.inN + i);
        idx.push(L.bOff + j);
        groups.push(idx);
      }
    }
    return groups;
  }

  /** Same function, different parameters: randomly permute the neurons in every hidden layer. */
  permuted(params, rng) {
    const out = new Float64Array(params);
    for (let l = 0; l < this.layers.length - 1; l++) {
      const L = this.layers[l], N = this.layers[l + 1];
      const n = L.outN;
      if (n < 2) continue;
      let perm;
      do {
        perm = [...Array(n).keys()];
        for (let i = n - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)); [perm[i], perm[k]] = [perm[k], perm[i]]; }
      } while (perm.every((v, i) => v === i));
      const src = new Float64Array(out);
      for (let j = 0; j < n; j++) {
        const s = perm[j];
        for (let i = 0; i < L.inN; i++) out[L.wOff + j * L.inN + i] = src[L.wOff + s * L.inN + i];
        out[L.bOff + j] = src[L.bOff + s];
        for (let k = 0; k < N.outN; k++) out[N.wOff + k * N.inN + j] = src[N.wOff + k * N.inN + s];
      }
    }
    return out;
  }
}
