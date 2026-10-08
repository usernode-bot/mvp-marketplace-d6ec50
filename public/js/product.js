/* Product detail page.
 *
 * One route (#/product/<id>) renders the gallery, variant pickers, seller,
 * reviews and related products. Per-product state (selected color, size,
 * quantity, gallery view) is module-local and reset on every navigation, so
 * each visit starts from the first variant. Cart writes go through store.js
 * with the chosen variant; Buy Now adds to the cart and jumps straight to it
 * (checkout itself is a later phase).
 */

import { icon, productArtView, productPlaceholder } from './icons.js';
import { fetchProduct, fetchProducts } from './api.js';
import {
  SELLERS,
  discountPct,
  productById,
  registerProducts,
  PRODUCTS,
  colorName,
  score,
  shippingFor,
  specsFor,
} from './data.js';
import { store } from './store.js';
import { emptyState, esc, fmtCount, fmtPrice, photoHtml, productCard, sizedImage, skeletonCard, starRow, toast } from './ui.js';
import { goToHash } from './router.js';
import { has, t } from './i18n.js';
import { initReviews, mountReviews } from './reviews.js';


let p = null;
let st = { qty: 1, color: '', size: '', view: 0, zoom: false, opts: {} };
let pendingId = null;

/* ------------------------------------------------------------------ */
/* Sections                                                             */
/* ------------------------------------------------------------------ */

function galleryImages() {
  // The product's real photo list: a selected colour's images when it has
  // its own, otherwise the default list. An empty list means "no photo".
  if (st.color && p.variantImages && p.variantImages[st.color] && p.variantImages[st.color].length) {
    return p.variantImages[st.color];
  }
  return Array.isArray(p.images) ? p.images : [];
}

/* One gallery photo. The neutral placeholder is drawn behind the image: it is
 * hidden the moment the photo paints (the img box is opaque) and shows through
 * only when the product has no photo, or the URL fails and the img removes
 * itself (onerror). */
function photoMain(src, i) {
  const fit = p.imageFit === 'contain' ? 'object-contain' : 'object-cover';
  // Generated marketplace products: shimmer while loading, placeholder only
  // on failure (photoHtml). The photo is zoomable (see bindZoom).
  if (p.generated) {
    return '<div class="absolute inset-0 bg-zinc-100" data-zoom-area role="button" tabindex="0" aria-pressed="false" aria-label="' + esc(t('product.zoomPhoto')) + '" style="cursor:zoom-in">'
      + (src
        ? photoHtml(src, t('product.photoAlt', { name: p.name, n: i + 1 }), { w: 900, eager: true, cls: 'pdp-zoom-img motion-safe:transition-transform motion-safe:duration-200' })
        : productPlaceholder(p, 'absolute inset-0 h-full w-full text-zinc-300'))
      + '</div>';
  }
  return '<div class="absolute inset-0 bg-zinc-100" data-zoom-area role="button" tabindex="0" aria-pressed="false" aria-label="' + esc(t('product.zoomPhoto')) + '" style="cursor:zoom-in">'
    + productPlaceholder(p, 'absolute inset-0 h-full w-full text-zinc-300')
    + (src
      ? '<img src="' + esc(src) + '" alt="' + esc(t('product.photoAlt', { name: p.name, n: i + 1 })) + '" data-product-image data-gallery-img'
        + ' class="product-img absolute inset-0 h-full w-full bg-zinc-100 ' + fit + ' pdp-zoom-img motion-safe:transition-transform motion-safe:duration-200" onerror="this.remove()">'
      : '')
    + '</div>';
}

function galleryHtml() {
  const disc = discountPct(p);
  const imgs = galleryImages();
  const n = imgs.length;
  const view = n ? st.view % n : 0;

  const dots = n > 1
    ? Array.from({ length: n }, (_, i) =>
      '<button type="button" data-img-go="' + i + '" aria-label="' + esc(t('product.photoOf', { n: i + 1, total: n }))
      + '" aria-current="' + (i === view) + '" class="h-1.5 rounded-full transition-all ' + (i === view ? 'w-5 bg-brand-600' : 'w-1.5 bg-zinc-300') + '"></button>').join('')
    : '';
  const thumbs = n > 1
    ? Array.from({ length: n }, (_, i) =>
      '<button type="button" data-img-go="' + i + '" aria-label="' + esc(t('product.showPhoto', { n: i + 1, total: n }))
      + '" class="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-zinc-100 ' + (i === view ? 'border-brand-600' : 'border-transparent') + '">'
      + (imgs[i]
        ? '<img src="' + esc(p.generated ? sizedImage(imgs[i], 160) : imgs[i]) + '" alt=""' + (p.generated ? ' loading="lazy" width="160" height="160"' : '') + ' class="product-img h-full w-full ' + (p.imageFit === 'contain' ? 'object-contain' : 'object-cover') + '" onerror="this.remove()">'
        : '')
      + '</button>').join('')
    : '';
  const fav = store.isFavorite(p.id);

  return '<div class="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">'
    + '<div id="pdp-img">' + photoMain(imgs[view], view) + '</div>'
    + (disc ? '<span class="badge-sale absolute left-3 top-3">-' + disc + '%</span>' : '')
    + (p.oos ? '<span class="badge absolute bottom-3 left-3 bg-zinc-900/80 text-white">' + esc(t('product.soldOut')) + '</span>' : '')
    + '<button type="button" data-fav="' + p.id + '" aria-label="' + esc(t('product.toggleFavorite')) + '" aria-pressed="' + fav
    + '" class="fav-btn absolute right-3 top-3' + (fav ? ' fav-btn-on' : '') + '">' + icon(fav ? 'heartFilled' : 'heart', 'h-4 w-4') + '</button>'
    + (n > 1 ? '<button type="button" data-img-prev aria-label="' + esc(t('product.prevPhoto')) + '" class="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-card md:flex">' + icon('chevronLeft', 'h-4 w-4') + '</button>' : '')
    + (n > 1 ? '<button type="button" data-img-next aria-label="' + esc(t('product.nextPhoto')) + '" class="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-card md:flex">' + icon('chevronRight', 'h-4 w-4') + '</button>' : '')
    + '</div>'
    + (dots ? '<div class="mt-3 flex justify-center gap-1.5">' + dots + '</div>' : '')
    + (thumbs ? '<div class="mt-3 hidden gap-2 md:flex">' + thumbs + '</div>' : '')
    + creditHtml(view);
}

/* Pexels asks for the photographer to be credited. One line under the
 * gallery names the photographer of the photo on show. */
function creditHtml(view) {
  const c = p.generated && Array.isArray(p.imageCredits) ? p.imageCredits[view] : null;
  if (!c || !c.photographer || !c.pexelsUrl) return '<p id="pdp-credit" class="mt-2 text-center text-[11px] text-zinc-400"></p>';
  return '<p id="pdp-credit" class="mt-2 text-center text-[11px] text-zinc-400">' + esc(t('product.photoBy')) + ' '
    + '<a href="' + esc(c.photographerUrl || c.pexelsUrl) + '" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">' + esc(c.photographer) + '</a>'
    + ' ' + esc(t('product.photoOn')) + ' <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">Pexels</a></p>';
}

/* Stock status. Generated products have a real count (p.stock); the bundled
 * catalog only knows sold out or not. */
function stockInfo() {
  if (p.oos || p.stock === 0) return { tone: 'out', text: t('product.soldOut') };
  if (typeof p.stock === 'number' && p.stock <= 9) return { tone: 'low', text: t('product.onlyLeft', { count: p.stock }) };
  return { tone: 'in', text: t('product.inStock') };
}

function stockHtml() {
  const s = stockInfo();
  const tone = s.tone === 'out' ? 'text-rose-600' : (s.tone === 'low' ? 'text-amber-600' : 'text-emerald-600');
  return '<p data-stock-status="' + s.tone + '" class="mt-3 flex items-center gap-1.5 text-sm font-semibold ' + tone + '">'
    + icon(s.tone === 'out' ? 'x' : 'check', 'h-4 w-4') + esc(s.text) + '</p>';
}

function infoHtml() {
  const ship = shippingFor(p);
  const disc = discountPct(p);
  const colors = p.colors || [];
  const sizes = p.sizes || [];

  const colorRow = colors.length
    ? '<div class="mt-4"><h2 class="text-sm font-bold text-zinc-900">' + esc(t('product.color')) + ': <span id="pdp-color-label" class="font-medium text-zinc-500">' + esc(colorName(st.color)) + '</span></h2>'
      + '<div class="mt-2 flex flex-wrap gap-2.5">'
      + colors.map((c, i) => '<button type="button" data-variant-color="' + c.name + '" aria-label="' + esc(t('product.colorOption', { name: colorName(c.name) })) + '" aria-pressed="' + (c.name === st.color)
        + '" class="h-8 w-8 rounded-full border-2 ' + (c.name === st.color ? 'border-brand-600' : 'border-transparent')
        + '" style="background-color:' + c.hex + '"></button>').join('')
      + '</div></div>'
    : '';

  // Generated products carry any number of named variant groups (Storage,
  // Color, Pack, Shade ...), each a row of option chips.
  const variantRows = (p.variants || []).map((g) =>
    '<div class="mt-4"><h2 class="text-sm font-bold text-zinc-900">' + esc(g.name) + ': <span data-variant-label="' + esc(g.name)
    + '" class="font-medium text-zinc-500">' + esc(st.opts[g.name] || '') + '</span></h2>'
    + '<div class="mt-2 flex flex-wrap gap-2">'
    + g.options.map((o) => {
      const on = st.opts[g.name] === o;
      return '<button type="button" data-variant-group="' + esc(g.name) + '" data-variant-opt="' + esc(o) + '" aria-pressed="' + on
        + '" class="h-9 min-w-11 rounded-lg border px-3 text-sm font-semibold ' + (on ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-zinc-200 bg-white text-zinc-700') + '">' + esc(o) + '</button>';
    }).join('')
    + '</div></div>').join('');

  const sizeRow = sizes.length
    ? '<div class="mt-4"><h2 class="text-sm font-bold text-zinc-900">' + esc(t('product.size')) + ': <span id="pdp-size-label" class="font-medium text-zinc-500">' + esc(st.size) + '</span></h2>'
      + '<div class="mt-2 flex flex-wrap gap-2">'
      + sizes.map((s) => '<button type="button" data-variant-size="' + s + '" aria-pressed="' + (s === st.size)
        + '" class="h-9 min-w-11 rounded-lg border px-3 text-sm font-semibold ' + (s === st.size ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-zinc-200 bg-white text-zinc-700')
        + '">' + s + '</button>').join('')
      + '</div></div>'
    : '';

  return '<h1 class="text-lg font-bold leading-snug text-zinc-900 md:text-xl">' + esc(p.name) + '</h1>'
    + '<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">'
    + starRow(p.rating)
    + '<span class="text-sm font-semibold text-zinc-700">' + p.rating.toFixed(1) + '</span>'
    + '<button type="button" data-scroll-reviews class="text-xs text-zinc-500 underline-offset-2 hover:text-brand-700 hover:underline">(' + esc(t('product.reviewsWord', { count: p.reviews, n: fmtCount(p.reviews) })) + ')</button>'
    + '<span class="text-xs text-zinc-300">|</span>'
    + '<span class="text-xs text-zinc-500">' + esc(t('product.sold', { n: fmtCount(p.sold) })) + '</span>'
    + '</div>'
    + '<div class="mt-3 flex items-end gap-2">'
    + '<span class="text-2xl font-bold tabular-nums text-rose-600">' + fmtPrice(p.price) + '</span>'
    + (p.orig ? '<span class="pb-0.5 text-sm tabular-nums text-zinc-400 line-through">' + fmtPrice(p.orig) + '</span>' : '')
    + (disc ? '<span class="badge-sale mb-0.5">-' + disc + '%</span>' : '')
    + '</div>'
    + '<div class="mt-4 space-y-2.5 rounded-xl bg-zinc-50 p-3.5 text-sm text-zinc-600">'
    + '<div class="flex items-start gap-2.5">' + icon('truck', 'h-4 w-4 mt-0.5 shrink-0 text-zinc-400')
    + '<span>' + (ship.fee === 0
      ? '<span class="font-semibold text-zinc-800">' + esc(t('product.freeShipping')) + '</span> · ' + esc(t('product.arrivesIn', { eta: ship.eta }))
      : esc(t('product.shippingFee', { fee: fmtPrice(ship.fee) })) + ' · ' + esc(t('product.arrivesIn', { eta: ship.eta }))) + '</span></div>'
    + '<div class="flex items-start gap-2.5">' + icon('returns', 'h-4 w-4 mt-0.5 shrink-0 text-zinc-400') + '<span>' + esc(ship.returns) + '</span></div>'
    + '</div>'
    + stockHtml()
    + colorRow + sizeRow + variantRows
    + '<div class="mt-4 flex items-center gap-3">'
    + '<h2 class="text-sm font-bold text-zinc-900">' + esc(t('product.quantity')) + '</h2>'
    + '<div class="ml-auto flex items-center overflow-hidden rounded-lg border border-zinc-200">'
    + '<button type="button" data-qty="-1" aria-label="' + esc(t('product.decreaseQty')) + '" class="flex h-9 w-9 items-center justify-center text-zinc-600 hover:bg-zinc-50">' + icon('minus', 'h-4 w-4') + '</button>'
    + '<span id="pdp-qty" class="w-10 text-center text-sm font-bold tabular-nums text-zinc-900">1</span>'
    + '<button type="button" data-qty="1" aria-label="' + esc(t('product.increaseQty')) + '" class="flex h-9 w-9 items-center justify-center text-zinc-600 hover:bg-zinc-50">' + icon('plus', 'h-4 w-4') + '</button>'
    + '</div></div>';
}

function sellerHtml() {
  const s = SELLERS[p.brand];
  if (!s) return '';
  return '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('product.seller')) + '</h2>'
    + '<div class="card mt-3 flex flex-wrap items-center gap-3 p-4">'
    + '<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">' + icon('store', 'h-6 w-6') + '</span>'
    + '<div class="min-w-0 flex-1">'
    + '<div class="flex flex-wrap items-center gap-2"><span class="text-sm font-bold text-zinc-900">' + p.brand + '</span>'
    + '<span class="badge badge-soft">' + esc(s.badge) + '</span></div>'
    + '<div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">'
    + starRow(s.rating, 'h-3 w-3')
    + '<span class="font-semibold text-zinc-700">' + s.rating.toFixed(1) + '</span>'
    + '<span>' + esc(t('product.followers', { n: s.followers })) + '</span><span class="text-zinc-300">|</span>'
    + '<span>' + esc(t('product.responseRate', { rate: s.response })) + '</span><span class="text-zinc-300">|</span>'
    + '<span>' + esc(t('product.since', { year: s.since })) + '</span>'
    + '</div></div>'
    + '<button type="button" data-chat class="btn-outline btn-sm">' + icon('chat', 'h-4 w-4') + esc(t('product.chatSeller')) + '</button>'
    + '</div></section>';
}

function specsHtml() {
  // Two columns on wide screens, one on phones. Every row is keyed for
  // translation; an empty value is dropped by specsFor, so a non-applicable
  // field is hidden rather than shown as "N/A".
  const source = p.generated && Array.isArray(p.specs)
    ? p.specs.concat([{ k: 'product.spec.stock', l: 'Stock', v: stockInfo().text }])
    : specsFor(p);
  const rows = source.map((r) => {
    const label = r.k && has(r.k) ? t(r.k) : r.l;
    return '<div class="flex items-start gap-3 border-b border-zinc-100 px-3.5 py-2.5 text-sm">'
      + '<dt class="w-28 shrink-0 text-zinc-500 sm:w-36">' + esc(label) + '</dt>'
      + '<dd class="min-w-0 text-zinc-800">' + esc(r.v) + '</dd></div>';
  }).join('');
  return '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('product.specifications')) + '</h2>'
    + '<dl class="mt-3 overflow-hidden rounded-xl border border-zinc-100 bg-white sm:grid sm:grid-cols-2 sm:gap-x-6">'
    + rows + '</dl></section>';
}

function descriptionHtml() {
  const features = Array.isArray(p.features) && p.features.length
    ? '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('product.keyFeatures')) + '</h2>'
      + '<ul class="mt-3 grid gap-2 sm:grid-cols-2">'
      + p.features.map((f) => '<li class="flex items-start gap-2.5 text-sm text-zinc-700"><span class="mt-0.5 shrink-0 text-brand-600">' + icon('check', 'h-4 w-4') + '</span>' + esc(f) + '</li>').join('')
      + '</ul></section>'
    : '';
  return '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('product.description')) + '</h2>'
    + '<p class="mt-2 text-sm leading-relaxed text-zinc-600">' + (p.generated ? esc(p.desc) : p.desc) + '</p></section>'
    + features;
}

/* The reviews section is owned by reviews.js: it loads the real rows from
 * the server, streams live updates and renders the composer and lightbox.
 * This is just the mount point, left in the page so the rating row's
 * "scroll to reviews" link always has a target. */
function reviewsHtml() {
  return '<section id="pdp-reviews" class="mt-8 scroll-mt-20"></section>';
}

function relatedHtml() {
  // A server-only product has no bundled neighbours: its "You may also like"
  // row is filled from GET /api/products once the page is up (loadRelated).
  if (p.generated) {
    return '<section id="pdp-related" class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('product.youMayLike')) + '</h2>'
      + '<div id="pdp-related-grid" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">'
      + Array.from({ length: 4 }, () => skeletonCard()).join('') + '</div></section>';
  }
  const related = PRODUCTS
    .filter((x) => x.cat === p.cat && x.id !== p.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 8);
  const viewed = store.recentlyViewed().filter((x) => x.id !== p.id).slice(0, 4);

  let html = related.length
    ? '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('product.youMayLike')) + '</h2>'
      + '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">' + related.map((x) => productCard(x)).join('') + '</div></section>'
    : '';
  if (viewed.length) {
    html += '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('product.recentlyViewed')) + '</h2>'
      + '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">' + viewed.map((x) => productCard(x)).join('') + '</div></section>';
  }
  return html;
}

function actionBarHtml() {
  if (p.oos) {
    return '<div class="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/95 shadow-card-lg backdrop-blur" style="padding-bottom: var(--un-safe-inset-bottom, 0px)">'
      + '<div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">'
      + '<button type="button" disabled class="btn-outline flex-1 cursor-not-allowed opacity-50">' + esc(t('product.addToCart')) + '</button>'
      + '<button type="button" disabled class="btn-primary flex-1 cursor-not-allowed opacity-50">' + esc(t('product.buyNow')) + '</button>'
      + '</div></div>';
  }
  return '<div class="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/95 shadow-card-lg backdrop-blur" style="padding-bottom: var(--un-safe-inset-bottom, 0px)">'
    + '<div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">'
    + '<button type="button" data-add-cart class="btn-outline flex-1">' + icon('cart', 'h-4 w-4') + esc(t('product.addToCart')) + '</button>'
    + '<button type="button" data-buy-now class="btn-primary flex-1">' + esc(t('product.buyNow')) + '</button>'
    + '</div></div>';
}

function notFoundHtml() {
  return '<button type="button" data-back class="icon-btn -ml-2 mb-3" aria-label="' + esc(t('product.back')) + '">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + emptyState({
      icon: 'package',
      title: t('product.notFoundTitle'),
      body: t('product.notFoundBody'),
      actionLabel: t('product.backHome'),
      actionAttr: 'data-nav="home"',
    });
}

/* ------------------------------------------------------------------ */
/* Rendering + interactions                                             */
/* ------------------------------------------------------------------ */

function syncGallery() {
  const imgs = galleryImages();
  const n = imgs.length;
  if (n) st.view = ((st.view % n) + n) % n;
  else st.view = 0;
  const img = document.getElementById('pdp-img');
  st.zoom = false;
  if (img) img.innerHTML = photoMain(imgs[st.view], st.view);
  const credit = document.getElementById('pdp-credit');
  if (credit) credit.outerHTML = creditHtml(st.view);
  document.querySelectorAll('#view-product [data-img-go]').forEach((btn) => {
    const i = Number(btn.getAttribute('data-img-go'));
    const on = i === st.view;
    if (btn.classList.contains('h-1.5')) {
      btn.className = 'h-1.5 rounded-full transition-all ' + (on ? 'w-5 bg-brand-600' : 'w-1.5 bg-zinc-300');
      btn.setAttribute('aria-current', String(on));
    } else {
      btn.className = 'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-zinc-100 ' + (on ? 'border-brand-600' : 'border-transparent');
    }
  });
}

function syncQty() {
  const el = document.getElementById('pdp-qty');
  if (el) el.textContent = String(st.qty);
}

function syncVariantButtons() {
  document.querySelectorAll('#view-product [data-variant-color]').forEach((btn) => {
    const on = btn.getAttribute('data-variant-color') === st.color;
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('border-brand-600', on);
    btn.classList.toggle('border-transparent', !on);
  });
  document.querySelectorAll('#view-product [data-variant-size]').forEach((btn) => {
    const on = btn.getAttribute('data-variant-size') === st.size;
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('border-brand-600', on);
    btn.classList.toggle('bg-brand-50', on);
    btn.classList.toggle('text-brand-700', on);
    btn.classList.toggle('border-zinc-200', !on);
    btn.classList.toggle('bg-white', !on);
    btn.classList.toggle('text-zinc-700', !on);
  });
  document.querySelectorAll('#view-product [data-variant-opt]').forEach((btn) => {
    const on = st.opts[btn.getAttribute('data-variant-group')] === btn.getAttribute('data-variant-opt');
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('border-brand-600', on);
    btn.classList.toggle('bg-brand-50', on);
    btn.classList.toggle('text-brand-700', on);
    btn.classList.toggle('border-zinc-200', !on);
    btn.classList.toggle('bg-white', !on);
    btn.classList.toggle('text-zinc-700', !on);
  });
  document.querySelectorAll('#view-product [data-variant-label]').forEach((el) => {
    el.textContent = st.opts[el.getAttribute('data-variant-label')] || '';
  });
  const colorLabel = document.getElementById('pdp-color-label');
  if (colorLabel) colorLabel.textContent = colorName(st.color);
  const sizeLabel = document.getElementById('pdp-size-label');
  if (sizeLabel) sizeLabel.textContent = st.size;
}

/* Zoom. Click or Enter toggles a 2x zoom of the main photo; while zoomed the
 * photo follows the pointer so every corner can be inspected. The first zoom
 * swaps in the 1800px version of a Pexels photo, so the zoom is sharp rather
 * than an upscaled 900px image. */
function applyZoom(e) {
  const area = document.querySelector('#view-product [data-zoom-area]');
  const img = area && area.querySelector('.pdp-zoom-img');
  if (!area || !img) return;
  area.setAttribute('aria-pressed', String(st.zoom));
  area.style.cursor = st.zoom ? 'zoom-out' : 'zoom-in';
  if (!st.zoom) {
    img.style.transform = '';
    return;
  }
  if (p.generated && !img.dataset.hires) {
    img.dataset.hires = '1';
    img.src = sizedImage(galleryImages()[st.view], 1800);
  }
  const r = area.getBoundingClientRect();
  const x = e && e.clientX !== undefined ? ((e.clientX - r.left) / r.width) * 100 : 50;
  const y = e && e.clientY !== undefined ? ((e.clientY - r.top) / r.height) * 100 : 50;
  img.style.transformOrigin = Math.max(0, Math.min(100, x)) + '% ' + Math.max(0, Math.min(100, y)) + '%';
  img.style.transform = 'scale(2)';
}

/* The variant values the cart line shows. Bundled products use colour and
 * size; generated ones use their first two named groups (e.g. Storage and
 * Color), which the cart joins as "128GB · Black". */
function cartVariant() {
  const groups = p.variants || [];
  if (!groups.length) return { color: st.color, size: st.size };
  return { color: st.opts[groups[0].name] || '', size: groups[1] ? (st.opts[groups[1].name] || '') : '' };
}

function maxQty() {
  return typeof p.stock === 'number' && p.stock > 0 ? Math.min(99, p.stock) : 99;
}

function bindProductEvents() {
  const view = document.getElementById('view-product');
  view.addEventListener('click', (e) => {
    const target = e.target.closest('[data-img-go], [data-img-prev], [data-img-next], [data-variant-color], [data-variant-size], [data-variant-opt], [data-zoom-area], [data-qty], [data-add-cart], [data-buy-now], [data-chat], [data-scroll-reviews]');
    if (!target) return;

    if (target.hasAttribute('data-img-go')) {
      const n = galleryImages().length || 1;
      st.view = Number(target.getAttribute('data-img-go')) % n;
      syncGallery();
      return;
    }
    if (target.hasAttribute('data-img-prev') || target.hasAttribute('data-img-next')) {
      const dir = target.hasAttribute('data-img-next') ? 1 : -1;
      const n = galleryImages().length || 1;
      st.view = (st.view + dir + n) % n;
      syncGallery();
      return;
    }
    if (target.hasAttribute('data-zoom-area')) {
      st.zoom = !st.zoom;
      applyZoom(e);
      return;
    }
    if (target.hasAttribute('data-variant-opt')) {
      st.opts[target.getAttribute('data-variant-group')] = target.getAttribute('data-variant-opt');
      syncVariantButtons();
      return;
    }
    const color = target.getAttribute('data-variant-color');
    if (color) {
      st.color = color;
      // A colour may have its own photos; switching resets to that set's
      // first image (falling back to the product's default images).
      st.view = 0;
      syncVariantButtons();
      const gal = document.getElementById('pdp-gallery');
      if (gal) gal.innerHTML = galleryHtml();
      return;
    }
    const size = target.getAttribute('data-variant-size');
    if (size) {
      st.size = size;
      syncVariantButtons();
      return;
    }
    const qty = target.getAttribute('data-qty');
    if (qty) {
      st.qty = Math.min(maxQty(), Math.max(1, st.qty + Number(qty)));
      syncQty();
      return;
    }

    if (target.hasAttribute('data-scroll-reviews')) {
      const section = document.getElementById('pdp-reviews');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (target.hasAttribute('data-chat')) {
      toast(t('product.chatSoon'));
      return;
    }

    if (p.oos) return; // both buy buttons are disabled; nothing to do

    if (target.hasAttribute('data-add-cart')) {
      store.addToCart(p.id, Object.assign({ qty: st.qty }, cartVariant()));
      toast(t('product.added'));
      return;
    }
    if (target.hasAttribute('data-buy-now')) {
      store.addToCart(p.id, Object.assign({ qty: st.qty }, cartVariant()));
      goToHash('#/cart');
    }
  });

  view.addEventListener('mousemove', (e) => {
    if (st.zoom && e.target.closest('[data-zoom-area]')) applyZoom(e);
  });
  view.addEventListener('mouseout', (e) => {
    if (st.zoom && e.target.closest('[data-zoom-area]') && !e.relatedTarget) {
      st.zoom = false;
      applyZoom();
    }
  });
  view.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-zoom-area]')) {
      e.preventDefault();
      st.zoom = !st.zoom;
      applyZoom();
    }
  });
}

let bound = false;

/* A bundled product renders at once. A server-only one (the generated
 * marketplace catalog) shows a skeleton while GET /api/products/:id answers. */
export function renderProduct(id) {
  pendingId = id;
  const local = productById(id);
  if (local) {
    renderLoaded(local);
    return;
  }
  const view = document.getElementById('view-product');
  document.title = t('product.titleSuffix', { name: t('product.pageTitle') });
  view.innerHTML = '<div class="mx-auto max-w-5xl px-4 pb-32 pt-3" aria-busy="true">'
    + '<div class="md:grid md:grid-cols-2 md:gap-8"><div class="aspect-square animate-pulse rounded-2xl bg-zinc-100"></div>'
    + '<div class="mt-5 space-y-3 md:mt-0"><div class="h-6 w-4/5 animate-pulse rounded bg-zinc-100"></div>'
    + '<div class="h-4 w-1/3 animate-pulse rounded bg-zinc-100"></div><div class="h-8 w-1/2 animate-pulse rounded bg-zinc-100"></div></div></div></div>';
  fetchProduct(id).then((res) => {
    if (pendingId !== id) return; // the shopper already navigated elsewhere
    if (res.ok && res.data && res.data.id === id) {
      registerProducts([res.data]);
      renderLoaded(res.data);
    } else {
      renderLoaded(null);
    }
  });
}

/* Fill "You may also like" for a server-only product: the best-rated items of
 * its subcategory, then its category. */
async function loadRelated(product) {
  const grid = document.getElementById('pdp-related-grid');
  if (!grid) return;
  let items = [];
  const sub = await fetchProducts({ cat: product.cat, sub: product.sub, sort: 'top_rated', limit: 9 });
  if (sub.ok && sub.data) items = sub.data.items;
  if (items.length < 5) {
    const cat = await fetchProducts({ cat: product.cat, sort: 'top_rated', limit: 9 });
    if (cat.ok && cat.data) items = items.concat(cat.data.items);
  }
  if (p !== product || !document.getElementById('pdp-related-grid')) return;
  const seen = new Set([product.id]);
  const list = items.filter((x) => !seen.has(x.id) && seen.add(x.id)).slice(0, 8)
    .map((x) => productById(x.id) || x);
  registerProducts(list);
  const section = document.getElementById('pdp-related');
  if (!list.length) { if (section) section.remove(); return; }
  document.getElementById('pdp-related-grid').innerHTML = list.map((x) => productCard(x)).join('');
}

function renderLoaded(product) {
  const view = document.getElementById('view-product');
  p = product;

  if (!p) {
    document.title = t('product.titleSuffix', { name: t('product.notFoundTitle') });
    view.innerHTML = notFoundHtml();
    return;
  }

  const opts = {};
  (p.variants || []).forEach((g) => { opts[g.name] = g.options[0]; });
  st = { qty: 1, color: (p.colors && p.colors[0] && p.colors[0].name) || '', size: (p.sizes && p.sizes[0]) || '', view: 0, zoom: false, opts };
  store.addRecentlyViewed(p.id);
  document.title = t('product.titleSuffix', { name: p.name });

  view.innerHTML = '<div class="mx-auto max-w-5xl px-4 pb-32 pt-3">'
    + '<button type="button" data-back class="icon-btn -ml-2 mb-3" aria-label="' + esc(t('product.back')) + '">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<div class="md:grid md:grid-cols-2 md:gap-8">'
    + '<div id="pdp-gallery" class="md:sticky md:top-6 md:self-start">' + galleryHtml() + '</div>'
    + '<div class="mt-5 md:mt-0">' + infoHtml() + '</div>'
    + '</div>'
    + descriptionHtml()
    + specsHtml()
    + sellerHtml()
    + reviewsHtml()
    + relatedHtml()
    + '</div>'
    + actionBarHtml();

  if (!bound) {
    bindProductEvents();
    bound = true;
  }

  // Fill the reviews section for this product. reviews.js owns the live
  // stream and re-mounts on every product navigation.
  initReviews();
  const demo = new URLSearchParams(location.search).get('demo') === '1';
  mountReviews(document.getElementById('pdp-reviews'), p, { demo });
  if (p.generated) loadRelated(p);
}