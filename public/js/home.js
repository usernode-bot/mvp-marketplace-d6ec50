/* Home page: promotional carousel, category tiles, Flash Sale row with
 * countdown and the Recommended grid. Search and category browsing moved to
 * dedicated pages (browse.js, routed by router.js); the home results section
 * now only serves the Big deals banner CTA.
 */

import { icon } from './icons.js';
import { BANNERS, CATEGORIES, PRODUCTS, TRENDING, discountPct } from './data.js';
import { store } from './store.js';
import {
  emptyState,
  fmtCount,
  fmtPrice,
  productCard,
  skeletonBanner,
  skeletonCard,
  skeletonCategoryTile,
  toast,
} from './ui.js';
import { goToHash } from './router.js';
import { createFilterService, parseFilterParams, filterParams, hasActiveFilters } from './filters.js';
import { fetchProducts } from './api.js';
import { localProductPage } from './product-query.js';
import { t, tc } from './i18n.js';
import {
  activeFilterChipsHtml,
  bindFilterControls,
  filterBarHtml,
  resultCountHtml,
  updateFilterBar,
} from './filter-ui.js';

/* Escape a user-typed string for use inside markup and attribute values
 * (recent searches and typed queries end up in innerHTML-built panels). */
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Banner gradient tones — whole literal class strings so the Tailwind
 * compiler sees them. */
const BANNER_TONES = {
  brand: 'bg-gradient-to-br from-brand-500 to-brand-700 text-white',
  rose: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white',
  slate: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white',
};

/* Reusable tile data for the home Categories strip: one object per tile
 * holding the icon glyph, its soft tint / deep icon color pair, and the
 * navigation path (a router.js hash route). Tile names come from CATEGORIES
 * in data.js; "More" opens the full categories directory. */
const CATEGORY_TILES = {
  electronics: { icon: 'smartphone', bg: 'bg-indigo-50', fg: 'text-indigo-600', path: '#/category/electronics' },
  fashion: { icon: 'shirt', bg: 'bg-rose-50', fg: 'text-rose-600', path: '#/category/fashion' },
  beauty: { icon: 'sparkles', bg: 'bg-purple-50', fg: 'text-purple-600', path: '#/category/beauty' },
  home: { icon: 'armchair', bg: 'bg-teal-50', fg: 'text-teal-600', path: '#/category/home' },
  sports: { icon: 'dumbbell', bg: 'bg-orange-50', fg: 'text-orange-600', path: '#/category/sports' },
  groceries: { icon: 'basket', bg: 'bg-green-50', fg: 'text-green-600', path: '#/category/groceries' },
  accessories: { icon: 'gem', bg: 'bg-slate-100', fg: 'text-slate-600', path: '#/category/accessories' },
  more: { icon: 'grid', bg: 'bg-zinc-100', fg: 'text-zinc-500', path: '#/categories' },
};

/* Subtle press feedback: shadow deepens and the tile lifts slightly.
 * Whole literal class strings so the Tailwind compiler sees them; the
 * motion-reduce variants keep it still for reduced-motion users. */
const TILE_HOVER = 'transition duration-200 hover:scale-105 hover:shadow-card-lg motion-reduce:transition-none motion-reduce:hover:scale-100';

/* ------------------------------------------------------------------ */
/* Banners                                                             */
/* ------------------------------------------------------------------ */

function bannerHtml(b, i) {
  return '<article class="banner relative flex h-40 w-[86%] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-2xl p-4 sm:h-48 sm:w-96 sm:p-5 lg:w-[26rem] '
    + BANNER_TONES[b.tone] + '" data-banner="' + b.id + '">'
    + '<span class="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/15"></span>'
    + '<span class="pointer-events-none absolute -bottom-14 right-16 h-28 w-28 rounded-full bg-white/10"></span>'
    + '<span class="pointer-events-none absolute bottom-2 right-3 opacity-25">' + icon(b.icon, 'h-20 w-20') + '</span>'
    + '<span class="badge ' + (b.tone === 'slate' ? 'bg-white/15 text-white' : 'bg-white/20 text-white') + '">' + icon('gift', 'h-3 w-3') + t('home.limitedTime') + '</span>'
    + '<div class="relative max-w-[75%]">'
    + '<h3 class="text-lg font-bold leading-tight sm:text-xl">' + t(b.key + '.title') + '</h3>'
    + '<p class="mt-1 text-xs leading-snug text-white/85 sm:text-sm">' + t(b.key + '.subtitle') + '</p>'
    + '</div>'
    + '<div class="relative"><button type="button" data-banner-action="' + i + '" class="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-100">' + t(b.key + '.cta') + icon('chevronRight', 'h-3.5 w-3.5') + '</button></div>'
    + '</article>';
}

/* ------------------------------------------------------------------ */
/* Category tiles                                                      */
/* ------------------------------------------------------------------ */

function tileLink(name, t) {
  return '<a href="' + t.path + '" class="card flex flex-col items-center gap-2 p-3 ' + TILE_HOVER + '">'
    + '<span class="flex h-11 w-11 items-center justify-center rounded-full ' + t.bg + ' ' + t.fg + '">' + icon(t.icon, 'h-6 w-6') + '</span>'
    + '<span class="text-center text-xs font-medium leading-tight text-zinc-700">' + name + '</span>'
    + '</a>';
}

function categoryTile(c) {
  return tileLink(t(c.key), CATEGORY_TILES[c.id]);
}

function moreTile() {
  return tileLink(t('category.more'), CATEGORY_TILES.more);
}

/* ------------------------------------------------------------------ */
/* Flash Sale countdown                                                */
/* ------------------------------------------------------------------ */

let timerHandle = null;

function flashDeadline() {
  const t = new Date();
  t.setHours(24, 0, 0, 0); // next local midnight
  return t.getTime();
}

function renderTimer(msLeft) {
  const el = document.getElementById('flash-timer');
  if (!el) return;
  const s = Math.max(0, Math.floor(msLeft / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  el.innerHTML = '<span class="chip">' + hh + '</span><span class="text-xs font-bold text-zinc-400">:</span>'
    + '<span class="chip">' + mm + '</span><span class="text-xs font-bold text-zinc-400">:</span>'
    + '<span class="chip">' + ss + '</span>';
}

function startCountdown() {
  if (timerHandle) return;
  const deadline = flashDeadline();
  const tick = () => renderTimer(deadline - Date.now());
  tick();
  timerHandle = setInterval(tick, 1000);
}

/* ------------------------------------------------------------------ */
/* Flash Sale scroll arrows                                            */
/* ------------------------------------------------------------------ */

/* Cards to nudge per click. The step is capped at the row's visible width
 * so a wide desktop row does not jump far more than a screenful. */
const FLASH_CARDS_PER_CLICK = 3;
const FLASH_GAP_PX = 12; // matches the row's gap-3

/* Show the button that can still scroll, hide the one that cannot, and
 * disable it for keyboard/screen-reader users. Runs on every scroll (manual
 * swipe/trackpad/drag included) and on resize. */
export function updateFlashNav() {
  const row = document.getElementById('flash-row');
  const prev = document.getElementById('flash-prev');
  const next = document.getElementById('flash-next');
  if (!row || !prev || !next) return;

  const maxScroll = row.scrollWidth - row.clientWidth;
  const atStart = row.scrollLeft <= 1;
  const atEnd = row.scrollLeft >= maxScroll - 1;

  prev.classList.toggle('hidden', atStart);
  prev.disabled = atStart || maxScroll <= 1;
  next.classList.toggle('hidden', atEnd);
  next.disabled = atEnd || maxScroll <= 1;
}

function flashStep(row) {
  const card = row.firstElementChild;
  const cardW = card ? card.offsetWidth : 0;
  const byCards = (cardW + FLASH_GAP_PX) * FLASH_CARDS_PER_CLICK;
  return byCards > 0 ? Math.min(byCards, row.clientWidth) : row.clientWidth;
}

export function initFlashNav() {
  const row = document.getElementById('flash-row');
  const prev = document.getElementById('flash-prev');
  const next = document.getElementById('flash-next');
  if (!row || !prev || !next) return;

  row.addEventListener('scroll', () => requestAnimationFrame(updateFlashNav), { passive: true });
  window.addEventListener('resize', updateFlashNav);

  prev.addEventListener('click', () => row.scrollBy({ left: -flashStep(row), behavior: 'smooth' }));
  next.addEventListener('click', () => row.scrollBy({ left: flashStep(row), behavior: 'smooth' }));

  updateFlashNav();
}

/* ------------------------------------------------------------------ */
/* Results (Big deals banner)                                          */
/* ------------------------------------------------------------------ */

/* Search and category browsing moved to dedicated pages (browse.js, routed
 * from router.js). The home results section now only serves the "Big deals"
 * banner CTA. */

function productsForFilter() {
  return PRODUCTS.filter((p) => discountPct(p) >= 30);
}

function openResults() {
  closePanels();
  const products = productsForFilter();
  const section = document.getElementById('results-section');
  document.getElementById('results-title').textContent = t('home.bigDeals');
  const count = document.getElementById('results-count');
  count.textContent = tc('common.item_one', 'common.item_many', products.length);

  const grid = document.getElementById('results-grid');
  const empty = document.getElementById('results-empty');
  grid.innerHTML = products.map((p) => productCard(p)).join('');

  if (products.length) {
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    empty.innerHTML = '';
  } else {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
    const suggestions = TRENDING.slice(0, 4)
      .map((t) => '<button type="button" data-search-suggest="' + t + '" class="badge-soft h-8 px-3 text-xs hover:bg-zinc-200">' + t + '</button>')
      .join('');
    empty.innerHTML = emptyState({
      icon: 'search',
      title: t('home.noResults.title'),
      body: t('home.noResults.body'),
      actionLabel: t('home.clearSearch'),
      actionAttr: 'data-results-clear',
    })
      // Suggestion chips below the empty-state action.
      + '<div class="-mt-6 flex flex-wrap justify-center gap-2 pb-8">' + suggestions + '</div>';
  }

  // Swap the home sections for the results view.
  ['promo', 'categories', 'flash', 'recommended'].forEach((id) => {
    const el = document.getElementById('section-' + id);
    if (el) el.classList.add('hidden');
  });
  section.classList.remove('hidden');
  window.scrollTo({ top: 0 });
}

export function clearResults() {
  document.getElementById('results-section').classList.add('hidden');
  ['promo', 'categories', 'flash', 'recommended'].forEach((id) => {
    const el = document.getElementById('section-' + id);
    if (el) el.classList.remove('hidden');
  });
}

/* ------------------------------------------------------------------ */
/* Search panel (recents + trending + live suggestions)                */
/* ------------------------------------------------------------------ */

function closePanels() {
  document.querySelectorAll('.search-panel').forEach((p) => p.classList.add('hidden'));
}

function panelRows(q) {
  const term = q.trim().toLowerCase();
  if (!term) {
    const recent = store.recent.length
      ? '<div class="flex items-center justify-between px-1 pb-1"><span class="text-xs font-semibold uppercase tracking-wide text-zinc-400">' + t('home.recentSearches') + '</span>'
        + '<button type="button" data-recent-clear class="text-xs font-medium text-brand-700 hover:underline">' + t('common.clearAll') + '</button></div>'
        + '<div class="flex flex-wrap gap-2 pb-1">'
        + store.recent.map((r) => '<span class="inline-flex items-center gap-1 rounded-full bg-zinc-100 pl-3 pr-1.5 text-xs font-medium text-zinc-700">'
          + '<button type="button" data-recent="' + esc(r) + '" class="py-1.5 hover:text-zinc-900">' + esc(r) + '</button>'
          + '<button type="button" data-recent-remove="' + esc(r) + '" aria-label="' + esc(t('home.removeRecentAria', { term: r })) + '" class="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600">' + icon('x', 'h-3 w-3') + '</button>'
          + '</span>').join('')
        + '</div>'
      : '';
    const trending = '<div class="px-1 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">' + t('home.trendingSearches') + '</div>'
      + '<div class="flex flex-wrap gap-2">'
      + TRENDING.map((term) => '<button type="button" data-recent="' + term + '" class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">' + icon('search', 'h-3 w-3') + term + '</button>').join('')
      + '</div>';
    if (!recent && !trending) return '<p class="p-2 text-sm text-zinc-400">' + t('home.startTyping') + '</p>';
    return recent + trending;
  }
  const matches = PRODUCTS.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 6);
  if (!matches.length) {
    return '<p class="p-2 text-sm text-zinc-500">' + esc(t('home.noMatches', { q })) + '</p>';
  }
  return matches.map((p) => '<button type="button" data-suggest="' + p.name + '" class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">'
    + '<span class="text-zinc-400">' + icon('search', 'h-4 w-4') + '</span>'
    + '<span class="truncate">' + p.name + '</span>'
    + '<span class="ml-auto shrink-0 text-xs text-zinc-400">' + fmtPrice(p.price) + '</span>'
    + '</button>').join('');
}

function bindSearch() {
  document.querySelectorAll('.search-box').forEach((box) => {
    const input = box.querySelector('input');
    const panel = box.querySelector('.search-panel');

    const open = () => {
      panel.innerHTML = panelRows(input.value);
      panel.classList.remove('hidden');
    };

    input.addEventListener('focus', open);
    input.addEventListener('input', open);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        submitSearch(input.value);
        input.blur();
      } else if (e.key === 'Escape') {
        input.blur();
      }
    });
    // Hide on outside press. pointerdown + preventDefault-free blur ordering:
    // we close on any pointerdown outside the box, and clicks inside the
    // panel are handled before that (delegation in app.js).
    document.addEventListener('pointerdown', (e) => {
      if (!box.contains(e.target)) panel.classList.add('hidden');
    });
    box.addEventListener('submit', (e) => e.preventDefault());
  });
}

function submitSearch(value) {
  const q = (value || '').trim();
  if (!q) return;
  store.addRecent(q);
  closePanels();
  goToHash('#/search?q=' + encodeURIComponent(q));
}

/* ------------------------------------------------------------------ */
/* Carousel                                                            */
/* ------------------------------------------------------------------ */

const carousel = {
  index: 0,
  timer: null,
  paused: false,
};

function carouselCount() {
  const track = document.getElementById('promo-carousel');
  return track ? track.children.length : 0;
}

function setDots() {
  const dots = document.querySelectorAll('#promo-dots [data-dot]');
  dots.forEach((d) => {
    const i = Number(d.dataset.dot);
    const on = i === carousel.index;
    d.classList.toggle('bg-brand-600', on);
    d.classList.toggle('w-4', on);
    d.classList.toggle('bg-zinc-300', !on);
    d.classList.toggle('w-2', !on);
  });
}

function goTo(i) {
  const track = document.getElementById('promo-carousel');
  const n = carouselCount();
  if (!track || !n) return;
  carousel.index = ((i % n) + n) % n;
  track.scrollTo({ left: track.children[carousel.index].offsetLeft, behavior: 'smooth' });
  setDots();
}

function initCarousel() {
  const track = document.getElementById('promo-carousel');
  if (!track || carousel.timer) return; // wire the interval once

  let raf = null;
  track.addEventListener('scroll', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const n = carouselCount();
      const mid = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      for (let i = 0; i < n; i++) {
        const left = track.children[i].offsetLeft;
        const right = left + track.children[i].clientWidth / 2;
        if (mid >= left && mid <= right) nearest = i;
      }
      if (nearest !== carousel.index) {
        carousel.index = nearest;
        setDots();
      }
    });
  }, { passive: true });

  const pause = () => { carousel.paused = true; };
  const resume = () => { carousel.paused = false; };
  track.addEventListener('pointerdown', pause);
  track.addEventListener('pointerup', resume);
  track.addEventListener('pointercancel', resume);
  track.addEventListener('mouseenter', pause);
  track.addEventListener('mouseleave', resume);

  // The shell keeps the last few apps loaded but hidden; don't advance the
  // banner while nobody can see it, so returning shows it as it was left.
  window.addEventListener('usernode:visibility-changed', (e) => {
    if (e.detail && e.detail.hidden) pause(); else resume();
  });

  carousel.timer = setInterval(() => {
    if (!carousel.paused && !document.hidden) goTo(carousel.index + 1);
  }, 4000);
}

/* ------------------------------------------------------------------ */
/* Recommended grid + filter bar                                       */
/* ------------------------------------------------------------------ */

/* Products added per "Load more" click. The list itself is paged by the
 * server; the grid renders one page and grows by one page. */
const REC_PAGE = 12;

let recommendedSection = null;

/* The hash for the current filter set on the home route. */
function recommendedHash(f) {
  const qs = filterParams(f).toString();
  return '#/home' + (qs ? '?' + qs : '');
}

function renderRecommendedLoading() {
  const grid = document.getElementById('recommended-grid');
  const more = document.getElementById('recommended-more');
  if (grid) grid.innerHTML = Array.from({ length: REC_PAGE }, () => skeletonCard()).join('');
  if (more) more.innerHTML = '';
  const empty = document.getElementById('recommended-empty');
  if (empty) { empty.classList.add('hidden'); empty.innerHTML = ''; }
}

/* One render per state change. Keeps the toolbar, the chips, the count, the
 * grid, the empty state and Load more all in step with the service. */
function renderRecommended() {
  const s = recommendedService;
  const grid = document.getElementById('recommended-grid');
  const more = document.getElementById('recommended-more');
  const empty = document.getElementById('recommended-empty');
  const chips = document.getElementById('recommended-chips');
  if (!s || !grid) return;

  if (recommendedSection) updateFilterBar(recommendedSection, s.filters);
  if (chips) {
    chips.innerHTML = resultCountHtml(s.total) + activeFilterChipsHtml(s.filters);
  }

  if (s.loading && !s.items.length && !s.error) {
    renderRecommendedLoading();
    return;
  }

  if (s.items.length) {
    grid.innerHTML = s.items.map((p) => productCard(p)).join('');
    grid.classList.remove('hidden');
    if (empty) { empty.classList.add('hidden'); empty.innerHTML = ''; }
    if (more) {
      const remaining = s.total - s.items.length;
      more.innerHTML = remaining > 0
        ? '<button type="button" id="recommended-more-btn" class="btn-outline btn-sm"'
          + (s.loading ? ' disabled' : '') + '>' + t('home.loadMore') + '<span class="text-zinc-400">(' + remaining + ')</span></button>'
        : '';
    }
  } else {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    if (more) more.innerHTML = '';
    if (empty) {
      empty.innerHTML = emptyState({
        icon: 'search',
        title: t('home.empty.title'),
        body: hasActiveFilters(s.filters) ? t('home.empty.bodyFiltered') : t('home.empty.bodyPlain'),
        actionLabel: hasActiveFilters(s.filters) ? t('home.clearAllFilters') : '',
        actionAttr: 'data-filter-clear',
      });
      empty.classList.remove('hidden');
    }
  }
}

function bindRecommended() {
  const more = document.getElementById('recommended-more');
  if (!more) return;
  more.addEventListener('click', (e) => {
    if (!e.target.closest('#recommended-more-btn')) return;
    if (recommendedService) recommendedService.loadMore();
  });
}

/* The Recommended list. GET /api/products is the real path; when it cannot
 * be reached (a container restart, a standalone run with no database) the
 * bundled catalog answers the same filters in memory, so a filtered home
 * still renders. The server is retried on the next filter change. */
async function recommendedFetcher(params) {
  const res = await fetchProducts(params);
  if (res.ok && res.data && Array.isArray(res.data.items)) return res;
  const fallback = localProductPage(params, { base: 'recommended' });
  return { ok: true, status: res.status, data: fallback };
}

/* Feed the home route's filter params to the service. Called by the router
 * every time the home tab renders, so a reload, a shared link or a back
 * button all reconstruct the same filtered list. */
export function applyHomeRoute(route) {
  if (!recommendedService) return;
  const query = (route && route.query) || new URLSearchParams();
  recommendedService.adoptRoute(parseFilterParams(query));
}

/* The home grid's filter service. It pages the catalog from GET /api/products
 * (with the bundled catalog as an offline fallback) and keeps its state in
 * the home route's hash query. */
const recommendedService = createFilterService({
  fetcher: recommendedFetcher,
  buildHash: recommendedHash,
  pushHash: (hash) => goToHash(hash),
  extraParams: () => ({}),
  limit: REC_PAGE,
  onError: (msg) => toast(msg),
});

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

export function initHome() {
  // 1. Skeletons immediately, so the shell never shows an empty grid.
  document.getElementById('promo-carousel').innerHTML = skeletonBanner() + skeletonBanner() + skeletonBanner();
  document.getElementById('promo-dots').innerHTML = [0, 1, 2].map((i) =>
    '<button type="button" data-dot="' + i + '" aria-label="' + esc(t('home.goToBannerAria', { n: i + 1 })) + '" class="un-touch-target h-2 w-2 rounded-full bg-zinc-300 transition-all"></button>').join('');
  document.getElementById('category-grid').innerHTML = CATEGORIES.concat([{ id: 'more' }]).map(() => skeletonCategoryTile()).join('');
  document.getElementById('flash-row').innerHTML = Array.from({ length: 5 }, () =>
    '<div class="w-40 shrink-0 snap-start sm:w-44">' + skeletonCard(true) + '</div>').join('');
  document.getElementById('recommended-grid').innerHTML = Array.from({ length: 8 }, () => skeletonCard()).join('');

  // 2. The Recommended filter bar: the toolbar renders at once (from the
  //    default filter set), then the service fills the grid from the URL.
  recommendedSection = document.getElementById('section-recommended');
  const bar = document.getElementById('recommended-filterbar');
  if (bar) bar.innerHTML = filterBarHtml(recommendedService.filters);
  recommendedService.subscribe(renderRecommended);
  bindFilterControls(recommendedSection, recommendedService);
  bindRecommended();

  // 3. Static home content shortly after. This is only long enough for the
  //    skeleton state to be visible (and testable).
  setTimeout(() => {
    renderHomeStatic();
    initCarousel();
    initFlashNav();
  }, 450);

  startCountdown();
  bindSearch();
}

/* Paint the translated home content that is not part of the routed grid:
 * the promotional carousel, the category tiles and the Flash Sale row. Called
 * once shortly after boot, and again on a locale change so a language switch
 * re-labels banners and tiles in place without a reload. */
export function renderHomeStatic() {
  const carouselEl = document.getElementById('promo-carousel');
  if (carouselEl) carouselEl.innerHTML = BANNERS.map(bannerHtml).join('');
  const gridEl = document.getElementById('category-grid');
  if (gridEl) gridEl.innerHTML = CATEGORIES.map(categoryTile).join('') + moreTile();
  const flashEl = document.getElementById('flash-row');
  if (flashEl) {
    flashEl.innerHTML = PRODUCTS.filter((p) => p.flash).map((p) =>
      '<div class="w-40 shrink-0 snap-start sm:w-44">' + productCard(p, { compact: true }) + '</div>').join('');
  }
  // The Recommended toolbar and grid render from the filter service, which
  // only repaints on its own state changes. Refresh both here so a locale
  // change re-labels the Filters/Sort controls and the product cards already
  // on screen. The toolbar's delegated listener lives on the section, so
  // replacing its innerHTML is safe and keeps the current sort/filter state.
  const barEl = document.getElementById('recommended-filterbar');
  if (barEl && recommendedService) barEl.innerHTML = filterBarHtml(recommendedService.filters);
  if (recommendedService && !recommendedService.loading && recommendedService.items.length) {
    renderRecommended();
  }
}

/* Banner CTA targets: the deals banner opens a discounted-items results view
 * on the home page, the flash banner scrolls to the Flash Sale row, and the
 * arrivals banner opens the Fashion category page. */
export function runBannerAction(i) {
  const b = BANNERS[i];
  if (!b) return;
  if (b.action.type === 'scroll') {
    clearResults();
    const el = document.getElementById('section-flash');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (b.action.type === 'deals') {
    openResults();
    return;
  }
  if (b.action.type === 'category') {
    goToHash('#/category/' + b.action.id);
  }
}

export { submitSearch, setDots, panelRows };
