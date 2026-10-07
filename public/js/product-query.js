/* Offline fallback for the product list.
 *
 * GET /api/products is the real path. When the request cannot reach the
 * server (a container restart, a flaky connection, a standalone local run
 * with no database), the grids fall back to this: the same filters, order
 * and paging applied in memory over the bundled catalog, so a filtered view
 * still renders instead of an error. It mirrors src/products.cjs's select()
 * on purpose; the server remains the source of truth for the ordering.
 */

import { PRODUCTS, RECOMMENDED_FOR_YOU, matchSearch, discountPct } from './data.js';

const SORTERS = {
  // The lists are already in curated order; a stable no-op sort keeps it.
  recommended: () => 0,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
  top_rated: (a, b) => b.rating - a.rating,
  best_selling: (a, b) => b.sold - a.sold,
  biggest_discount: (a, b) => discountPct(b) - discountPct(a),
};

function matches(p, params) {
  if (params.q && !matchSearch(p, params.q)) return false;
  if (params.cat && p.cat !== params.cat) return false;
  if (params.sub && p.sub !== params.sub) return false;
  const loc = p.location || {};
  if (params.province && loc.province !== params.province) return false;
  if (params.city && !String(params.city).split(',').map((c) => c.trim()).includes(loc.city)) return false;
  const min = params.min === undefined || params.min === '' ? null : Math.round(Number(params.min) * 100);
  const max = params.max === undefined || params.max === '' ? null : Math.round(Number(params.max) * 100);
  if (min !== null && Number.isFinite(min) && p.price < min) return false;
  if (max !== null && Number.isFinite(max) && p.price > max) return false;
  return true;
}

/* The same { items, total, page, limit, hasMore } contract the endpoint
 * returns. `base` names which catalog to search (the Recommended grid leads
 * with its own list; browse uses the whole catalog). */
export function localProductPage(params, { base = 'catalog' } = {}) {
  const source = base === 'recommended' ? RECOMMENDED_FOR_YOU : PRODUCTS;
  const list = source.filter((p) => matches(p, params));
  const cmp = SORTERS[params.sort] || SORTERS.recommended;
  list.sort(cmp);
  const limit = Math.max(1, Number(params.limit) || 24);
  const page = Math.max(1, Number(params.page) || 1);
  const start = (page - 1) * limit;
  const items = list.slice(start, start + limit);
  return { items, total: list.length, page, limit, hasMore: start + items.length < list.length };
}
