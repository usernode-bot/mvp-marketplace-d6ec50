/* Product filters: the one shared filter/sort state for the marketplace.
 *
 * Every surface that shows a filtered product list (the home "Recommended
 * for you" grid and the category/search browse pages) reads and writes
 * through `productFilters`, so the same choices mean the same thing
 * everywhere and survive navigation in the address bar.
 *
 * State lives in the URL hash query (`#/home?city=Batam&sort=price_asc`),
 * which is what makes a filtered view shareable: the router parses the same
 * params, the hook serializes them back, and a reload or a pasted link lands
 * on the same list.
 *
 * The hook has no DOM dependency (its only import is the i18n lookup); the UI module (filter-ui.js) renders it and
 * api.js fetches from it.
 */

import { SORT_OPTIONS, DEFAULT_SORT } from './sort-options.js';
import { t, has } from './i18n.js';

/* The translated name of a sort order, resolved at call time. */
export function sortText(id) {
  const row = SORT_OPTIONS.find((o) => o.id === id) || SORT_OPTIONS[0];
  return has(row.labelKey) ? t(row.labelKey) : row.label;
}

/* How long to wait after the last keystroke/number before asking the server.
 * The URL is updated immediately (so the address bar is truthful and a
 * reload is instant); only the network request is debounced. */
export const FILTER_DEBOUNCE_MS = 300;
export const DEFAULT_LIMIT = 24;

/* The default, "nothing chosen" filter set. */
export function emptyFilters() {
  return {
    province: '',
    cities: [],
    min: null, // integer cents
    max: null,
    sort: DEFAULT_SORT,
  };
}

/* A filter set is "active" when it narrows the list in any way. Sort alone is
 * not an active filter: it reorders, it does not remove anything. */
export function hasActiveFilters(f) {
  return !!(f.province || f.cities.length || f.min !== null || f.max !== null);
}

export function activeFilterCount(f) {
  return (f.province || f.cities.length ? 1 : 0)
    + (f.min !== null || f.max !== null ? 1 : 0);
}

/* "$25" for a whole-dollar amount, "$25.50" otherwise. */
function fmtAmount(cents) {
  const d = cents / 100;
  return '$' + (Number.isInteger(d) ? String(d) : d.toFixed(2));
}

/* Short human labels for the active-filter chips, in a stable order:
 * location, then price, then sort. */
export function filterChips(f) {
  const chips = [];
  if (f.province || f.cities.length) {
    const label = f.cities.length
      ? (f.cities.length === 1 ? f.cities[0] : f.cities[0] + ' +' + (f.cities.length - 1))
      : f.province;
    chips.push({ key: 'location', label, title: f.province && f.cities.length ? f.province + ': ' + f.cities.join(', ') : label });
  }
  if (f.min !== null && f.max !== null) {
    chips.push({ key: 'price', label: fmtAmount(f.min) + ' - ' + fmtAmount(f.max), title: t('filters.chip.priceRange', { min: fmtAmount(f.min), max: fmtAmount(f.max) }) });
  } else if (f.min !== null) {
    chips.push({ key: 'price', label: t('filters.chip.from', { amount: fmtAmount(f.min) }), title: t('filters.chip.priceFrom', { amount: fmtAmount(f.min) }) });
  } else if (f.max !== null) {
    chips.push({ key: 'price', label: t('filters.chip.upTo', { amount: fmtAmount(f.max) }), title: t('filters.chip.priceUpTo', { amount: fmtAmount(f.max) }) });
  }
  if (f.sort !== DEFAULT_SORT) {
    const opt = SORT_OPTIONS.find((o) => o.id === f.sort);
    const name = opt ? sortText(f.sort) : f.sort;
    chips.push({ key: 'sort', label: name, title: t('filters.chip.sort', { name }) });
  }
  return chips;
}

/* Parse the filter params out of a URLSearchParams (the router's query, or
 * window.location). Unknown sorts fall back to the default; empty values are
 * dropped. `cities` accepts either repeated keys or a single comma list, so
 * both "?city=Bandung&city=Bekasi" and "?city=Bandung,Bekasi" round-trip. */
export function parseFilterParams(searchParams) {
  const f = emptyFilters();
  if (!searchParams || typeof searchParams.get !== 'function') return f;

  const province = (searchParams.get('province') || '').trim();
  if (province) f.province = province;

  const cities = new Set();
  if (typeof searchParams.getAll === 'function') {
    searchParams.getAll('city').forEach((c) => String(c).split(',').forEach((part) => {
      const t = part.trim();
      if (t) cities.add(t);
    }));
  }
  f.cities = [...cities];

  const min = parseAmount(searchParams.get('min'));
  const max = parseAmount(searchParams.get('max'));
  f.min = min;
  f.max = max;

  const sort = (searchParams.get('sort') || '').trim();
  if (SORT_OPTIONS.some((o) => o.id === sort)) f.sort = sort;

  return f;
}

/* "1299.5" or "1299" -> 129950 | 129900 cents; blank or malformed -> null. */
export function parseAmount(value) {
  if (typeof value !== 'string') return null;
  const raw = value.trim().replace(/[$,]/g, '');
  if (!raw || !/^\d+(\.\d{1,2})?$/.test(raw)) return null;
  const n = Math.round(Number(raw) * 100);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/* The params a filter set contributes to a URL (sorted for a stable string,
 * so the same set always serializes identically). Sort is always written so
 * a shared link keeps the ordering the sharer saw. */
export function filterParams(f) {
  const p = new URLSearchParams();
  if (f.province) p.set('province', f.province);
  if (f.cities.length) p.set('city', f.cities.join(','));
  if (f.min !== null) p.set('min', String(f.min / 100));
  if (f.max !== null) p.set('max', String(f.max / 100));
  if (f.sort && f.sort !== DEFAULT_SORT) p.set('sort', f.sort);
  return p;
}

/* Merge a filter set into an existing query string, keeping the params the
 * caller owns (q, cat, sub) and replacing only the filter ones. */
export function applyFiltersToQuery(existing, f) {
  const p = new URLSearchParams(existing || '');
  ['province', 'city', 'min', 'max', 'sort'].forEach((k) => p.delete(k));
  const add = filterParams(f);
  add.forEach((value, key) => p.set(key, value));
  return p;
}

/* Reject a min that is above max (and vice versa) rather than sending a
 * range that can only ever be empty. Returns a corrected set. */
export function normalizeRange(f) {
  const out = Object.assign({}, f);
  if (out.min !== null && out.max !== null && out.min > out.max) {
    const t = out.min;
    out.min = out.max;
    out.max = t;
  }
  return out;
}

/* The plain query object api.js sends to GET /api/products. */
export function toApiParams(f, extra = {}) {
  const params = Object.assign({}, extra);
  if (f.province) params.province = f.province;
  if (f.cities.length) params.city = f.cities.join(',');
  if (f.min !== null) params.min = String(f.min / 100);
  if (f.max !== null) params.max = String(f.max / 100);
  if (f.sort) params.sort = f.sort;
  return params;
}

/* ---------------------------------------------------------------------------
 * The filter service.
 *
 * One instance per grid (the home Recommended grid, the browse grid). It
 * owns the filter state, talks to GET /api/products, and notifies its
 * subscribers whenever the list or the loading state changes. The URL is the
 * source of truth: every change is pushed into the hash, and the router
 * feeds the parsed filters back through adoptRoute() so a reload, a back
 * button or a pasted link reconstructs exactly the same list.
 *
 * Options:
 *   fetcher(params)   -> Promise<{ ok, data }>   (api.js fetchProducts)
 *   buildHash(f)      -> string                  the hash for the current route
 *   pushHash(hash)    -> void                    (router goToHash)
 *   extraParams()     -> object                  route params to send too
 *                      (q, cat, sub), read fresh on each request
 *   onError(message)  -> void                    optional
 * ------------------------------------------------------------------------- */
export function createFilterService(options = {}) {
  const fetcher = options.fetcher;
  const buildHash = options.buildHash;
  const pushHash = options.pushHash;
  const extraParams = options.extraParams || (() => ({}));
  const onError = options.onError || (() => {});
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : DEFAULT_LIMIT;

  const state = {
    filters: emptyFilters(),
    items: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: false,
    error: null,
  };
  const listeners = new Set();
  let seq = 0; // request counter: a stale response never overwrites a newer one
  let timer = null;
  let dirty = false; // a change that still needs a fetch (or is waiting on the URL)

  function snapshot() {
    return state;
  }

  function emit() {
    listeners.forEach((fn) => {
      try {
        fn(snapshot());
      } catch (e) {
        console.error('filter listener failed', e);
      }
    });
  }

  function sameFilters(a, b) {
    return a.province === b.province && a.sort === b.sort && a.min === b.min && a.max === b.max
      && a.cities.length === b.cities.length && a.cities.every((c, i) => c === b.cities[i]);
  }

  function scheduleFetch(delay = FILTER_DEBOUNCE_MS) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      runFetch({ append: false });
    }, delay);
  }

  async function runFetch({ append }) {
    if (typeof fetcher !== 'function') return;
    const mySeq = ++seq;
    const page = append ? state.page + 1 : 1;
    state.loading = true;
    state.error = null;
    emit();

    const params = toApiParams(state.filters, Object.assign({ page: String(page), limit: String(limit) }, extraParams()));
    const result = await fetcher(params);
    if (mySeq !== seq) return; // a newer request has superseded this one

    if (result && result.ok && result.data) {
      const data = result.data;
      state.items = append ? state.items.concat(data.items || []) : (data.items || []);
      state.total = Number(data.total) || 0;
      state.page = Number(data.page) || page;
      state.hasMore = !!data.hasMore;
      state.loading = false;
      state.error = null;
    } else {
      state.loading = false;
      state.error = result ? result.status : 0;
      onError(t('filters.loadError'));
    }
    emit();
  }

  const service = {
    get filters() { return state.filters; },
    get items() { return state.items; },
    get total() { return state.total; },
    get page() { return state.page; },
    get hasMore() { return state.hasMore; },
    get loading() { return state.loading; },
    get error() { return state.error; },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /* Apply a partial change. The address bar is updated right away; the
     * network request waits for the debounce so a shopper typing a price is
     * not fetched on every keystroke. */
    setFilters(patch) {
      const next = normalizeRange(Object.assign({}, state.filters, patch));
      if (sameFilters(next, state.filters)) {
        if (typeof pushHash === 'function' && buildHash) pushHash(buildHash(next));
        return;
      }
      state.filters = next;
      state.items = []; // a new filter set starts a fresh, unfiltered page
      state.loading = true;
      state.error = null;
      dirty = true;
      emit();
      if (typeof pushHash === 'function' && buildHash) {
        // The hash change re-enters through adoptRoute, which does the fetch.
        pushHash(buildHash(next));
      } else {
        scheduleFetch();
        dirty = false;
      }
    },

    /* Adopt the filters the router parsed from the hash. This is where the
     * URL actually takes effect: it runs on navigation, reload, back/forward
     * and right after setFilters pushed a new hash. */
    adoptRoute(filters) {
      const next = normalizeRange(filters || emptyFilters());
      const changed = !sameFilters(next, state.filters);
      // Nothing to do when the route already matches the loaded list and no
      // change is waiting on the URL (a plain tab switch, say).
      if (!changed && !dirty && state.items.length && !state.error) return;
      state.filters = next;
      if (changed) {
        state.items = [];
        state.loading = true;
        state.error = null;
        emit();
      }
      dirty = false;
      scheduleFetch(changed ? FILTER_DEBOUNCE_MS : 0);
    },

    /* Remove one active-filter chip. */
    removeChip(key) {
      if (key === 'location') return this.setFilters({ province: '', cities: [] });
      if (key === 'price') return this.setFilters({ min: null, max: null });
      if (key === 'sort') return this.setFilters({ sort: DEFAULT_SORT });
    },

    reset() {
      this.setFilters(emptyFilters());
    },

    loadMore() {
      if (state.loading || !state.hasMore) return;
      if (timer) { clearTimeout(timer); timer = null; }
      runFetch({ append: true });
    },

    /* Force a fresh request for the current filters (used when the backing
     * catalog changes, e.g. a fallback result is replaced by the server). */
    reload() {
      if (timer) { clearTimeout(timer); timer = null; }
      runFetch({ append: false });
    },
  };

  return service;
}
