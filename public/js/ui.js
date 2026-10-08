/* Shared UI pieces: formatting helpers, toast, product cards, badges,
 * skeletons and empty states. Rendered as HTML strings; behavior is wired
 * with data-* attributes and event delegation in app.js, so cards never
 * carry their own listeners.
 */

import { icon, productArt, productPlaceholder, sizedImage } from './icons.js';
import { discountPct } from './data.js';
import { store } from './store.js';
import { t, has, intlLocale } from './i18n.js';

/* ---------------------------------------------------------------------------
 * Product photos for the generated marketplace catalog.
 *
 * Those photos live on Pexels' CDN, which resizes on request, so each surface
 * asks for the size it shows (card 480, thumbnail 160, gallery 900, zoom
 * 1800) instead of downloading the 940px original everywhere. Any other URL
 * (a committed photo, a data URI) is returned unchanged.
 * ------------------------------------------------------------------------- */
export { sizedImage };

/* A photo that failed to load: drop the broken <img> and the shimmer, and
 * show the neutral placeholder in the same fixed box. This is the ONLY time
 * the fallback appears; while loading, the shimmer shows instead. */
window.unImgFail = function (img) {
  const holder = img.parentElement;
  if (!holder) return;
  const alt = img.getAttribute('alt') || t('ui.product');
  img.remove();
  const shimmer = holder.querySelector('[data-img-shimmer]');
  if (shimmer) shimmer.remove();
  if (!holder.querySelector('[data-img-fallback]')) {
    holder.insertAdjacentHTML('beforeend', '<div data-img-fallback class="absolute inset-0 bg-zinc-100">'
      + productPlaceholder({ name: alt }, 'absolute inset-0 h-full w-full text-zinc-300') + '</div>');
  }
};

window.unImgLoaded = function (img) {
  const shimmer = img.parentElement && img.parentElement.querySelector('[data-img-shimmer]');
  if (shimmer) shimmer.remove();
};

/* One photo in a fixed-aspect box: a pulsing placeholder while it loads, the
 * photo once it has, the fallback only if it fails. `opts.w` is the pixel
 * width to request, `opts.eager` skips lazy loading (the detail page's main
 * photo), `opts.cls` adds classes to the <img> (e.g. the zoom transition). */
export function photoHtml(url, alt, opts = {}) {
  const w = opts.w || 480;
  return '<div data-img-shimmer class="absolute inset-0 animate-pulse bg-zinc-100"></div>'
    + '<img src="' + esc(sizedImage(url, w)) + '" alt="' + esc(alt) + '" width="' + w + '" height="' + w + '"'
    + (opts.eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async" data-product-image'
    + ' class="product-img absolute inset-0 h-full w-full ' + (opts.fit === 'contain' ? 'object-contain' : 'object-cover') + (opts.cls ? ' ' + opts.cls : '') + '"'
    + ' onload="unImgLoaded(this)" onerror="unImgFail(this)">';
}


/* "$12.99" from integer cents, in the selected locale. The currency stays USD
 * (the stored amounts are integer cents), so only the formatting changes. */
export function fmtPrice(cents) {
  try {
    return numberFormat({ style: 'currency', currency: 'USD' }).format(cents / 100);
  } catch {
    return '$' + (cents / 100).toFixed(2);
  }
}

/* 12040 -> "12k", 980 -> "980". Below 1000 the digits are grouped by the
 * locale (1.234); above it the compact "k" form stays as the visual budget. */
export function fmtCount(n) {
  if (n >= 1000) {
    const k = n / 1000;
    const v = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    let text = String(v);
    try { text = new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 1 }).format(v); } catch { /* keep plain */ }
    return t('ui.thousands', { n: text });
  }
  return numberFormat({ useGrouping: true, maximumFractionDigits: 0 }).format(n);
}

/* Localized display names for the fixed category / subcategory vocabulary
 * (the data tables keep ids and English names; the shown name comes from
 * the dictionary by id, falling back to the table's own name). */
export function categoryName(c) {
  if (!c) return '';
  const key = 'ui.cat.' + c.id;
  return has(key) ? t(key) : (c.name || '');
}

export function subcategoryLabel(s) {
  if (!s) return '';
  if (!s.id) return t('ui.sub.all');
  const key = 'ui.sub.' + s.id;
  return has(key) ? t(key) : (s.name || '');
}

/* "Oct 2" within the current year, "Oct 2, 2025" otherwise. */
export function fmtDate(ts) {
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(intlLocale(), sameYear
    ? { month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' });
}

/* Escape a user-typed string for use inside HTML text and attribute values. */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* Confirmation dialog. Uses the platform kit's alert when present (the same
 * pattern as the cart's remove confirmation); falls back to window.confirm
 * in standalone local runs. Resolves true only when the destructive button
 * was pressed. */
export function confirmDialog({ title, message, confirmLabel }) {
  if (confirmLabel === undefined) confirmLabel = t('ui.confirm');
  if (window.unNative && typeof window.unNative.alert === 'function') {
    return window.unNative.alert({
      title,
      message,
      buttons: [
        { label: t('ui.cancel'), style: 'cancel' },
        { label: confirmLabel, style: 'destructive' },
      ],
    }).then((r) => !!(r && r.button && r.button.style === 'destructive'));
  }
  return Promise.resolve(window.confirm(title + '\n\n' + message));
}

/* "Tue, Oct 6" from a Date (used for checkout delivery estimates). */
export function fmtEtaDate(d) {
  return d.toLocaleDateString(intlLocale(), { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ---------------------------------------------------------------------------
 * Circular avatar. Renders the user's photo when one is set, and the letter
 * placeholder otherwise (the fallback shows through if the image fails to
 * load). `badge` adds the camera chip that marks the avatar as editable;
 * `loading` dims it with a spinner during upload. Both the Profile card and
 * the Edit Profile screen render through this one helper, so the avatar is
 * defined once and its markup stays identical wherever it appears.
 * ------------------------------------------------------------------------- */
export function avatarHtml({
  url = null,
  name = null,
  size = 'h-14 w-14',
  textSize = 'text-lg',
  badge = false,
  loading = false,
  alt = t('ui.profilePhoto'),
} = {}) {
  const initial = name ? String(name)[0].toUpperCase() : 'G';
  const fallback = '<span data-avatar-fallback class="flex h-full w-full items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700 '
    + textSize + '">' + esc(initial) + '</span>';
  const img = url
    ? '<img data-avatar-img src="' + esc(url) + '" alt="' + esc(alt)
      + '" class="absolute inset-0 h-full w-full rounded-full object-cover" onerror="this.remove()">'
    : '';
  const spinner = loading
    ? '<span class="absolute inset-0 flex items-center justify-center rounded-full bg-zinc-900/50 text-white">'
      + icon('loader', 'h-5 w-5 animate-spin') + '</span>'
    : '';
  const badgeHtml = badge
    ? '<span class="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white ring-2 ring-white" aria-hidden="true">'
      + icon('camera', 'h-3 w-3') + '</span>'
    : '';

  return '<span data-avatar class="relative inline-flex shrink-0 ' + size + ' rounded-full">'
    + fallback + img + spinner + badgeHtml
    + '</span>';
}

/* ---------------------------------------------------------------------------
 * Star row. Five outline stars, filled proportionally to the rating via a
 * clipped overlay. Amber is the ratings color per the design system.
 * ------------------------------------------------------------------------- */
export function starRow(rating, cls = 'h-3.5 w-3.5') {
  const five = Array.from({ length: 5 }, () => icon('star', cls)).join('');
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return '<span class="relative inline-flex shrink-0" role="img" aria-label="' + esc(t('ui.rated', { rating })) + '">'
    + '<span class="flex text-zinc-200">' + five + '</span>'
    + '<span class="absolute inset-0 flex overflow-hidden text-amber-400" style="width:' + pct + '%">' + five + '</span>'
    + '</span>';
}

/* ---------------------------------------------------------------------------
 * Toast. Uses the platform's native kit when it is present (it is safe-area
 * aware and singleton); falls back to a minimal fixed pill otherwise, e.g.
 * standalone local runs where the hosted assets are unreachable.
 * ------------------------------------------------------------------------- */
let toastTimer;
export function toast(message) {
  if (window.unNative && typeof window.unNative.toast === 'function') {
    window.unNative.toast(message);
    return;
  }
  let el = document.getElementById('fallback-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fallback-toast';
    el.setAttribute('role', 'status');
    el.className = 'fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white opacity-0 shadow-card-lg transition-opacity duration-200';
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 1800);
}

/* ---------------------------------------------------------------------------
 * Product card. `opts.compact` narrows the layout for the flash-sale row and
 * swaps the plain sold count for a sold-progress bar. Tapping anywhere on the
 * card (except the favorite/add buttons) opens the product detail page; sold
 * out items show a badge and a disabled add button.
 * ------------------------------------------------------------------------- */
export function productCard(p, opts = {}) {
  const disc = discountPct(p);
  const fav = store.isFavorite(p.id);
  const heart = icon(fav ? 'heartFilled' : 'heart', 'h-4 w-4');

  const soldBlock = opts.compact
    ? '<div class="mt-1.5"><div class="h-1.5 w-full overflow-hidden rounded-full bg-rose-100"><div class="h-full rounded-full bg-rose-500" style="width:' + (p.pct || 0) + '%"></div></div>'
      + '<div class="mt-1 text-[11px] font-medium text-zinc-500">' + esc(t('ui.sold', { n: fmtCount(p.sold) })) + '</div></div>'
    : '<span class="text-xs text-zinc-500">' + esc(t('ui.sold', { n: fmtCount(p.sold) })) + '</span>';

  // Card art. A committed product photo (p.image) layers over the generated
  // illustration, which paints instantly behind it as the fallback: if the
  // photo is missing or fails to load (onerror removes it) the illustration
  // shows through instead of a broken-image icon. A product with no photo
  // renders the illustration alone, exactly as before. p.imageFit 'contain'
  // letterboxes a photo whose shape cropping would ruin. The photo sits
  // inside the existing hover-scale wrapper, so hover zoom and the sold-out
  // dim still apply to it; the badge and heart button stay later siblings.
  // The card shows the product's FIRST image from the shared `images` array —
  // the very value the detail gallery opens on — so the two surfaces can never
  // disagree. `p.image` is kept as a fallback for a record that predates the
  // array. The generated illustration stays behind it as the instant first
  // paint and the failure fallback.
  const photo = (p.images && p.images.length) ? p.images[0] : p.image;
  // Generated marketplace products have no illustration: their box shows a
  // shimmer while the photo loads and the neutral placeholder only if it
  // fails (photoHtml). A product with no photo at all gets the placeholder.
  const art = '<div class="relative h-full w-full transition-transform duration-300 group-hover:scale-[1.03]' + (p.oos ? ' opacity-60' : '') + '">'
    + (p.art
      ? productArt(p)
        + (photo
          ? '<img src="' + esc(photo) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" data-product-image'
            + ' class="product-img absolute inset-0 h-full w-full ' + (p.imageFit === 'contain' ? 'object-contain' : 'object-cover') + '" onerror="this.remove()">'
          : '')
      : (photo
        ? photoHtml(photo, p.name, { w: 480, fit: p.imageFit })
        : '<div class="absolute inset-0 bg-zinc-100">' + productPlaceholder(p, 'absolute inset-0 h-full w-full text-zinc-300') + '</div>'))
    + '</div>';

  return '<article class="card product-card group flex cursor-pointer flex-col overflow-hidden" data-product="' + p.id + '">'
    + '<div class="relative aspect-square overflow-hidden rounded-t-xl">'
    // Sold-out items keep their illustration but render muted (~60%) so the
    // status reads at a glance; only the card art dims — cart, order and
    // product-page art stays full color.
    + art
    + (disc ? '<span class="badge-sale absolute left-2 top-2">-' + disc + '%</span>' : '')
    + (p.oos ? '<span class="badge absolute bottom-2 left-2 bg-zinc-900/80 text-white">' + esc(t('ui.soldOut')) + '</span>' : '')
    + '<button type="button" data-fav="' + p.id + '" aria-label="' + esc(t('ui.toggleFavorite')) + '" aria-pressed="' + fav
    + '" class="fav-btn absolute right-2 top-2' + (fav ? ' fav-btn-on' : '') + '">' + heart + '</button>'
    + '</div>'
    + '<div class="flex flex-1 flex-col p-3">'
    + '<h3 class="line-clamp-2 text-sm font-medium leading-snug text-zinc-800">' + p.name + '</h3>'
    + '<div class="mt-1.5 flex items-center gap-1 text-xs text-zinc-500">'
    + '<span class="text-amber-400">' + icon('star', 'h-3.5 w-3.5') + '</span>'
    + '<span class="font-semibold text-zinc-700">' + p.rating.toFixed(1) + '</span>'
    + '<span>(' + fmtCount(p.reviews) + ')</span>'
    + (opts.compact ? '' : soldBlock)
    + '</div>'
    + (opts.compact ? soldBlock : '')
    // Where the item ships from. A quiet map-pin line under the rating row,
    // so the shopper can see at a glance which city a filtered list is from.
    + (p.location && p.location.city
      ? '<div class="mt-1 flex items-center gap-1 text-xs text-zinc-500" data-card-city>'
        + icon('mapPin', 'h-3 w-3') + esc(p.location.city) + '</div>'
      : '')
    + '<div class="mt-auto flex items-end justify-between gap-2 pt-2">'
    + '<div class="min-w-0">'
    + '<div class="text-base font-bold tabular-nums text-zinc-900">' + fmtPrice(p.price) + '</div>'
    + (p.orig ? '<div class="text-xs tabular-nums text-zinc-400 line-through">' + fmtPrice(p.orig) + '</div>' : '')
    + '</div>'
    + (p.oos
      ? '<button type="button" disabled aria-label="' + esc(t('ui.soldOut')) + '" class="add-btn cursor-not-allowed bg-zinc-300">' + icon('x', 'h-4 w-4') + '</button>'
      : '<button type="button" data-add="' + p.id + '" aria-label="' + esc(t('ui.addToCart')) + '" class="add-btn">' + icon('plus', 'h-4 w-4') + '<span class="hidden lg:inline">' + esc(t('ui.add')) + '</span></button>')
    + '</div>'
    + '</div>'
    + '</article>';
}

/* Placeholder card shown while mock data "loads" on boot. */
export function skeletonCard(compact = false) {
  return '<div class="card overflow-hidden" aria-hidden="true">'
    + '<div class="aspect-square animate-pulse bg-zinc-100"></div>'
    + '<div class="space-y-2 p-3">'
    + '<div class="h-3.5 w-4/5 animate-pulse rounded bg-zinc-100"></div>'
    + '<div class="h-3 w-2/5 animate-pulse rounded bg-zinc-100"></div>'
    + '<div class="h-5 w-1/2 animate-pulse rounded bg-zinc-100"></div>'
    + '</div></div>';
}

export function skeletonBanner() {
  return '<div class="h-40 w-[86%] shrink-0 snap-center animate-pulse rounded-2xl bg-zinc-100 sm:w-96 sm:shrink-0" aria-hidden="true"></div>';
}

export function skeletonCategoryTile() {
  return '<div class="card flex flex-col items-center gap-2 p-3" aria-hidden="true">'
    + '<div class="h-11 w-11 animate-pulse rounded-full bg-zinc-100"></div>'
    + '<div class="h-3 w-10 animate-pulse rounded bg-zinc-100"></div></div>';
}

/* Empty state: icon in a tinted circle, one-line title, one-line body and an
 * optional action button. */
export function emptyState({ icon: iconName, title, body, actionLabel, actionAttr = '' }) {
  return '<div class="flex flex-col items-center gap-3 px-6 py-12 text-center">'
    + '<span class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">' + icon(iconName, 'h-8 w-8') + '</span>'
    + '<h3 class="text-base font-semibold text-zinc-900">' + title + '</h3>'
    + '<p class="max-w-xs text-sm text-zinc-500">' + body + '</p>'
    + (actionLabel ? '<button type="button" class="btn-primary btn-sm mt-1" ' + actionAttr + '>' + actionLabel + '</button>' : '')
    + '</div>';
}
