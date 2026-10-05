// Colour maps. All functions return [r,g,b] in 0..255.

const TERRAIN = [
  [0.0, [20, 30, 110]],
  [0.12, [30, 90, 200]],
  [0.28, [30, 180, 210]],
  [0.45, [60, 200, 130]],
  [0.62, [225, 215, 100]],
  [0.8, [240, 130, 50]],
  [1.0, [200, 50, 70]],
];

function ramp(stops, t) {
  if (!(t > 0)) t = 0;
  if (t > 1) t = 1;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const u = (t - t0) / (t1 - t0);
      return [c0[0] + (c1[0] - c0[0]) * u, c0[1] + (c1[1] - c0[1]) * u, c0[2] + (c1[2] - c0[2]) * u];
    }
  }
  return stops[stops.length - 1][1];
}

/** Landscape colour: 0 = deep valley (blue), 1 = high peak (red). */
export const terrain = (t) => ramp(TERRAIN, t);

const CLASS = [
  [0.0, [37, 99, 200]],
  [0.5, [34, 38, 56]],
  [1.0, [215, 105, 30]],
];
/** Classifier output colour: 0 = blue class, 1 = orange class. */
export const classColor = (p) => ramp(CLASS, p);

export const BLUE = '#3b82f6';
export const ORANGE = '#f97316';
export const BALL_COLORS = ['#f43f5e', '#facc15', '#22d3ee', '#a78bfa', '#4ade80', '#fb923c', '#f472b6', '#ffffff'];
export const OPT_COLORS = { gd: '#f43f5e', momentum: '#facc15', adam: '#22d3ee' };

export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
