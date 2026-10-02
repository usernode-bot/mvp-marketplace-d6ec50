/* Phase 3: the cart tab, end to end. Owns item rows (selection, variant,
 * price/discount, quantity, remove, favorite, save-for-later), the select-all
 * bar, the voucher block, the order summary and the mobile sticky checkout
 * bar. Totals are recomputed from the store on every render; the store
 * re-renders this view after each change, so everything stays in sync.
 *
 * Rendering is HTML strings with behavior wired through data-* attributes and
 * the delegated click handler in app.js (the app-wide pattern). The voucher
 * form is the one delegated submit listener, registered by initCart().
 */

import { icon, productArt } from './icons.js';
import { VOUCHERS, voucherByCode, voucherDescription, discountPct } from './data.js';
import { store } from './store.js';
import { fmtPrice, emptyState, toast } from './ui.js';

/* Shipping estimate: free over $50, otherwise a flat $3.99. */
const FREE_SHIPPING_AT = 5000;
const SHIPPING_FEE = 399;

/* Transient voucher-input state: the error shown under the input and the
 * code that produced it. Cleared on the next store change (see initCart). */
let voucherError = null;
let voucherDraft = '';

/* Escape a user-typed string for use inside an attribute value. */
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ------------------------------------------------------------------ */
/* Demo state for staging previews and proposal checks                 */
/* ------------------------------------------------------------------ */

const DEMO_SEED_FLAG = 'bazario:demo-seeded';

/* ?demo=1 seeds a representative cart once, so the populated cart is
 * reachable from a URL (checks and before/after shots start from a fresh
 * browser with an empty cart). Only seeds an empty cart, and only once per
 * browser: after that the route is an ordinary cart page and the empty state
 * is reachable at /#/cart. */
function seedDemoCart() {
  if (new URLSearchParams(window.location.search).get('demo') !== '1') return;
  try {
    if (localStorage.getItem(DEMO_SEED_FLAG)) return;
    if (store.cart.length) return;
    store.setCart([
      { id: 'p01', qty: 1, selected: true },
      { id: 'p14', qty: 2, selected: true },
      { id: 'p09', qty: 1, selected: true },
      { id: 'p26', qty: 1, selected: false },
    ]);
    localStorage.setItem(DEMO_SEED_FLAG, '1');
  } catch {
    // Storage refused: run with whatever is in the cart.
  }
}

/* ------------------------------------------------------------------ */
/* Totals                                                              */
/* ------------------------------------------------------------------ */

function computeTotals(entries) {
  const selected = entries.filter((e) => e.item.selected);
  const subtotal = selected.reduce((s, e) => s + e.product.price * e.item.qty, 0);
  const productDiscounts = selected.reduce(
    (s, e) => s + (e.product.orig && e.product.orig > e.product.price
      ? (e.product.orig - e.product.price) * e.item.qty
      : 0),
    0);

  let shipping = 0;
  if (selected.length) shipping = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;

  const voucher = store.voucher ? voucherByCode(store.voucher) : null;
  let voucherActive = false;
  let voucherDiscount = 0;
  if (voucher && selected.length) {
    if (subtotal >= voucher.min) {
      voucherActive = true;
      if (voucher.type === 'percent') voucherDiscount = Math.round((subtotal * voucher.value) / 100);
      else if (voucher.type === 'fixed') voucherDiscount = Math.min(voucher.value, subtotal);
      else if (voucher.type === 'ship') shipping = 0;
    }
  }

  const total = subtotal - voucherDiscount + shipping;
  const itemCount = selected.reduce((s, e) => s + e.item.qty, 0);
  return { selected, subtotal, productDiscounts, shipping, voucher, voucherActive, voucherDiscount, total, itemCount };
}

/* ------------------------------------------------------------------ */
/* Item rows                                                           */
/* ------------------------------------------------------------------ */

function cartRow(entry) {
  const { item, product: p } = entry;
  const disc = discountPct(p);
  const fav = store.isFavorite(p.id);
  const ghostBtn = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors ';

  return '<div class="card flex gap-3 p-3" data-cart-row="' + p.id + '">'
    + '<input type="checkbox" data-cart-select="' + p.id + '"' + (item.selected ? ' checked' : '')
    + ' class="mt-1 h-4 w-4 shrink-0 accent-brand-600" aria-label="Select ' + p.name + '">'
    + '<div class="h-20 w-20 shrink-0 overflow-hidden rounded-lg">' + productArt(p) + '</div>'
    + '<div class="min-w-0 flex-1">'
    + '<div class="flex items-start gap-2">'
    + '<h3 class="min-w-0 flex-1 text-sm font-medium leading-snug text-zinc-800">' + p.name + '</h3>'
    + (disc ? '<span class="badge-sale shrink-0">-' + disc + '%</span>' : '')
    + '</div>'
    + (p.variant ? '<p class="mt-0.5 truncate text-xs text-zinc-500">' + p.variant + '</p>' : '')
    + '<div class="mt-1 flex items-baseline gap-1.5">'
    + '<span class="text-sm font-bold tabular-nums text-zinc-900">' + fmtPrice(p.price) + '</span>'
    + (p.orig ? '<span class="text-xs tabular-nums text-zinc-400 line-through">' + fmtPrice(p.orig) + '</span>' : '')
    + '</div>'
    + '<div class="mt-2 flex items-center gap-2">'
    + '<button type="button" data-cart-minus="' + p.id + '" aria-label="Decrease quantity"'
    + (item.qty <= 1 ? ' disabled' : '')
    + ' class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40">' + icon('minus', 'h-3.5 w-3.5') + '</button>'
    + '<span class="min-w-6 text-center text-sm font-semibold tabular-nums">' + item.qty + '</span>'
    + '<button type="button" data-cart-plus="' + p.id + '" aria-label="Increase quantity" class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50">' + icon('plus', 'h-3.5 w-3.5') + '</button>'
    + (item.qty > 1
      ? '<span class="ml-1 text-xs text-zinc-500">Line total <span class="font-semibold tabular-nums text-zinc-700">' + fmtPrice(p.price * item.qty) + '</span></span>'
      : '')
    + '</div>'
    + '<div class="mt-2 flex items-center gap-0.5">'
    + '<button type="button" data-fav="' + p.id + '" aria-label="Toggle favorite" aria-pressed="' + fav
    + '" class="' + ghostBtn + (fav ? 'text-rose-500 hover:bg-rose-50' : 'hover:bg-zinc-100 hover:text-zinc-600') + '">' + icon(fav ? 'heartFilled' : 'heart', 'h-4 w-4') + '</button>'
    + '<button type="button" data-cart-save="' + p.id + '" aria-label="Save for later" class="' + ghostBtn + 'hover:bg-zinc-100 hover:text-zinc-600">' + icon('bookmark', 'h-4 w-4') + '</button>'
    + '<button type="button" data-cart-remove="' + p.id + '" aria-label="Remove from cart" class="' + ghostBtn + 'hover:bg-rose-50 hover:text-rose-600">' + icon('trash', 'h-4 w-4') + '</button>'
    + '</div>'
    + '</div>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Selection bar + saved for later                                     */
/* ------------------------------------------------------------------ */

function selectionBar(entries) {
  const allSelected = entries.every((e) => e.item.selected);
  const selectedCount = entries.filter((e) => e.item.selected).length;
  return '<div class="card flex items-center gap-3 px-4 py-3">'
    + '<label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700">'
    + '<input type="checkbox" data-cart-select-all' + (allSelected ? ' checked' : '')
    + ' class="h-4 w-4 accent-brand-600" aria-label="Select all items">'
    + '<span>' + (allSelected ? 'Deselect all' : 'Select all') + '</span></label>'
    + '<span class="badge-soft ml-auto">' + selectedCount + ' of ' + entries.length + ' selected</span>'
    + '</div>';
}

function savedRow(p) {
  return '<div class="card flex items-center gap-3 p-3" data-saved-row="' + p.id + '">'
    + '<div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg">' + productArt(p) + '</div>'
    + '<div class="min-w-0 flex-1">'
    + '<h3 class="truncate text-sm font-medium text-zinc-800">' + p.name + '</h3>'
    + (p.variant ? '<p class="mt-0.5 truncate text-xs text-zinc-500">' + p.variant + '</p>' : '')
    + '<span class="text-sm font-bold tabular-nums text-zinc-900">' + fmtPrice(p.price) + '</span>'
    + '</div>'
    + '<button type="button" data-saved-move="' + p.id + '" class="btn-outline btn-sm shrink-0">Move to cart</button>'
    + '<button type="button" data-saved-remove="' + p.id + '" aria-label="Remove saved item" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600">' + icon('trash', 'h-4 w-4') + '</button>'
    + '</div>';
}

function savedSection(saved) {
  return '<section class="mt-6" aria-label="Saved for later">'
    + '<div class="flex items-center gap-2"><h2 class="section-title">Saved for later</h2><span class="badge-soft">' + saved.length + '</span></div>'
    + '<div class="mt-3 flex flex-col gap-3">' + saved.map(savedRow).join('') + '</div>'
    + '</section>';
}

/* ------------------------------------------------------------------ */
/* Vouchers                                                            */
/* ------------------------------------------------------------------ */

function voucherBlock(totals) {
  const applied = store.voucher ? voucherByCode(store.voucher) : null;

  let appliedHtml = '';
  if (applied) {
    const active = totals.voucherActive;
    const box = active ? 'border-brand-100 bg-brand-50' : 'border-zinc-200 bg-zinc-50';
    const fg = active ? 'text-brand-700' : 'text-zinc-500';
    const effect = active
      ? (applied.type === 'ship' ? 'Free' : '-' + fmtPrice(totals.voucherDiscount))
      : '$0.00';
    appliedHtml =
      '<div class="mt-3 flex items-start gap-2.5 rounded-lg border p-3 ' + box + '">'
      + '<span class="mt-0.5 shrink-0 ' + fg + '">' + icon('ticket', 'h-4 w-4') + '</span>'
      + '<div class="min-w-0 flex-1">'
      + '<div class="flex items-center gap-2"><span class="text-sm font-semibold ' + fg + '">' + applied.code + '</span>'
      + (active ? '<span class="badge-brand">Applied</span>' : '')
      + '</div>'
      + '<p class="mt-0.5 text-xs ' + fg + '">' + voucherDescription(applied) + '</p>'
      + (active ? '' : '<p class="mt-1 text-xs text-zinc-500">Your order is under the minimum, so it is not applied yet.</p>')
      + '</div>'
      + '<span class="shrink-0 text-sm font-semibold tabular-nums ' + fg + '">' + effect + '</span>'
      + '<button type="button" data-voucher-remove aria-label="Remove voucher" class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600">' + icon('x', 'h-3.5 w-3.5') + '</button>'
      + '</div>';
  }

  const list = VOUCHERS.map((v) => {
    const isApplied = applied && applied.code === v.code;
    return '<div class="flex items-center gap-3 rounded-lg border border-zinc-100 p-2.5">'
      + '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">' + icon('ticket', 'h-4 w-4') + '</span>'
      + '<div class="min-w-0 flex-1">'
      + '<p class="text-sm font-semibold text-zinc-900">' + v.code + '</p>'
      + '<p class="text-xs text-zinc-500">' + voucherDescription(v) + '</p>'
      + '</div>'
      + (isApplied
        ? '<span class="badge-brand shrink-0">Applied</span>'
        : '<button type="button" data-voucher-pick="' + v.code + '" class="btn-ghost btn-sm shrink-0">Apply</button>')
      + '</div>';
  }).join('');

  return '<div class="mt-4 border-t border-zinc-100 pt-3">'
    + '<h3 class="text-sm font-semibold text-zinc-900">Vouchers</h3>'
    + appliedHtml
    + '<form data-voucher-form class="mt-3 flex gap-2">'
    + '<div class="relative flex-1">'
    + '<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">' + icon('ticket', 'h-4 w-4') + '</span>'
    + '<input name="code" type="text" value="' + esc(voucherDraft) + '" placeholder="Enter voucher code" autocomplete="off" aria-label="Voucher code"'
    + ' class="input' + (voucherError ? ' border-rose-300 focus:border-rose-400 focus:ring-rose-100' : '') + '">'
    + '</div>'
    + '<button type="submit" class="btn-outline">Apply</button>'
    + '</form>'
    + (voucherError ? '<p class="mt-1.5 text-xs font-medium text-rose-600">' + voucherError + '</p>' : '')
    + '<p class="mt-3 text-xs font-medium text-zinc-400">Available vouchers</p>'
    + '<div class="mt-2 space-y-2">' + list + '</div>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Summary                                                             */
/* ------------------------------------------------------------------ */

function summaryRow(label, value, cls = 'text-zinc-900') {
  return '<div class="flex justify-between gap-2"><span class="text-zinc-600">' + label
    + '</span><span class="font-medium tabular-nums ' + cls + '">' + value + '</span></div>';
}

function summaryBlock(totals) {
  const items = totals.itemCount + (totals.itemCount === 1 ? ' item' : ' items');
  const shippingRow = !totals.selected.length
    ? summaryRow('Shipping', '—', 'text-zinc-400')
    : totals.shipping === 0
      ? summaryRow('Estimated shipping', 'Free', 'text-brand-700')
      : summaryRow('Estimated shipping', fmtPrice(totals.shipping));
  const voucherRow = totals.voucherActive && totals.voucher.type !== 'ship'
    ? summaryRow('Voucher (' + totals.voucher.code + ')', '-' + fmtPrice(totals.voucherDiscount), 'text-brand-700')
    : '';

  return '<div class="card p-4 lg:sticky lg:top-24">'
    + '<h2 class="text-sm font-semibold text-zinc-900">Order summary</h2>'
    + '<div class="mt-3 space-y-1.5 text-sm">'
    + summaryRow('Subtotal (' + items + ')', fmtPrice(totals.subtotal))
    + (totals.productDiscounts ? summaryRow('Product discounts', '-' + fmtPrice(totals.productDiscounts), 'text-brand-700') : '')
    + shippingRow
    + voucherRow
    + '</div>'
    + voucherBlock(totals)
    + '<div class="mt-4 flex justify-between border-t border-zinc-100 pt-3 text-base font-bold text-zinc-900"><span>Total</span><span class="tabular-nums">' + fmtPrice(totals.total) + '</span></div>'
    + '<button type="button" data-soon class="btn-primary mt-4 w-full">Checkout</button>'
    + '<p class="mt-2 text-center text-xs text-zinc-400">Checkout and payment arrive in a later phase.</p>'
    + '</div>';
}

/* Sticky checkout bar above the mobile bottom nav. Positioned in JS against
 * the actual nav height (which includes the safe-area inset) so it never
 * floats or overlaps. */
function mobileBar(totals) {
  const items = totals.itemCount + (totals.itemCount === 1 ? ' item' : ' items');
  return '<div id="cart-checkout-bar" class="fixed inset-x-0 z-30 border-t border-zinc-100 bg-white/95 px-4 py-2.5 backdrop-blur md:hidden">'
    + '<div class="mx-auto flex max-w-lg items-center gap-3">'
    + '<div class="min-w-0">'
    + '<p class="text-[11px] text-zinc-500">Total (' + items + ')</p>'
    + '<p class="text-base font-bold leading-tight tabular-nums text-zinc-900">' + fmtPrice(totals.total) + '</p>'
    + '</div>'
    + '<button type="button" data-soon class="btn-primary ml-auto shrink-0">Checkout</button>'
    + '</div>'
    + '</div>';
}

function positionBar() {
  const bar = document.getElementById('cart-checkout-bar');
  if (!bar) return;
  const nav = document.getElementById('bottom-nav');
  bar.style.bottom = nav && nav.offsetHeight ? nav.offsetHeight + 'px' : '0px';
}

/* ------------------------------------------------------------------ */
/* Remove confirmation                                                 */
/* ------------------------------------------------------------------ */

function confirmRemove(message) {
  if (window.unNative && typeof window.unNative.alert === 'function') {
    return window.unNative.alert({
      title: 'Remove item?',
      message,
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Remove', style: 'destructive' },
      ],
    }).then((r) => !!(r && r.button && r.button.style === 'destructive'));
  }
  return Promise.resolve(window.confirm(message));
}

export function removeCartItem(id) {
  const entry = store.cartItems().find((e) => e.product.id === id);
  const name = entry ? entry.product.name : 'This item';
  confirmRemove(name + ' will be removed from your cart.').then((ok) => {
    if (!ok) return;
    store.removeFromCart(id);
    toast('Removed from cart');
  });
}

/* ------------------------------------------------------------------ */
/* Voucher actions                                                     */
/* ------------------------------------------------------------------ */

export function applyVoucherCode(raw) {
  const code = (raw || '').trim().toUpperCase();
  voucherError = null;
  voucherDraft = code;

  const v = code ? voucherByCode(code) : null;
  if (!v) {
    voucherError = code
      ? '"' + code + '" is not a valid voucher code. Check the spelling and try again.'
      : 'Enter a voucher code first.';
    renderCartView();
    return false;
  }

  const subtotal = computeTotals(store.cartItems()).subtotal;
  if (subtotal < v.min) {
    voucherError = '"' + v.code + '" needs a ' + fmtPrice(v.min) + ' subtotal. Add ' + fmtPrice(v.min - subtotal) + ' more to use it.';
    renderCartView();
    return false;
  }

  store.setVoucher(v.code);
  toast('Voucher ' + v.code + ' applied');
  return true;
}

/* ------------------------------------------------------------------ */
/* View                                                                */
/* ------------------------------------------------------------------ */

export function renderCartView() {
  const view = document.getElementById('view-cart');
  if (!view) return;
  seedDemoCart();

  const entries = store.cartItems();
  const saved = store.savedItems();

  if (!entries.length) {
    view.innerHTML =
      '<h1 class="section-title">Cart</h1>'
      + '<div class="card mt-4">' + emptyState({
        icon: 'cart',
        title: 'Your cart is empty',
        body: 'Browse the catalog and add something you like.',
        actionLabel: 'Start shopping',
        actionAttr: 'data-nav="home"',
      }) + '</div>'
      + (saved.length ? savedSection(saved) : '');
    return;
  }

  const totals = computeTotals(entries);

  view.innerHTML =
    '<div class="flex items-center gap-2"><h1 class="section-title">Cart</h1><span class="badge-soft">'
    + entries.length + (entries.length === 1 ? ' item' : ' items') + '</span></div>'
    + '<div class="mt-4 grid items-start gap-6 lg:grid-cols-3">'
    + '<div class="flex flex-col gap-3 lg:col-span-2">'
    + selectionBar(entries)
    + entries.map(cartRow).join('')
    + '</div>'
    + '<div class="lg:col-span-1">' + summaryBlock(totals) + '</div>'
    + '</div>'
    + (saved.length ? savedSection(saved) : '')
    + mobileBar(totals);

  positionBar();
}

/* Voucher-input state resets on any cart change, and the voucher form is the
 * one delegated submit listener this view needs. */
export function initCart() {
  store.subscribe(() => {
    voucherError = null;
    voucherDraft = '';
  });
  // Keep the sticky bar above the bottom nav when the viewport moves across
  // the md breakpoint (the nav is display:none on desktop, so a render there
  // leaves the bar at bottom 0 until something repositions it).
  window.addEventListener('resize', positionBar);
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-voucher-form]');
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector('input[name="code"]');
    applyVoucherCode(input ? input.value : '');
  });
}
