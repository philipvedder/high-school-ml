// Shared "lab" state: the network trained in station 5 is analysed in station 6.
import { MLP } from './nn.js';
import { makeDataset } from './datasets.js';
import { Optimizer } from './optim.js';
import { makeRng } from './util.js';

const MAX_SNAPSHOTS = 300;

export class Trainer {
  constructor(net, data, { opt = 'adam', lr = 0.03, batch = 0, seed = 1 } = {}) {
    this.net = net;
    this.data = data;
    this.optType = opt;
    this.opt = new Optimizer(opt, net.nParams, { lr, beta: 0.9 });
    this.batch = batch; // 0 = full batch
    this.rng = makeRng(seed * 7 + 3);
    this.steps = 0;
    this.lossHistory = [];
    this.trajectory = [new Float64Array(net.params)];
    this.snapEvery = 2;
    this.initParams = new Float64Array(net.params);
  }
  setOptimizer(type) {
    if (type === this.optType) return;
    this.optType = type;
    this.opt = new Optimizer(type, this.net.nParams, { lr: this.opt.lr, beta: 0.9 });
  }
  setLr(lr) { this.opt.lr = lr; }
  sample() {
    const d = this.data;
    if (!this.batch || this.batch >= d.length) return d;
    const s = [];
    for (let i = 0; i < this.batch; i++) s.push(d[Math.floor(this.rng() * d.length)]);
    return s;
  }
  step(k = 1) {
    let loss = 0;
    for (let i = 0; i < k; i++) {
      loss = this.net.lossAndGrad(this.sample());
      if (!isFinite(loss)) { this.diverged = true; break; }
      this.opt.step(this.net.params, this.net.grad);
      this.steps++;
      if (this.steps % this.snapEvery === 0) this.snapshot();
    }
    const full = this.net.loss(this.data);
    this.lossHistory.push(full);
    if (this.lossHistory.length > 600) this.lossHistory = this.lossHistory.filter((_, i) => i % 2 === 0);
    return full;
  }
  snapshot() {
    this.trajectory.push(new Float64Array(this.net.params));
    if (this.trajectory.length > MAX_SNAPSHOTS) {
      this.trajectory = this.trajectory.filter((_, i) => i % 2 === 0);
      this.snapEvery *= 2;
    }
  }
}

/** The single shared lab object. */
export const lab = {
  config: { dataset: 'circle', noise: 0.15, layers: 2, neurons: 5, act: 'tanh', opt: 'adam', lr: 0.03, batch: 0, seed: 1, dataSeed: 1 },
  data: null,
  net: null,
  trainer: null,
  version: 0,
  listeners: new Set(),
  sizes() {
    const c = this.config;
    return [2, ...Array(c.layers).fill(c.neurons), 1];
  },
  newData() {
    const c = this.config;
    this.data = makeDataset(c.dataset, { noise: c.noise, seed: c.dataSeed });
    this.reset();
  },
  reset() {
    const c = this.config;
    this.net = new MLP(this.sizes(), c.act, c.seed);
    this.trainer = new Trainer(this.net, this.data, { opt: c.opt, lr: c.lr, batch: c.batch, seed: c.seed });
    this.changed();
  },
  changed() { this.version++; this.listeners.forEach((f) => f()); },
  ensure() { if (!this.data) this.newData(); },
};
