/* Home page: promotional carousel, category tiles, Flash Sale row with
 * countdown, Recommended grid, and the search/filter results view (which
 * also serves empty-search and no-product states).
 */

import { icon } from './icons.js';
import { BANNERS, CATEGORIES, PRODUCTS, TRENDING, categoryById, discountPct } from './data.js';
import { store } from './store.js';
import {
  emptyState,
  fmtCount,
  fmtPrice,
  productCard,
  skeletonBanner,
  skeletonCard,
  skeletonCategoryTile,
} from './ui.js';

const state = {
  filter: null, // { type: 'search' | 'category' | 'deals', q?, id? }
};

/* Banner gradient tones — whole literal class strings so the Tailwind
 * compiler sees them. */
const BANNER_TONES = {
  brand: 'bg-gradient-to-br from-brand-500 to-brand-700 text-white',
  rose: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white',
  slate: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white',
};

/* Soft tint / deep icon color pairs for the category tiles. */
const CATEGORY_TINTS = {
  electronics: ['bg-indigo-50', 'text-indigo-600'],
  fashion: ['bg-rose-50', 'text-rose-600'],
  beauty: ['bg-purple-50', 'text-purple-600'],
  home: ['bg-teal-50', 'text-teal-600'],
  sports: ['bg-orange-50', 'text-orange-600'],
  groceries: ['bg-green-50', 'text-green-600'],
  accessories: ['bg-slate-100', 'text-slate-600'],
  more: ['bg-zinc-100', 'text-zinc-500'],
};

const CATEGORY_ART = {
  electronics: 'speaker',
  fashion: 'shirt',
  beauty: 'sparkles',
  home: 'armchair',
  sports: 'dumbbell',
  groceries: 'basket',
  accessories: 'gem',
  more: 'ellipsis',
};

/* ------------------------------------------------------------------ */
/* Banners                                                             */
/* ------------------------------------------------------------------ */

function bannerHtml(b, i) {
  return '<article class="banner relative flex h-40 w-[86%] shrink-0 snap-center flex-col justify-between overflow-hidden rounded-2xl p-4 sm:h-48 sm:w-96 sm:p-5 lg:w-[26rem] '
    + BANNER_TONES[b.tone] + '" data-banner="' + b.id + '">'
    + '<span class="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/15"></span>'
    + '<span class="pointer-events-none absolute -bottom-14 right-16 h-28 w-28 rounded-full bg-white/10"></span>'
    + '<span class="pointer-events-none absolute bottom-2 right-3 opacity-25">' + icon(b.icon, 'h-20 w-20') + '</span>'
    + '<span class="badge ' + (b.tone === 'slate' ? 'bg-white/15 text-white' : 'bg-white/20 text-white') + '">' + icon('gift', 'h-3 w-3') + 'Limited time</span>'
    + '<div class="relative max-w-[75%]">'
    + '<h3 class="text-lg font-bold leading-tight sm:text-xl">' + b.title + '</h3>'
    + '<p class="mt-1 text-xs leading-snug text-white/85 sm:text-sm">' + b.subtitle + '</p>'
    + '</div>'
    + '<div class="relative"><button type="button" data-banner-action="' + i + '" class="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-100">' + b.cta + icon('chevronRight', 'h-3.5 w-3.5') + '</button></div>'
    + '</article>';
}

/* ------------------------------------------------------------------ */
/* Category tiles                                                      */
/* ------------------------------------------------------------------ */

function categoryTile(c) {
  const [bg, fg] = CATEGORY_TINTS[c.id];
  return '<button type="button" data-category="' + c.id + '" class="card flex flex-col items-center gap-2 p-3 transition-shadow hover:shadow-card-lg">'
    + '<span class="flex h-11 w-11 items-center justify-center rounded-full ' + bg + ' ' + fg + '">' + icon(CATEGORY_ART[c.id], 'h-6 w-6') + '</span>'
    + '<span class="text-center text-xs font-medium leading-tight text-zinc-700">' + c.name + '</span>'
    + '</button>';
}

function moreTile() {
  const [bg, fg] = CATEGORY_TINTS.more;
  return '<button type="button" data-nav="categories" class="card flex flex-col items-center gap-2 p-3 transition-shadow hover:shadow-card-lg">'
    + '<span class="flex h-11 w-11 items-center justify-center rounded-full ' + bg + ' ' + fg + '">' + icon('ellipsis', 'h-6 w-6') + '</span>'
    + '<span class="text-center text-xs font-medium leading-tight text-zinc-700">More</span>'
    + '</button>';
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
/* Results (search / category / deals)                                 */
/* ------------------------------------------------------------------ */

function productsForFilter(filter) {
  if (!filter) return [];
  if (filter.type === 'search') {
    const q = filter.q.toLowerCase();
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q) || p.cat.includes(q));
  }
  if (filter.type === 'category') return PRODUCTS.filter((p) => p.cat === filter.id);
  if (filter.type === 'deals') return PRODUCTS.filter((p) => discountPct(p) >= 30);
  return [];
}

function filterTitle(filter) {
  if (!filter) return '';
  if (filter.type === 'search') return 'Results for "' + filter.q + '"';
  if (filter.type === 'category') {
    const c = categoryById(filter.id);
    return c ? c.name : 'Products';
  }
  if (filter.type === 'deals') return 'Big deals';
  return 'Products';
}

export function openResults(filter) {
  state.filter = filter;
  closePanels();
  const products = productsForFilter(filter);
  const section = document.getElementById('results-section');
  document.getElementById('results-title').textContent = filterTitle(filter);
  const count = document.getElementById('results-count');
  count.textContent = products.length + (products.length === 1 ? ' item' : ' items');

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
      title: 'No results found',
      body: 'Nothing matches "' + filter.q + '" right now. Try a different word, or start from a trending search.',
      actionLabel: 'Clear search',
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
  state.filter = null;
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
      ? '<div class="flex items-center justify-between px-1 pb-1"><span class="text-xs font-semibold uppercase tracking-wide text-zinc-400">Recent searches</span>'
        + '<button type="button" data-recent-clear class="text-xs font-medium text-brand-700 hover:underline">Clear all</button></div>'
        + '<div class="flex flex-wrap gap-2 pb-1">'
        + store.recent.map((r) => '<span class="inline-flex items-center gap-1 rounded-full bg-zinc-100 pl-3 pr-1.5 text-xs font-medium text-zinc-700">'
          + '<button type="button" data-recent="' + r + '" class="py-1.5 hover:text-zinc-900">' + r + '</button>'
          + '<button type="button" data-recent-remove="' + r + '" aria-label="Remove ' + r + ' from recent searches" class="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600">' + icon('x', 'h-3 w-3') + '</button>'
          + '</span>').join('')
        + '</div>'
      : '';
    const trending = '<div class="px-1 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Trending searches</div>'
      + '<div class="flex flex-wrap gap-2">'
      + TRENDING.map((t) => '<button type="button" data-recent="' + t + '" class="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200">' + icon('search', 'h-3 w-3') + t + '</button>').join('')
      + '</div>';
    if (!recent && !trending) return '<p class="p-2 text-sm text-zinc-400">Start typing to search.</p>';
    return recent + trending;
  }
  const matches = PRODUCTS.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 6);
  if (!matches.length) {
    return '<p class="p-2 text-sm text-zinc-500">No matches for "' + q + '". Press Enter to search anyway.</p>';
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
  openResults({ type: 'search', q });
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
  if (!track) return;

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

  carousel.timer = setInterval(() => {
    if (!carousel.paused && !document.hidden) goTo(carousel.index + 1);
  }, 4000);
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

export function initHome() {
  // 1. Skeletons immediately, so the shell never shows an empty grid.
  document.getElementById('promo-carousel').innerHTML = skeletonBanner() + skeletonBanner() + skeletonBanner();
  document.getElementById('promo-dots').innerHTML = [0, 1, 2].map((i) =>
    '<button type="button" data-dot="' + i + '" aria-label="Go to banner ' + (i + 1) + '" class="h-2 w-2 rounded-full bg-zinc-300 transition-all"></button>').join('');
  document.getElementById('category-grid').innerHTML = CATEGORIES.concat([{ id: 'more' }]).map(() => skeletonCategoryTile()).join('');
  document.getElementById('flash-row').innerHTML = Array.from({ length: 5 }, () =>
    '<div class="w-40 shrink-0 snap-start sm:w-44">' + skeletonCard(true) + '</div>').join('');
  document.getElementById('recommended-grid').innerHTML = Array.from({ length: 8 }, () => skeletonCard()).join('');

  // 2. Real content shortly after. The data is static, so this is only long
  //    enough for the skeleton state to be visible (and testable).
  setTimeout(() => {
    document.getElementById('promo-carousel').innerHTML = BANNERS.map(bannerHtml).join('');
    document.getElementById('category-grid').innerHTML =
      CATEGORIES.map(categoryTile).join('') + moreTile();
    document.getElementById('flash-row').innerHTML =
      PRODUCTS.filter((p) => p.flash).map((p) =>
        '<div class="w-40 shrink-0 snap-start sm:w-44">' + productCard(p, { compact: true }) + '</div>').join('');
    document.getElementById('recommended-grid').innerHTML =
      PRODUCTS.map((p) => productCard(p)).join('');
    initCarousel();
  }, 450);

  startCountdown();
  bindSearch();
}

/* Banner CTA targets: the deals banner opens a discounted-items results view,
 * the flash banner scrolls to the Flash Sale row, the arrivals banner opens
 * the Fashion category. */
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
    openResults({ type: 'deals' });
    return;
  }
  if (b.action.type === 'category') {
    openResults({ type: 'category', id: b.action.id });
  }
}

export { submitSearch, setDots, panelRows };
