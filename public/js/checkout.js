/* Checkout (Phase 4): shipping address, products, shipping options, voucher,
 * payment method and a live order summary, plus the mock place-order flow
 * (loading -> processing -> success) and inline validation.
 *
 * All checkout/payment logic is mock and client-side: no real payment
 * provider is contacted and no data leaves the browser. A placed order is
 * stored through store.addOrder() so the Orders tab can show it, and the
 * cart is cleared on success. The saved address persists in localStorage
 * under the same app-level `bazario:` namespace as the rest of the store.
 */

import { icon, productArt } from './icons.js';
import { store } from './store.js';
import { fmtEtaDate, fmtPrice, emptyState, toast } from './ui.js';

const view = document.getElementById('view-checkout');
const ADDRESS_KEY = 'bazario:address';

/* Shipping options. etaDays drives the estimated-delivery date range shown
 * on the success screen and the Orders tab. */
const SHIPPING = [
  { id: 'standard', name: 'Standard', price: 299, eta: '3-5 business days', etaDays: [3, 5] },
  { id: 'express', name: 'Express', price: 999, eta: '1-2 business days', etaDays: [1, 2] },
];

/* Mock voucher codes. The hint under the input names one so a tester can
 * exercise the flow without guessing. */
const VOUCHERS = {
  MVP10: { kind: 'pct', value: 10, label: '10% off your order' },
  WELCOME5: { kind: 'flat', value: 500, label: '$5.00 off your order' },
};

const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit / debit card', icon: 'creditCard', desc: 'Visa, Mastercard, American Express' },
  { id: 'bank', name: 'Bank transfer', icon: 'bank', desc: 'Transfer details are shown after you place the order' },
  { id: 'ewallet', name: 'E-wallet', icon: 'smartphone', desc: 'Pay from your stored e-wallet balance' },
  { id: 'cod', name: 'Cash on delivery', icon: 'banknote', desc: 'Pay the courier when your order arrives' },
];

const FIELDS = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'Full name', autocomplete: 'name' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 555 010 2233', autocomplete: 'tel' },
  { key: 'address', label: 'Address', type: 'text', placeholder: 'Street and house number', autocomplete: 'street-address' },
  { key: 'city', label: 'City', type: 'text', placeholder: 'City', autocomplete: 'address-level2' },
  { key: 'postal', label: 'Postal code', type: 'text', placeholder: 'ZIP / postal code', autocomplete: 'postal-code' },
];

/* Mock variant per category: the catalog has no real variants yet, and the
 * checkout asks for one to be shown per line. */
const VARIANTS = {
  electronics: 'Black',
  fashion: 'Medium',
  beauty: '50 ml',
  home: 'Standard',
  sports: 'One size',
  groceries: '1 pack',
  accessories: 'Standard',
};

/* Mock payment timing: two simulated stages before the success screen. */
const LOADING_MS = 900;
const PROCESSING_MS = 1400;

const state = {
  address: loadAddress(), // { name, phone, address, city, postal } | null
  editingAddress: false,
  shippingId: 'standard',
  voucher: null, // { code, kind, value, label }
  paymentId: null,
  phase: 'idle', // idle | loading | processing
  draft: null, // unsaved address form values, kept across re-renders
  voucherDraft: '',
};

function loadAddress() {
  try {
    const raw = localStorage.getItem(ADDRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAddress(value) {
  try {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(value));
  } catch {
    // Storage refused: the address just does not persist for the session.
  }
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function ship() {
  return SHIPPING.find((s) => s.id === state.shippingId) || SHIPPING[0];
}

function totals() {
  const subtotal = store.cartTotal();
  let discount = 0;
  if (state.voucher) {
    discount = state.voucher.kind === 'pct'
      ? Math.round((subtotal * state.voucher.value) / 100)
      : state.voucher.value;
    discount = Math.min(discount, subtotal);
  }
  const shipping = ship().price;
  return { subtotal, shipping, discount, total: Math.max(subtotal + shipping - discount, 0) };
}

function etaLabel(opt) {
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  return fmtEtaDate(new Date(now + opt.etaDays[0] * day)) + ' – ' + fmtEtaDate(new Date(now + opt.etaDays[1] * day));
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function sectionHead(iconName, title, extra = '') {
  return '<div class="flex items-center gap-2">'
    + '<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">' + icon(iconName, 'h-4 w-4') + '</span>'
    + '<h2 class="text-sm font-semibold text-zinc-900">' + title + '</h2>'
    + extra
    + '</div>';
}

function fieldHtml(f, value) {
  return '<div' + (f.key === 'address' ? ' class="sm:col-span-2"' : '') + '>'
    + '<label class="mb-1 block text-xs font-medium text-zinc-600" for="co-' + f.key + '">' + f.label + '</label>'
    + '<input id="co-' + f.key + '" data-field="' + f.key + '" type="' + f.type + '" class="field" '
    + 'placeholder="' + f.placeholder + '" autocomplete="' + f.autocomplete + '" value="' + esc(value) + '">'
    + '<p class="field-msg hidden" data-field-msg="' + f.key + '"></p>'
    + '</div>';
}

function addressSection() {
  const a = state.address;
  const editing = state.editingAddress || !a;
  let body;
  if (!editing) {
    body = '<div class="mt-3 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">'
      + '<p class="font-medium text-zinc-900">' + esc(a.name) + '</p>'
      + '<p class="mt-0.5">' + esc(a.phone) + '</p>'
      + '<p class="mt-0.5">' + esc(a.address) + ', ' + esc(a.city) + ' ' + esc(a.postal) + '</p>'
      + '</div>'
      + '<button type="button" class="btn-ghost btn-sm mt-2 -ml-1" data-addr-edit>Change address</button>';
  } else {
    const v = state.draft || a || {};
    body = '<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">'
      + FIELDS.map((f) => fieldHtml(f, v[f.key] || '')).join('')
      + '</div>'
      + '<button type="button" class="btn-secondary btn-sm mt-3" data-addr-save>Save address</button>';
  }
  return '<section class="card p-4" aria-label="Shipping address">' + sectionHead('mapPin', 'Shipping address') + body + '</section>';
}

function productsSection(entries) {
  const rows = entries.map((e) => {
    const p = e.product;
    return '<div class="flex items-center gap-3 py-3">'
      + '<div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg">' + productArt(p) + '</div>'
      + '<div class="min-w-0 flex-1">'
      + '<h3 class="truncate text-sm font-medium text-zinc-800">' + p.name + '</h3>'
      + '<div class="mt-1 flex flex-wrap items-center gap-1.5">'
      + '<span class="badge-soft">' + (VARIANTS[p.cat] || 'Standard') + '</span>'
      + '<span class="text-xs text-zinc-500">Qty ' + e.item.qty + '</span>'
      + '</div></div>'
      + '<div class="text-right">'
      + '<div class="text-sm font-bold tabular-nums text-zinc-900">' + fmtPrice(p.price * e.item.qty) + '</div>'
      + (e.item.qty > 1 ? '<div class="text-xs tabular-nums text-zinc-400">' + fmtPrice(p.price) + ' each</div>' : '')
      + '</div></div>';
  }).join('');
  return '<section class="card p-4" aria-label="Products" data-checkout-products>'
    + sectionHead('bag', 'Products', '<span class="badge-soft ml-auto">' + entries.length + '</span>')
    + '<div class="mt-1 divide-y divide-zinc-100">' + rows + '</div>'
    + '</section>';
}

function shippingSection() {
  const rows = SHIPPING.map((o) => {
    const sel = o.id === state.shippingId;
    return '<button type="button" data-ship="' + o.id + '" aria-pressed="' + sel
      + '" class="flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors '
      + (sel ? 'border-brand-500 bg-brand-50/50' : 'border-zinc-200 hover:bg-zinc-50') + '">'
      + '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full '
      + (sel ? 'bg-brand-100 text-brand-700' : 'bg-zinc-100 text-zinc-500') + '">' + icon('truck', 'h-4 w-4') + '</span>'
      + '<span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-zinc-900">' + o.name + '</span>'
      + '<span class="block text-xs text-zinc-500">' + o.eta + '</span></span>'
      + '<span class="text-sm font-bold tabular-nums ' + (sel ? 'text-brand-700' : 'text-zinc-900') + '">' + fmtPrice(o.price) + '</span>'
      + '</button>';
  }).join('');
  return '<section class="card p-4" aria-label="Shipping">' + sectionHead('truck', 'Shipping')
    + '<div class="mt-3 flex flex-col gap-2">' + rows + '</div>'
    + '</section>';
}

function voucherSection() {
  let body;
  if (state.voucher) {
    body = '<div class="mt-3 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">'
      + '<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-green-600">' + icon('ticket', 'h-4 w-4') + '</span>'
      + '<div class="min-w-0 flex-1"><p class="text-sm font-semibold text-zinc-900">' + state.voucher.code + '</p>'
      + '<p class="text-xs text-zinc-500">' + state.voucher.label + '</p></div>'
      + '<button type="button" class="btn-ghost btn-sm" data-voucher-remove>Remove</button>'
      + '</div>';
  } else {
    body = '<div class="mt-3 flex items-start gap-2">'
      + '<input data-voucher-input type="text" class="field" placeholder="Voucher code" aria-label="Voucher code" value="' + esc(state.voucherDraft) + '">'
      + '<button type="button" class="btn-secondary" data-voucher-apply>Apply</button>'
      + '</div>'
      + '<p class="field-msg hidden" data-voucher-msg></p>'
      + '<p class="mt-2 text-xs text-zinc-400">Try MVP10 for 10% off your order.</p>';
  }
  return '<section class="card p-4" aria-label="Voucher">' + sectionHead('ticket', 'Voucher') + body + '</section>';
}

function paymentSection() {
  const m = PAYMENT_METHODS.find((x) => x.id === state.paymentId) || null;
  let body;
  if (m) {
    body = '<div class="mt-3 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2.5">'
      + '<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">' + icon(m.icon, 'h-4 w-4') + '</span>'
      + '<div class="min-w-0 flex-1"><p class="text-sm font-semibold text-zinc-900">' + m.name + '</p>'
      + '<p class="truncate text-xs text-zinc-500">' + m.desc + '</p></div>'
      + '<span class="text-brand-600">' + icon('check', 'h-4 w-4') + '</span>'
      + '</div>'
      + '<button type="button" class="btn-ghost btn-sm mt-2 -ml-1" data-payment-open>Change payment method</button>';
  } else {
    body = '<button type="button" class="btn-secondary mt-3 w-full" data-payment-open>Choose payment method</button>'
      + '<p class="field-msg hidden" data-payment-msg>Choose a payment method to place your order</p>';
  }
  return '<section class="card p-4" aria-label="Payment method">' + sectionHead('creditCard', 'Payment method') + body + '</section>';
}

function summarySection(t) {
  return '<h2 class="text-sm font-semibold text-zinc-900">Order summary</h2>'
    + '<div class="mt-3 flex justify-between text-sm text-zinc-600"><span>Subtotal</span><span class="font-medium tabular-nums text-zinc-900">' + fmtPrice(t.subtotal) + '</span></div>'
    + '<div class="mt-1.5 flex justify-between text-sm text-zinc-600"><span>Shipping</span><span class="font-medium tabular-nums text-zinc-900">' + fmtPrice(t.shipping) + '</span></div>'
    + (t.discount ? '<div class="mt-1.5 flex justify-between text-sm text-zinc-600"><span>Discount</span><span class="font-medium tabular-nums text-green-600">-' + fmtPrice(t.discount) + '</span></div>' : '')
    + '<div class="mt-3 flex justify-between border-t border-zinc-100 pt-3 text-sm font-semibold text-zinc-900"><span>Total</span><span class="tabular-nums">' + fmtPrice(t.total) + '</span></div>'
    + '<button type="button" class="btn-primary mt-4 w-full" data-place-order><span>Place order</span></button>'
    + '<p class="mt-2 text-center text-xs text-zinc-400">Mock checkout: no real payment is taken.</p>';
}

export function renderCheckoutView() {
  // Keep unsaved typing alive across re-renders (e.g. picking shipping while
  // halfway through the address form).
  if (view.querySelector('[data-field]')) {
    const values = {};
    FIELDS.forEach((f) => {
      const el = view.querySelector('[data-field="' + f.key + '"]');
      if (el) values[f.key] = el.value;
    });
    state.draft = values;
    const vIn = view.querySelector('[data-voucher-input]');
    if (vIn) state.voucherDraft = vIn.value;
  }

  const entries = store.cartItems();
  if (!entries.length) {
    view.innerHTML =
      '<div class="flex items-center gap-2">'
      + '<button type="button" class="icon-btn -ml-2" data-nav="cart" aria-label="Back to cart">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
      + '<h1 class="section-title">Checkout</h1></div>'
      + '<div class="card mt-4">' + emptyState({
        icon: 'cart',
        title: 'Your cart is empty',
        body: 'Add items to your cart to check out.',
        actionLabel: 'Continue shopping',
        actionAttr: 'data-nav="home"',
      }) + '</div>';
    return;
  }

  const t = totals();
  const items = store.cartCount();

  view.innerHTML =
    '<div class="flex items-center gap-2">'
    + '<button type="button" class="icon-btn -ml-2" data-nav="cart" aria-label="Back to cart">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">Checkout</h1>'
    + '<span class="badge-soft ml-1">' + items + (items === 1 ? ' item' : ' items') + '</span>'
    + '</div>'
    + '<div class="mt-4 grid gap-6 lg:grid-cols-3">'
    + '<div class="flex flex-col gap-4 lg:col-span-2">'
    + addressSection()
    + productsSection(entries)
    + shippingSection()
    + voucherSection()
    + paymentSection()
    + '</div>'
    + '<div class="lg:col-span-1"><div class="card p-4 lg:sticky lg:top-24">' + summarySection(t) + '</div></div>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function validateAddress(v) {
  const errors = {};
  if ((v.name || '').trim().length < 2) errors.name = 'Enter your full name';
  const digits = ((v.phone || '').match(/\d/g) || []).length;
  if (digits < 7) errors.phone = 'Enter a valid phone number';
  if ((v.address || '').trim().length < 5) errors.address = 'Enter your street address';
  if (!(v.city || '').trim()) errors.city = 'Enter your city';
  if (!/^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/.test((v.postal || '').trim())) errors.postal = 'Enter a valid postal code';
  return errors;
}

function showFieldErrors(errors) {
  FIELDS.forEach((f) => {
    const input = view.querySelector('[data-field="' + f.key + '"]');
    const msg = view.querySelector('[data-field-msg="' + f.key + '"]');
    if (input) input.classList.toggle('field-error', !!errors[f.key]);
    if (msg) {
      msg.textContent = errors[f.key] || '';
      msg.classList.toggle('hidden', !errors[f.key]);
    }
  });
}

function showVoucherError(message) {
  const input = view.querySelector('[data-voucher-input]');
  const msg = view.querySelector('[data-voucher-msg]');
  if (input) input.classList.add('field-error');
  if (msg) {
    msg.textContent = message;
    msg.classList.remove('hidden');
  }
}

function collectForm() {
  const values = {};
  FIELDS.forEach((f) => {
    const el = view.querySelector('[data-field="' + f.key + '"]');
    values[f.key] = el ? el.value : ((state.address && state.address[f.key]) || '');
  });
  return values;
}

function scrollFirstError(errors) {
  const first = FIELDS.find((f) => errors[f.key]);
  const el = first && view.querySelector('[data-field="' + first.key + '"]');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function saveAddressForm() {
  const values = collectForm();
  const errors = validateAddress(values);
  if (Object.keys(errors).length) {
    showFieldErrors(errors);
    scrollFirstError(errors);
    return;
  }
  state.address = values;
  saveAddress(values);
  state.editingAddress = false;
  state.draft = null;
  toast('Address saved');
  renderCheckoutView();
}

function applyVoucher() {
  const input = view.querySelector('[data-voucher-input]');
  const code = (input ? input.value : state.voucherDraft).trim().toUpperCase();
  if (!code) {
    showVoucherError('Enter a voucher code');
    return;
  }
  const v = VOUCHERS[code];
  if (!v) {
    showVoucherError('That code is not valid');
    return;
  }
  state.voucher = { code, kind: v.kind, value: v.value, label: v.label };
  state.voucherDraft = '';
  toast('Voucher applied: ' + v.label);
  renderCheckoutView();
}

function updatePlaceButton() {
  const btn = view.querySelector('[data-place-order]');
  if (!btn) return;
  const busy = state.phase !== 'idle';
  btn.disabled = busy;
  btn.innerHTML = busy
    ? icon('loader', 'h-4 w-4 animate-spin') + '<span>' + (state.phase === 'loading' ? 'Placing order…' : 'Processing payment…') + '</span>'
    : '<span>Place order</span>';
}

function completeOrder(entries) {
  const s = ship();
  const t = totals();
  const method = PAYMENT_METHODS.find((x) => x.id === state.paymentId);
  const order = {
    number: 'BZ-' + Math.floor(100000 + Math.random() * 900000),
    placedAt: Date.now(),
    status: 'Processing',
    etaLabel: etaLabel(s),
    shippingId: s.id,
    shippingName: s.name,
    paymentId: method ? method.id : null,
    paymentName: method ? method.name : '',
    address: { ...state.address },
    items: entries.map((e) => ({ id: e.product.id, name: e.product.name, qty: e.item.qty, price: e.product.price })),
    subtotal: t.subtotal,
    shipping: t.shipping,
    discount: t.discount,
    total: t.total,
  };
  store.addOrder(order);
  store.clearCart();
  state.phase = 'idle';
  state.draft = null;
  renderSuccess(order);
}

function placeOrder() {
  if (state.phase !== 'idle') return;
  const entries = store.cartItems();
  if (!entries.length) return;

  // Validate and save whatever is in the address form right now.
  if (state.editingAddress || !state.address) {
    const values = collectForm();
    const errors = validateAddress(values);
    if (Object.keys(errors).length) {
      showFieldErrors(errors);
      scrollFirstError(errors);
      toast('Check the highlighted fields');
      return;
    }
    state.address = values;
    saveAddress(values);
    state.editingAddress = false;
    state.draft = null;
  }

  if (!state.paymentId) {
    const msg = view.querySelector('[data-payment-msg]');
    if (msg) {
      msg.classList.remove('hidden');
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    toast('Choose a payment method');
    return;
  }

  // Mock payment: two simulated stages, no real provider is contacted.
  state.phase = 'loading';
  updatePlaceButton();
  setTimeout(() => {
    if (state.phase !== 'loading') return;
    state.phase = 'processing';
    updatePlaceButton();
  }, LOADING_MS);
  setTimeout(() => {
    if (state.phase !== 'processing') return;
    completeOrder(entries);
  }, LOADING_MS + PROCESSING_MS);
}

/* ------------------------------------------------------------------ */
/* Payment modal                                                       */
/* ------------------------------------------------------------------ */

let modalEl = null;

function payRow(m) {
  const sel = state.paymentId === m.id;
  return '<button type="button" data-payment-pick="' + m.id
    + '" class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-zinc-50'
    + (sel ? ' bg-brand-50' : '') + '">'
    + '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full '
    + (sel ? 'bg-brand-100 text-brand-700' : 'bg-zinc-100 text-zinc-500') + '">' + icon(m.icon, 'h-5 w-5') + '</span>'
    + '<span class="min-w-0 flex-1"><span class="block text-sm font-semibold text-zinc-900">' + m.name + '</span>'
    + '<span class="block truncate text-xs text-zinc-500">' + m.desc + '</span></span>'
    + (sel
      ? '<span class="text-brand-600">' + icon('check', 'h-5 w-5') + '</span>'
      : '<span class="h-5 w-5 shrink-0 rounded-full border-2 border-zinc-200"></span>')
    + '</button>';
}

function onModalKeydown(e) {
  if (e.key === 'Escape') closePaymentModal();
}

function closePaymentModal() {
  if (!modalEl) return;
  modalEl.remove();
  modalEl = null;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onModalKeydown);
}

function choosePayment(id) {
  const m = PAYMENT_METHODS.find((x) => x.id === id);
  if (!m) return;
  state.paymentId = m.id;
  closePaymentModal();
  const msg = view.querySelector('[data-payment-msg]');
  if (msg) msg.classList.add('hidden');
  toast('Payment method: ' + m.name);
  renderCheckoutView();
}

function openPaymentModal() {
  if (state.phase !== 'idle') return;
  closePaymentModal();
  modalEl = document.createElement('div');
  modalEl.id = 'payment-modal';
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');
  modalEl.setAttribute('aria-label', 'Choose payment method');
  modalEl.className = 'fixed inset-0 z-50 flex items-end justify-center sm:items-center';
  modalEl.innerHTML =
    '<div class="absolute inset-0 bg-zinc-900/40" data-payment-close></div>'
    + '<div class="relative w-full rounded-t-2xl bg-white shadow-card-lg sm:max-w-md sm:rounded-2xl">'
    + '<div class="flex items-center justify-between border-b border-zinc-100 px-4 py-3">'
    + '<h2 class="text-sm font-semibold text-zinc-900">Payment method</h2>'
    + '<button type="button" class="icon-btn h-8 w-8" data-payment-close aria-label="Close">' + icon('x', 'h-4 w-4') + '</button>'
    + '</div>'
    + '<div class="p-3">' + PAYMENT_METHODS.map(payRow).join('') + '</div>'
    + '<div class="hidden sm:block h-2"></div>'
    + '<div class="sm:hidden" style="padding-bottom: var(--un-safe-inset-bottom, env(safe-area-inset-bottom, 0px));"></div>'
    + '</div>';
  modalEl.addEventListener('click', (e) => {
    const pick = e.target.closest('[data-payment-pick]');
    if (pick) {
      choosePayment(pick.getAttribute('data-payment-pick'));
      return;
    }
    if (e.target.closest('[data-payment-close]')) closePaymentModal();
  });
  document.body.appendChild(modalEl);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onModalKeydown);
}

/* ------------------------------------------------------------------ */
/* Success screen                                                      */
/* ------------------------------------------------------------------ */

function renderSuccess(order) {
  view.innerHTML =
    '<div class="card mx-auto mt-8 max-w-md p-6 text-center">'
    + '<span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">' + icon('check', 'h-8 w-8') + '</span>'
    + '<h1 class="mt-4 text-xl font-bold tracking-tight text-zinc-900">Order placed successfully</h1>'
    + '<p class="mt-1 text-sm text-zinc-500">Order <span class="font-semibold text-zinc-900">' + order.number + '</span></p>'
    + '<div class="mt-5 rounded-xl bg-zinc-50 p-4 text-left text-sm">'
    + '<div class="flex justify-between gap-3"><span class="text-zinc-600">Estimated delivery</span><span class="font-medium text-zinc-900">' + order.etaLabel + '</span></div>'
    + '<div class="mt-2 flex justify-between gap-3"><span class="text-zinc-600">Shipping</span><span class="font-medium text-zinc-900">' + order.shippingName + '</span></div>'
    + '<div class="mt-2 flex justify-between gap-3"><span class="text-zinc-600">Payment</span><span class="font-medium text-zinc-900">' + order.paymentName + '</span></div>'
    + '<div class="mt-2 flex justify-between gap-3 border-t border-zinc-200 pt-2"><span class="text-zinc-600">Total</span><span class="font-semibold tabular-nums text-zinc-900">' + fmtPrice(order.total) + '</span></div>'
    + '</div>'
    + '<button type="button" class="btn-primary mt-5 w-full" data-nav="orders">View order</button>'
    + '<button type="button" class="btn-outline mt-2 w-full" data-nav="home">Continue shopping</button>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Event wiring (delegated, like the rest of the app)                  */
/* ------------------------------------------------------------------ */

view.addEventListener('click', (e) => {
  const pick = e.target.closest('[data-payment-pick]');
  if (pick) {
    choosePayment(pick.getAttribute('data-payment-pick'));
    return;
  }
  if (e.target.closest('[data-payment-close]')) {
    closePaymentModal();
    return;
  }

  const target = e.target.closest('[data-addr-edit], [data-addr-save], [data-ship], [data-voucher-apply], [data-voucher-remove], [data-payment-open], [data-place-order]');
  if (!target) return;

  if (target.hasAttribute('data-addr-edit')) {
    state.editingAddress = true;
    state.draft = state.address ? { ...state.address } : {};
    renderCheckoutView();
    return;
  }
  if (target.hasAttribute('data-addr-save')) {
    saveAddressForm();
    return;
  }
  const shipId = target.getAttribute('data-ship');
  if (shipId) {
    if (state.phase !== 'idle') return;
    state.shippingId = shipId;
    renderCheckoutView();
    return;
  }
  if (target.hasAttribute('data-voucher-apply')) {
    applyVoucher();
    return;
  }
  if (target.hasAttribute('data-voucher-remove')) {
    if (state.phase !== 'idle') return;
    state.voucher = null;
    renderCheckoutView();
    return;
  }
  if (target.hasAttribute('data-payment-open')) {
    openPaymentModal();
    return;
  }
  if (target.hasAttribute('data-place-order')) {
    placeOrder();
  }
});

view.addEventListener('input', (e) => {
  const el = e.target;
  if (el.hasAttribute('data-field')) {
    el.classList.remove('field-error');
    const msg = view.querySelector('[data-field-msg="' + el.getAttribute('data-field') + '"]');
    if (msg) {
      msg.textContent = '';
      msg.classList.add('hidden');
    }
    return;
  }
  if (el.hasAttribute('data-voucher-input')) {
    state.voucherDraft = el.value;
    el.classList.remove('field-error');
    const msg = view.querySelector('[data-voucher-msg]');
    if (msg) msg.classList.add('hidden');
  }
});

view.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target && e.target.hasAttribute && e.target.hasAttribute('data-voucher-input')) {
    e.preventDefault();
    applyVoucher();
  }
});