/* Central localization for the whole app.
 *
 * One language state: `store.prefs.locale` (persisted under bazario:prefs, the
 * same place as every other preference). `setLocale(code)` is the only writer;
 * it persists the choice, updates <html lang>, retranslates the static markup
 * in index.html (data-i18n* attributes) and fires a `localechange` event on
 * window so the app re-renders the current screen. Nothing else keeps a
 * language of its own.
 *
 * Dictionaries live in locales/<code>/<namespace>.js, flat key -> string. `en`
 * is the source; `id` (Bahasa Indonesia) overrides it. A key missing from the
 * active locale falls back to English, and a key missing everywhere renders as
 * an empty string (never "undefined" or the raw key).
 *
 * t(key, params): `{name}` placeholders are filled from params. When params has
 * a numeric `count`, `key.one` / `key.other` variants are chosen with
 * Intl.PluralRules (falling back to the bare key).
 */

import { store } from './store.js';
import en_common from './locales/en/common.js';
import en_nav from './locales/en/nav.js';
import en_settings from './locales/en/settings.js';
import en_home from './locales/en/home.js';
import en_filters from './locales/en/filters.js';
import en_browse from './locales/en/browse.js';
import en_ui from './locales/en/ui.js';
import en_product from './locales/en/product.js';
import en_reviews from './locales/en/reviews.js';
import en_catalog from './locales/en/catalog.js';
import en_cart from './locales/en/cart.js';
import en_checkout from './locales/en/checkout.js';
import en_shipping from './locales/en/shipping.js';
import en_payment from './locales/en/payment.js';
import en_addresses from './locales/en/addresses.js';
import en_orders from './locales/en/orders.js';
import en_profile from './locales/en/profile.js';
import id_common from './locales/id/common.js';
import id_nav from './locales/id/nav.js';
import id_settings from './locales/id/settings.js';
import id_home from './locales/id/home.js';
import id_filters from './locales/id/filters.js';
import id_browse from './locales/id/browse.js';
import id_ui from './locales/id/ui.js';
import id_product from './locales/id/product.js';
import id_reviews from './locales/id/reviews.js';
import id_catalog from './locales/id/catalog.js';
import id_cart from './locales/id/cart.js';
import id_checkout from './locales/id/checkout.js';
import id_shipping from './locales/id/shipping.js';
import id_payment from './locales/id/payment.js';
import id_addresses from './locales/id/addresses.js';
import id_orders from './locales/id/orders.js';
import id_profile from './locales/id/profile.js';

const NAMESPACES = [[en_common, id_common], [en_nav, id_nav], [en_settings, id_settings], [en_home, id_home], [en_filters, id_filters], [en_browse, id_browse], [en_ui, id_ui], [en_product, id_product], [en_reviews, id_reviews], [en_catalog, id_catalog], [en_cart, id_cart], [en_checkout, id_checkout], [en_shipping, id_shipping], [en_payment, id_payment], [en_addresses, id_addresses], [en_orders, id_orders], [en_profile, id_profile]];

function merge(index) {
  const out = {};
  NAMESPACES.forEach((pair) => Object.assign(out, pair[index]));
  return out;
}

const EN = merge(0);
const DICTS = { en: EN, id: merge(1) };

/* The locales the Language picker offers, with each one's own name. */
export const LOCALES = [
  { code: 'en', label: 'English', intl: 'en-US' },
  { code: 'id', label: 'Bahasa Indonesia', intl: 'id-ID' },
];

/* Map any stored tag onto a shipped locale (language-subtag match). */
function normalize(code) {
  if (!code || typeof code !== 'string') return 'en';
  if (DICTS[code]) return code;
  const base = code.toLowerCase().split('-')[0];
  return DICTS[base] ? base : 'en';
}

export function locale() {
  return normalize(store && store.prefs ? store.prefs.locale : 'en');
}

/* BCP-47 tag for Intl / toLocaleString calls. */
export function intlLocale() {
  const found = LOCALES.find((l) => l.code === locale());
  return found ? found.intl : 'en-US';
}

export function localeLabel() {
  const found = LOCALES.find((l) => l.code === locale());
  return found ? found.label : 'English';
}

const warned = new Set();

function lookup(key) {
  const dict = DICTS[locale()];
  if (dict && typeof dict[key] === 'string') return dict[key];
  if (typeof EN[key] === 'string') return EN[key];
  return undefined;
}

export function has(key) {
  return lookup(key) !== undefined;
}

function fill(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (m, name) => {
    const v = params[name];
    return v === undefined || v === null ? '' : String(v);
  });
}

export function t(key, params) {
  let found;
  if (params && typeof params.count === 'number') {
    let cat = 'other';
    try {
      cat = new Intl.PluralRules(intlLocale()).select(params.count);
    } catch {
      cat = 'other';
    }
    found = lookup(key + '.' + cat);
    if (found === undefined) found = lookup(key + '.other');
  }
  if (found === undefined) found = lookup(key);
  if (found === undefined) {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn('[i18n] missing translation key: ' + key);
    }
    return '';
  }
  return fill(found, params);
}

/* ------------------------------------------------------------------ */
/* Static markup: data-i18n="key" sets textContent; data-i18n-<attr>   */
/* sets placeholder / aria-label / title.                              */
/* ------------------------------------------------------------------ */

const ATTRS = ['placeholder', 'aria-label', 'title'];

export function translateStatic(root) {
  const scope = root || document;
  scope.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  ATTRS.forEach((attr) => {
    scope.querySelectorAll('[data-i18n-' + attr + ']').forEach((el) => {
      el.setAttribute(attr, t(el.getAttribute('data-i18n-' + attr)));
    });
  });
  document.documentElement.lang = locale();
  const title = t('common.appName');
  if (title) document.title = title;
}

/* Change the app language. Persists, retranslates static markup, then tells
 * the app to re-render. Re-selecting the active language is a no-op. */
export function setLocale(code) {
  const next = normalize(code);
  if (next === locale() && store.prefs.locale === next) return false;
  store.setPref('locale', next);
  translateStatic();
  window.dispatchEvent(new CustomEvent('localechange', { detail: { locale: next } }));
  return true;
}

/* Apply the saved language to the static markup on boot. */
export function initI18n() {
  translateStatic();
}
