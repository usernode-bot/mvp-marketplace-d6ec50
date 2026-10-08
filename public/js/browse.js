/* Category and search-results pages. One browse engine renders both:
 * a category route (#/category/<id>) adds subcategory chips and a
 * search-within-category input; a search route (#/search?q=...) shows the
 * query, result count and, with an empty query, recent + popular searches.
 *
 * Filters (price, rating, brand, discount, availability) and sorting apply
 * live to the grid. Filter state lives in module state keyed to the route,
 * so returning to a page you just visited keeps your filters.
 */

import { icon } from './icons.js';
import {
  POPULAR_SEARCHES,
  PRODUCTS,
  SUBCATEGORIES,
  categoryById,
  discountPct,
  matchSearch,
  registerProducts,
  score,
} from './data.js';
import { fetchProducts } from './api.js';
import { store } from './store.js';
import { emptyState, esc, productCard, skeletonCard } from './ui.js';
import { goToHash } from './router.js';

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
];

const PRICE_BUCKETS = [
  { id: 'any', label: 'Any price', min: 0, max: Infinity },
  { id: 'under-20', label: 'Under $20', min: 0, max: 2000 },
  { id: '20-100', label: '$20 to $100', min: 2000, max: 10000 },
  { id: '100-300', label: '$100 to $300', min: 10000, max: 30000 },
  { id: 'over-300', label: '$300 & above', min: 30000, max: Infinity },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 4.5, label: '4.5 & up' },
  { value: 4, label: '4.0 & up' },
  { value: 3.5, label: '3.5 & up' },
];

const DISCOUNT_OPTIONS = [
  { value: 0, label: 'Any' },
  { value: 10, label: '10% or more' },
  { value: 20, label: '20% or more' },
  { value: 30, label: '30% or more' },
];

const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

const PAGE_SIZE = 24;

let state = null;

function defaultFilters() {
  return { price: 'any', rating: 0, discount: 0, brands: [], inStock: false };
}

/* ------------------------------------------------------------------ */
/* Data selection                                                       */
/* ------------------------------------------------------------------ */

/* A page's products are the bundled catalog plus the generated marketplace
 * products fetched from the server (state.server, see loadServerScope). */
function inScope(p) {
  if (state.mode === 'category') {
    if (p.cat !== state.id) return false;
    if (state.sub && p.sub !== state.sub) return false;
    if (state.inCatQuery && !matchSearch(p, state.inCatQuery)) return false;
    return true;
  }
  return matchSearch(p, state.q);
}

function scopeProducts() {
  return PRODUCTS.concat(state.server).filter(inScope);
}

/* Pull this page's server products, 100 a request, up to 1,000. Category
 * pages ask for the category; search pages for the query (the server runs the
 * same every-word match as matchSearch). The grid redraws when they arrive. */
async function loadServerScope(sig) {
  const params = state.mode === 'category' ? { cat: state.id } : { q: state.q };
  const items = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetchProducts(Object.assign({ limit: 100, page }, params));
    if (!res.ok || !res.data || !Array.isArray(res.data.items)) break;
    items.push(...res.data.items.filter((it) => it.generated));
    if (!res.data.hasMore) break;
  }
  if (!state || state.sig !== sig) return;
  registerProducts(items);
  state.server = items;
  state.loading = false;
  renderGrid();
}

function applyFilters(list) {
  const f = state.filters;
  const bucket = PRICE_BUCKETS.find((b) => b.id === f.price) || PRICE_BUCKETS[0];
  return list.filter((p) => {
    if (p.price < bucket.min || p.price > bucket.max) return false;
    if (f.rating && p.rating < f.rating) return false;
    if (f.discount && discountPct(p) < f.discount) return false;
    if (f.brands.length && !f.brands.includes(p.brand)) return false;
    if (f.inStock && p.oos) return false;
    return true;
  });
}

function applySort(list) {
  const sorted = [...list];
  // Recommended: the curated catalog leads (as on the home grid), then the
  // generated marketplace products, each group by score.
  if (state.sort === 'recommended') sorted.sort((a, b) => (a.generated ? 1 : 0) - (b.generated ? 1 : 0) || score(b) - score(a));
  else if (state.sort === 'popular') sorted.sort((a, b) => b.sold - a.sold);
  else if (state.sort === 'newest') sorted.sort((a, b) => a.age - b.age);
  else if (state.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  return sorted;
}

function resultList() {
  return applySort(applyFilters(scopeProducts()));
}

/* Brands available in the current scope, most products first. */
function brandsInScope() {
  const counts = new Map();
  scopeProducts().forEach((p) => counts.set(p.brand, (counts.get(p.brand) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([brand, count]) => ({ brand, count }));
}

function activeFilterCount() {
  const f = state.filters;
  return (f.price !== 'any' ? 1 : 0)
    + (f.rating ? 1 : 0)
    + (f.discount ? 1 : 0)
    + (f.brands.length ? 1 : 0)
    + (f.inStock ? 1 : 0);
}

/* ------------------------------------------------------------------ */
/* Small builders                                                       */
/* ------------------------------------------------------------------ */

function chip(group, value, label, active) {
  return '<button type="button" data-filter-' + group + '="' + value + '" class="h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors '
    + (active ? 'bg-brand-600 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50') + '">'
    + label + '</button>';
}

function sectionHeading(text) {
  return '<h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-400">' + text + '</h3>';
}

function toolbarHtml() {
  const n = activeFilterCount();
  return '<div class="mt-4 flex items-center gap-2">'
    + '<span id="browse-count" class="badge-soft"></span>'
    + '<button type="button" data-filter-open class="btn-outline btn-sm ml-auto" aria-haspopup="dialog">' + icon('sliders', 'h-4 w-4') + 'Filter'
    + '<span id="filter-badge" class="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold leading-none text-white' + (n ? '' : ' hidden') + '">' + n + '</span>'
    + '</button>'
    + '<div class="relative">'
    + '<button type="button" id="sort-btn" data-sort-toggle class="btn-outline btn-sm" aria-haspopup="menu">Sort: <span id="sort-label"></span>' + icon('chevronDown', 'h-3.5 w-3.5') + '</button>'
    + '<div id="sort-menu" class="absolute right-0 top-full z-30 mt-1.5 hidden w-52 rounded-xl border border-zinc-100 bg-white p-1.5 shadow-card-lg" role="menu">'
    + SORT_OPTIONS.map((o) => '<button type="button" data-sort-item="' + o.id + '" role="menuitem" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"><span class="check-slot w-4 shrink-0"></span>' + o.label + '</button>').join('')
    + '</div></div></div>';
}

function filterOverlayHtml() {
  const f = state.filters;
  const brands = brandsInScope();

  const price = sectionHeading('Price')
    + '<div class="mt-2 flex flex-wrap gap-2">'
    + PRICE_BUCKETS.map((b) => chip('price', b.id, b.label, f.price === b.id)).join('')
    + '</div>';

  const rating = sectionHeading('Customer rating')
    + '<div class="mt-2 flex flex-wrap gap-2">'
    + RATING_OPTIONS.map((o) => chip('rating', String(o.value), o.label, f.rating === o.value)).join('')
    + '</div>';

  const brand = sectionHeading('Brand')
    + '<div class="mt-1 divide-y divide-zinc-100">'
    + brands.map((b) => '<label class="flex cursor-pointer items-center gap-3 py-2.5 text-sm text-zinc-700">'
      + '<input type="checkbox" class="h-4 w-4 accent-brand-600" data-filter-brand="' + b.brand + '"' + (f.brands.includes(b.brand) ? ' checked' : '') + '>'
      + '<span>' + b.brand + '</span>'
      + '<span class="ml-auto text-xs text-zinc-400">' + b.count + '</span>'
      + '</label>').join('')
    + '</div>';

  const discount = sectionHeading('Discount')
    + '<div class="mt-2 flex flex-wrap gap-2">'
    + DISCOUNT_OPTIONS.map((o) => chip('discount', String(o.value), o.label, f.discount === o.value)).join('')
    + '</div>';

  const availability = sectionHeading('Availability')
    + '<label class="mt-1 flex cursor-pointer items-center justify-between py-2.5 text-sm text-zinc-700">'
    + '<span>In stock only</span>'
    + '<input type="checkbox" class="un-switch" data-filter-stock' + (f.inStock ? ' checked' : '') + ' aria-label="In stock only">'
    + '</label>';

  return '<div class="absolute inset-0 bg-zinc-900/40" data-filter-close></div>'
    + '<div class="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-card-lg md:inset-0 md:my-auto md:h-fit md:max-w-md md:rounded-2xl">'
    + '<div class="flex items-center justify-between border-b border-zinc-100 px-4 py-3">'
    + '<h2 class="text-base font-bold text-zinc-900">Filters</h2>'
    + '<button type="button" data-filter-close class="icon-btn" aria-label="Close filters">' + icon('x', 'h-5 w-5') + '</button>'
    + '</div>'
    + '<div class="flex-1 space-y-5 overflow-y-auto px-4 py-4">' + price + rating + brand + discount + availability + '</div>'
    + '<div class="border-t border-zinc-100 p-3" style="padding-bottom: calc(0.75rem + var(--un-safe-inset-bottom, 0px));">'
    + '<div class="flex gap-2">'
    + '<button type="button" data-filter-reset class="btn-outline flex-1">Reset</button>'
    + '<button type="button" data-filter-close class="btn-primary flex-1">Show <span id="filter-show-count"></span></button>'
    + '</div></div></div>';
}

function emptyResultsHtml() {
  if (state.mode === 'category') {
    return emptyState({
      icon: 'search',
      title: 'No results found',
      body: 'No products match your filters in this category. Try clearing them or searching a different word.',
      actionLabel: 'Clear search & filters',
      actionAttr: 'data-browse-reset',
    });
  }
  const suggestions = POPULAR_SEARCHES.slice(0, 4)
    .map((t) => '<button type="button" data-search-suggest="' + t + '" class="badge-soft h-8 px-3 text-xs hover:bg-zinc-200">' + t + '</button>')
    .join('');
  return emptyState({
    icon: 'search',
    title: 'No results found',
    body: 'Nothing matches "' + esc(state.q) + '" right now. Try a different word, or start from a popular search.',
    actionLabel: 'Clear search',
    actionAttr: 'data-browse-clear-search',
  })
    + '<div class="-mt-6 flex flex-wrap justify-center gap-2 pb-8">' + suggestions + '</div>';
}

/* ------------------------------------------------------------------ */
/* Shells                                                               */
/* ------------------------------------------------------------------ */

function searchInputHtml(id, placeholder, value) {
  return '<div class="relative">'
    + '<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">' + icon('search', 'h-5 w-5') + '</span>'
    + '<input type="search" id="' + id + '" class="input" placeholder="' + placeholder + '" value="' + esc(value) + '" autocomplete="off" aria-label="' + placeholder + '">'
    + '</div>';
}

function searchHomeShell() {
  const recent = store.recent.length
    ? '<section class="mt-6" aria-label="Recent searches"><h2 class="text-sm font-semibold text-zinc-900">Recent searches</h2>'
      + '<div class="mt-2.5 flex flex-wrap gap-2">'
      + store.recent.map((r) => '<button type="button" data-recent="' + esc(r) + '" class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">' + icon('clock', 'h-3.5 w-3.5') + esc(r) + '</button>').join('')
      + '</div></section>'
    : '';
  const popular = '<section class="mt-6" aria-label="Popular searches"><h2 class="text-sm font-semibold text-zinc-900">Popular searches</h2>'
    + '<div class="mt-2.5 flex flex-wrap gap-2">'
    + POPULAR_SEARCHES.map((t) => '<button type="button" data-search-suggest="' + t + '" class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">' + icon('flame', 'h-3.5 w-3.5') + t + '</button>').join('')
    + '</div></section>';
  return '<h1 class="section-title">Search</h1>'
    + '<div class="mt-3">' + searchInputHtml('search-page-input', 'Search products, brands, and more', '') + '</div>'
    + '<div class="card mt-4">' + emptyState({
      icon: 'search',
      title: 'Search MVP Marketplace',
      body: 'Find products across every category. Start with a word, a brand or a category name.',
    }) + '</div>'
    + recent + popular;
}

function categoryShell() {
  const category = categoryById(state.id);
  if (!category) {
    return emptyState({
      icon: 'grid',
      title: 'Category not found',
      body: 'That category does not exist. Browse all categories instead.',
      actionLabel: 'Back to home',
      actionAttr: 'data-nav="home"',
    });
  }
  const subs = SUBCATEGORIES[category.id] || [];
  const chips = [{ id: '', name: 'All' }].concat(subs)
    .map((s) => '<button type="button" data-sub="' + s.id + '" aria-pressed="' + (state.sub === s.id)
      + '" class="h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors '
      + (state.sub === s.id ? 'bg-brand-600 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50')
      + '">' + s.name + '</button>')
    .join('');

  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-back class="icon-btn -ml-2" aria-label="Back">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + category.name + '</h1>'
    + '</div>'
    + '<div id="sub-chips" class="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">' + chips + '</div>'
    + '<div class="mt-2">' + searchInputHtml('cat-search', 'Search in ' + category.name, state.inCatQuery) + '</div>'
    + toolbarHtml()
    + '<div id="browse-grid" class="mt-3 ' + GRID_CLASS + '"></div>'
    + '<div id="browse-more" class="mt-4 flex justify-center"></div>'
    + '<div id="browse-empty" class="hidden"></div>'
    + filterOverlay();
}

function searchResultsShell() {
  return '<div class="flex min-w-0 items-center gap-2">'
    + '<button type="button" data-back class="icon-btn -ml-2 shrink-0" aria-label="Back">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title truncate">Results for "' + esc(state.q) + '"</h1>'
    + '</div>'
    + '<div class="mt-2">' + searchInputHtml('search-page-input', 'Search products, brands, and more', state.q) + '</div>'
    + toolbarHtml()
    + '<div id="browse-grid" class="mt-3 ' + GRID_CLASS + '"></div>'
    + '<div id="browse-more" class="mt-4 flex justify-center"></div>'
    + '<div id="browse-empty" class="hidden"></div>'
    + filterOverlay();
}

function filterOverlay() {
  return '<div id="filter-overlay" class="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true" aria-label="Filters"></div>';
}

function shellHtml() {
  if (state.mode === 'category') return categoryShell();
  return state.q ? searchResultsShell() : searchHomeShell();
}

/* ------------------------------------------------------------------ */
/* Rendering                                                            */
/* ------------------------------------------------------------------ */

function syncSortMenu() {
  const label = document.getElementById('sort-label');
  if (label) label.textContent = (SORT_OPTIONS.find((o) => o.id === state.sort) || SORT_OPTIONS[0]).label;
  document.querySelectorAll('#sort-menu [data-sort-item]').forEach((btn) => {
    btn.querySelector('.check-slot').innerHTML = btn.dataset.sortItem === state.sort ? icon('check', 'h-4 w-4 text-brand-600') : '';
  });
}

function renderGrid() {
  const list = resultList();
  const grid = document.getElementById('browse-grid');
  const empty = document.getElementById('browse-empty');
  const count = document.getElementById('browse-count');
  const more = document.getElementById('browse-more');
  const badge = document.getElementById('filter-badge');
  const showCount = document.getElementById('filter-show-count');

  // Back to the first page whenever the sort, a filter or the scope changes.
  const pageKey = JSON.stringify([state.sort, state.filters, state.sub, state.inCatQuery]);
  if (state.pageKey !== pageKey) {
    state.pageKey = pageKey;
    state.shown = PAGE_SIZE;
  }
  // In the default order every curated product stays on the first page and
  // the paging applies to the generated ones after them; any other sort pages
  // the whole list.
  const lead = state.sort === 'recommended' ? list.filter((p) => !p.generated).length : 0;
  const visible = list.slice(0, lead + state.shown);
  if (count) count.textContent = list.length + (list.length === 1 ? ' item' : ' items') + (state.loading ? ' so far' : '');
  if (badge) {
    const n = activeFilterCount();
    badge.textContent = String(n);
    badge.classList.toggle('hidden', n === 0);
  }
  if (showCount) showCount.textContent = list.length + (list.length === 1 ? ' product' : ' products');
  if (!grid || !empty) return;

  if (more) {
    more.innerHTML = list.length > visible.length
      ? '<button type="button" data-browse-more class="btn-outline">Show more (' + (list.length - visible.length) + ' left)</button>'
      : '';
  }

  if (!list.length && state.loading) {
    // The server's products are still on their way: skeletons, not "no results".
    grid.innerHTML = Array.from({ length: 8 }, () => skeletonCard()).join('');
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
  } else if (list.length) {
    grid.innerHTML = visible.map((p) => productCard(p)).join('');
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    empty.innerHTML = '';
  } else {
    grid.classList.add('hidden');
    empty.innerHTML = emptyResultsHtml();
    empty.classList.remove('hidden');
  }
}

function renderShell() {
  const view = document.getElementById('view-browse');
  view.innerHTML = shellHtml();
  const cat = state.mode === 'category' ? categoryById(state.id) : null;
  document.title = state.mode === 'category' && cat ? cat.name + ' · MVP Marketplace' : 'Search · MVP Marketplace';

  // Sort menu + filter overlay reflect current state.
  syncSortMenu();
  const overlay = document.getElementById('filter-overlay');
  if (overlay) overlay.innerHTML = filterOverlayHtml();
  renderGrid();

  // Search inputs (bound per shell so they are always fresh).
  const catInput = document.getElementById('cat-search');
  if (catInput) {
    let debounce = null;
    catInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        if (state) {
          state.inCatQuery = catInput.value;
          renderGrid();
        }
      }, 200);
    });
  }
  const searchInput = document.getElementById('search-page-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = searchInput.value.trim();
        if (q) goToHash('#/search?q=' + encodeURIComponent(q));
      }
    });
  }
}

export function renderBrowse(route) {
  const sig = route.mode + ':' + (route.id || '') + ':' + (route.q || '');
  const fresh = !state || state.sig !== sig;
  if (fresh) {
    state = {
      sig,
      mode: route.mode,
      id: route.id || '',
      q: route.q || '',
      sub: route.sub || '',
      inCatQuery: '',
      sort: 'recommended',
      filters: defaultFilters(),
      server: [],
      loading: !!(route.mode === 'category' || route.q),
      shown: PAGE_SIZE,
      pageKey: '',
    };
    if (state.loading) loadServerScope(sig);
  } else if (route.sub) {
    state.sub = route.sub;
  }

  if (fresh) {
    const view = document.getElementById('view-browse');
    view.innerHTML = '<div class="h-7 w-40 animate-pulse rounded bg-zinc-100"></div>'
      + '<div class="mt-4 ' + GRID_CLASS + '">' + Array.from({ length: 8 }, () => skeletonCard()).join('') + '</div>';
    const mySig = sig;
    setTimeout(() => {
      if (state && state.sig === mySig) renderShell();
    }, 250);
  } else {
    renderShell();
  }
}

/* ------------------------------------------------------------------ */
/* Events (delegated once on the browse container)                      */
/* ------------------------------------------------------------------ */

function setChipGroup(group, value, buttons) {
  buttons.forEach((btn) => {
    const on = btn.dataset['filter' + group.charAt(0).toUpperCase() + group.slice(1)] === String(value);
    btn.classList.toggle('bg-brand-600', on);
    btn.classList.toggle('text-white', on);
    btn.classList.toggle('border', !on);
    btn.classList.toggle('border-zinc-200', !on);
    btn.classList.toggle('bg-white', !on);
    btn.classList.toggle('text-zinc-600', !on);
    btn.classList.toggle('hover:bg-zinc-50', !on);
  });
}

function closeSortMenu() {
  const menu = document.getElementById('sort-menu');
  if (menu) menu.classList.add('hidden');
}

function closeFilter() {
  const overlay = document.getElementById('filter-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function bindBrowseEvents() {
  const view = document.getElementById('view-browse');
  if (!view) return;

  view.addEventListener('click', (e) => {
    const target = e.target.closest('[data-sub], [data-sort-toggle], [data-sort-item], [data-filter-open], [data-filter-close], [data-filter-reset], [data-filter-price], [data-filter-rating], [data-filter-discount], [data-browse-reset], [data-browse-clear-search], [data-browse-more]');
    if (!target) return;

    if (target.hasAttribute('data-browse-more')) {
      state.shown += PAGE_SIZE;
      renderGrid();
      return;
    }

    const sub = target.getAttribute('data-sub');
    if (sub !== null && target.hasAttribute('data-sub')) {
      state.sub = sub;
      renderShell();
      window.scrollTo({ top: 0 });
      return;
    }

    if (target.hasAttribute('data-sort-toggle')) {
      const menu = document.getElementById('sort-menu');
      if (menu) menu.classList.toggle('hidden');
      return;
    }

    const sortItem = target.getAttribute('data-sort-item');
    if (sortItem) {
      state.sort = sortItem;
      syncSortMenu();
      closeSortMenu();
      renderGrid();
      return;
    }

    if (target.hasAttribute('data-filter-open')) {
      const overlay = document.getElementById('filter-overlay');
      if (overlay) {
        overlay.innerHTML = filterOverlayHtml();
        renderGrid(); // keeps "Show N products" in sync
        overlay.classList.remove('hidden');
      }
      return;
    }

    if (target.hasAttribute('data-filter-close')) {
      closeFilter();
      return;
    }

    if (target.hasAttribute('data-filter-reset')) {
      state.filters = defaultFilters();
      closeFilter();
      renderShell();
      renderGrid();
      return;
    }

    const price = target.getAttribute('data-filter-price');
    if (price) {
      state.filters.price = price;
      setChipGroup('price', price, view.querySelectorAll('[data-filter-price]'));
      renderGrid();
      return;
    }

    const rating = target.getAttribute('data-filter-rating');
    if (rating) {
      state.filters.rating = Number(rating);
      setChipGroup('rating', rating, view.querySelectorAll('[data-filter-rating]'));
      renderGrid();
      return;
    }

    const discount = target.getAttribute('data-filter-discount');
    if (discount) {
      state.filters.discount = Number(discount);
      setChipGroup('discount', discount, view.querySelectorAll('[data-filter-discount]'));
      renderGrid();
      return;
    }

    if (target.hasAttribute('data-browse-reset')) {
      state.sub = '';
      state.inCatQuery = '';
      state.filters = defaultFilters();
      renderShell();
      window.scrollTo({ top: 0 });
      return;
    }

    if (target.hasAttribute('data-browse-clear-search')) {
      goToHash('#/search');
      return;
    }
  });

  // Checkboxes and the switch fire change events, not clicks with values.
  view.addEventListener('change', (e) => {
    const target = e.target;
    if (target.matches('[data-filter-brand]')) {
      const brand = target.getAttribute('data-filter-brand');
      state.filters.brands = target.checked
        ? state.filters.brands.concat([brand])
        : state.filters.brands.filter((b) => b !== brand);
      renderGrid();
    } else if (target.matches('[data-filter-stock]')) {
      state.filters.inStock = target.checked;
      renderGrid();
    }
  });

  // Close the sort menu on any press outside it.
  document.addEventListener('pointerdown', (e) => {
    const menu = document.getElementById('sort-menu');
    if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !e.target.closest('[data-sort-toggle]')) {
      menu.classList.add('hidden');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeSortMenu();
      closeFilter();
    }
  });
}

bindBrowseEvents();