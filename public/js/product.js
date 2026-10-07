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
import {
  SELLERS,
  discountPct,
  productById,
  PRODUCTS,
  ratingDistribution,
  reviewsFor,
  score,
  shippingFor,
  specsFor,
} from './data.js';
import { store } from './store.js';
import { emptyState, esc, fmtCount, fmtPrice, productCard, starRow, toast } from './ui.js';
import { goToHash } from './router.js';
import { t } from './i18n.js';


let p = null;
let st = { qty: 1, color: '', size: '', view: 0 };

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
  return '<div class="absolute inset-0 bg-zinc-100">'
    + productPlaceholder(p, 'absolute inset-0 h-full w-full text-zinc-300')
    + (src
      ? '<img src="' + esc(src) + '" alt="' + esc(p.name + ' photo ' + (i + 1)) + '" data-product-image data-gallery-img'
        + ' class="product-img absolute inset-0 h-full w-full bg-zinc-100 ' + fit + '" onerror="this.remove()">'
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
      '<button type="button" data-img-go="' + i + '" aria-label="Photo ' + (i + 1) + ' of ' + n
      + '" aria-current="' + (i === view) + '" class="h-1.5 rounded-full transition-all ' + (i === view ? 'w-5 bg-brand-600' : 'w-1.5 bg-zinc-300') + '"></button>').join('')
    : '';
  const thumbs = n > 1
    ? Array.from({ length: n }, (_, i) =>
      '<button type="button" data-img-go="' + i + '" aria-label="Show photo ' + (i + 1) + ' of ' + n
      + '" class="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-zinc-100 ' + (i === view ? 'border-brand-600' : 'border-transparent') + '">'
      + (imgs[i]
        ? '<img src="' + esc(imgs[i]) + '" alt="" class="product-img h-full w-full ' + (p.imageFit === 'contain' ? 'object-contain' : 'object-cover') + '" onerror="this.remove()">'
        : '')
      + '</button>').join('')
    : '';
  const fav = store.isFavorite(p.id);

  return '<div class="relative aspect-square overflow-hidden rounded-2xl bg-zinc-100">'
    + '<div id="pdp-img">' + photoMain(imgs[view], view) + '</div>'
    + (disc ? '<span class="badge-sale absolute left-3 top-3">-' + disc + '%</span>' : '')
    + (p.oos ? '<span class="badge absolute bottom-3 left-3 bg-zinc-900/80 text-white">Sold out</span>' : '')
    + '<button type="button" data-fav="' + p.id + '" aria-label="Toggle favorite" aria-pressed="' + fav
    + '" class="fav-btn absolute right-3 top-3' + (fav ? ' fav-btn-on' : '') + '">' + icon(fav ? 'heartFilled' : 'heart', 'h-4 w-4') + '</button>'
    + (n > 1 ? '<button type="button" data-img-prev aria-label="Previous photo" class="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-card md:flex">' + icon('chevronLeft', 'h-4 w-4') + '</button>' : '')
    + (n > 1 ? '<button type="button" data-img-next aria-label="Next photo" class="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-card md:flex">' + icon('chevronRight', 'h-4 w-4') + '</button>' : '')
    + '</div>'
    + (dots ? '<div class="mt-3 flex justify-center gap-1.5">' + dots + '</div>' : '')
    + (thumbs ? '<div class="mt-3 hidden gap-2 md:flex">' + thumbs + '</div>' : '');
}

function infoHtml() {
  const ship = shippingFor(p);
  const disc = discountPct(p);
  const colors = p.colors || [];
  const sizes = p.sizes || [];

  const colorRow = colors.length
    ? '<div class="mt-4"><h2 class="text-sm font-bold text-zinc-900">Color: <span id="pdp-color-label" class="font-medium text-zinc-500">' + st.color + '</span></h2>'
      + '<div class="mt-2 flex flex-wrap gap-2.5">'
      + colors.map((c, i) => '<button type="button" data-variant-color="' + c.name + '" aria-label="Color ' + c.name + '" aria-pressed="' + (c.name === st.color)
        + '" class="h-8 w-8 rounded-full border-2 ' + (c.name === st.color ? 'border-brand-600' : 'border-transparent')
        + '" style="background-color:' + c.hex + '"></button>').join('')
      + '</div></div>'
    : '';

  const sizeRow = sizes.length
    ? '<div class="mt-4"><h2 class="text-sm font-bold text-zinc-900">Size: <span id="pdp-size-label" class="font-medium text-zinc-500">' + st.size + '</span></h2>'
      + '<div class="mt-2 flex flex-wrap gap-2">'
      + sizes.map((s) => '<button type="button" data-variant-size="' + s + '" aria-pressed="' + (s === st.size)
        + '" class="h-9 min-w-11 rounded-lg border px-3 text-sm font-semibold ' + (s === st.size ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-zinc-200 bg-white text-zinc-700')
        + '">' + s + '</button>').join('')
      + '</div></div>'
    : '';

  return '<h1 class="text-lg font-bold leading-snug text-zinc-900 md:text-xl">' + p.name + '</h1>'
    + '<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">'
    + starRow(p.rating)
    + '<span class="text-sm font-semibold text-zinc-700">' + p.rating.toFixed(1) + '</span>'
    + '<button type="button" data-scroll-reviews class="text-xs text-zinc-500 underline-offset-2 hover:text-brand-700 hover:underline">(' + fmtCount(p.reviews) + ' reviews)</button>'
    + '<span class="text-xs text-zinc-300">|</span>'
    + '<span class="text-xs text-zinc-500">' + fmtCount(p.sold) + ' sold</span>'
    + '</div>'
    + '<div class="mt-3 flex items-end gap-2">'
    + '<span class="text-2xl font-bold tabular-nums text-rose-600">' + fmtPrice(p.price) + '</span>'
    + (p.orig ? '<span class="pb-0.5 text-sm tabular-nums text-zinc-400 line-through">' + fmtPrice(p.orig) + '</span>' : '')
    + (disc ? '<span class="badge-sale mb-0.5">-' + disc + '%</span>' : '')
    + '</div>'
    + '<div class="mt-4 space-y-2.5 rounded-xl bg-zinc-50 p-3.5 text-sm text-zinc-600">'
    + '<div class="flex items-start gap-2.5">' + icon('truck', 'h-4 w-4 mt-0.5 shrink-0 text-zinc-400')
    + '<span>' + (ship.fee === 0 ? '<span class="font-semibold text-zinc-800">Free shipping</span>' : 'Shipping ' + fmtPrice(ship.fee)) + ' · Arrives in ' + ship.eta + '</span></div>'
    + '<div class="flex items-start gap-2.5">' + icon('returns', 'h-4 w-4 mt-0.5 shrink-0 text-zinc-400') + '<span>' + ship.returns + '</span></div>'
    + '</div>'
    + colorRow + sizeRow
    + '<div class="mt-4 flex items-center gap-3">'
    + '<h2 class="text-sm font-bold text-zinc-900">Quantity</h2>'
    + '<div class="ml-auto flex items-center overflow-hidden rounded-lg border border-zinc-200">'
    + '<button type="button" data-qty="-1" aria-label="Decrease quantity" class="flex h-9 w-9 items-center justify-center text-zinc-600 hover:bg-zinc-50">' + icon('minus', 'h-4 w-4') + '</button>'
    + '<span id="pdp-qty" class="w-10 text-center text-sm font-bold tabular-nums text-zinc-900">1</span>'
    + '<button type="button" data-qty="1" aria-label="Increase quantity" class="flex h-9 w-9 items-center justify-center text-zinc-600 hover:bg-zinc-50">' + icon('plus', 'h-4 w-4') + '</button>'
    + '</div></div>';
}

function sellerHtml() {
  const s = SELLERS[p.brand];
  if (!s) return '';
  return '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">Seller</h2>'
    + '<div class="card mt-3 flex flex-wrap items-center gap-3 p-4">'
    + '<span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">' + icon('store', 'h-6 w-6') + '</span>'
    + '<div class="min-w-0 flex-1">'
    + '<div class="flex flex-wrap items-center gap-2"><span class="text-sm font-bold text-zinc-900">' + p.brand + '</span>'
    + '<span class="badge badge-soft">' + s.badge + '</span></div>'
    + '<div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500">'
    + starRow(s.rating, 'h-3 w-3')
    + '<span class="font-semibold text-zinc-700">' + s.rating.toFixed(1) + '</span>'
    + '<span>' + s.followers + ' followers</span><span class="text-zinc-300">|</span>'
    + '<span>' + s.response + ' response rate</span><span class="text-zinc-300">|</span>'
    + '<span>Since ' + s.since + '</span>'
    + '</div></div>'
    + '<button type="button" data-chat class="btn-outline btn-sm">' + icon('chat', 'h-4 w-4') + 'Chat seller</button>'
    + '</div></section>';
}

function specsHtml() {
  // Two columns on wide screens, one on phones. Every row is keyed for
  // translation; an empty value is dropped by specsFor, so a non-applicable
  // field is hidden rather than shown as "N/A".
  const rows = specsFor(p).map((r) => {
    const label = t(r.k) || r.l;
    return '<div class="flex items-start gap-3 border-b border-zinc-100 px-3.5 py-2.5 text-sm">'
      + '<dt class="w-28 shrink-0 text-zinc-500 sm:w-36">' + esc(label) + '</dt>'
      + '<dd class="min-w-0 text-zinc-800">' + esc(r.v) + '</dd></div>';
  }).join('');
  return '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">' + esc(t('specifications')) + '</h2>'
    + '<dl class="mt-3 overflow-hidden rounded-xl border border-zinc-100 bg-white sm:grid sm:grid-cols-2 sm:gap-x-6">'
    + rows + '</dl></section>';
}

function descriptionHtml() {
  return '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">Description</h2>'
    + '<p class="mt-2 text-sm leading-relaxed text-zinc-600">' + p.desc + '</p></section>';
}

function reviewCard(r) {
  const photos = r.images.length
    ? '<div class="mt-2.5 flex gap-2">' + r.images.map((v) =>
      '<div class="h-16 w-16 overflow-hidden rounded-lg bg-zinc-100">' + productArtView(p, v) + '</div>').join('') + '</div>'
    : '';
  return '<article class="card p-4">'
    + '<div class="flex items-center gap-3">'
    + '<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ' + r.tintBg + ' ' + r.tintFg + '">' + r.author.charAt(0) + '</span>'
    + '<div class="min-w-0">'
    + '<div class="text-sm font-semibold text-zinc-900">' + r.author + '</div>'
    + '<div class="flex items-center gap-1.5">' + starRow(r.rating, 'h-3 w-3') + '<span class="text-xs text-zinc-400">' + r.when + '</span></div>'
    + '</div>'
    + (r.verified ? '<span class="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">' + icon('check', 'h-3 w-3') + 'Verified purchase</span>' : '')
    + '</div>'
    + '<p class="mt-2.5 text-sm leading-relaxed text-zinc-600">' + r.text + '</p>'
    + photos
    + '</article>';
}

function reviewsHtml() {
  const reviews = reviewsFor(p);
  const dist = ratingDistribution(p.rating);
  const bars = dist.map((share, i) => {
    const stars = 5 - i;
    return '<div class="flex items-center gap-2 text-xs text-zinc-500">'
      + '<span class="w-3 shrink-0 text-right tabular-nums">' + stars + '</span>'
      + icon('star', 'h-3 w-3 shrink-0 text-amber-400')
      + '<div class="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100"><div class="h-full rounded-full bg-amber-400" style="width:' + Math.round(share * 100) + '%"></div></div>'
      + '</div>';
  }).join('');

  return '<section id="pdp-reviews" class="mt-8 scroll-mt-20"><h2 class="text-base font-bold text-zinc-900">Reviews</h2>'
    + '<div class="card mt-3 p-4"><div class="flex items-center gap-5">'
    + '<div class="shrink-0 text-center">'
    + '<div class="text-3xl font-bold tabular-nums text-zinc-900">' + p.rating.toFixed(1) + '</div>'
    + starRow(p.rating)
    + '<div class="mt-1 text-xs text-zinc-500">' + fmtCount(p.reviews) + ' reviews</div>'
    + '</div>'
    + '<div class="flex-1 space-y-1.5">' + bars + '</div>'
    + '</div></div>'
    + '<div class="mt-3 space-y-3">' + reviews.map(reviewCard).join('') + '</div>'
    + '</section>';
}

function relatedHtml() {
  const related = PRODUCTS
    .filter((x) => x.cat === p.cat && x.id !== p.id)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 8);
  const viewed = store.recentlyViewed().filter((x) => x.id !== p.id).slice(0, 4);

  let html = related.length
    ? '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">You may also like</h2>'
      + '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">' + related.map((x) => productCard(x)).join('') + '</div></section>'
    : '';
  if (viewed.length) {
    html += '<section class="mt-8"><h2 class="text-base font-bold text-zinc-900">Recently viewed</h2>'
      + '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">' + viewed.map((x) => productCard(x)).join('') + '</div></section>';
  }
  return html;
}

function actionBarHtml() {
  if (p.oos) {
    return '<div class="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/95 shadow-card-lg backdrop-blur" style="padding-bottom: var(--un-safe-inset-bottom, 0px)">'
      + '<div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">'
      + '<button type="button" disabled class="btn-outline flex-1 cursor-not-allowed opacity-50">Add to Cart</button>'
      + '<button type="button" disabled class="btn-primary flex-1 cursor-not-allowed opacity-50">Buy Now</button>'
      + '</div></div>';
  }
  return '<div class="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-100 bg-white/95 shadow-card-lg backdrop-blur" style="padding-bottom: var(--un-safe-inset-bottom, 0px)">'
    + '<div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">'
    + '<button type="button" data-add-cart class="btn-outline flex-1">' + icon('cart', 'h-4 w-4') + 'Add to Cart</button>'
    + '<button type="button" data-buy-now class="btn-primary flex-1">Buy Now</button>'
    + '</div></div>';
}

function notFoundHtml() {
  return '<button type="button" data-back class="icon-btn -ml-2 mb-3" aria-label="Back">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + emptyState({
      icon: 'package',
      title: 'Product not found',
      body: 'That product is no longer available. Explore the catalog for something similar.',
      actionLabel: 'Back to home',
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
  if (img) img.innerHTML = photoMain(imgs[st.view], st.view);
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
  const colorLabel = document.getElementById('pdp-color-label');
  if (colorLabel) colorLabel.textContent = st.color;
  const sizeLabel = document.getElementById('pdp-size-label');
  if (sizeLabel) sizeLabel.textContent = st.size;
}

function bindProductEvents() {
  const view = document.getElementById('view-product');
  view.addEventListener('click', (e) => {
    const target = e.target.closest('[data-img-go], [data-img-prev], [data-img-next], [data-variant-color], [data-variant-size], [data-qty], [data-add-cart], [data-buy-now], [data-chat], [data-scroll-reviews]');
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
      st.qty = Math.min(99, Math.max(1, st.qty + Number(qty)));
      syncQty();
      return;
    }

    if (target.hasAttribute('data-scroll-reviews')) {
      const section = document.getElementById('pdp-reviews');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    if (target.hasAttribute('data-chat')) {
      toast('Seller chat is coming soon');
      return;
    }

    if (p.oos) return; // both buy buttons are disabled; nothing to do

    if (target.hasAttribute('data-add-cart')) {
      store.addToCart(p.id, { qty: st.qty, color: st.color, size: st.size });
      toast('Added to cart');
      return;
    }
    if (target.hasAttribute('data-buy-now')) {
      store.addToCart(p.id, { qty: st.qty, color: st.color, size: st.size });
      goToHash('#/cart');
    }
  });
}

let bound = false;

export function renderProduct(id) {
  const view = document.getElementById('view-product');
  p = productById(id);

  if (!p) {
    document.title = 'Product not found · MVP Marketplace';
    view.innerHTML = notFoundHtml();
    return;
  }

  st = { qty: 1, color: (p.colors && p.colors[0] && p.colors[0].name) || '', size: (p.sizes && p.sizes[0]) || '', view: 0 };
  store.addRecentlyViewed(p.id);
  document.title = p.name + ' · MVP Marketplace';

  view.innerHTML = '<div class="mx-auto max-w-5xl px-4 pb-32 pt-3">'
    + '<button type="button" data-back class="icon-btn -ml-2 mb-3" aria-label="Back">' + icon('chevronLeft', 'h-5 w-5') + '</button>'
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
}