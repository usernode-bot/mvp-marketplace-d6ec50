/* Server-side catalog query layer.
 *
 * The catalog stays a single source of truth: this module reads the client's
 * own data module (public/js/data.js), which Node loads as ESM (the
 * public/js/package.json marker makes that folder modules for both the
 * browser and Node). So there is no second, drifting copy of the products:
 * the rows the server writes to Postgres, the province/city vocabulary it
 * filters against and the relevance score it sorts by are the client's.
 *
 * The filtering and ordering happen in Postgres (see server.js). This module
 * owns the two things that must match the client exactly: the ORDER BY for a
 * sort id, and the WHERE for a set of filters. It also builds the seed rows.
 *
 * Prices are integer cents. `price` is the price the shopper pays; `orig` is
 * the pre-discount price when there is one; `discount` is the percent off
 * (0 when `orig` is absent). Sorting and the price range both use `price`.
 */

const catalog = require('../public/js/data.js');
const { SORT_OPTIONS, DEFAULT_SORT } = require('../public/js/sort-options.js');

const PRODUCTS = catalog.PRODUCTS;
const { discountPct, subcategoryName } = catalog;

// The curated Recommended order (recommended-data.js first, then the older
// catalog rows), which is what the home grid showed before it was paged by
// the server. "recommended" sorts by it so the default view is unchanged.
const RANK = new Map(catalog.RECOMMENDED_FOR_YOU.map((p, i) => [p.id, i]));

const SORT_IDS = new Set(SORT_OPTIONS.map((o) => o.id));

/* One product as a database row. `search_text` is the lower-cased haystack a
 * free-text query scans, so a search never has to concat five columns per
 * row at query time. */
function toRow(p) {
  const loc = p.location || {};
  return {
    id: p.id,
    name: p.name,
    cat: p.cat,
    sub: p.sub || '',
    brand: p.brand,
    art: p.art || '',
    price: p.price,
    orig: p.orig || null,
    discount: discountPct(p),
    rating: p.rating,
    reviews: p.reviews,
    sold: p.sold,
    oos: !!p.oos,
    age: p.age,
    province: loc.province || '',
    city: loc.city || '',
    kw: p.kw || '',
    image: p.image || null,
    flash: !!p.flash,
    pct: p.pct || 0,
    rank: RANK.has(p.id) ? RANK.get(p.id) : 0,
    search_text: [p.name, p.brand, p.cat, subcategoryName(p.cat, p.sub), p.kw || '']
      .join(' ').toLowerCase(),
  };
}

const ROWS = PRODUCTS.map(toRow);

/* ORDER BY per sort id, plus a stable id tiebreaker so paging never repeats
 * or skips a row. `recommended` reproduces the client's relevance score. */
const ORDER_SQL = {
  recommended: { column: 'rank', direction: 'ASC' },
  price_asc: { column: 'price', direction: 'ASC' },
  price_desc: { column: 'price', direction: 'DESC' },
  top_rated: { column: 'rating', direction: 'DESC' },
  best_selling: { column: 'sold', direction: 'DESC' },
  biggest_discount: { column: 'discount', direction: 'DESC' },
};

/* A safe, length-bounded string from a loosely typed query value. */
function boundedText(value, max) {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

/* The city filter is a set, not one value: the client sends the chosen
 * cities as a comma-separated list (or repeated keys), and the endpoint keeps
 * rows in any of them. Each name is trimmed and length-bounded; duplicates are
 * dropped so the same choice never widens the WHERE twice. */
function cityList(source) {
  const raw = [];
  if (source && typeof source.getAll === 'function') {
    raw.push(...source.getAll('city'));
  } else if (source) {
    const v = source.city;
    if (Array.isArray(v)) raw.push(...v);
    else if (v !== undefined && v !== null) raw.push(String(v));
  }
  const out = [];
  for (const value of raw) {
    for (const part of String(value).split(',')) {
      const t = part.trim().slice(0, 80);
      if (t && !out.includes(t)) out.push(t);
    }
  }
  return out.slice(0, 60);
}

/* "$1,299.50", "1299.5", "1299" -> 129950 cents. Returns null for anything
 * that is not a usable non-negative amount. */
function dollarsToCents(value) {
  const raw = typeof value === 'string' ? value.trim().replace(/[$,]/g, '') : '';
  if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const n = Math.round(Number(raw) * 100);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const MAX_PAGE = 10000;
const DEFAULT_LIMIT = 24;

/* Turn raw query values into a validated filter set. Unknown sorts fall back
 * to `recommended`; unknown places and out-of-range numbers are kept as
 * ordinary values, so `city=Nowhere` filters to nothing rather than being
 * silently widened to everywhere. */
function parseParams(source) {
  // Accepts a URLSearchParams (tests) or Express's parsed query object
  // (req.query). A repeated key arrives as an array; the first value wins.
  const get = (k) => {
    if (!source) return null;
    if (typeof source.get === 'function') return source.get(k);
    const v = source[k];
    if (Array.isArray(v)) return v.length ? v[0] : null;
    return v === undefined || v === null ? null : String(v);
  };
  const sort = get('sort');
  const page = Number(get('page'));
  const limit = Number(get('limit'));
  const min = dollarsToCents(get('min'));
  const max = dollarsToCents(get('max'));
  return {
    q: boundedText(get('q'), 100),
    cat: boundedText(get('cat'), 40),
    sub: boundedText(get('sub'), 40),
    province: boundedText(get('province'), 80),
    cities: cityList(source),
    min,
    max,
    sort: sort && SORT_IDS.has(sort) ? sort : DEFAULT_SORT,
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, 100) : DEFAULT_LIMIT,
  };
}

function escapeLike(term) {
  return term.replace(/[\\%_]/g, '\\$&');
}

/* Build the parameterized WHERE clause for a parsed filter set. */
function buildWhere(params) {
  const clauses = [];
  const values = [];
  const add = (value, sql) => {
    values.push(value);
    clauses.push(sql.replace('?', '$' + values.length));
  };

  if (params.q) {
    const terms = params.q.toLowerCase().split(/\s+/).filter(Boolean);
    // Every term must appear somewhere in the haystack (AND of LIKEs), which
    // is exactly what the client's matchSearch does.
    for (const term of terms) add('%' + escapeLike(term) + '%', "search_text LIKE ? ESCAPE '\\'");
  }
  if (params.cat) add(params.cat, 'cat = ?');
  if (params.sub) add(params.sub, 'sub = ?');
  if (params.province) add(params.province, 'province = ?');
  // Membership, not equality: the city filter is a multi-select.
  if (params.cities && params.cities.length) add(params.cities, 'city = ANY(?)');
  if (params.min !== null) add(params.min, 'price >= ?');
  if (params.max !== null) add(params.max, 'price <= ?');

  return { clause: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', values };
}

function orderBy(sort) {
  const o = ORDER_SQL[sort] || ORDER_SQL.recommended;
  return 'ORDER BY ' + o.column + ' ' + o.direction + ', id ASC';
}

/* Pure in-memory filter + page over an array of product rows (the seed rows,
 * or rows read back from Postgres). The route uses the SQL path; this mirrors
 * it so the same rules can be exercised without a database. */
function select(rows, params) {
  const terms = params.q ? params.q.toLowerCase().split(/\s+/).filter(Boolean) : [];
  let list = rows.filter((r) => {
    if (terms.length && !terms.every((t) => r.search_text.includes(t))) return false;
    if (params.cat && r.cat !== params.cat) return false;
    if (params.sub && r.sub !== params.sub) return false;
    if (params.province && r.province !== params.province) return false;
    if (params.cities && params.cities.length && !params.cities.includes(r.city)) return false;
    if (params.min !== null && r.price < params.min) return false;
    if (params.max !== null && r.price > params.max) return false;
    return true;
  });

  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const comparators = {
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    top_rated: (a, b) => b.rating - a.rating,
    best_selling: (a, b) => b.sold - a.sold,
    biggest_discount: (a, b) => b.discount - a.discount,
    recommended: (a, b) => (a.rank || 0) - (b.rank || 0),
  };
  const cmp = comparators[params.sort] || comparators.recommended;
  list = [...list].sort((a, b) => cmp(a, b) || byId(a, b));

  const total = list.length;
  const start = (params.page - 1) * params.limit;
  const items = list.slice(start, start + params.limit);
  return { items, total, page: params.page, limit: params.limit, hasMore: start + items.length < total };
}

/* One database row back into the client's product shape, so a card, the
 * product page and the cart read the same fields whether the row came from
 * the API or from the bundled catalog. */
function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    cat: row.cat,
    sub: row.sub,
    brand: row.brand,
    art: row.art,
    price: row.price,
    orig: row.orig,
    rating: Number(row.rating),
    reviews: row.reviews,
    sold: row.sold,
    oos: row.oos,
    age: row.age,
    location: { province: row.province, city: row.city },
    kw: row.kw,
    image: row.image,
    flash: row.flash,
    pct: row.pct,
  };
}

module.exports = { ROWS, parseParams, buildWhere, orderBy, select, toProduct, SORT_OPTIONS, DEFAULT_SORT, discountPct };
