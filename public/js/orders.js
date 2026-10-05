/* Phase 5: Orders. The tabbed list (All / To Pay / To Ship / Shipped /
 * Completed / Cancelled), the order detail page and its actions (track,
 * cancel, buy again, contact seller).
 *
 * Orders are mock seed data from data.js (ORDER_SEEDS), like the catalog and
 * the vouchers: there is no checkout yet, so nothing here creates an order.
 * The one piece of user state is status overrides in the store: cancelling
 * an order is persisted, so a reload keeps the cancelled state. Everything
 * renders as HTML strings with data-* attributes; initOrders() registers the
 * one delegated click listener this module needs.
 */

import { icon, productArt } from './icons.js';
import { ORDER_SEEDS, productById } from './data.js';
import { store } from './store.js';
import { fmtDate, fmtPrice, emptyState, esc, toast, confirmDialog } from './ui.js';

const HOUR = 3600000;
const DAY = 86400000;

/* Status labels, badge colors and detail hints. Whole literal class strings
 * so the Tailwind compiler sees every one of them. */
const STATUS_META = {
  to_pay: {
    label: 'To Pay',
    badge: 'bg-amber-50 text-amber-700',
    text: 'text-amber-700',
    hint: 'Awaiting payment. This order ships as soon as payment is confirmed.',
  },
  to_ship: {
    label: 'To Ship',
    badge: 'bg-sky-50 text-sky-700',
    text: 'text-sky-700',
    hint: 'Payment received. We are packing your order for shipment.',
  },
  shipped: {
    label: 'Shipped',
    badge: 'bg-indigo-50 text-indigo-700',
    text: 'text-indigo-700',
    hint: 'On the way. Track the delivery below.',
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700',
    text: 'text-emerald-700',
    hint: 'Delivered. We hope you are enjoying your order.',
  },
  cancelled: {
    label: 'Cancelled',
    badge: 'bg-zinc-100 text-zinc-500',
    text: 'text-zinc-500',
    hint: 'This order was cancelled. Any payment is refunded within 3-5 business days.',
  },
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'to_pay', label: 'To Pay' },
  { id: 'to_ship', label: 'To Ship' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

let selectedTab = 'all';

/* ------------------------------------------------------------------ */
/* Order model                                                         */
/* ------------------------------------------------------------------ */

function statusOf(order) {
  return store.orderOverrides[order.no] || order.status;
}

/* Resolve seeds into full order objects. Built on demand at render time so
 * status overrides and "days ago" timestamps stay live. */
function placedSeeds() {
  return store.orders.map((o) => ({
    no: o.number,
    status: 'to_ship',
    daysAgo: Math.max(0, (Date.now() - o.placedAt) / DAY),
    items: o.items.map((it) => ({ id: it.id, qty: it.qty })),
    payment: o.paymentName || 'Payment on delivery',
    shipMethod: o.courierName || o.shippingName,
    shipEta: o.etaLabel,
    countryName: o.countryName || '',
    courierName: o.courierName || o.shippingName || '',
    shipping: o.shipping,
    address: {
      name: o.address.name,
      phone: o.address.phone,
      line1: o.address.address,
      city: o.address.city,
      zip: o.address.postal,
    },
  }));
}

function buildOrders() {
  return placedSeeds().concat(ORDER_SEEDS).map((seed) => {
    const items = seed.items
      .map((it) => ({ product: productById(it.id), qty: it.qty }))
      .filter((e) => e.product);
    const createdAt = Date.now() - seed.daysAgo * DAY;
    const subtotal = items.reduce((s, e) => s + e.product.price * e.qty, 0);
    const discount = items.reduce(
      (s, e) => s + (e.product.orig && e.product.orig > e.product.price
        ? (e.product.orig - e.product.price) * e.qty
        : 0),
      0);
    const status = seed.status;
    return {
      no: seed.no,
      status,
      createdAt,
      paidAt: status !== 'to_pay' ? createdAt + 2 * HOUR : null,
      shippedAt: status === 'shipped' || status === 'completed' ? createdAt + DAY : null,
      deliveredAt: status === 'completed' ? createdAt + 4 * DAY : null,
      cancelledAt: status === 'cancelled' ? createdAt + (seed.cancelledAfterHours || 3) * HOUR : null,
      items,
      itemCount: items.reduce((s, e) => s + e.qty, 0),
      subtotal,
      discount,
      shipping: seed.shipping,
      total: subtotal - discount + seed.shipping,
      payment: seed.payment,
      shipMethod: seed.shipMethod,
      shipEta: seed.shipEta,
      countryName: seed.countryName || '',
      courierName: seed.courierName || seed.shipMethod || '',
      address: seed.address,
    };
  }).sort((a, b) => b.createdAt - a.createdAt);
}

function orderByNo(no) {
  return buildOrders().find((o) => o.no === no) || null;
}

/* Total order count for the profile's quick-stats tile. */
export function countOrders() {
  return ORDER_SEEDS.length + store.orders.length;
}

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

function timelineSteps(o) {
  const s = statusOf(o);
  const placed = { label: 'Order placed', date: o.createdAt };
  const paid = { label: 'Payment confirmed', date: o.paidAt };
  const shipped = { label: 'Shipped', date: o.shippedAt };
  const delivered = { label: 'Delivered', date: o.deliveredAt };

  if (s === 'cancelled') {
    return [
      Object.assign({}, placed, { state: 'done' }),
      { label: 'Order cancelled', date: o.cancelledAt, state: 'cancelled' },
    ];
  }
  if (s === 'to_pay') {
    return [
      Object.assign({}, placed, { state: 'done' }),
      { label: 'Payment confirmed', date: null, hint: 'Awaiting payment', state: 'current' },
      Object.assign({}, shipped, { state: 'pending' }),
      Object.assign({}, delivered, { state: 'pending' }),
    ];
  }
  if (s === 'to_ship') {
    return [
      Object.assign({}, placed, { state: 'done' }),
      Object.assign({}, paid, { state: 'done' }),
      { label: 'Packing your order', date: null, hint: 'Usually ships in 1-2 days', state: 'current' },
      Object.assign({}, shipped, { state: 'pending' }),
      Object.assign({}, delivered, { state: 'pending' }),
    ];
  }
  if (s === 'shipped') {
    return [
      Object.assign({}, placed, { state: 'done' }),
      Object.assign({}, paid, { state: 'done' }),
      Object.assign({}, shipped, { state: 'done' }),
      { label: 'Delivered', date: null, hint: 'In transit', state: 'current' },
    ];
  }
  return [placed, paid, shipped, delivered].map((st) => Object.assign({}, st, { state: 'done' }));
}

function timelineDot(state) {
  if (state === 'done') {
    return '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">' + icon('check', 'h-3 w-3') + '</span>';
  }
  if (state === 'current') {
    return '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100"><span class="h-2 w-2 rounded-full bg-brand-600"></span></span>';
  }
  if (state === 'cancelled') {
    return '<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-500">' + icon('x', 'h-3 w-3') + '</span>';
  }
  return '<span class="h-5 w-5 shrink-0 rounded-full border-2 border-zinc-200 bg-white"></span>';
}

function timelineHtml(o) {
  const steps = timelineSteps(o);
  const rows = steps.map((st, i) => {
    const line = i < steps.length - 1 ? '<span class="min-h-4 w-px flex-1 bg-zinc-100"></span>' : '';
    const when = st.date
      ? fmtDate(st.date)
      : (st.hint ? '<span class="' + (st.state === 'current' ? 'font-medium text-brand-700' : 'text-zinc-400') + '">' + st.hint + '</span>' : '');
    const labelCls = st.state === 'pending' ? 'text-zinc-400' : 'text-zinc-800';
    return '<li class="flex gap-3">'
      + '<span class="flex flex-col items-center">' + timelineDot(st.state) + line + '</span>'
      + '<div class="min-w-0 flex-1 pb-1">'
      + '<p class="text-sm font-medium ' + labelCls + '">' + st.label + '</p>'
      + (when ? '<p class="mt-0.5 text-xs text-zinc-500">' + when + '</p>' : '')
      + '</div></li>';
  }).join('');
  return '<div class="card p-4" data-order-timeline>'
    + '<h2 class="text-sm font-semibold text-zinc-900">Timeline</h2>'
    + '<ol class="mt-3 flex flex-col">' + rows + '</ol></div>';
}

/* ------------------------------------------------------------------ */
/* Orders list                                                         */
/* ------------------------------------------------------------------ */

function statusBadge(order) {
  const meta = STATUS_META[statusOf(order)];
  return '<span class="badge ' + meta.badge + '">' + meta.label + '</span>';
}

function orderCard(o) {
  const first = o.items[0];
  const more = o.items.length - 1;
  return '<article class="card p-4" data-order-card="' + o.no + '">'
    + '<div class="flex items-center gap-2">'
    + '<span class="min-w-0 truncate text-xs font-medium text-zinc-500">No. ' + o.no + '</span>'
    + '<span class="ml-auto shrink-0">' + statusBadge(o) + '</span>'
    + '</div>'
    + '<div class="mt-3 flex gap-3">'
    + '<div class="h-16 w-16 shrink-0 overflow-hidden rounded-lg">' + productArt(first.product) + '</div>'
    + '<div class="min-w-0 flex-1">'
    + '<h3 class="truncate text-sm font-medium text-zinc-800">' + first.product.name + '</h3>'
    + '<p class="mt-0.5 text-xs text-zinc-500">Qty ' + first.qty
    + (more > 0 ? ' · +' + more + ' more item' + (more === 1 ? '' : 's') : '') + '</p>'
    + '<p class="mt-1 text-sm font-bold tabular-nums text-zinc-900">' + fmtPrice(o.total) + '</p>'
    + '</div>'
    + '</div>'
    + '<p class="mt-2 text-xs text-zinc-400">Placed ' + fmtDate(o.createdAt) + '</p>'
    + '<div class="mt-3 flex gap-2 border-t border-zinc-100 pt-3">'
    + '<button type="button" data-order-view="' + o.no + '" class="btn-outline btn-sm flex-1">View Details</button>'
    + '<button type="button" data-order-rebuy="' + o.no + '" class="btn-secondary btn-sm flex-1">Buy Again</button>'
    + '</div>'
    + '</article>';
}

function tabsHtml(counts) {
  return '<div role="tablist" aria-label="Order status" class="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">'
    + TABS.map((t) => {
      const active = t.id === selectedTab;
      const count = t.id === 'all' ? counts.all : counts[t.id];
      const countHtml = t.id !== 'all' && count
        ? '<span class="tabular-nums opacity-70">' + count + '</span>'
        : '';
      return '<button type="button" role="tab" aria-selected="' + active + '" data-order-tab="' + t.id
        + '" class="tab-pill' + (active ? ' tab-pill-active' : '') + '">' + t.label + countHtml + '</button>';
    }).join('')
    + '</div>';
}

function renderOrdersList() {
  const view = document.getElementById('view-orders');
  const orders = buildOrders();

  const counts = { all: orders.length };
  TABS.forEach((t) => {
    if (t.id !== 'all') counts[t.id] = orders.filter((o) => statusOf(o) === t.id).length;
  });

  const shown = selectedTab === 'all' ? orders : orders.filter((o) => statusOf(o) === selectedTab);
  const tabLabel = TABS.find((t) => t.id === selectedTab).label.toLowerCase();

  const body = shown.length
    ? '<div class="mt-4 flex flex-col gap-3">' + shown.map(orderCard).join('') + '</div>'
    : '<div class="card mt-4">' + emptyState({
      icon: 'package',
      title: 'No ' + tabLabel + ' orders',
      body: 'Orders in this status will show up here as soon as there are any.',
    }) + '</div>';

  view.innerHTML =
    '<h1 class="section-title">Orders</h1>'
    + tabsHtml(counts)
    + body;
}

export function setOrdersTab(id) {
  if (!TABS.some((t) => t.id === id)) return;
  selectedTab = id;
  renderOrdersList();
}

/* ------------------------------------------------------------------ */
/* Order detail                                                        */
/* ------------------------------------------------------------------ */

function infoRow(iconName, label, value, sub) {
  return '<div class="flex items-start gap-3 px-4 py-3.5">'
    + '<span class="mt-0.5 shrink-0 text-zinc-400">' + icon(iconName, 'h-5 w-5') + '</span>'
    + '<div class="min-w-0 flex-1">'
    + '<p class="text-sm font-medium text-zinc-800">' + label + '</p>'
    + (sub ? '<p class="mt-0.5 text-xs text-zinc-500">' + sub + '</p>' : '')
    + '</div>'
    + '<span class="shrink-0 text-sm font-semibold text-zinc-700">' + value + '</span>'
    + '</div>';
}

function summaryRow(label, value, cls = 'text-zinc-900') {
  return '<div class="flex justify-between gap-2"><span class="text-zinc-600">' + label
    + '</span><span class="font-medium tabular-nums ' + cls + '">' + value + '</span></div>';
}

function productsHtml(o) {
  const rows = o.items.map((e) => {
    const p = e.product;
    return '<div class="flex items-center gap-3 px-4 py-3">'
      + '<div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg">' + productArt(p) + '</div>'
      + '<div class="min-w-0 flex-1">'
      + '<h3 class="truncate text-sm font-medium text-zinc-800">' + p.name + '</h3>'
      + (p.variant ? '<p class="mt-0.5 truncate text-xs text-zinc-500">' + p.variant + '</p>' : '')
      + '<p class="mt-0.5 text-xs text-zinc-500">Qty ' + e.qty + '</p>'
      + '</div>'
      + '<span class="shrink-0 text-sm font-semibold tabular-nums text-zinc-900">' + fmtPrice(p.price * e.qty) + '</span>'
      + '</div>';
  }).join('');
  return '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">'
    + '<h2 class="px-4 pt-4 text-sm font-semibold text-zinc-900">Products</h2>'
    + '<div class="mt-1">' + rows + '</div></div>';
}

function actionsHtml(o) {
  const s = statusOf(o);
  const buttons = [];
  if (s === 'shipped' || s === 'completed') {
    buttons.push('<button type="button" data-order-track="' + o.no + '" class="btn-outline flex-1">Track Order</button>');
  }
  if (s === 'to_pay' || s === 'to_ship') {
    buttons.push('<button type="button" data-order-cancel="' + o.no + '" class="btn-outline flex-1 text-rose-600 hover:bg-rose-50">Cancel Order</button>');
  }
  buttons.push('<button type="button" data-order-rebuy="' + o.no + '" class="btn-primary flex-1">Buy Again</button>');
  buttons.push('<button type="button" data-order-contact="' + o.no + '" class="btn-outline flex-1">Contact Seller</button>');
  return '<div class="mt-4 flex flex-wrap gap-2">' + buttons.join('') + '</div>';
}

function renderOrderDetail(no) {
  const view = document.getElementById('view-orders');
  const o = orderByNo(no);
  if (!o) {
    renderOrdersList();
    return;
  }
  const s = statusOf(o);
  const meta = STATUS_META[s];
  const a = o.address;

  view.innerHTML =
    '<div class="flex items-center gap-1">'
    + '<button type="button" data-orders-back class="icon-btn -ml-2" aria-label="Back to orders">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">Order details</h1>'
    + '</div>'

    // Status card
    + '<div class="card mt-4 p-4">'
    + '<div class="flex items-start gap-3">'
    + '<div class="min-w-0 flex-1">'
    + '<p class="text-xs font-medium text-zinc-500">Order ' + o.no + '</p>'
    + '<h2 class="mt-0.5 text-lg font-bold ' + meta.text + '">' + meta.label + '</h2>'
    + '<p class="mt-1 text-sm text-zinc-500">' + meta.hint + '</p>'
    + '<p class="mt-1 text-xs text-zinc-400">Placed ' + fmtDate(o.createdAt) + '</p>'
    + '</div>'
    + '<button type="button" data-copy-text="' + o.no + '" class="icon-btn shrink-0" aria-label="Copy order number">' + icon('copy', 'h-4 w-4') + '</button>'
    + '</div></div>'

    + '<div class="mt-4">' + timelineHtml(o) + '</div>'

    // Shipping address
    + '<div class="card mt-4 p-4">'
    + '<h2 class="text-sm font-semibold text-zinc-900">Shipping address</h2>'
    + '<div class="mt-2 flex items-start gap-3">'
    + '<span class="mt-0.5 shrink-0 text-zinc-400">' + icon('mapPin', 'h-5 w-5') + '</span>'
    + '<div class="min-w-0 text-sm">'
    + '<p class="font-medium text-zinc-800">' + esc(a.name) + '</p>'
    + '<p class="mt-0.5 text-zinc-500">' + esc(a.phone) + '</p>'
    + '<p class="mt-0.5 text-zinc-500">' + esc(a.line1) + ', ' + esc(a.city) + ' ' + esc(a.zip) + '</p>'
    + '</div></div></div>'

    + productsHtml(o)

    // Payment + shipping method
    + '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">'
    + infoRow('creditCard', 'Payment method', esc(o.payment))
    + infoRow('truck', 'Courier', esc(o.courierName || o.shipMethod), (o.countryName ? 'Ship to ' + esc(o.countryName) + ' · ' : '') + o.shipEta)
    + '</div>'

    // Price breakdown
    + '<div class="card mt-4 p-4">'
    + '<h2 class="text-sm font-semibold text-zinc-900">Price summary</h2>'
    + '<div class="mt-3 space-y-1.5 text-sm">'
    + summaryRow('Subtotal (' + o.itemCount + (o.itemCount === 1 ? ' item' : ' items') + ')', fmtPrice(o.subtotal))
    + (o.discount ? summaryRow('Product discounts', '-' + fmtPrice(o.discount), 'text-brand-700') : '')
    + summaryRow('Shipping', o.shipping === 0 ? 'Free' : fmtPrice(o.shipping), o.shipping === 0 ? 'text-brand-700' : 'text-zinc-900')
    + '</div>'
    + '<div class="mt-3 flex justify-between border-t border-zinc-100 pt-3 text-base font-bold text-zinc-900"><span>Total</span><span class="tabular-nums">' + fmtPrice(o.total) + '</span></div>'
    + '</div>'

    + actionsHtml(o);
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export function buyAgain(no) {
  const o = orderByNo(no);
  if (!o) return;
  o.items.forEach((e) => {
    for (let i = 0; i < e.qty; i++) store.addToCart(e.product.id);
  });
  toast('Items added to cart');
  location.hash = '/cart';
}

function cancelOrder(no) {
  const o = orderByNo(no);
  if (!o) return;
  confirmDialog({
    title: 'Cancel order?',
    message: 'Order ' + no + ' will be cancelled. Any payment is refunded within 3-5 business days.',
    confirmLabel: 'Cancel order',
  }).then((ok) => {
    if (!ok) return;
    store.setOrderStatus(no, 'cancelled');
    toast('Order cancelled');
    renderOrdersView(); // show the cancelled state (and its actions) right away
  });
}

/* Track sheet content: carrier, tracking number and checkpoints. Rendered
 * as a real DOM element for the kit's presentSheet. */
function trackSheetElement(o) {
  const el = document.createElement('div');
  el.className = 'px-5 pb-6 pt-4';
  const trackingNo = 'SP-' + o.no.replace(/\D/g, '');
  const done = statusOf(o) === 'completed';
  const checkpoints = [
    { label: 'Label created', date: o.createdAt, state: 'done' },
    { label: 'Picked up by ' + (o.courierName || 'the courier'), date: o.shippedAt, state: 'done' },
    { label: 'In transit', date: null, hint: 'Moving through the network', state: done ? 'done' : 'current' },
    {
      label: 'Delivered',
      date: o.deliveredAt,
      hint: done ? '' : 'Estimated ' + fmtDate(o.createdAt + 4 * DAY),
      state: done ? 'done' : 'pending',
    },
  ];
  const rows = checkpoints.map((c, i) => {
    const line = i < checkpoints.length - 1 ? '<span class="min-h-4 w-px flex-1 bg-zinc-100"></span>' : '';
    const when = c.date ? fmtDate(c.date) : (c.hint || '');
    return '<li class="flex gap-3">'
      + '<span class="flex flex-col items-center">' + timelineDot(c.state) + line + '</span>'
      + '<div class="min-w-0 flex-1 pb-1">'
      + '<p class="text-sm font-medium text-zinc-800">' + c.label + '</p>'
      + (when ? '<p class="mt-0.5 text-xs text-zinc-500">' + when + '</p>' : '')
      + '</div></li>';
  }).join('');

  el.innerHTML =
    '<h3 class="text-base font-bold text-zinc-900">Track order</h3>'
    + '<p class="mt-0.5 text-xs text-zinc-500">Order ' + o.no + '</p>'
    + '<div class="mt-4 flex items-center gap-3 rounded-lg border border-zinc-100 p-3">'
    + '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">' + icon('truck', 'h-4 w-4') + '</span>'
    + '<div class="min-w-0 flex-1"><p class="text-sm font-semibold text-zinc-900">' + esc(o.courierName || 'SwiftPost') + '</p>'
    + '<p class="text-xs text-zinc-500">Tracking ' + trackingNo + '</p></div>'
    + '<button type="button" data-copy-text="' + trackingNo + '" class="icon-btn shrink-0" aria-label="Copy tracking number">' + icon('copy', 'h-4 w-4') + '</button>'
    + '</div>'
    + '<ol class="mt-4 flex flex-col">' + rows + '</ol>';
  return el;
}

let openSheet = null;

function trackOrder(no) {
  const o = orderByNo(no);
  if (!o) return;
  if (window.unNative && typeof window.unNative.presentSheet === 'function') {
    if (openSheet) openSheet.dismiss();
    openSheet = window.unNative.presentSheet({
      contentEl: trackSheetElement(o),
      onDismiss: () => { openSheet = null; },
    });
    return;
  }
  const courier = o.courierName || 'the courier';
  toast(statusOf(o) === 'completed'
    ? 'Delivered by ' + courier
    : 'In transit with ' + courier + '. Arriving soon.');
}

function contactSeller(no) {
  const message = 'In-app seller messaging arrives in a later phase. Your order number is ' + no
    + '. Keep it handy when contacting support.';
  if (window.unNative && typeof window.unNative.alert === 'function') {
    window.unNative.alert({
      title: 'Contact seller',
      message,
      buttons: [
        { label: 'Close', style: 'cancel' },
        { label: 'Copy order number', style: 'default' },
      ],
    }).then((r) => {
      if (r && r.button && r.button.label === 'Copy order number') copyText(no);
    });
    return;
  }
  window.confirm(message);
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast('Copied'),
      () => toast(text),
    );
    return;
  }
  toast(text);
}

/* ------------------------------------------------------------------ */
/* View entry + delegated listener                                     */
/* ------------------------------------------------------------------ */

export function renderOrdersView() {
  // A tracking sheet left open must not survive navigating to another order.
  if (openSheet) { openSheet.dismiss(); openSheet = null; }
  const segs = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (segs[1]) renderOrderDetail(decodeURIComponent(segs[1]));
  else renderOrdersList();
}

export function initOrders() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-order-tab], [data-order-view], [data-order-rebuy], [data-order-cancel], [data-order-track], [data-order-contact], [data-orders-back], [data-copy-text]');
    if (!el) return;

    const tab = el.getAttribute('data-order-tab');
    if (tab) return setOrdersTab(tab);

    const view = el.getAttribute('data-order-view');
    if (view) {
      location.hash = '/orders/' + view;
      return;
    }

    const rebuy = el.getAttribute('data-order-rebuy');
    if (rebuy) return buyAgain(rebuy);

    const cancel = el.getAttribute('data-order-cancel');
    if (cancel) return cancelOrder(cancel);

    const track = el.getAttribute('data-order-track');
    if (track) return trackOrder(track);

    const contact = el.getAttribute('data-order-contact');
    if (contact) return contactSeller(contact);

    if (el.hasAttribute('data-orders-back')) {
      location.hash = '/orders';
      return;
    }

    const copy = el.getAttribute('data-copy-text');
    if (copy) copyText(copy);
  });
}