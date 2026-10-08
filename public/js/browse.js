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
  score,
} from './data.js';
import { store } from './store.js';
import { emptyState, esc, productCard, skeletonCard } from './ui.js';
import { goToHash } from './router.js';
import { t, tc } from './i18n.js';

function sortLabel(id) {
  return t('browse.sort.' + id.replace(/-/g, '_'));
}

const SORT_OPTIONS = [
  { id: 'recommended' },
  { id: 'popular' },
  { id: 'newest' },
  { id: 'price-asc' },
  { id: 'price-desc' },
];

const PRICE_BUCKETS = [
  { id: 'any', key: 'browse.price.any', min: 0, max: Infinity },
  { id: 'under-20', key: 'browse.price.under20', min: 0, max: 2000 },
  { id: '20-100', key: 'browse.price.20to100', min: 2000, max: 10000 },
  { id: '100-300', key: 'browse.price.100to300', min: 10000, max: 30000 },
  { id: 'over-300', key: 'browse.price.over300', min: 30000, max: Infinity },
];

const RATING_OPTIONS = [
  { value: 0, key: 'browse.rating.any' },
  { value: 4.5, key: 'browse.rating.45' },
  { value: 4, key: 'browse.rating.40' },
  { value: 3.5, key: 'browse.rating.35' },
];

const DISCOUNT_OPTIONS = [
  { value: 0, key: 'browse.discount.any' },
  { value: 10, key: 'browse.discount.10' },
  { value: 20, key: 'browse.discount.20' },
  { value: 30, key: 'browse.discount.30' },
];

const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

let state = null;

function defaultFilters() {
  return { price: 'any', rating: 0, discount: 0, brands: [], inStock: false };
}

/* ------------------------------------------------------------------ */
/* Data selection                                                       */
/* ------------------------------------------------------------------ */

function scopeProducts() {
  if (state.mode === 'category') {
    let list = PRODUCTS.filter((p) => p.cat === state.id);
    if (state.sub) list = list.filter((p) => p.sub === state.sub);
    if (state.inCatQuery) list = list.filter((p) => matchSearch(p, state.inCatQuery));
    return list;
  }
  return PRODUCTS.filter((p) => matchSearch(p, state.q));
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
  if (state.sort === 'recommended') sorted.sort((a, b) => score(b) - score(a));
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
    + esc(label) + '</button>';
}

function sectionHeading(text) {
  return '<h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-400">' + esc(text) + '</h3>';
}

function toolbarHtml() {
  const n = activeFilterCount();
  return '<div class="mt-4 flex items-center gap-2">'
    + '<span id="browse-count" class="badge-soft"></span>'
    + '<button type="button" data-filter-open class="btn-outline btn-sm ml-auto" aria-haspopup="dialog">' + icon('sliders', 'h-4 w-4') + esc(t('browse.filter'))
    + '<span id="filter-badge" class="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold leading-none text-white' + (n ? '' : ' hidden') + '">' + n + '</span>'
    + '</button>'
    + '<div class="relative">'
    + '<button type="button" id="sort-btn" data-sort-toggle class="btn-outline btn-sm" aria-haspopup="menu">' + esc(t('browse.sort')) + ' <span id="sort-label"></span>' + icon('chevronDown', 'h-3.5 w-3.5') + '</button>'
    + '<div id="sort-menu" class="absolute right-0 top-full z-30 mt-1.5 hidden w-52 rounded-xl border border-zinc-100 bg-white p-1.5 shadow-card-lg" role="menu">'
    + SORT_OPTIONS.map((o) => '<button type="button" data-sort-item="' + o.id + '" role="menuitem" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"><span class="check-slot w-4 shrink-0"></span>' + esc(sortLabel(o.id)) + '</button>').join('')
    + '</div></div></div>';
}

function filterOverlayHtml() {
  const f = state.filters;
  const brands = brandsInScope();

  const price = sectionHeading(t('browse.section.price'))
    + '<div class="mt-2 flex flex-wrap gap-2">'
    + PRICE_BUCKETS.map((b) => chip('price', b.id, t(b.key), f.price === b.id)).join('')
    + '</div>';

  const rating = sectionHeading(t('browse.section.rating'))
    + '<div class="mt-2 flex flex-wrap gap-2">'
    + RATING_OPTIONS.map((o) => chip('rating', String(o.value), t(o.key), f.rating === o.value)).join('')
    + '</div>';

  const brand = sectionHeading(t('browse.section.brand'))
    + '<div class="mt-1 divide-y divide-zinc-100">'
    + brands.map((b) => '<label class="flex cursor-pointer items-center gap-3 py-2.5 text-sm text-zinc-700">'
      + '<input type="checkbox" class="h-4 w-4 accent-brand-600" data-filter-brand="' + b.brand + '"' + (f.brands.includes(b.brand) ? ' checked' : '') + '>'
      + '<span>' + b.brand + '</span>'
      + '<span class="ml-auto text-xs text-zinc-400">' + b.count + '</span>'
      + '</label>').join('')
    + '</div>';

  const discount = sectionHeading(t('browse.section.discount'))
    + '<div class="mt-2 flex flex-wrap gap-2">'
    + DISCOUNT_OPTIONS.map((o) => chip('discount', String(o.value), t(o.key), f.discount === o.value)).join('')
    + '</div>';

  const availability = sectionHeading(t('browse.section.availability'))
    + '<label class="mt-1 flex cursor-pointer items-center justify-between py-2.5 text-sm text-zinc-700">'
    + '<span>' + esc(t('browse.inStockOnly')) + '</span>'
    + '<input type="checkbox" class="un-switch" data-filter-stock' + (f.inStock ? ' checked' : '') + ' aria-label="' + esc(t('browse.inStockOnly')) + '">'
    + '</label>';

  return '<div class="absolute inset-0 bg-zinc-900/40" data-filter-close></div>'
    + '<div class="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-card-lg md:inset-0 md:my-auto md:h-fit md:max-w-md md:rounded-2xl">'
    + '<div class="flex items-center justify-between border-b border-zinc-100 px-4 py-3">'
    + '<h2 class="text-base font-bold text-zinc-900">' + esc(t('browse.filters')) + '</h2>'
    + '<button type="button" data-filter-close class="icon-btn" aria-label="' + esc(t('browse.closeFilters')) + '">' + icon('x', 'h-5 w-5') + '</button>'
    + '</div>'
    + '<div class="flex-1 space-y-5 overflow-y-auto px-4 py-4">' + price + rating + brand + discount + availability + '</div>'
    + '<div class="border-t border-zinc-100 p-3" style="padding-bottom: calc(0.75rem + var(--un-safe-inset-bottom, 0px));">'
    + '<div class="flex gap-2">'
    + '<button type="button" data-filter-reset class="btn-outline flex-1">' + esc(t('common.reset')) + '</button>'
    + '<button type="button" data-filter-close class="btn-primary flex-1">' + esc(t('common.show')) + ' <span id="filter-show-count"></span></button>'
    + '</div></div></div>';
}

function emptyResultsHtml() {
  if (state.mode === 'category') {
    return emptyState({
      icon: 'search',
      title: t('browse.noResults.title'),
      body: t('browse.noResults.categoryBody'),
      actionLabel: t('browse.clearSearchFilters'),
      actionAttr: 'data-browse-reset',
    });
  }
  const suggestions = POPULAR_SEARCHES.slice(0, 4)
    .map((term) => '<button type="button" data-search-suggest="' + esc(term) + '" class="badge-soft h-8 px-3 text-xs hover:bg-zinc-200">' + esc(term) + '</button>')
    .join('');
  return emptyState({
    icon: 'search',
    title: t('browse.noResults.title'),
    body: esc(t('browse.noResults.searchBody', { q: state.q })),
    actionLabel: t('browse.clearSearch'),
    actionAttr: 'data-browse-clear-search',
  })
    + '<div class="-mt-6 flex flex-wrap justify-center gap-2 pb-8">' + suggestions + '</div>';
}

/* ------------------------------------------------------------------ */
/* Shells                                                               */
/* ------------------------------------------------------------------ */

function searchInputHtml(id, placeholder, value) {
  // `placeholder` is already a translated string; escape it for attributes.
  return '<div class="relative">'
    + '<span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">' + icon('search', 'h-5 w-5') + '</span>'
    + '<input type="search" id="' + id + '" class="input" placeholder="' + esc(placeholder) + '" value="' + esc(value) + '" autocomplete="off" aria-label="' + esc(placeholder) + '">'
    + '</div>';
}

function searchHomeShell() {
  const recent = store.recent.length
    ? '<section class="mt-6" aria-label="' + esc(t('browse.recentSearches')) + '"><h2 class="text-sm font-semibold text-zinc-900">' + esc(t('browse.recentSearches')) + '</h2>'
      + '<div class="mt-2.5 flex flex-wrap gap-2">'
      + store.recent.map((r) => '<button type="button" data-recent="' + esc(r) + '" class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">' + icon('clock', 'h-3.5 w-3.5') + esc(r) + '</button>').join('')
      + '</div></section>'
    : '';
  const popular = '<section class="mt-6" aria-label="' + esc(t('browse.popularSearches')) + '"><h2 class="text-sm font-semibold text-zinc-900">' + esc(t('browse.popularSearches')) + '</h2>'
    + '<div class="mt-2.5 flex flex-wrap gap-2">'
    + POPULAR_SEARCHES.map((term) => '<button type="button" data-search-suggest="' + esc(term) + '" class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">' + icon('flame', 'h-3.5 w-3.5') + esc(term) + '</button>').join('')
    + '</div></section>';
  return '<h1 class="section-title">' + esc(t('browse.search')) + '</h1>'
    + '<div class="mt-3">' + searchInputHtml('search-page-input', t('search.placeholder'), '') + '</div>'
    + '<div class="card mt-4">' + emptyState({
      icon: 'search',
      title: t('browse.searchTitle'),
      body: t('browse.searchBody'),
    }) + '</div>'
    + recent + popular;
}

function categoryShell() {
  const category = categoryById(state.id);
  const categoryName = category ? t(category.key) : '';
  if (!category) {
    return emptyState({
      icon: 'grid',
      title: t('browse.categoryNotFound.title'),
      body: t('browse.categoryNotFound.body'),
      actionLabel: t('browse.backHome'),
      actionAttr: 'data-nav="home"',
    });
  }
  const subs = SUBCATEGORIES[category.id] || [];
  const chips = [{ id: '', key: 'browse.all' }].concat(subs)
    .map((sub) => '<button type="button" data-sub="' + sub.id + '" aria-pressed="' + (state.sub === sub.id)
      + '" class="h-8 shrink-0 rounded-full px-3.5 text-xs font-semibold transition-colors '
      + (state.sub === sub.id ? 'bg-brand-600 text-white' : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50')
      + '">' + esc(t(sub.key)) + '</button>')
    .join('');

  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-back class="icon-btn -ml-2" aria-label="' + esc(t('common.back')) + '">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + esc(categoryName) + '</h1>'
    + '</div>'
    + '<div id="sub-chips" class="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">' + chips + '</div>'
    + '<div class="mt-2">' + searchInputHtml('cat-search', t('browse.searchIn', { category: categoryName }), state.inCatQuery) + '</div>'
    + toolbarHtml()
    + '<div id="browse-grid" class="mt-3 ' + GRID_CLASS + '"></div>'
    + '<div id="browse-empty" class="hidden"></div>'
    + filterOverlay();
}

function searchResultsShell() {
  return '<div class="flex min-w-0 items-center gap-2">'
    + '<button type="button" data-back class="icon-btn -ml-2 shrink-0" aria-label="' + esc(t('common.back')) + '">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title truncate">' + esc(t('browse.resultsFor', { q: state.q })) + '</h1>'
    + '</div>'
    + '<div class="mt-2">' + searchInputHtml('search-page-input', t('search.placeholder'), state.q) + '</div>'
    + toolbarHtml()
    + '<div id="browse-grid" class="mt-3 ' + GRID_CLASS + '"></div>'
    + '<div id="browse-empty" class="hidden"></div>'
    + filterOverlay();
}

function filterOverlay() {
  return '<div id="filter-overlay" class="fixed inset-0 z-50 hidden" role="dialog" aria-modal="true" aria-label="' + esc(t('browse.filters')) + '"></div>';
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
  if (label) label.textContent = sortLabel((SORT_OPTIONS.find((o) => o.id === state.sort) || SORT_OPTIONS[0]).id);
  document.querySelectorAll('#sort-menu [data-sort-item]').forEach((btn) => {
    btn.querySelector('.check-slot').innerHTML = btn.dataset.sortItem === state.sort ? icon('check', 'h-4 w-4 text-brand-600') : '';
  });
}

function renderGrid() {
  const list = resultList();
  const grid = document.getElementById('browse-grid');
  const empty = document.getElementById('browse-empty');
  const count = document.getElementById('browse-count');
  const badge = document.getElementById('filter-badge');
  const showCount = document.getElementById('filter-show-count');

  if (count) count.textContent = tc('common.item_one', 'common.item_many', list.length);
  if (badge) {
    const n = activeFilterCount();
    badge.textContent = String(n);
    badge.classList.toggle('hidden', n === 0);
  }
  if (showCount) showCount.textContent = tc('common.product_one', 'common.product_many', list.length);
  if (!grid || !empty) return;

  if (list.length) {
    grid.innerHTML = list.map((p) => productCard(p)).join('');
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
  document.title = state.mode === 'category' && cat
    ? t(cat.key) + ' · ' + t('app.title')
    : t('browse.search') + ' · ' + t('app.title');

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
    };
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
    const target = e.target.closest('[data-sub], [data-sort-toggle], [data-sort-item], [data-filter-open], [data-filter-close], [data-filter-reset], [data-filter-price], [data-filter-rating], [data-filter-discount], [data-browse-reset], [data-browse-clear-search]');
    if (!target) return;

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