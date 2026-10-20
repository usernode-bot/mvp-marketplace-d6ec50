/* Client side of the Flash Sale: loads today's campaign from the server,
 * keeps the countdown clock, prices cart lines at the campaign price and
 * checks the Flash Sale lines of an order with the server before it is placed.
 *
 * Source of truth is GET /api/flash-sale (persisted campaigns). Only when that
 * request fails does flash-demo.js supply a clearly marked demo campaign.
 * This module never imports the store (the store imports it), so cart pricing
 * can ask it for a price without a cycle.
 */
import { apiFetch } from './api.js';
import { registerProducts } from './data.js';
import { buildDemoCampaign } from './flash-demo.js';

const state = {
  status: 'loading', // 'loading' | 'active' | 'ended' | 'empty'
  campaign: null, // { id, dateKey, timezone, startsAt, endsAt, status, demo? }
  items: [], // display products: the catalog product at the campaign price
  offset: 0, // server clock minus device clock, ms
  demo: false,
};
let offers = new Map(); // product id -> { price, orig, remaining }
const listeners = new Set();

export function flashSnapshot() {
  return state;
}

export function subscribeFlash(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

/* The server's idea of now. The countdown runs on this, not on the device
 * clock, so a wrong phone clock cannot show a wrong end time. */
export function flashNow() {
  return Date.now() + state.offset;
}

export function msUntilEnd() {
  return state.campaign ? Math.max(0, state.campaign.endsAt - flashNow()) : 0;
}

function apply(data, demo) {
  state.demo = demo;
  state.offset = demo ? 0 : (Date.parse(data.serverNow) || Date.now()) - Date.now();
  state.campaign = data.campaign;
  const items = data.items || [];
  registerProducts(items.map((i) => i.product));
  offers = new Map(items.map((i) => [i.product.id, i.offer]));
  state.items = items.map(({ product, offer }) => Object.assign({}, product, {
    price: offer.price,
    orig: offer.orig,
    flash: true,
    pct: offer.stock ? Math.min(100, Math.round((offer.sold / offer.stock) * 100)) : 0,
    oos: !!product.oos || offer.remaining <= 0,
  }));
  if (!items.length) state.status = 'empty';
  else state.status = data.campaign.status === 'active' && flashNow() < data.campaign.endsAt ? 'active' : 'ended';
  notify();
}

/* Fetch today's campaign. Safe to call again at any time (the countdown calls
 * it when a campaign ends, to pick up the next one). */
export async function loadFlashSale() {
  const headers = {};
  try {
    if (window.usernode && window.usernode.previewNow) headers['x-usernode-now'] = window.usernode.now().toISOString();
  } catch {
    // No preview clock: use real time.
  }
  const res = await apiFetch('/api/flash-sale', { headers });
  if (res.ok && res.data && res.data.campaign) {
    apply(res.data, false);
  } else {
    apply(buildDemoCampaign(Date.now()), true); // backend unreachable
  }
  return state;
}

/* Called by the countdown every second: moves an active campaign to ended the
 * moment its end instant passes. Returns true when it just ended. */
export function expireIfDue() {
  if (state.status === 'active' && state.campaign && flashNow() >= state.campaign.endsAt) {
    state.status = 'ended';
    notify();
    return true;
  }
  return false;
}

/* The product as the cart should price it. While a campaign runs, a product
 * in it sells at the campaign price; otherwise it is returned untouched. */
export function effectiveProduct(p) {
  const o = offers.get(p.id);
  if (!o || state.status !== 'active' || o.remaining <= 0) return p;
  if (p.price === o.price && p.orig === o.orig) return p;
  return Object.assign({}, p, { price: o.price, orig: o.orig });
}

function flashLines(entries) {
  if (state.status !== 'active') return [];
  return entries
    .filter((e) => offers.has(e.product.id))
    .map((e) => ({ productId: e.product.id, qty: e.item.qty, price: offers.get(e.product.id).price }));
}

/* Before an order is placed: confirms with the server that the campaign is
 * still running and that every Flash Sale line is in stock at its campaign
 * price, and reserves those units. { ok: true } when there is nothing to
 * check. Otherwise { ok: false, code } with code one of campaign_ended,
 * price_changed, out_of_stock, not_in_campaign, unavailable, account_required
 * or unreachable. The campaign is reloaded after any answer so the screen
 * shows what the server now says. */
export async function reserveFlashLines(entries) {
  if (expireIfDue()) { loadFlashSale(); return { ok: false, code: 'campaign_ended' }; }
  const lines = flashLines(entries);
  if (!lines.length) return { ok: true };
  if (state.demo) return { ok: true }; // demo campaign: nothing to reserve against
  const res = await apiFetch('/api/flash-sale/purchase', { method: 'POST', body: JSON.stringify({ items: lines }) });
  await loadFlashSale();
  if (res.ok) return { ok: true };
  if (res.status === 401) return { ok: false, code: 'account_required' };
  const code = res.data && res.data.code;
  return { ok: false, code: code || 'unreachable' };
}
