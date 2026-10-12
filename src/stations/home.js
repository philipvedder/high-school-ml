// Home page and teacher guide.
import { h, fitCanvas } from '../lib/util.js';

export const STATION_LIST = [
  { id: 'neuron', num: 1, icon: '🧠', min: 7 },
  { id: 'loss', num: 2, icon: '📏', min: 7 },
  { id: 'descent', num: 3, icon: '⛰️', min: 8 },
  { id: 'hiker', num: 4, icon: '🌫️', min: 10 },
  { id: 'network', num: 5, icon: '🕸️', min: 7 },
  { id: 'research', num: 6, icon: '🔬', min: 10 },
];

export function createHome() {
  const root = h(`
    <section class="home">
      <div class="hero">
        <canvas class="hero-bg"></canvas>
        <div class="hero-text">
          <div class="kicker" data-i18n="home.kicker"></div>
          <h1>Loss Landscape <i>Lab</i></h1>
          <div class="term"><span class="ps">$</span>./train <span class="arg">--network</span> mine <span class="arg">--until</span> it_learns<span class="caret"></span></div>
          <p class="lead" data-i18n="home.lead"></p>
          <div class="btn-row"><a class="btn primary big" href="#neuron" data-i18n="home.start"></a><a class="btn big" href="./slides.html" data-i18n="home.slides"></a><a class="btn big" href="#guide" data-i18n="home.guide"></a></div>
        </div>
      </div>
      <div class="story card" data-i18n="home.story"></div>
      <div class="cards">
        ${STATION_LIST.map((s) => `
          <a class="station-card" href="#${s.id}">
            <div class="sc-top"><span class="sc-num">${s.num}</span><span class="sc-min">~${s.min} min</span></div>
            <h3 data-i18n="${s.id}.title"></h3>
            <p data-i18n="home.card.${s.id}"></p>
          </a>`).join('')}
      </div>
      <footer class="foot muted small" data-i18n="home.footer"></footer>
    </section>`);

  // animated hero: a ball rolling down a bumpy 1D loss curve with gradient descent
  const canvas = root.querySelector('.hero-bg');
  const f = (x) => 0.35 * Math.sin(3 * x) + 0.25 * Math.sin(7.3 * x + 1) + 0.6 * (x - 0.3) ** 2;
  const df = (x) => 1.05 * Math.cos(3 * x) + 1.825 * Math.cos(7.3 * x + 1) + 1.2 * (x - 0.3);
  let balls = [], raf = null, frame = 0;
  const spawn = () => ({ x: -1.6 + Math.random() * 3.6, v: 0, life: 0, hue: Math.random() < 0.5 ? '#EE9B00' : '#94D2BD' });
  function tick() {
    raf = requestAnimationFrame(tick);
    const { w, h: H, ctx } = fitCanvas(canvas);
    ctx.clearRect(0, 0, w, H);
    const X = (x) => ((x + 1.9) / 4.2) * w;
    const amp = w < 600 ? 0.8 : 0.34;
    const Y = (y) => H * 0.98 - ((y + 0.6) / 2.6) * H * amp;
    const grd = 'rgba(238,155,0,0.10)';
    ctx.beginPath();
    for (let k = 0; k <= 300; k++) { const x = -1.9 + (4.2 * k) / 300; k ? ctx.lineTo(X(x), Y(f(x))) : ctx.moveTo(X(x), Y(f(x))); }
    ctx.lineTo(w, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = grd; ctx.fill();
    ctx.beginPath();
    for (let k = 0; k <= 300; k++) { const x = -1.9 + (4.2 * k) / 300; k ? ctx.lineTo(X(x), Y(f(x))) : ctx.moveTo(X(x), Y(f(x))); }
    ctx.strokeStyle = '#EE9B00'; ctx.lineWidth = 2.5; ctx.stroke();
    if (frame++ % 50 === 0 && balls.length < 6) balls.push(spawn());
    for (const b of balls) {
      b.v = 0.9 * b.v - 0.004 * df(b.x);
      b.x += b.v; b.life++;
      ctx.fillStyle = b.hue;
      ctx.globalAlpha = Math.min(1, b.life / 20, (400 - b.life) / 40);
      ctx.beginPath(); ctx.arc(X(b.x), Y(f(b.x)) - 8, 8, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    balls = balls.filter((b) => b.life < 400);
  }
  return {
    root,
    show() { if (!raf) tick(); },
    hide() { cancelAnimationFrame(raf); raf = null; },
  };
}

export function createGuide() {
  const root = h(`<section class="guide"><div class="card guide-body" data-i18n="guide.body"></div></section>`);
  return { root, show() {}, hide() {} };
}
