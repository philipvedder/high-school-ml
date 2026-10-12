// UI building blocks: sliders, selects, missions, confetti, station layout.
import { h, fmt } from './util.js';
import { t, applyI18n } from '../i18n.js';

/** Label HTML: an i18n key or {raw: 'text'}. */
const labelHtml = (label) => (typeof label === 'object' ? label.raw : `<span data-i18n="${label}"></span>`);

export function slider({ label, min, max, step = 0.01, value, log = false, digits = 2, format, onInput }) {
  const el = h(`<label class="ctl slider"><div class="ctl-top">${labelHtml(label)}<output></output></div><input type="range"></label>`);
  const input = el.querySelector('input');
  const out = el.querySelector('output');
  const N = 1000;
  const toU = (v) => (log ? (Math.log(v / min) / Math.log(max / min)) * N : v);
  const fromU = (u) => (log ? min * Math.pow(max / min, u / N) : +u);
  if (log) { input.min = 0; input.max = N; input.step = 1; } else { input.min = min; input.max = max; input.step = step; }
  const show = (v) => { out.textContent = format ? format(v) : fmt(v, digits); };
  const api = {
    el,
    get value() { return fromU(input.value); },
    set value(v) { input.value = toU(v); show(v); },
    setDisabled(d) { input.disabled = d; el.classList.toggle('disabled', d); },
  };
  input.addEventListener('input', () => { show(api.value); onInput?.(api.value); });
  api.value = value;
  return api;
}

/** options: [{value, label}] where label is an i18n key or {raw}. */
export function select({ label, options, value, onChange }) {
  const el = h(`<label class="ctl select"><div class="ctl-top">${label ? labelHtml(label) : ''}</div><select></select></label>`);
  const sel = el.querySelector('select');
  for (const o of options) {
    const op = document.createElement('option');
    op.value = o.value;
    if (typeof o.label === 'object') op.textContent = o.label.raw; else op.dataset.i18n = o.label;
    sel.appendChild(op);
  }
  sel.value = value;
  sel.addEventListener('change', () => onChange?.(sel.value));
  return { el, get value() { return sel.value; }, set value(v) { sel.value = v; } };
}

export function segmented({ label, options, value, onChange }) {
  const el = h(`<div class="ctl seg-wrap">${label ? `<div class="ctl-top">${labelHtml(label)}</div>` : ''}<div class="seg"></div></div>`);
  const seg = el.querySelector('.seg');
  let cur = value;
  const btns = options.map((o) => {
    const b = h(`<button type="button">${labelHtml(o.label)}</button>`);
    b.addEventListener('click', () => { api.value = o.value; onChange?.(o.value); });
    seg.appendChild(b);
    return [o.value, b];
  });
  const api = {
    el,
    get value() { return cur; },
    set value(v) { cur = v; btns.forEach(([val, b]) => b.classList.toggle('on', val === v)); },
  };
  api.value = value;
  return api;
}

export function toggle({ label, value = false, onChange }) {
  const el = h(`<label class="ctl toggle"><input type="checkbox"><span class="sw"></span>${labelHtml(label)}</label>`);
  const inp = el.querySelector('input');
  inp.checked = value;
  inp.addEventListener('change', () => onChange?.(inp.checked));
  return { el, get value() { return inp.checked; }, set value(v) { inp.checked = v; } };
}

export function button(label, onClick, cls = '') {
  const b = h(`<button type="button" class="btn ${cls}">${labelHtml(label)}</button>`);
  b.addEventListener('click', onClick);
  return b;
}

export function row(...children) {
  const r = h('<div class="btn-row"></div>');
  children.forEach((c) => r.appendChild(c));
  return r;
}

export function card(titleKey, ...children) {
  const c = h(`<div class="card">${titleKey ? `<h3 data-i18n="${titleKey}"></h3>` : ''}</div>`);
  children.forEach((ch) => c.appendChild(ch.el || ch));
  return c;
}

/** Mission checklist that ticks itself off. keys: i18n keys. */
export function missions(keys, stationId) {
  const el = h(`<div class="card missions"><h3><span data-i18n="common.missions"></span> <span class="mcount"></span></h3><ul></ul></div>`);
  const ul = el.querySelector('ul');
  const done = new Set(JSON.parse(sessionStorageGet(`missions-${stationId}`) || '[]'));
  const items = {};
  for (const k of keys) {
    const li = h(`<li><span class="check"></span><span data-i18n="${k}"></span></li>`);
    items[k] = li;
    ul.appendChild(li);
  }
  const refresh = () => {
    for (const k of keys) items[k].classList.toggle('done', done.has(k));
    el.querySelector('.mcount').textContent = `${done.size}/${keys.length}`;
  };
  refresh();
  return {
    el,
    complete(k) {
      if (done.has(k)) return;
      done.add(k);
      sessionStorageSet(`missions-${stationId}`, JSON.stringify([...done]));
      refresh();
      items[k].classList.add('pop');
      confetti(items[k]);
      toast(t('common.missionDone') + ' ' + stripHtml(t(k)));
    },
    isDone: (k) => done.has(k),
  };
}

function stripHtml(s) { const d = document.createElement('div'); d.innerHTML = s; return d.textContent; }
function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch { return null; } }
function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } }

/** Collapsible "math behind it" box. */
export function explain(key, titleKey = 'common.math') {
  return h(`<details class="card explain"><summary data-i18n="${titleKey}"></summary><div class="explain-body" data-i18n="${key}"></div></details>`);
}

/** Standard station layout. Returns {root, viz, panel}. */
export function stationShell(num, id) {
  const root = h(`
    <section class="station" id="st-${id}">
      <header class="station-head">
        <div class="badge">${String(num).padStart(2, '0')}</div>
        <div class="kicker">station_${String(num).padStart(2, '0')} · ${id}</div>
        <h1 data-i18n="${id}.title"></h1>
        <p class="lead" data-i18n="${id}.lead"></p>
      </header>
      <div class="station-body">
        <div class="viz"></div>
        <aside class="panel"></aside>
      </div>
    </section>`);
  return { root, viz: root.querySelector('.viz'), panel: root.querySelector('.panel') };
}

let toastEl = null, toastTimer = null;
export function toast(msg, ms = 2800) {
  if (!toastEl) { toastEl = h('<div class="toast"></div>'); document.body.appendChild(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

/** A short confetti burst originating from an element (or screen centre). */
export function confetti(fromEl) {
  const c = document.createElement('canvas');
  c.className = 'confetti';
  document.body.appendChild(c);
  const W = (c.width = innerWidth), H = (c.height = innerHeight);
  const ctx = c.getContext('2d');
  let ox = W / 2, oy = H / 2;
  if (fromEl) { const r = fromEl.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; }
  const cols = ['#EE9B00', '#0A9396', '#94D2BD', '#CA6702', '#E9D8A6', '#BB3E03', '#AE2012'];
  const P = Array.from({ length: 90 }, () => {
    const a = Math.random() * Math.PI * 2, s = 3 + Math.random() * 7;
    return { x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4, r: 3 + Math.random() * 4, c: cols[(Math.random() * cols.length) | 0], rot: Math.random() * 6 };
  });
  let f = 0;
  const tick = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      p.vy += 0.25; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.rot += 0.2;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - f / 90);
      ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
      ctx.restore();
    }
    if (++f < 90) requestAnimationFrame(tick); else c.remove();
  };
  tick();
}

export { applyI18n };
