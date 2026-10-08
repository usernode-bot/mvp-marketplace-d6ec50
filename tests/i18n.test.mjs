import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Minimal browser globals so the client modules import under node.
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
const events = [];
globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } };
globalThis.window = { dispatchEvent: (e) => events.push(e), addEventListener() {}, location: { search: '' } };
globalThis.document = {
  documentElement: {},
  querySelectorAll: () => [],
};

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'js');
const i18n = await import(path.join(root, 'i18n.js'));
const { store } = await import(path.join(root, 'store.js'));

async function dict(lang) {
  const out = {};
  for (const f of fs.readdirSync(path.join(root, 'locales', lang))) {
    Object.assign(out, (await import(path.join(root, 'locales', lang, f))).default);
  }
  return out;
}

test('en and id dictionaries have the same keys and placeholders', async () => {
  const en = await dict('en');
  const id = await dict('id');
  const keys = (d) => Object.keys(d).sort();
  const missingInId = Object.keys(en).filter((k) => !(k in id));
  const extraInId = Object.keys(id).filter((k) => !(k in en));
  assert.deepEqual(missingInId, []);
  assert.deepEqual(extraInId, []);
  for (const k of keys(en)) {
    const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(ph(id[k]), ph(en[k]), 'placeholders differ for ' + k);
    assert.ok(id[k].trim() !== '', 'empty id string for ' + k);
  }
});

test('every literal t() key used by the client exists in English', async () => {
  const en = await dict('en');
  const used = new Set();
  for (const f of fs.readdirSync(root).filter((n) => n.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    // Keys built from an id at runtime (t('orders.tab.' + id)) end in a prefix; skip those.
    for (const m of src.matchAll(/\bt\('([\w.]+)'(?!\s*\+)/g)) used.add(m[1]);
  }
  const html = fs.readFileSync(path.join(root, '..', 'index.html'), 'utf8');
  for (const m of html.matchAll(/data-i18n(?:-[\w-]+)?="([\w.]+)"/g)) used.add(m[1]);
  const missing = [...used].filter((k) => !(k in en) && !(k + '.other' in en));
  assert.deepEqual(missing, []);
});

test('setLocale switches language, persists it and announces the change', () => {
  assert.equal(i18n.t('nav.cart'), 'Cart');
  assert.equal(i18n.setLocale('id'), true);
  assert.equal(i18n.t('nav.cart'), 'Keranjang');
  assert.equal(i18n.t('settings.language'), 'Bahasa');
  assert.equal(JSON.parse(localStorage.getItem('bazario:prefs')).locale, 'id');
  assert.equal(events.at(-1).type, 'localechange');
  assert.equal(i18n.setLocale('id'), false);
  assert.equal(i18n.setLocale('en'), true);
  assert.equal(i18n.t('nav.cart'), 'Cart');
});

test('missing keys fall back to English and never render undefined or the key', () => {
  i18n.setLocale('id');
  assert.equal(i18n.t('no.such.key'), '');
  assert.equal(i18n.t('settings.languageSet', { language: 'X' }), 'Bahasa diatur ke X');
  // An unsupported stored locale resolves to English.
  store.setPref('locale', 'fr');
  assert.equal(i18n.locale(), 'en');
  i18n.setLocale('en');
});
