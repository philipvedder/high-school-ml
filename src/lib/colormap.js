// Colour system. Palette: https://coolors.co/palette/001219-005f73-0a9396-94d2bd-e9d8a6-ee9b00-ca6702-bb3e03-ae2012-9b2226
// All colour-map functions return [r,g,b] in 0..255.

export const PAL = {
  ink: '#001219', // background
  deep: '#005F73',
  teal: '#0A9396',
  mint: '#94D2BD',
  sand: '#E9D8A6', // main text / highlights
  amber: '#EE9B00',
  orange: '#CA6702',
  rust: '#BB3E03',
  red: '#AE2012',
  wine: '#9B2226',
};

// Loss landscapes: a cool valley floor that warms up quickly towards the peaks.
const TERRAIN = [
  [0.0, [0, 80, 98]],
  [0.06, [10, 147, 150]],
  [0.14, [148, 210, 189]],
  [0.26, [233, 216, 166]],
  [0.42, [238, 155, 0]],
  [0.6, [202, 103, 2]],
  [0.76, [187, 62, 3]],
  [0.9, [174, 32, 18]],
  [1.0, [155, 34, 38]],
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

/** Landscape colour: 0 = valley floor (teal), 1 = high peak (wine red). */
export const terrain = (t) => ramp(TERRAIN, t);

const CLASS = [
  [0.0, [0, 95, 115]],
  [0.5, [6, 36, 44]],
  [1.0, [202, 103, 2]],
];
/** Classifier output colour: 0 = teal class, 1 = amber class. */
export const classColor = (p) => ramp(CLASS, p);

// class colours (names kept for compatibility: BLUE = class 0, ORANGE = class 1)
export const BLUE = PAL.teal;
export const ORANGE = PAL.amber;
export const BALL_COLORS = [PAL.sand, PAL.mint, PAL.amber, '#ffffff', PAL.teal, PAL.rust, PAL.orange, PAL.red];
export const OPT_COLORS = { gd: PAL.sand, momentum: PAL.mint, adam: PAL.amber };
export const CATEGORICAL = [PAL.amber, PAL.mint, PAL.rust, PAL.sand, PAL.teal, PAL.orange, PAL.red, '#ffffff', PAL.deep, PAL.wine];

export const MONO = '"Spline Sans Mono Variable", ui-monospace, Menlo, monospace';

export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
