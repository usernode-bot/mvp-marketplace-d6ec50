/* Client-side state: favorites, cart (with per-item selection), saved for
 * later, the applied voucher and recent searches.
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
  orders: 'bazario:orders',
  saved: 'bazario:saved',
  voucher: 'bazario:voucher',
  orderOverrides: 'bazario:order-overrides',
  addresses: 'bazario:addresses',
  profile: 'bazario:profile',
  prefs: 'bazario:prefs',
};

/* Settings defaults. Only the chosen values persist; new toggles inherit
 * these until the user changes them. */
const DEFAULT_PREFS = () => ({
  orderUpdates: true,
  promotions: true,
  personalized: true,
  saveSearch: true,
  locale: 'en',
});

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

/* Older carts (Phase 1) have no selection flag; treat those as selected. */
function normalizeCartEntry(entry) {
  return { id: entry.id, qty: entry.qty, selected: entry.selected !== false };
}

function normalizeVoucher(v) {
  return typeof v === 'string' && v.trim() ? v.trim().toUpperCase() : null;
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
  cart: load(KEYS.cart, []).map(normalizeCartEntry), // [{ id, qty, selected }]
  recent: load(KEYS.recent, []),
  orders: load(KEYS.orders, []), // placed (mock) orders, newest first
  saved: new Set(load(KEYS.saved, [])), // ids moved out of the cart
  voucher: normalizeVoucher(load(KEYS.voucher, null)),
  // Order status overrides keyed by order number (Phase 5). Orders themselves
  // are mock seed data; cancelling one is the only user mutation, and it
  // persists so a reload keeps the cancelled state.
  orderOverrides: load(KEYS.orderOverrides, {}),
  addresses: load(KEYS.addresses, []), // [{ id, name, phone, line1, city, zip, isDefault }]
  profile: load(KEYS.profile, null), // { name, phone, email } or null
  prefs: Object.assign(DEFAULT_PREFS(), load(KEYS.prefs, {})),

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
    else this.cart.push({ id, qty: 1, selected: true });
    save(KEYS.cart, this.cart);
    emit();
  },

  /* Replace the whole cart (used by the ?demo=1 seeding route only). */
  setCart(entries) {
    this.cart = entries.map(normalizeCartEntry);
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

  setSelected(id, on) {
    const item = this.cart.find((i) => i.id === id);
    if (!item || item.selected === on) return;
    item.selected = on;
    save(KEYS.cart, this.cart);
    emit();
  },

  setAllSelected(on) {
    let changed = false;
    this.cart.forEach((i) => {
      if (i.selected !== on) {
        i.selected = on;
        changed = true;
      }
    });
    if (!changed) return;
    save(KEYS.cart, this.cart);
    emit();
  },

  selectedEntries() {
    return this.cart.filter((i) => i.selected !== false);
  },

  removeFromCart(id) {
    this.cart = this.cart.filter((i) => i.id !== id);
    save(KEYS.cart, this.cart);
    emit();
  },

  /* Move a cart item out to the "Saved for later" list. */
  saveForLater(id) {
    this.removeFromCart(id);
    if (!this.saved.has(id)) {
      this.saved.add(id);
      save(KEYS.saved, [...this.saved]);
      emit();
    }
  },

  /* Move a saved item back into the cart. */
  moveToCart(id) {
    if (this.saved.has(id)) {
      this.saved.delete(id);
      save(KEYS.saved, [...this.saved]);
    }
    const item = this.cart.find((i) => i.id === id);
    if (item) item.qty += 1;
    else this.cart.push({ id, qty: 1, selected: true });
    save(KEYS.cart, this.cart);
    emit();
  },

  removeSaved(id) {
    if (!this.saved.has(id)) return;
    this.saved.delete(id);
    save(KEYS.saved, [...this.saved]);
    emit();
  },

  savedItems() {
    return [...this.saved].map((id) => PRODUCT_LOOKUP[id]).filter(Boolean);
  },

  setVoucher(code) {
    this.voucher = normalizeVoucher(code);
    save(KEYS.voucher, this.voucher);
    emit();
  },

  clearVoucher() {
    this.setVoucher(null);
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

  /* ------------------------------------------------------------------
   * Orders (Phase 5). The seeds live in data.js; this holds only the
   * user's mutations on top of them.
   * ------------------------------------------------------------------ */

  setOrderStatus(no, status) {
    this.orderOverrides = Object.assign({}, this.orderOverrides, { [no]: status });
    save(KEYS.orderOverrides, this.orderOverrides);
    emit();
  },

  /* ------------------------------------------------------------------
   * Addresses (Phase 5). Invariant: when the list is non-empty, exactly
   * one entry is the default.
   * ------------------------------------------------------------------ */

  addAddress(data) {
    const entry = Object.assign({}, data, {
      id: 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    });
    if (entry.isDefault || !this.addresses.length) {
      this.addresses.forEach((a) => { a.isDefault = false; });
      entry.isDefault = true;
    } else {
      entry.isDefault = false;
    }
    this.addresses.push(entry);
    save(KEYS.addresses, this.addresses);
    emit();
  },

  updateAddress(id, patch) {
    const entry = this.addresses.find((a) => a.id === id);
    if (!entry) return;
    Object.assign(entry, patch);
    if (patch.isDefault) {
      this.addresses.forEach((a) => { if (a.id !== id) a.isDefault = false; });
    }
    if (!this.addresses.some((a) => a.isDefault)) entry.isDefault = true;
    save(KEYS.addresses, this.addresses);
    emit();
  },

  removeAddress(id) {
    const wasDefault = this.addresses.some((a) => a.id === id && a.isDefault);
    this.addresses = this.addresses.filter((a) => a.id !== id);
    if (wasDefault && this.addresses.length) this.addresses[0].isDefault = true;
    save(KEYS.addresses, this.addresses);
    emit();
  },

  addressById(id) {
    return this.addresses.find((a) => a.id === id) || null;
  },

  /* ------------------------------------------------------------------
   * Account profile and settings (Phase 5).
   * ------------------------------------------------------------------ */

  setProfile(data) {
    const clean = {
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim(),
    };
    this.profile = clean.name || clean.phone || clean.email ? clean : null;
    save(KEYS.profile, this.profile);
    emit();
  },

  setPref(key, value) {
    if (!(key in DEFAULT_PREFS())) return;
    this.prefs = Object.assign({}, this.prefs, { [key]: value });
    save(KEYS.prefs, this.prefs);
    emit();
  },

  /* Log out: this app keeps everything on the device, so signing out clears
   * every bazario:* key (cart, wishlist, addresses, settings and the demo
   * seed flags) and resets in-memory state. */
  clearAll() {
    try {
      const doomed = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('bazario:') === 0) doomed.push(k);
      }
      doomed.forEach((k) => localStorage.removeItem(k));
    } catch {
      // Storage refused: reset what we hold in memory anyway.
    }
    this.favorites = new Set();
    this.cart = [];
    this.recent = [];
    this.saved = new Set();
    this.voucher = null;
    this.orderOverrides = {};
    this.addresses = [];
    this.profile = null;
    this.prefs = DEFAULT_PREFS();
    this.orders = [];
    emit();
  },

  clearCart() {
    this.cart = [];
    save(KEYS.cart, this.cart);
    emit();
  },

  addOrder(order) {
    this.orders = [order, ...this.orders].slice(0, 20);
    save(KEYS.orders, this.orders);
    emit();
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
