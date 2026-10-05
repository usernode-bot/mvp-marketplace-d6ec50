/* App bootstrap: icon hydration, hash routing (router.js), header/bottom-nav
 * bindings and one delegated click handler for all card buttons
 * (favorite / add-to-cart / category / banner CTA / search panel / in-app
 * route links).
 *
 * Views and routes live in router.js: tabs (home/categories/cart/orders/
 * profile) render their own modules, with sub-routes like #/orders/<no> and
 * #/profile/<page> handled by orders.js / profile.js; category browse and
 * search results render through browse.js; product detail through product.js.
 * Deep links (?q=..., ?cat=...) are translated to hash routes on boot so the
 * address bar always carries the real screen.
 */

import { hydrateIcons, icon } from './icons.js';
import { productById } from './data.js';
import { store } from './store.js';
import { toast } from './ui.js';
import { clearResults, initHome, panelRows, runBannerAction, submitSearch } from './home.js';
import { initOrders } from './orders.js';
import { renderProfileView } from './profile.js';
import { initAddresses } from './addresses.js';
import { initSettings } from './settings.js';
import { applyVoucherCode, initCart, removeCartItem, renderCartView } from './cart.js';
import { goToHash, parseRoute, renderRoute } from './router.js';

/* ------------------------------------------------------------------ */
/* Header / nav badges                                                 */
/* ------------------------------------------------------------------ */

function updateBadges() {
  const count = store.cartCount();
  document.querySelectorAll('[data-cart-badge]').forEach((el) => {
    el.textContent = String(count);
    el.classList.toggle('hidden', count === 0);
  });
}

/* ------------------------------------------------------------------ */
/* Delegated clicks                                                    */
/* ------------------------------------------------------------------ */

function reopenSearchPanel(box, input) {
  const panel = box.querySelector('.search-panel');
  if (!panel) return;
  panel.innerHTML = panelRows(input.value);
  panel.classList.remove('hidden');
  input.focus();
}

function handleClick(e) {
  const target = e.target.closest('[data-fav], [data-add], [data-category], [data-nav], [data-route], [data-banner-action], [data-recent], [data-recent-remove], [data-recent-clear], [data-suggest], [data-search-suggest], [data-soon], [data-cart-plus], [data-cart-minus], [data-cart-remove], [data-cart-select], [data-cart-select-all], [data-cart-save], [data-saved-move], [data-saved-remove], [data-voucher-pick], [data-voucher-remove], [data-results-clear], [data-back], [data-product]');
  if (!target) return;

  const favId = target.getAttribute('data-fav');
  if (favId) {
    const on = store.toggleFavorite(favId);
    toast(on ? 'Added to favorites' : 'Removed from favorites');
    document.querySelectorAll('[data-fav="' + favId + '"]').forEach((btn) => {
      btn.innerHTML = icon(on ? 'heartFilled' : 'heart', 'h-4 w-4');
      btn.classList.toggle('fav-btn-on', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    if (parseRoute().view === 'profile') renderProfileView();
    return;
  }

  const addId = target.getAttribute('data-add');
  if (addId) {
    const product = productById(addId);
    if (product && product.oos) {
      toast('This item is sold out');
      return;
    }
    store.addToCart(addId);
    toast('Added to cart');
    // Brief "Added" confirmation on the button that was tapped.
    const original = target.innerHTML;
    target.innerHTML = icon('check', 'h-4 w-4') + '<span class="hidden lg:inline">Added</span>';
    target.disabled = true;
    setTimeout(() => {
      target.innerHTML = original;
      target.disabled = false;
    }, 1200);
    return;
  }

  const cat = target.getAttribute('data-category');
  if (cat) {
    goToHash('#/category/' + cat);
    return;
  }

  const nav = target.getAttribute('data-nav');
  if (nav) {
    goToHash('#/' + nav);
    return;
  }

  if (target.hasAttribute('data-back')) {
    history.back();
    return;
  }

  // In-app sub-route link (e.g. "profile/wishlist" -> #/profile/wishlist).
  const route = target.getAttribute('data-route');
  if (route) {
    location.hash = '/' + route;
    return;
  }

  const bannerAction = target.getAttribute('data-banner-action');
  if (bannerAction) {
    runBannerAction(Number(bannerAction));
    return;
  }

  const recent = target.getAttribute('data-recent');
  if (recent) {
    submitSearch(recent);
    return;
  }

  const recentRemove = target.getAttribute('data-recent-remove');
  if (recentRemove) {
    store.removeRecent(recentRemove);
    const box = target.closest('.search-box');
    if (box) reopenSearchPanel(box, box.querySelector('input'));
    return;
  }

  if (target.hasAttribute('data-recent-clear')) {
    store.clearRecent();
    const box = target.closest('.search-box');
    if (box) reopenSearchPanel(box, box.querySelector('input'));
    return;
  }

  const suggest = target.getAttribute('data-suggest');
  if (suggest) {
    submitSearch(suggest);
    return;
  }

  const searchSuggest = target.getAttribute('data-search-suggest');
  if (searchSuggest) {
    submitSearch(searchSuggest);
    return;
  }

  if (target.hasAttribute('data-soon')) {
    toast('Coming in a later phase');
    return;
  }

  const plus = target.getAttribute('data-cart-plus');
  if (plus) {
    const entry = store.cart.find((i) => i.key === plus);
    if (entry) store.setQty(entry.key, entry.qty + 1);
    return;
  }

  const minus = target.getAttribute('data-cart-minus');
  if (minus) {
    const entry = store.cart.find((i) => i.key === minus);
    // Use the remove button (with confirmation) to delete an item.
    if (entry && entry.qty > 1) store.setQty(entry.key, entry.qty - 1);
    return;
  }

  const remove = target.getAttribute('data-cart-remove');
  if (remove) {
    removeCartItem(remove);
    return;
  }

  const select = target.getAttribute('data-cart-select');
  if (select) {
    store.setSelected(select, target.checked);
    return;
  }

  if (target.hasAttribute('data-cart-select-all')) {
    store.setAllSelected(target.checked);
    return;
  }

  const save = target.getAttribute('data-cart-save');
  if (save) {
    store.saveForLater(save);
    toast('Saved for later');
    return;
  }

  const move = target.getAttribute('data-saved-move');
  if (move) {
    store.moveToCart(move);
    toast('Moved to cart');
    return;
  }

  const savedRemove = target.getAttribute('data-saved-remove');
  if (savedRemove) {
    store.removeSaved(savedRemove);
    toast('Removed from saved items');
    return;
  }

  if (target.hasAttribute('data-voucher-remove')) {
    store.clearVoucher();
    toast('Voucher removed');
    return;
  }

  const pick = target.getAttribute('data-voucher-pick');
  if (pick) {
    applyVoucherCode(pick);
    return;
  }

  if (target.hasAttribute('data-results-clear')) {
    clearResults();
    goToHash('#/home');
    return;
  }

  // Tapping anywhere on a product card (its image included) opens the
  // product detail page. The card's own buttons (favorite, add) match their
  // inner data-* attributes first via closest(), so they never land here.
  const productId = target.getAttribute('data-product');
  if (productId) {
    goToHash('#/product/' + productId);
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function boot() {
  hydrateIcons();

  document.addEventListener('click', handleClick);
  initCart();
  initOrders();
  initAddresses();
  initSettings();

  window.addEventListener('hashchange', renderRoute);

  store.subscribe(updateBadges);
  store.subscribe(() => {
    if (parseRoute().view === 'cart') renderCartView();
  });

  // Demo seed for proposal checks and staging screenshots: ?demo=checkout
  // fills the cart with a few mock items, in memory only (they persist only
  // if the shopper then changes something). Plain routes never hit this.
  if (new URLSearchParams(window.location.search).get('demo') === 'checkout') {
    store.cart = ['p01|1', 'p14|2', 'p26|1'].map((spec) => {
      const [id, qty] = spec.split('|');
      return { id, qty: Number(qty), color: '', size: '', key: id + '||', selected: true };
    });
  }

  updateBadges();

  initHome();
  renderRoute();

  // Shareable deep links: /?q=... opens search results, /?cat=... opens a
  // category page. They become plain hash routes so the address bar carries
  // the real screen; the plain routes stay honest (no query, no results).
  const params = new URLSearchParams(window.location.search);
  const deepQ = params.get('q');
  const deepCat = params.get('cat');
  if (deepQ) {
    store.addRecent(deepQ);
    goToHash('#/search?q=' + encodeURIComponent(deepQ.trim() || ' '));
  } else if (deepCat && deepCat !== 'more') {
    goToHash('#/category/' + deepCat);
  }

  // The bell opens the Notifications page (Phase 5).
  const bell = document.getElementById('bell-btn');
  if (bell) {
    bell.addEventListener('click', () => {
      location.hash = '/profile/notifications';
    });
  }
}

boot();