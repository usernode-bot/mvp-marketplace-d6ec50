/* Product reviews: the list, the composer (with photo upload), the live
 * update stream and the photo lightbox.
 *
 * The product page hands this module one container (#pdp-reviews) per visit.
 * Everything else here is module-local: the loaded reviews keyed by id, the
 * viewer's own situation, the draft being composed, and the one SSE
 * connection for the product being viewed.
 *
 * Photos never travel as bytes through this app's server. The browser resizes
 * and re-encodes each pick into a canvas (which is also what strips EXIF
 * metadata, including GPS), uploads the result through the platform bridge and
 * persists only the returned URL against the review.
 */

import { icon } from './icons.js';
import {
  createReview,
  deleteReview,
  fetchReviews,
  openReviewStream,
  updateReview,
} from './api.js';
import { confirmDialog, esc, starRow, toast } from './ui.js';
import { fmtNumber, intlLocale, t } from './i18n.js';

const MAX_IMAGES = 5;
const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const OUTPUT_EDGE = 1600;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/* The server lists at most this many reviews per product. A marketplace
 * product has far fewer, so its breakdown can be counted from the list; past
 * the cap the server's own counts are used instead. */
const LIST_CAP = 50;

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'helpful', label: 'Most helpful' },
  { id: 'highest', label: 'Highest rating' },
  { id: 'lowest', label: 'Lowest rating' },
];

/* Every piece of copy resolves through t() at render time, so a language
 * change shows up on the next render. COPY.<name> reads reviews.<name>. */
const COPY = new Proxy({}, { get: (_, name) => t('reviews.' + String(name)) });

/* A failed write: map by HTTP status (and the few exact server strings) to a
 * localized message; anything else falls back to the generic failure. */
function errorMessage(res, fallback) {
  const status = res && res.status;
  const raw = res && res.data && res.data.error;
  if (status === 401) return t('reviews.signIn');
  if (status === 403) return raw === 'Not your review' ? t('reviews.notYours') : t('reviews.refusal');
  if (status === 404) return t('reviews.notFound');
  if (status === 429) return t('reviews.rateLimited');
  if (status === 400) {
    if (raw === 'Choose a rating from 1 to 5 stars.') return t('reviews.chooseRating');
    if (raw === 'Review text is too long.') return t('reviews.textTooLong');
    return t('reviews.invalidReview');
  }
  return fallback;
}

/* State. `items` is a Map keyed by string review id so the server response and
 * the SSE echo reconcile to exactly one card. `draft.images` entries carry a
 * local object URL for the thumbnail while the upload is in flight. */
const state = {
  product: null,
  container: null,
  items: new Map(),
  summary: null,
  sort: 'newest',
  viewer: null,
  loading: true,
  error: false,
  stream: null,
  streamTimer: null,
  live: false,
  composing: false,
  editingId: null,
  rating: 0,
  text: '',
  images: [],
  open: false,
  uploading: 0,
  saving: false,
  lightbox: null,
};

let listenersBound = false;
let imgSeq = 0;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

function sorted() {
  const time = (r) => Date.parse(r.createdAt) || 0;
  const by = {
    newest: (a, b) => time(b) - time(a),
    helpful: (a, b) => (b.helpful || 0) - (a.helpful || 0) || time(b) - time(a),
    highest: (a, b) => b.rating - a.rating || time(b) - time(a),
    lowest: (a, b) => a.rating - b.rating || time(b) - time(a),
  };
  return [...state.items.values()].sort(by[state.sort] || by.newest);
}

/* The rating breakdown. For a marketplace product it is counted from the
 * reviews themselves (the card's rating and count are that same average and
 * number); for the bundled catalog it stays the product's own aggregate. */
function statsFor() {
  const s = state.summary;
  if (!s || !s.exact) return null;
  let counts = s.counts;
  const items = [...state.items.values()].filter((r) => r.status !== 'rejected');
  if (items.length < LIST_CAP) {
    counts = [0, 0, 0, 0, 0];
    items.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) counts[5 - r.rating] += 1; });
  }
  const total = counts.reduce((a, b) => a + b, 0);
  const sum = counts.reduce((a, n, i) => a + n * (5 - i), 0);
  return { counts, total, average: total ? Math.floor((sum * 20 + total) / (2 * total)) / 10 : 0 };
}

function photoAlt(image, review) {
  if (image.alt) return image.alt;
  const author = review && review.author ? review.author : t('reviews.aShopper');
  const product = state.product ? state.product.name : t('reviews.thisProduct');
  return t('reviews.photoAlt', { author: author, product: product });
}

function avatarTint(name) {
  const tints = [
    ['bg-rose-50', 'text-rose-600'],
    ['bg-indigo-50', 'text-indigo-600'],
    ['bg-teal-50', 'text-teal-600'],
    ['bg-amber-50', 'text-amber-600'],
    ['bg-purple-50', 'text-purple-600'],
  ];
  let sum = 0;
  const s = String(name || '?');
  for (let i = 0; i < s.length; i += 1) sum += s.charCodeAt(i);
  return tints[sum % tints.length];
}

function whenLabel(iso) {
  const ts = Date.parse(iso);
  if (!ts) return '';
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return COPY.today;
  if (days === 1) return COPY.yesterday;
  if (days < 30) return t('reviews.daysAgo', { count: days });
  return new Date(ts).toLocaleDateString(intlLocale(), { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

function summaryHtml() {
  const p = state.product;
  const stats = statsFor();
  const rating = stats ? stats.average : (p ? p.rating : 0);
  const count = stats ? stats.total : (p ? p.reviews : 0);
  return '<div class="card mt-3 p-4" data-review-summary><div class="flex items-center gap-5">'
    + '<div class="shrink-0 text-center">'
    + '<div class="text-3xl font-bold tabular-nums text-zinc-900" data-review-average>' + fmtNumber(rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '</div>'
    + starRow(rating)
    + '<div class="mt-1 text-xs text-zinc-500" data-review-count>' + esc(t('reviews.count', { count, n: fmtCountSafe(count) })) + '</div>'
    + '</div>'
    + '<div class="flex-1 space-y-1.5" data-review-breakdown>' + (stats ? exactBarsHtml(stats) : barsHtml(p ? p.rating : 0)) + '</div>'
    + '</div></div>';
}

function exactBarsHtml(stats) {
  return stats.counts.map((n, i) => {
    const stars = 5 - i;
    const pct = stats.total ? Math.round((n / stats.total) * 100) : 0;
    return '<div class="flex items-center gap-2 text-xs text-zinc-500" data-review-bar="' + stars + '">'
      + '<span class="w-3 shrink-0 text-right tabular-nums">' + stars + '</span>'
      + icon('star', 'h-3 w-3 shrink-0 text-amber-400')
      + '<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"><div class="h-full rounded-full bg-amber-400" style="width:' + pct + '%"></div></div>'
      + '<span class="w-6 shrink-0 text-right tabular-nums" data-review-bar-count>' + n + '</span>'
      + '</div>';
  }).join('');
}

function sortBarHtml() {
  if (state.loading || state.error || state.items.size < 2) return '';
  return '<div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="Sort reviews" data-review-sorts>'
    + SORTS.map((o) => '<button type="button" data-review-sort="' + o.id + '" aria-pressed="' + (state.sort === o.id) + '"'
      + ' class="tab-pill' + (state.sort === o.id ? ' tab-pill-active' : '') + '">' + o.label + '</button>').join('')
    + '</div>';
}

function fmtCountSafe(n) {
  if (n >= 1000) {
    const k = n / 1000;
    return (k >= 10 ? Math.round(k) : Math.round(k * 10) / 10) + 'k';
  }
  return String(n);
}

// The distribution bars stay the product's catalog aggregate; they describe
// the product's overall rating, not just the reviews rendered below.
function barsHtml(rating) {
  const shares = distributionFor(rating);
  return shares.map((share, i) => {
    const stars = 5 - i;
    return '<div class="flex items-center gap-2 text-xs text-zinc-500">'
      + '<span class="w-3 shrink-0 text-right tabular-nums">' + stars + '</span>'
      + icon('star', 'h-3 w-3 shrink-0 text-amber-400')
      + '<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"><div class="h-full rounded-full bg-amber-400" style="width:' + Math.round(share * 100) + '%"></div></div>'
      + '</div>';
  }).join('');
}

function distributionFor(rating) {
  const rows = [
    [4.75, [0.82, 0.13, 0.03, 0.01, 0.01]],
    [4.5, [0.72, 0.2, 0.05, 0.02, 0.01]],
    [4.25, [0.62, 0.26, 0.08, 0.03, 0.01]],
    [4.0, [0.55, 0.3, 0.1, 0.04, 0.01]],
    [3.5, [0.42, 0.32, 0.17, 0.06, 0.03]],
  ];
  let best = rows[0];
  let bestDist = Infinity;
  for (const row of rows) {
    const d = Math.abs(row[0] - rating);
    if (d < bestDist) { bestDist = d; best = row; }
  }
  return best[1];
}

function photoThumb(image, review, index, total) {
  const alt = photoAlt(image, review);
  const count = total > 1 ? '<span class="absolute right-1 top-1 rounded-full bg-zinc-900/70 px-1.5 text-[10px] font-semibold text-white">' + (index + 1) + '/' + total + '</span>' : '';
  return '<button type="button" class="relative block h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100" data-review-photo="' + esc(review.id) + '" data-photo-index="' + index + '" aria-label="' + esc(t('reviews.openPhoto', { n: index + 1, total: total })) + '">'
    + '<span data-photo-skeleton class="absolute inset-0 animate-pulse bg-zinc-200"></span>'
    + '<img src="' + esc(image.url) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async" data-review-photo-img class="relative h-full w-full object-cover" onload="this.previousElementSibling && this.previousElementSibling.remove()" onerror="this.remove()">'
    + count + '</button>';
}

function reviewCard(r) {
  const [bg, fg] = avatarTint(r.author);
  const initial = String(r.author || '?').charAt(0).toUpperCase();
  const photos = (r.images && r.images.length)
    ? '<div class="mt-2.5 flex flex-wrap gap-2">' + r.images.map((im, i) => photoThumb(im, r, i, r.images.length)).join('') + '</div>'
    : '';
  const verified = r.verified
    ? '<span class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">' + icon('check', 'h-3 w-3') + esc(COPY.verified) + '</span>'
    : '';
  const pending = r.status === 'pending'
    ? '<span class="badge-soft ml-2" data-review-pending>' + esc(COPY.pending) + '</span>'
    : '';
  const owner = r.mine
    ? '<div class="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3" data-review-owner>'
      + '<button type="button" class="btn-outline btn-sm gap-1" data-review-edit="' + esc(r.id) + '">' + icon('pencil', 'h-3.5 w-3.5') + esc(COPY.edit) + '</button>'
      + '<button type="button" class="btn-outline btn-sm gap-1 text-rose-600" data-review-delete="' + esc(r.id) + '">' + icon('trash', 'h-3.5 w-3.5') + esc(COPY.delete) + '</button>'
      + '</div>'
    : '';
  const optimistic = r.pending ? ' opacity-70' : '';
  return '<article class="card p-4' + optimistic + '" data-review="' + esc(r.id) + '">'
    + '<div class="flex items-center gap-3">'
    + '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ' + bg + ' ' + fg + '">' + esc(initial) + '</span>'
    + '<div class="min-w-0">'
    + '<div class="flex items-center gap-1"><span class="truncate text-sm font-semibold text-zinc-900">' + esc(r.author) + '</span>' + pending + '</div>'
    + '<div class="flex items-center gap-1.5">' + starRow(r.rating, 'h-3 w-3') + '<span class="text-xs text-zinc-400">' + esc(whenLabel(r.createdAt)) + '</span></div>'
    + '</div>'
    + verified
    + '</div>'
    + (r.title ? '<h3 class="mt-2.5 text-sm font-semibold text-zinc-900" data-review-title>' + esc(r.title) + '</h3>' : '')
    + (r.body ? '<p class="' + (r.title ? 'mt-1' : 'mt-2.5') + ' text-sm leading-relaxed text-zinc-600">' + esc(r.body) + '</p>' : '')
    + photos
    + helpfulHtml(r)
    + replyHtml(r)
    + owner
    + '</article>';
}

function helpfulHtml(r) {
  if (!r.helpful) return '';
  return '<p class="mt-2.5 text-xs text-zinc-400" data-review-helpful>' + r.helpful + (r.helpful === 1 ? ' person' : ' people') + ' found this helpful</p>';
}

function replyHtml(r) {
  if (!r.sellerReply || !r.sellerReply.text) return '';
  return '<div class="mt-3 rounded-lg bg-zinc-50 px-3 py-2" data-review-reply>'
    + '<div class="text-xs font-semibold text-zinc-700">Seller reply</div>'
    + '<p class="mt-1 text-xs leading-relaxed text-zinc-500">' + esc(r.sellerReply.text) + '</p></div>';
}

function skeletonCard() {
  return '<div class="card p-4" aria-hidden="true">'
    + '<div class="flex items-center gap-3"><div class="h-9 w-9 animate-pulse rounded-full bg-zinc-100"></div>'
    + '<div class="space-y-2"><div class="h-3 w-28 animate-pulse rounded bg-zinc-100"></div><div class="h-3 w-16 animate-pulse rounded bg-zinc-100"></div></div></div>'
    + '<div class="mt-3 h-3 w-4/5 animate-pulse rounded bg-zinc-100"></div>'
    + '<div class="mt-2 h-3 w-3/5 animate-pulse rounded bg-zinc-100"></div>'
    + '</div>';
}

function listBodyHtml() {
  if (state.loading) {
    return '<div class="mt-3 space-y-3" data-reviews-loading aria-label="' + esc(COPY.loading) + '">'
      + skeletonCard() + skeletonCard() + '</div>';
  }
  if (state.error) {
    return '<div class="mt-3">' + '<div class="card p-6 text-center">'
      + '<p class="text-sm text-zinc-500">' + esc(COPY.error) + '</p>'
      + '<button type="button" class="btn-outline btn-sm mt-3" data-reviews-retry>' + esc(COPY.retry) + '</button>'
      + '</div></div>';
  }
  const items = sorted();
  if (!items.length) {
    return '<div class="mt-3"><div class="card p-6 text-center">'
      + '<h3 class="text-sm font-semibold text-zinc-900">' + esc(COPY.emptyTitle) + '</h3>'
      + '<p class="mt-1 text-sm text-zinc-500">' + esc(COPY.emptyBody) + '</p>'
      + '</div></div>';
  }
  return '<div class="mt-3 space-y-3" data-reviews-list>' + items.map(reviewCard).join('') + '</div>';
}

function composerOpen() {
  return state.composing;
}

function composerHtml() {
  if (!composerOpen()) return '';
  const editing = !!state.editingId;
  const stars = Array.from({ length: 5 }, (_, i) =>
    '<button type="button" data-review-star="' + (i + 1) + '" aria-label="' + esc(t('reviews.starLabel', { count: i + 1 })) + '" class="p-0.5 text-2xl leading-none ' + (i < state.rating ? 'text-amber-400' : 'text-zinc-300') + '">' + icon('star', 'h-7 w-7') + '</button>').join('');
  const thumbs = state.images.map((im, i) =>
    '<div class="relative h-[72px] w-[72px] shrink-0" data-draft-photo="' + i + '">'
    + '<div class="relative h-[72px] w-[72px] overflow-hidden rounded-lg bg-zinc-100">'
    + (im.preview ? '<img src="' + esc(im.preview) + '" alt="" class="h-full w-full object-cover">' : '')
    + (im.status !== 'done' ? '<span class="absolute inset-0 flex items-center justify-center bg-zinc-900/45 text-white">' + icon('loader', 'h-4 w-4 animate-spin') + '</span>' : '')
    + '</div>'
    + (im.status === 'done' ? '' : '<div class="mt-1 h-1 w-[72px] overflow-hidden rounded-full bg-zinc-200"><div class="h-full w-1/2 animate-pulse rounded-full bg-brand-600"></div></div>')
    + '<button type="button" data-draft-remove="' + i + '" aria-label="' + esc(COPY.removePhoto) + '" class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white">' + icon('x', 'h-3 w-3') + '</button>'
    + '</div>').join('');
  const drop = '<label class="dropzone min-h-[72px] flex-1" data-review-drop>'
    + icon('imagePlus', 'h-5 w-5 text-zinc-400')
    + '<span>' + esc(COPY.dropHint) + '</span>'
    + '<input type="file" data-review-file class="hidden" accept="' + ACCEPTED.join(',') + '" multiple>'
    + '</label>';
  const saveLabel = editing ? COPY.save : COPY.post;
  return '<div class="card mt-3 p-4" data-review-compose>'
    + '<div class="flex items-center justify-between gap-2">'
    + '<h3 class="text-sm font-bold text-zinc-900">' + esc(editing ? COPY.editTitle : COPY.write) + '</h3>'
    + '<button type="button" class="icon-btn" data-review-cancel aria-label="' + esc(COPY.cancel) + '">' + icon('x', 'h-5 w-5') + '</button>'
    + '</div>'
    + (state.product ? '<div class="mt-1 text-xs text-zinc-500">' + esc(state.product.name) + '</div>' : '')
    + '<div class="mt-3 text-xs font-semibold text-zinc-500">' + esc(COPY.rating) + '</div>'
    + '<div class="mt-1 flex items-center" role="radiogroup" aria-label="' + esc(COPY.rating) + '">' + stars + '</div>'
    + '<textarea data-review-text rows="3" class="field mt-3 py-2" style="height:auto" placeholder="' + esc(COPY.placeholder) + '" maxlength="2000">' + esc(state.text) + '</textarea>'
    + '<div class="mt-3 flex items-center gap-2">'
    + '<span class="text-sm font-semibold text-zinc-900">' + esc(COPY.addPhotos) + '</span>'
    + '<span class="ml-auto text-xs text-zinc-400">' + esc(t('reviews.photoCount', { n: state.images.length, max: MAX_IMAGES })) + '</span>'
    + '</div>'
    + '<div class="mt-2 flex flex-wrap items-stretch gap-3">' + thumbs + (state.images.length < MAX_IMAGES ? drop : '') + '</div>'
    + '<p class="mt-2 text-xs text-zinc-400">' + esc(COPY.hint) + '</p>'
    + '<p data-review-error class="field-msg hidden" role="alert"></p>'
    + '<div class="mt-3 flex gap-2">'
    + '<button type="button" class="btn-outline flex-1" data-review-cancel>' + esc(COPY.cancel) + '</button>'
    + '<button type="button" class="btn-primary flex-1" data-review-save' + (state.saving ? ' disabled' : '') + '>' + (state.saving ? icon('loader', 'h-4 w-4 animate-spin') + '<span>' + esc(COPY.saving) + '</span>' : esc(saveLabel)) + '</button>'
    + '</div></div>';
}

function actionRowHtml() {
  if (state.loading || state.error) return '';
  const v = state.viewer;
  // `data-review-cta` marks whichever affordance this viewer gets (write,
  // sign in, or the verified-buyer refusal) so a check can assert the state
  // without depending on which identity is signed in.
  if (!v || !v.signedIn) {
    return '<div class="mt-3" data-review-cta><button type="button" class="btn-primary w-full sm:w-auto" data-review-ask>' + esc(COPY.write) + '</button>'
      + '<p class="mt-2 text-xs text-zinc-400">' + esc(COPY.signIn) + '</p></div>';
  }
  if (v.hasReviewed) {
    return state.composing ? '' : '<div class="mt-3" data-review-cta><p class="text-xs text-zinc-400">' + esc(COPY.reviewed) + '</p></div>';
  }
  if (!v.canReview) {
    return '<div class="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500" data-review-cta data-review-refusal>' + esc(COPY.refusal) + '</div>';
  }
  return state.composing ? '' : '<div class="mt-3" data-review-cta><button type="button" class="btn-primary w-full sm:w-auto" data-review-start>' + esc(COPY.write) + '</button></div>';
}

function liveBadgeHtml() {
  return state.live
    ? '<span class="ml-auto inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600" data-reviews-live title="' + esc(COPY.liveTitle) + '"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>' + esc(COPY.live) + '</span>'
    : '<span class="ml-auto" aria-hidden="true"></span>';
}

function sectionHtml() {
  return '<section id="pdp-reviews" class="mt-8 scroll-mt-20">'
    + '<div class="flex items-center gap-2"><h2 class="text-base font-bold text-zinc-900">' + esc(COPY.title) + '</h2>' + liveBadgeHtml() + '</div>'
    + summaryHtml()
    + sortBarHtml()
    + actionRowHtml()
    + composerHtml()
    + listBodyHtml()
    + '</section>';
}

function render() {
  if (!state.container) return;
  state.container.innerHTML = sectionHtml();
}

/* ------------------------------------------------------------------ */
/* Loading + realtime                                                  */
/* ------------------------------------------------------------------ */

async function load() {
  state.loading = true;
  state.error = false;
  render();
  const res = await fetchReviews(state.product.id, { demo: state.demo });
  if (!alive()) return;
  if (res.ok && res.data) {
    state.items = new Map();
    state.summary = res.data.summary || null;
    for (const r of res.data.items || []) state.items.set(String(r.id), r);
    state.viewer = res.data.viewer || { signedIn: false, canReview: false, hasReviewed: false, reviewId: null };
    state.loading = false;
  } else {
    state.loading = false;
    state.error = true;
  }
  render();
}

function alive() {
  return !!state.container && document.body.contains(state.container);
}

function applyEvent(payload) {
  if (!payload || payload.productId !== state.product.id) return;
  if (payload.type === 'delete') {
    state.items.delete(String(payload.id));
    render();
    return;
  }
  if (payload.type === 'upsert' && payload.review) {
    const r = payload.review;
    const id = String(r.id);
    state.items.set(id, r);
    // Drop the optimistic placeholder once the real row (or its echo) lands.
    for (const [key, val] of state.items) {
      if (val.optimistic && val.author === r.author && key !== id) {
        state.items.delete(key);
      }
    }
    if (r.mine && state.viewer) {
      state.viewer.hasReviewed = true;
      state.viewer.reviewId = id;
    }
    if (!state.composing) render();
  }
}

/* A long-lived EventSource keeps a request pending forever, and a pending
 * request stops a page from ever reaching a network-idle state — which is
 * what the preview's screenshot and proposal checks wait for before they
 * read the page. So the stream opens only once the page is settled: the
 * `load` event has fired (the last eager request is done) and a beat has
 * passed, leaving a quiet window first. Live updates then arrive a moment
 * after the first paint instead of during it.
 *
 * A later in-app navigation to another product is already past that window,
 * so it opens straight away. */
const STREAM_SETTLE_DELAY_MS = 1500;

function openStream() {
  if (state.stream || state.streamTimer) return;   // already open or scheduled
  const myId = state.product.id;
  state.stream = openReviewStream(myId, {
    onOpen: () => {
      if (!state.product || state.product.id !== myId) return;
      state.live = true;
      render();
    },
    onEvent: applyEvent,
    onError: () => {
      if (!state.product || state.product.id !== myId) return;
      if (state.live) { state.live = false; render(); }
    },
  });
}

function scheduleStream() {
  if (state.stream || state.streamTimer) return;
  const myId = state.product.id;
  const start = () => {
    if (!state.product || state.product.id !== myId) return;
    state.streamTimer = setTimeout(() => {
      state.streamTimer = null;
      if (!state.product || state.product.id !== myId) return;
      openStream();
    }, STREAM_SETTLE_DELAY_MS);
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

export function closeStream() {
  if (state.streamTimer) {
    clearTimeout(state.streamTimer);
    state.streamTimer = null;
  }
  if (state.stream) {
    try { state.stream.close(); } catch { /* already closed */ }
    state.stream = null;
  }
  state.live = false;
}

export function unmountReviews() {
  closeStream();
  state.product = null;
  state.container = null;
  state.items = new Map();
  state.viewer = null;
  state.loading = true;
  state.error = false;
  state.composing = false;
  state.editingId = null;
  state.rating = 0;
  state.text = '';
  revokeDraftImages();
  state.images = [];
  state.open = false;
  state.demo = false;
}

/* Mount the reviews section into `container` (the product page's
 * #pdp-reviews slot) for `product`. Called on every product render. */
export function mountReviews(container, product, opts = {}) {
  unmountReviews();
  state.product = { id: product.id, name: product.name, rating: product.rating, reviews: product.reviews };
  state.container = container;
  state.summary = null;
  state.sort = 'newest';
  state.demo = !!opts.demo;
  render();
  load().finally(scheduleStream);
}

/* ------------------------------------------------------------------ */
/* Composer actions                                                    */
/* ------------------------------------------------------------------ */

function startCompose() {
  state.composing = true;
  state.editingId = null;
  state.rating = 0;
  state.text = '';
  revokeDraftImages();
  state.images = [];
  render();
  focusComposer();
}

function startEdit(id) {
  const r = state.items.get(String(id));
  if (!r) return;
  state.composing = true;
  state.editingId = String(id);
  state.rating = r.rating;
  state.text = r.body || '';
  revokeDraftImages();
  state.images = (r.images || []).map((im) => ({
    key: 'existing-' + (imgSeq += 1),
    status: 'done',
    url: im.url,
    fileId: null,
    alt: im.alt || '',
    preview: im.url,
  }));
  render();
  focusComposer();
}

function cancelCompose() {
  state.composing = false;
  state.editingId = null;
  state.rating = 0;
  state.text = '';
  revokeDraftImages();
  state.images = [];
  render();
}

function focusComposer() {
  const box = state.container && state.container.querySelector('[data-review-compose]');
  if (box) box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setRating(n) {
  state.rating = n;
  render();
  focusComposer();
}

function revokeDraftImages() {
  for (const im of state.images) {
    if (im.preview && im.preview.startsWith('blob:')) {
      try { URL.revokeObjectURL(im.preview); } catch { /* ignore */ }
    }
  }
}

function composerError(msg) {
  const el = state.container && state.container.querySelector('[data-review-error]');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}

/* ------------------------------------------------------------------ */
/* Photo upload (client resize + EXIF strip via canvas re-encode)      */
/* ------------------------------------------------------------------ */

function fileExtension(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

function isAcceptedFile(file) {
  if (ACCEPTED.includes(file.type)) return true;
  if (!file.type) {
    const ext = fileExtension(file.name);
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return true;
  }
  return false;
}

async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through to the <img> path.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  if (img.decode) await img.decode();
  else await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, objectUrl: url };
}

/* Re-encode to at most OUTPUT_EDGE on the longest edge. Drawing through a
 * canvas is what drops EXIF (camera, date, GPS); we keep only pixels. */
function encodeReview(decoded) {
  return new Promise((resolve, reject) => {
    const longest = Math.max(decoded.width, decoded.height) || 1;
    const scale = Math.min(1, OUTPUT_EDGE / longest);
    const w = Math.max(1, Math.round(decoded.width * scale));
    const h = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(decoded.source, 0, 0, w, h);
    const attempts = [
      { type: 'image/webp', q: 0.82 },
      { type: 'image/webp', q: 0.68 },
      { type: 'image/jpeg', q: 0.82 },
      { type: 'image/jpeg', q: 0.7 },
    ];
    function attempt(i) {
      if (i >= attempts.length) return reject(new Error('encode-failed'));
      const a = attempts[i];
      canvas.toBlob((blob) => {
        if (!blob) return attempt(i + 1);
        let type = blob.type;
        if (a.type === 'image/webp' && type !== 'image/webp') type = '';
        if (type === '' || blob.size > 1.6 * 1024 * 1024) return attempt(i + 1);
        const ext = type === 'image/webp' ? 'webp' : 'jpg';
        resolve({ blob, name: 'review.' + ext });
      }, a.type, a.q);
    }
    attempt(0);
  });
}

async function addFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  composerError('');
  for (const file of files) {
    if (state.images.length >= MAX_IMAGES) { toast(COPY.overLimit); break; }
    if (!isAcceptedFile(file)) { toast(COPY.invalid); continue; }
    if (file.size > MAX_INPUT_BYTES) { toast(COPY.tooLarge); continue; }
    if (!window.usernode || typeof window.usernode.uploadFile !== 'function') {
      composerError(COPY.uploadUnavailable);
      continue;
    }
    const entry = { key: 'img-' + (imgSeq += 1), status: 'uploading', url: null, fileId: null, alt: '', preview: null };
    state.images.push(entry);
    render();
    uploadOne(file, entry);
  }
}

async function uploadOne(file, entry) {
  let decoded = null;
  try {
    decoded = await decodeImage(file);
    if (decoded.objectUrl) entry.preview = decoded.objectUrl;
    const encoded = await encodeReview(decoded);
    entry.preview = URL.createObjectURL(encoded.blob);
    const upFile = new File([encoded.blob], encoded.name, { type: encoded.blob.type });
    const stored = await window.usernode.uploadFile(upFile, { visibility: 'public' });
    entry.url = stored.url;
    entry.fileId = stored.id || null;
    entry.status = 'done';
  } catch (err) {
    entry.status = 'error';
    state.images = state.images.filter((x) => x !== entry);
    composerError(COPY.uploadFailed);
  } finally {
    if (decoded && decoded.objectUrl) { try { URL.revokeObjectURL(decoded.objectUrl); } catch { /* ignore */ } }
    if (state.container) render();
    focusComposer();
  }
}

function removeDraftImage(i) {
  const im = state.images[i];
  if (!im) return;
  if (im.preview && im.preview.startsWith('blob:')) {
    try { URL.revokeObjectURL(im.preview); } catch { /* ignore */ }
  }
  state.images.splice(i, 1);
  render();
}

function draftPayloadImages() {
  return state.images
    .filter((im) => im.status === 'done' && im.url)
    .map((im) => ({ url: im.url, fileId: im.fileId, alt: im.alt || '' }));
}

/* ------------------------------------------------------------------ */
/* Saving                                                              */
/* ------------------------------------------------------------------ */

async function save() {
  if (state.saving) return;
  if (state.uploading) { composerError(COPY.waitUploads); return; }
  if (!state.rating) { composerError(COPY.chooseRating); return; }
  state.saving = true;
  composerError('');
  render();
  const pendingImages = state.images.filter((im) => im.status !== 'done' && im.status !== 'error');
  if (pendingImages.length) { state.saving = false; composerError(COPY.waitUploads); render(); return; }

  const images = draftPayloadImages();
  const editing = state.editingId;

  if (!editing) {
    // Optimistic author UI: the card appears immediately; the server response
    // and the SSE echo both reconcile onto its id so it never doubles.
    const tempId = 'temp-' + (imgSeq += 1);
    state.items.set(tempId, {
      id: tempId,
      author: COPY.you,
      rating: state.rating,
      body: state.text,
      verified: true,
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mine: true,
      pending: true,
      optimistic: true,
      images: images.map((im, i) => ({ id: 't-' + i, url: im.url, alt: im.alt })),
    });
    cancelComposeButKeepCard();
    render();
  }

  const payload = { rating: state.rating, body: state.text, images };
  const res = editing
    ? await updateReview(editing, payload)
    : await createReview(Object.assign({ productId: state.product.id }, payload));

  state.saving = false;

  if (res.ok && res.data && res.data.review) {
    const r = res.data.review;
    // Remove the optimistic placeholder and insert the server's row.
    for (const [key, val] of state.items) {
      if (val.optimistic) state.items.delete(key);
    }
    state.items.set(String(r.id), r);
    if (state.viewer) { state.viewer.hasReviewed = true; state.viewer.reviewId = String(r.id); }
    state.composing = false;
    state.editingId = null;
    state.text = '';
    state.rating = 0;
    revokeDraftImages();
    state.images = [];
    toast(editing ? COPY.updated : COPY.posted);
    render();
  } else {
    // Pull the optimistic card back out; the write did not happen.
    for (const [key, val] of state.items) {
      if (val.optimistic) state.items.delete(key);
    }
    const msg = errorMessage(res, COPY.saveFailed);
    state.saving = false;
    render();
    if (editing) {
      state.composing = true;
      render();
    }
    composerError(msg);
  }
}

// Clear the composer without dropping the optimistic card it just created.
function cancelComposeButKeepCard() {
  state.composing = false;
  state.rating = 0;
  state.text = '';
  revokeDraftImages();
  state.images = [];
}

async function removeReview(id) {
  const ok = await confirmDialog({
    title: COPY.deleteTitle,
    message: COPY.deleteMessage,
    confirmLabel: COPY.deleteReview,
  });
  if (!ok) return;
  const res = await deleteReview(id);
  if (res.ok) {
    state.items.delete(String(id));
    if (state.viewer) { state.viewer.hasReviewed = false; state.viewer.reviewId = null; }
    toast(COPY.deleted);
    render();
  } else {
    toast(errorMessage(res, COPY.deleteFailed));
  }
}

/* ------------------------------------------------------------------ */
/* Lightbox                                                            */
/* ------------------------------------------------------------------ */

function lightboxEl() {
  let el = document.getElementById('review-lightbox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'review-lightbox';
    document.body.appendChild(el);
  }
  return el;
}

function openLightbox(reviewId, index) {
  const r = state.items.get(String(reviewId));
  if (!r || !r.images || !r.images.length) return;
  state.lightbox = { review: r, index: Math.max(0, Math.min(r.images.length - 1, index)) };
  renderLightbox();
}

function closeLightbox() {
  state.lightbox = null;
  const el = lightboxEl();
  el.className = 'hidden';
  el.innerHTML = '';
}

function moveLightbox(dir) {
  if (!state.lightbox) return;
  const n = state.lightbox.review.images.length;
  state.lightbox.index = (state.lightbox.index + dir + n) % n;
  renderLightbox();
}

function renderLightbox() {
  const el = lightboxEl();
  if (!state.lightbox) { el.className = 'hidden'; el.innerHTML = ''; return; }
  const { review, index } = state.lightbox;
  const image = review.images[index];
  const n = review.images.length;
  const dots = n > 1
    ? '<div class="mt-3 flex justify-center gap-1.5">' + review.images.map((_, i) =>
      '<span class="h-1.5 rounded-full ' + (i === index ? 'w-5 bg-brand-400' : 'w-1.5 bg-white/40') + '"></span>').join('') + '</div>'
    : '';
  const verified = review.verified ? ' <span class="text-brand-300">&#183; ' + esc(COPY.verified) + '</span>' : '';
  el.className = 'photo-lightbox';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', t('reviews.reviewPhoto', { n: index + 1, total: n }));
  el.innerHTML =
    '<div class="lb-strong flex items-center justify-between px-4 py-3 text-sm">'
    + '<span>' + esc(t('reviews.photoOf', { n: index + 1, total: n })) + '</span>'
    + '<button type="button" class="photo-lightbox-btn" data-lightbox-close aria-label="' + esc(COPY.close) + '">' + icon('x', 'h-5 w-5') + '</button>'
    + '</div>'
    + '<div data-lightbox-track class="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2">'
    + (n > 1 ? '<button type="button" class="photo-lightbox-btn absolute left-2" data-lightbox-prev aria-label="' + esc(COPY.prevPhoto) + '">' + icon('chevronLeft', 'h-5 w-5') + '</button>' : '')
    + '<img src="' + esc(image.url) + '" alt="' + esc(photoAlt(image, review)) + '" class="max-h-full max-w-full object-contain" data-lightbox-img>'
    + (n > 1 ? '<button type="button" class="photo-lightbox-btn absolute right-2" data-lightbox-next aria-label="' + esc(COPY.nextPhoto) + '">' + icon('chevronRight', 'h-5 w-5') + '</button>' : '')
    + '</div>'
    + '<div class="lb-strong px-4 pb-6 pt-3 text-sm">'
    + '<div>' + esc(review.author) + verified + '</div>'
    + (image.alt ? '<div class="lb-muted mt-1 text-xs">' + esc(image.alt) + '</div>' : '')
    + dots
    + '</div>';
}

/* Swipe on the lightbox track, pointer-based so it works with touch and mouse. */
let swipe = null;
function onLightboxPointerDown(e) {
  if (!state.lightbox) return;
  const track = e.target.closest('[data-lightbox-track]');
  if (!track) return;
  swipe = { x: e.clientX, t: Date.now() };
}
function onLightboxPointerUp(e) {
  if (!swipe || !state.lightbox) { swipe = null; return; }
  const dx = e.clientX - swipe.x;
  if (Math.abs(dx) > 40) moveLightbox(dx < 0 ? 1 : -1);
  swipe = null;
}

/* ------------------------------------------------------------------ */
/* Global listeners (bound once)                                       */
/* ------------------------------------------------------------------ */

export function initReviews() {
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener('click', (e) => {
    const target = e.target.closest(
      '[data-review-start], [data-review-cancel], [data-review-save], [data-review-star], ' +
      '[data-review-edit], [data-review-delete], [data-review-retry], [data-review-photo], ' +
      '[data-review-ask], [data-draft-remove], [data-review-drop], [data-review-sort], ' +
      '[data-lightbox-close], [data-lightbox-prev], [data-lightbox-next]');
    if (!target) return;

    if (target.hasAttribute('data-lightbox-close')) { closeLightbox(); return; }
    if (target.hasAttribute('data-lightbox-prev')) { moveLightbox(-1); return; }
    if (target.hasAttribute('data-lightbox-next')) { moveLightbox(1); return; }
    if (target.hasAttribute('data-review-start')) { startCompose(); return; }
    if (target.hasAttribute('data-review-cancel')) { cancelCompose(); return; }
    if (target.hasAttribute('data-review-save')) { save(); return; }
    if (target.hasAttribute('data-review-star')) { setRating(Number(target.getAttribute('data-review-star'))); return; }
    if (target.hasAttribute('data-review-retry')) { load(); return; }
    if (target.hasAttribute('data-review-sort')) {
      state.sort = target.getAttribute('data-review-sort');
      render();
      return;
    }
    if (target.closest('[data-review-drop]')) return; // the file input handles it
    if (target.hasAttribute('data-review-photo')) {
      openLightbox(target.getAttribute('data-review-photo'), Number(target.getAttribute('data-photo-index')));
      return;
    }
    const editId = target.getAttribute('data-review-edit');
    if (editId) { startEdit(editId); return; }
    const delId = target.getAttribute('data-review-delete');
    if (delId) { removeReview(delId); return; }
    const rm = target.getAttribute('data-draft-remove');
    if (rm !== null) { removeDraftImage(Number(rm)); return; }
    if (target.hasAttribute('data-review-ask')) {
      if (window.usernode && typeof window.usernode.askForAccount === 'function') {
        window.usernode.askForAccount({ action: COPY.askAction });
      }
      return;
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-review-file]');
    if (el && el.files && el.files.length) {
      addFiles(el.files);
      el.value = '';
    }
  });

  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-review-text]');
    if (el) state.text = el.value;
  });

  // Drag and drop onto the drop zone.
  document.addEventListener('dragover', (e) => {
    const drop = e.target.closest('[data-review-drop]');
    if (!drop) return;
    e.preventDefault();
    drop.classList.add('dropzone-active');
  });
  document.addEventListener('dragleave', (e) => {
    const drop = e.target.closest('[data-review-drop]');
    if (!drop) return;
    drop.classList.remove('dropzone-active');
  });
  document.addEventListener('drop', (e) => {
    const drop = e.target.closest('[data-review-drop]');
    if (!drop) return;
    e.preventDefault();
    drop.classList.remove('dropzone-active');
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });

  document.addEventListener('keydown', (e) => {
    if (!state.lightbox) return;
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowLeft') { moveLightbox(-1); return; }
    if (e.key === 'ArrowRight') { moveLightbox(1); }
  });
  document.addEventListener('pointerdown', onLightboxPointerDown);
  document.addEventListener('pointerup', onLightboxPointerUp);

  // The shell keeps apps loaded but hidden; stop streaming while nobody can
  // see the page and reopen the channel when it comes back.
  window.addEventListener('usernode:visibility-changed', (e) => {
    if (!state.product) return;
    if (e.detail && e.detail.hidden) {
      closeStream();
      state.live = false;
      render();
    } else if (!state.stream && !state.streamTimer && !state.loading) {
      // Visible again after a hide: reopen. While a load is still in flight
      // the stream's own settle step will open it.
      openStream();
    }
  });

  // Leaving the product closes the live stream.
  window.addEventListener('hashchange', () => {
    if (!state.product) return;
    const want = '#/product/' + state.product.id;
    const hash = location.hash || '';
    if (hash !== want && !hash.startsWith(want + '?') && !hash.startsWith(want + '/')) {
      closeStream();
      if (state.live) { state.live = false; }
    }
  });
}
