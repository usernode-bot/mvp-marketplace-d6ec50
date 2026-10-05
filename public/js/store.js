/* Client-side state: favorites, cart (variant-aware, with per-item
 * selection), saved for later, the applied voucher, recent searches and
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
  orders: 'bazario:orders',
  saved: 'bazario:saved',
  voucher: 'bazario:voucher',
  orderOverrides: 'bazario:order-overrides',
  addresses: 'bazario:addresses',
  payments: 'bazario:payments',
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

function normalizeVoucher(v) {
  return typeof v === 'string' && v.trim() ? v.trim().toUpperCase() : null;
}

/* A linked payment method. `id` names the config entry in
 * public/js/payment.js; the extra fields hold what the user entered when
 * linking (phone for e-wallets, account number + holder name for banks).
 * Card numbers are never stored in full — `masked` keeps only the last
 * four digits. */
function normalizePayment(p) {
  if (!p || typeof p.id !== 'string') return null;
  return {
    id: p.id,
    phone: typeof p.phone === 'string' ? p.phone : '',
    account: typeof p.account === 'string' ? p.account : '',
    holder: typeof p.holder === 'string' ? p.holder : '',
    masked: typeof p.masked === 'string' ? p.masked : '',
    linkedAt: Number(p.linkedAt) || Date.now(),
  };
}

function normalizePayments(raw) {
  const blob = raw && typeof raw === 'object' ? raw : {};
  const list = (Array.isArray(blob.list) ? blob.list : [])
    .map(normalizePayment)
    .filter(Boolean);
  const ids = new Set(list.map((p) => p.id));
  const def = ids.has(blob.defaultPayment) ? blob.defaultPayment : (list[0] ? list[0].id : null);
  return { list, defaultPayment: def };
}

const PAYMENTS = normalizePayments(load(KEYS.payments, {}));

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
      selected: e.selected !== false, // older carts have no flag: selected
    }));
}

export const store = {
  favorites: new Set(load(KEYS.favorites, [])),
  cart: normalizeCart(load(KEYS.cart, [])), // [{ id, qty, color, size, key, selected }]
  recent: load(KEYS.recent, []),
  viewed: load(KEYS.viewed, []), // most-recent-first product ids
  orders: load(KEYS.orders, []), // placed (mock) orders, newest first
  saved: new Set(load(KEYS.saved, [])), // ids moved out of the cart
  voucher: normalizeVoucher(load(KEYS.voucher, null)),
  // Order status overrides keyed by order number (Phase 5). Orders themselves
  // are mock seed data; cancelling one is the only user mutation, and it
  // persists so a reload keeps the cancelled state.
  orderOverrides: load(KEYS.orderOverrides, {}),
  addresses: load(KEYS.addresses, []), // [{ id, name, phone, line1, city, zip, isDefault }]
  // Linked payment methods, keyed by the config id in public/js/payment.js.
  // `defaultPayment` names the single default method (null = none).
  payments: PAYMENTS.list,
  defaultPayment: PAYMENTS.defaultPayment,
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

  addToCart(id, opts = {}) {
    const qty = Math.max(1, Math.floor(Number(opts.qty) || 1));
    const color = opts.color || '';
    const size = opts.size || '';
    const key = entryKey(id, color, size);
    const item = this.cart.find((i) => i.key === key);
    if (item) item.qty += qty;
    else this.cart.push({ id, qty, color, size, key, selected: true });
    save(KEYS.cart, this.cart);
    emit();
  },

  /* Replace the whole cart (used by the ?demo=1 seeding route only). */
  setCart(entries) {
    this.cart = normalizeCart(entries);
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

  setSelected(key, on) {
    const item = this.cart.find((i) => i.key === key);
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

  removeFromCart(key) {
    this.cart = this.cart.filter((i) => i.key !== key);
    save(KEYS.cart, this.cart);
    emit();
  },

  /* Move a cart item out to the "Saved for later" list. */
  saveForLater(key) {
    const entry = this.cart.find((i) => i.key === key);
    if (!entry) return;
    const id = entry.id;
    this.removeFromCart(key);
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
    const key = entryKey(id, '', '');
    const item = this.cart.find((i) => i.key === key);
    if (item) item.qty += 1;
    else this.cart.push({ id, qty: 1, color: '', size: '', key, selected: true });
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
   * Payment methods (Phase: Payment). Invariant: when the list is
   * non-empty, `defaultPayment` names exactly one linked method.
   * ------------------------------------------------------------------ */

  isPaymentLinked(id) {
    return this.payments.some((p) => p.id === id);
  },

  paymentById(id) {
    return this.payments.find((p) => p.id === id) || null;
  },

  /* Direct (no-input) methods: bank transfers, QRIS and COD. Linking one
   * makes it the default when there is no default yet. */
  linkPayment(id) {
    if (!id || this.isPaymentLinked(id)) return;
    const entry = { id, phone: '', account: '', holder: '', masked: '', linkedAt: Date.now() };
    this.payments = this.payments.concat(entry);
    if (!this.defaultPayment) this.defaultPayment = id;
    this._savePayments();
  },

  /* Methods that need details (e-wallet phone, bank account + holder). */
  linkPaymentDetails(id, details) {
    if (!id) return;
    const entry = Object.assign(
      { id, phone: '', account: '', holder: '', masked: '', linkedAt: Date.now() },
      details || {},
    );
    const existing = this.paymentById(id);
    if (existing) Object.assign(existing, entry);
    else this.payments = this.payments.concat(entry);
    if (!this.defaultPayment) this.defaultPayment = id;
    this._savePayments();
  },

  unlinkPayment(id) {
    const wasDefault = this.defaultPayment === id;
    this.payments = this.payments.filter((p) => p.id !== id);
    if (wasDefault) this.defaultPayment = this.payments[0] ? this.payments[0].id : null;
    this._savePayments();
  },

  /* Set one linked method as the default; no-op for an unlinked id. */
  setDefaultPayment(id) {
    if (!this.isPaymentLinked(id)) return;
    this.defaultPayment = id;
    this._savePayments();
  },

  _savePayments() {
    save(KEYS.payments, { list: this.payments, defaultPayment: this.defaultPayment });
    emit();
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
    this.payments = [];
    this.defaultPayment = null;
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
