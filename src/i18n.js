// Tiny i18n: t(key) looks up the current language; elements with data-i18n are filled automatically.
import { STRINGS } from './strings.js';

let lang = (() => {
  try {
    const saved = localStorage.getItem('lang');
    if (saved === 'de' || saved === 'en') return saved;
  } catch { /* ignore */ }
  return (navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en';
})();

const listeners = new Set();

export const getLang = () => lang;

export function t(key, vars) {
  const entry = STRINGS[key];
  let s = entry ? entry[lang] ?? entry.en : key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
}

export function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  document.documentElement.lang = l;
  applyI18n();
  listeners.forEach((f) => f(l));
}

export function onLangChange(f) { listeners.add(f); }
