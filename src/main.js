import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/figtree';
import '@fontsource-variable/spline-sans-mono';
import './style.css';
import { applyI18n, setLang, getLang } from './i18n.js';
import { h } from './lib/util.js';
import { createHome, createGuide, STATION_LIST } from './stations/home.js';
import { create as createNeuron } from './stations/neuron.js';
import { create as createLoss } from './stations/lossfit.js';
import { create as createDescent } from './stations/descent.js';
import { create as createHiker } from './stations/hiker.js';
import { create as createNetwork } from './stations/network.js';
import { create as createResearch } from './stations/research.js';

const FACTORIES = {
  home: createHome,
  guide: createGuide,
  neuron: createNeuron,
  loss: createLoss,
  descent: createDescent,
  hiker: createHiker,
  network: createNetwork,
  research: createResearch,
};

const app = document.getElementById('app');
const nav = document.getElementById('topnav');
const pages = {};
let current = null;

nav.appendChild(h(`
  <div class="nav-inner">
    <a href="#home" class="brand"><img src="./favicon.svg" alt=""><span class="brand-name"><span class="tilde">~/</span>loss-landscape-<b>lab</b></span></a>
    <div class="nav-stations">
      ${STATION_LIST.map((s) => `<a href="#${s.id}" data-page="${s.id}"><span class="nnum">${s.num}</span><span class="nlabel" data-i18n="nav.${s.id}"></span></a>`).join('')}
    </div>
    <div class="nav-tools">
      <a href="./slides.html" class="tool" data-i18n-title="nav.slides">slides</a>
      <a href="#guide" data-page="guide" class="tool" data-i18n-title="nav.guide">guide</a>
      <button class="tool presenter" data-i18n-title="nav.presenter">A<sup>+</sup></button>
      <button class="tool fullscreen" data-i18n-title="nav.fullscreen">⛶</button>
      <div class="lang"><button data-lang="de">DE</button><button data-lang="en">EN</button></div>
    </div>
  </div>`));

nav.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); markLang(); }));
function markLang() { nav.querySelectorAll('[data-lang]').forEach((b) => b.classList.toggle('on', b.dataset.lang === getLang())); }

nav.querySelector('.presenter').addEventListener('click', () => {
  const on = document.documentElement.classList.toggle('presenter');
  try { localStorage.setItem('presenter', on ? '1' : ''); } catch { /* ignore */ }
  window.dispatchEvent(new Event('resize'));
});
try { if (localStorage.getItem('presenter')) document.documentElement.classList.add('presenter'); } catch { /* ignore */ }

nav.querySelector('.fullscreen').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
});

function route() {
  const id = (location.hash || '#home').slice(1);
  const key = FACTORIES[id] ? id : 'home';
  if (current === key) return;
  if (current) { pages[current].hide(); pages[current].root.hidden = true; }
  if (!pages[key]) {
    pages[key] = FACTORIES[key]();
    app.appendChild(pages[key].root);
    applyI18n(pages[key].root);
  }
  pages[key].root.hidden = false;
  current = key;
  nav.querySelectorAll('[data-page]').forEach((a) => a.classList.toggle('active', a.dataset.page === key));
  // on phones the station tabs scroll horizontally: keep the active one visible
  const strip = nav.querySelector('.nav-stations');
  const act = strip.querySelector('a.active');
  if (act && strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: act.offsetLeft - strip.offsetLeft - 8, behavior: 'smooth' });
  window.scrollTo(0, 0);
  // wait one frame so the layout exists before drawing
  requestAnimationFrame(() => pages[key].show());
}

document.documentElement.lang = getLang();
applyI18n(nav);
markLang();
window.addEventListener('hashchange', route);
route();
