import '@fontsource-variable/newsreader/wght.css';
import '@fontsource-variable/newsreader/wght-italic.css';
import '@fontsource-variable/figtree';
import '@fontsource-variable/spline-sans-mono';
import 'reveal.js/reset.css';
import 'reveal.js/reveal.css';
import 'katex/dist/katex.min.css';
import '../style.css';
import './slides.css';
import Reveal from 'reveal.js';
import Notes from 'reveal.js/plugin/notes';
import renderMathInElement from 'katex/contrib/auto-render';
import { WIDGETS } from './widgets.js';

// ---- language (shared with the Lab via localStorage) ----
function initialLang() {
  try { const s = localStorage.getItem('lang'); if (s === 'de' || s === 'en') return s; } catch { /* ignore */ }
  return (navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
}
function setLang(l) {
  document.documentElement.dataset.lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  document.querySelectorAll('.lang-toggle button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  refresh();
}
const toggleLang = () => setLang(document.documentElement.dataset.lang === 'de' ? 'en' : 'de');

// ---- math ----
renderMathInElement(document.querySelector('.slides'), {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
  ],
  throwOnError: false,
});

// ---- widgets ----
const widgets = [];
document.querySelectorAll('[data-widget]').forEach((el) => {
  const make = WIDGETS[el.dataset.widget];
  if (!make) return;
  const opts = el.dataset.opts ? JSON.parse(el.dataset.opts) : {};
  el.dataset.preventSwipe = '';
  widgets.push({ el, ...make(el, opts) });
});

let currentSlide = null;
function update(slide) {
  currentSlide = slide;
  for (const w of widgets) {
    if (slide && slide.contains(w.el)) requestAnimationFrame(() => w.activate?.());
    else w.deactivate?.();
  }
}
function refresh() { if (currentSlide) update(currentSlide); }

const deck = new Reveal({
  hash: true,
  slideNumber: 'c/t',
  width: 1280,
  height: 720,
  margin: 0.03,
  center: false,
  transition: 'slide',
  backgroundTransition: 'fade',
  plugins: [Notes],
  keyboard: { 76: toggleLang }, // L
});

document.querySelectorAll('.lang-toggle button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
setLang(initialLang());

deck.initialize().then(() => update(deck.getCurrentSlide()));
window.deck = deck;
deck.on('slidechanged', (e) => update(e.currentSlide));
deck.on('resize', () => refresh());
