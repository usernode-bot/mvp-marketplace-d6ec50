/* Internationalization (i18n) core.
 *
 * One tiny, dependency-free translator for the whole app. Modules import
 * `t` (and `tc` for counts) and render translated strings; switching the
 * locale re-renders the active view through onLocaleChange, so the entire
 * interface follows the picker without a reload.
 *
 * Resolution order for the FIRST visit (no saved choice yet):
 *   1. the user's Homeroom platform locale (bridge getUserLocale), when set
 *   2. the device language (navigator.language)
 *   3. English
 * Only an explicit in-app choice is persisted (bazario:locale), so the
 * platform value stays a default the shopper can override, exactly as the
 * platform conventions ask.
 *
 * Missing keys always fall back to English, then to the key itself, so a
 * gap in a translation can never render as a blank or a crash.
 */

import en from './i18n/en.js';
import es from './i18n/es.js';
import ptBR from './i18n/pt-BR.js';
import id from './i18n/id.js';

export const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

export const DEFAULT_LOCALE = 'en';

const DICTIONARIES = { en, es, 'pt-BR': ptBR, id };
const STORAGE_KEY = 'bazario:locale';

let current = DEFAULT_LOCALE;
const listeners = new Set();
let started = false;

/* Map an arbitrary BCP-47 tag onto the locales this app ships:
 * 'pt' / 'pt-BR' / 'pt-PT' -> 'pt-BR'; 'es-419' -> 'es'; 'id-ID' -> 'id';
 * 'en-GB' -> 'en'. Returns null when nothing matches. */
export function matchLocale(tag) {
  if (!tag || typeof tag !== 'string') return null;
  const lower = tag.trim().toLowerCase();
  if (!lower) return null;
  if (lower === 'pt' || lower.startsWith('pt-')) return 'pt-BR';
  const base = lower.split('-')[0];
  return LOCALES.some((l) => l.code === base) ? base : null;
}

export function getLocale() {
  return current;
}

export function localeLabel(code = current) {
  const found = LOCALES.find((l) => l.code === code);
  return found ? found.label : LOCALES[0].label;
}

function loadStored() {
  try {
    return matchLocale(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function persist(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Storage refused (private mode, cross-origin WebView): the choice just
    // does not persist across reloads.
  }
}

/* Translate `key`, filling {name} placeholders from `vars`. Falls back to
 * English, then to the key itself. */
export function t(key, vars) {
  const dict = DICTIONARIES[current] || en;
  let str = dict[key];
  if (str === undefined) str = en[key];
  if (str === undefined) return key;
  if (vars) {
    str = str.replace(/\{(\w+)\}/g, (m, name) => (
      vars[name] === undefined || vars[name] === null ? m : String(vars[name])
    ));
  }
  return str;
}

/* Count-aware translation: picks the _one / _many key for `count` and injects
 * {count} unless the caller overrides it. Every shipped locale splits at one. */
export function tc(keyOne, keyMany, count, vars) {
  const n = Number(count) || 0;
  return t(n === 1 ? keyOne : keyMany, Object.assign({ count: n }, vars));
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function applyLocale(code, notify) {
  current = code;
  try {
    document.documentElement.setAttribute('lang', code);
  } catch {
    // element missing in a headless context: nothing to announce.
  }
  if (notify) {
    listeners.forEach((fn) => {
      try {
        fn(code);
      } catch (err) {
        console.error('locale listener failed', err);
      }
    });
  }
}

/* Set the active locale. `persist` is true for an explicit in-app choice;
 * a platform/device seed passes false so it stays a default. */
export function setLocale(code, { persist: shouldPersist = true } = {}) {
  const resolved = matchLocale(code) || DEFAULT_LOCALE;
  if (shouldPersist) persist(resolved);
  const changed = resolved !== current;
  applyLocale(resolved, changed);
  return resolved;
}

async function platformLocale() {
  try {
    if (window.usernode && typeof window.usernode.getUserLocale === 'function') {
      const r = await window.usernode.getUserLocale();
      if (r && typeof r.locale === 'string') return r.locale;
    }
  } catch {
    // No platform shell (standalone/local): treat as "no preference".
  }
  return null;
}

function deviceLocale() {
  try {
    return navigator.language || null;
  } catch {
    return null;
  }
}

/* A `?lang=<tag>` deep link forces a locale for that view (a shared link in
 * someone else's language). It outranks a saved choice but is not persisted,
 * so the shopper's own pick still comes back on the next plain load. */
function urlLocale() {
  try {
    return matchLocale(new URLSearchParams(window.location.search).get('lang'));
  } catch {
    return null;
  }
}

/* Boot the translator. A saved choice is applied synchronously (no flash of
 * English); otherwise the platform/device locale seeds it asynchronously. */
export function initI18n() {
  if (started) return;
  started = true;

  // Explicit deep-linked language wins for this view, without persisting.
  const linked = urlLocale();
  if (linked) {
    applyLocale(linked, false);
    return;
  }

  const stored = loadStored();
  if (stored) {
    applyLocale(stored, false);
    return;
  }

  // Keep following the platform setting live, but only while the shopper has
  // not made their own in-app choice (an app-level choice always wins).
  try {
    window.addEventListener('usernode:locale-changed', (e) => {
      if (loadStored()) return;
      const code = matchLocale(e && e.detail && e.detail.locale) || DEFAULT_LOCALE;
      if (code !== current) applyLocale(code, true);
    });
  } catch {
    // no window: nothing to listen on.
  }

  platformLocale().then((tag) => {
    const seeded = matchLocale(tag) || matchLocale(deviceLocale()) || DEFAULT_LOCALE;
    if (seeded !== current) applyLocale(seeded, true);
  });
}
