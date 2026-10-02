/* Client-side state for Phase 1: favorites, cart and recent searches.
 *
 * Everything persists to localStorage under one app-level namespace. This
 * store is deliberately NOT keyed on the signed-in user: an offline load
 * carries no token, and per-user namespaces would destroy the real user's
 * saved data on the first offline boot. Phase 2 moves cart/favorites
 * server-side; this module is the single seam for that swap.
 */

import { PRODUCTS } from './data.js';

const KEYS = {
  favorites: 'bazario:favorites',
  cart: 'bazario:cart',
  recent: 'bazario:recent',
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

export const store = {
  favorites: new Set(load(KEYS.favorites, [])),
  cart: load(KEYS.cart, []), // [{ id, qty }]
  recent: load(KEYS.recent, []),

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

  addToCart(id) {
    const item = this.cart.find((i) => i.id === id);
    if (item) item.qty += 1;
    else this.cart.push({ id, qty: 1 });
    save(KEYS.cart, this.cart);
    emit();
  },

  setQty(id, qty) {
    if (qty <= 0) {
      this.removeFromCart(id);
      return;
    }
    const item = this.cart.find((i) => i.id === id);
    if (item) {
      item.qty = qty;
      save(KEYS.cart, this.cart);
      emit();
    }
  },

  removeFromCart(id) {
    this.cart = this.cart.filter((i) => i.id !== id);
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

  subscribe(fn) {
    listeners.add(fn);
  },
};
