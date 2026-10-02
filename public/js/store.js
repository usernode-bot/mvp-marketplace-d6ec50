/* Client-side state: favorites, cart (variant-aware), recent searches and
 * recently viewed products.
 *
 * Everything persists to localStorage under one app-level namespace. This
 * store is deliberately NOT keyed on the signed-in user: an offline load
 * carries no token, and per-user namespaces would destroy the real user's
 * saved data on the first offline boot. A later phase moves cart/favorites
 * server-side; this module is the single seam for that swap.
 */

import { PRODUCTS } from './data.js';

const KEYS = {
  favorites: 'bazario:favorites',
  cart: 'bazario:cart',
  recent: 'bazario:recent',
  viewed: 'bazario:viewed',
};

const PRODUCT_LOOKUP = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage refused (private mode, cross-origin WebView): state simply
    // does not persist for the session.
  }
}

const listeners = new Set();

function emit() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('store listener failed', e);
    }
  });
}

/* A cart entry is one product + chosen variant. Older saved carts (Phase 1)
 * stored plain { id, qty } rows; normalize gives them a key so every entry
 * shares the same shape. */
function entryKey(id, color, size) {
  return id + '|' + (color || '') + '|' + (size || '');
}

function normalizeCart(raw) {
  return (Array.isArray(raw) ? raw : [])
    .filter((e) => e && PRODUCT_LOOKUP[e.id])
    .map((e) => ({
      id: e.id,
      qty: Math.max(1, Number(e.qty) || 1),
      color: e.color || '',
      size: e.size || '',
      key: e.key || entryKey(e.id, e.color, e.size),
    }));
}

export const store = {
  favorites: new Set(load(KEYS.favorites, [])),
  cart: normalizeCart(load(KEYS.cart, [])),
  recent: load(KEYS.recent, []),
  viewed: load(KEYS.viewed, []), // most-recent-first product ids

  isFavorite(id) {
    return this.favorites.has(id);
  },

  toggleFavorite(id) {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    save(KEYS.favorites, [...this.favorites]);
    emit();
    return this.favorites.has(id);
  },

  favoriteCount() {
    return this.favorites.size;
  },

  cartCount() {
    return this.cart.reduce((sum, item) => sum + item.qty, 0);
  },

  addToCart(id, opts = {}) {
    const qty = Math.max(1, Math.floor(Number(opts.qty) || 1));
    const color = opts.color || '';
    const size = opts.size || '';
    const key = entryKey(id, color, size);
    const item = this.cart.find((i) => i.key === key);
    if (item) item.qty += qty;
    else this.cart.push({ id, qty, color, size, key });
    save(KEYS.cart, this.cart);
    emit();
  },

  setQty(key, qty) {
    if (qty <= 0) {
      this.removeFromCart(key);
      return;
    }
    const item = this.cart.find((i) => i.key === key);
    if (item) {
      item.qty = qty;
      save(KEYS.cart, this.cart);
      emit();
    }
  },

  removeFromCart(key) {
    this.cart = this.cart.filter((i) => i.key !== key);
    save(KEYS.cart, this.cart);
    emit();
  },

  cartItems() {
    // Resolved against the product list at render time, so stale ids from an
    // older data set drop out instead of breaking the cart view.
    return this.cart
      .map((item) => ({ item, product: PRODUCT_LOOKUP[item.id] }))
      .filter((entry) => entry.product);
  },

  cartTotal() {
    return this.cartItems().reduce((sum, e) => sum + e.product.price * e.item.qty, 0);
  },

  addRecent(q) {
    const query = q.trim();
    if (!query) return;
    this.recent = [query, ...this.recent.filter((r) => r.toLowerCase() !== query.toLowerCase())].slice(0, 8);
    save(KEYS.recent, this.recent);
  },

  removeRecent(q) {
    this.recent = this.recent.filter((r) => r !== q);
    save(KEYS.recent, this.recent);
  },

  clearRecent() {
    this.recent = [];
    save(KEYS.recent, this.recent);
  },

  addRecentlyViewed(id) {
    if (!PRODUCT_LOOKUP[id]) return;
    this.viewed = [id, ...this.viewed.filter((v) => v !== id)].slice(0, 10);
    save(KEYS.viewed, this.viewed);
  },

  recentlyViewed() {
    return this.viewed.map((id) => PRODUCT_LOOKUP[id]).filter(Boolean);
  },

  subscribe(fn) {
    listeners.add(fn);
  },
};