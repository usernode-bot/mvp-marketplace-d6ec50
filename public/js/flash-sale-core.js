/* Flash Sale rules shared by the server (src/flash-sale.cjs) and the client's
 * demo fallback (public/js/flash-demo.js), so there is exactly one definition
 * of which day it is, which products qualify and which ones a day picks.
 *
 * Pure functions only: no DOM, no database, no clock. Every time is passed in
 * as epoch milliseconds, which is what makes the rules testable.
 *
 * Selection algorithm (deterministic daily rotation):
 *   score(product, day) = hash32(day + '|' + product.id)
 * Eligible products are ordered by that score (ties by id) and the first N are
 * the day's picks. Products that ran the previous day are only used when fewer
 * than N other eligible products exist. The same inputs always give the same
 * list, so every visitor sees the same products on the same day, and a new date
 * key reshuffles the order without any random call.
 */

export const FLASH_SIZE = 12; // products per daily campaign
export const FLASH_STOCK_CAP = 50; // most units of one product put on sale per campaign
export const DEFAULT_TIMEZONE = 'Asia/Jakarta';

export function validTimezone(tz) {
  if (typeof tz !== 'string' || !tz.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/* The configured marketplace timezone, or the default for a missing or
 * unknown value (a typo in the setting must not take the page down). */
export function resolveTimezone(tz) {
  return validTimezone(tz) ? tz.trim() : DEFAULT_TIMEZONE;
}

const fmtCache = new Map();
function partsFormatter(tz) {
  if (!fmtCache.has(tz)) {
    fmtCache.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }));
  }
  return fmtCache.get(tz);
}

function zonedParts(ms, tz) {
  const o = {};
  for (const p of partsFormatter(tz).formatToParts(new Date(ms))) o[p.type] = p.value;
  return { y: Number(o.year), m: Number(o.month), d: Number(o.day), h: Number(o.hour), mi: Number(o.minute), s: Number(o.second) };
}

/* Offset of the zone from UTC at an instant, in ms (Jakarta: +7h). */
function offsetAt(ms, tz) {
  const p = zonedParts(ms, tz);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(ms / 1000) * 1000;
}

const pad = (n) => String(n).padStart(2, '0');

/* "2026-10-12": the calendar date in the marketplace zone. The rotation key. */
export function dateKeyFor(ms, tz) {
  const p = zonedParts(ms, resolveTimezone(tz));
  return p.y + '-' + pad(p.m) + '-' + pad(p.d);
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1) + '-' + pad(t.getUTCDate());
}

/* The instant a calendar date starts in the zone (handles DST: that day may
 * be 23 or 25 hours long). */
export function zonedStartUtc(key, tz) {
  const zone = resolveTimezone(tz);
  const [y, m, d] = key.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const first = offsetAt(guess, zone);
  let t = guess - first;
  const second = offsetAt(t, zone);
  if (second !== first) t = guess - second;
  return t;
}

/* A daily campaign runs from local midnight to the next local midnight. */
export function campaignWindow(key, tz) {
  return { startsAt: zonedStartUtc(key, tz), endsAt: zonedStartUtc(addDays(key, 1), tz) };
}

/* 'scheduled' before it starts, 'active' while it runs, 'ended' once the end
 * instant is reached (the end itself is already ended). */
export function campaignStatus(c, nowMs) {
  if (nowMs < c.startsAt) return 'scheduled';
  if (nowMs < c.endsAt) return 'active';
  return 'ended';
}

export function remainingMs(endsAt, nowMs) {
  return Math.max(0, endsAt - nowMs);
}

function firstImage(p) {
  const first = Array.isArray(p.images) && p.images.length ? p.images[0] : p.image;
  return typeof first === 'string' && first.trim() ? first.trim() : '';
}

/* Can this product go in a Flash Sale? Active and not sold out, a real name,
 * photo and price, a discount price strictly below the original price, a
 * positive stock count (an unknown count does not qualify: nothing could be
 * validated at purchase), and not opted out of Flash Sales. */
export function isEligible(p) {
  if (!p || typeof p.id !== 'string' || !p.id) return false;
  if (p.active === false || p.oos) return false;
  if (p.flashEligible === false) return false;
  if (typeof p.name !== 'string' || !p.name.trim()) return false;
  if (!firstImage(p)) return false;
  if (!Number.isInteger(p.price) || p.price <= 0) return false;
  if (!Number.isInteger(p.orig) || p.orig <= p.price) return false;
  if (!Number.isInteger(p.stock) || p.stock <= 0) return false;
  return true;
}

/* Percent off, from the actual prices. */
export function discountFrom(price, orig) {
  if (!Number.isInteger(price) || !Number.isInteger(orig) || orig <= 0 || price >= orig) return 0;
  return Math.round((1 - price / orig) * 100);
}

/* 32-bit FNV-1a followed by a murmur-style finalizer, so nearby ids do not
 * produce nearby scores. */
export function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function ranked(list, key) {
  return list
    .map((p) => ({ p, score: hash32(key + '|' + p.id) }))
    .sort((a, b) => a.score - b.score || (a.p.id < b.p.id ? -1 : a.p.id > b.p.id ? 1 : 0))
    .map((x) => x.p);
}

/* The day's products, in display order. `pool` may hold anything: ineligible
 * rows and duplicate ids are dropped here. `avoidIds` is the previous day's
 * picks; they are used only to top up when fewer than `count` other products
 * qualify. Returns [] for an empty pool. */
export function selectDaily(pool, key, count = FLASH_SIZE, avoidIds = []) {
  const seen = new Set();
  const eligible = [];
  for (const p of pool || []) {
    if (isEligible(p) && !seen.has(p.id)) { seen.add(p.id); eligible.push(p); }
  }
  const avoid = new Set(avoidIds || []);
  const fresh = ranked(eligible.filter((p) => !avoid.has(p.id)), key);
  if (fresh.length >= count) return fresh.slice(0, count);
  const repeats = ranked(eligible.filter((p) => avoid.has(p.id)), key);
  return fresh.concat(repeats).slice(0, count);
}

/* What a picked product sells for: the catalog's current discount price, the
 * original price it is measured against, and the stock set aside for the
 * campaign (never more than the product really has). */
export function offerFor(p) {
  return {
    price: p.price,
    orig: p.orig,
    pct: discountFrom(p.price, p.orig),
    stock: Math.min(p.stock, FLASH_STOCK_CAP),
  };
}
