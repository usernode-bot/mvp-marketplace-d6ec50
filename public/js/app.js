/* App bootstrap: icon hydration, hash-based routing (top-level tabs plus
 * sub-routes like #/orders/<no> and #/profile/<page>), header/bottom-nav
 * bindings and one delegated click handler for all card buttons
 * (favorite / add-to-cart / category / banner CTA / search panel / in-app
 * route links).
 */

import { hydrateIcons, icon } from './icons.js';
import { productById } from './data.js';
import { store } from './store.js';
import { toast } from './ui.js';
import { clearResults, initHome, openResults, panelRows, submitSearch } from './home.js';
import { renderCategoriesView, selectCategoryTab } from './views.js';
import { initOrders, renderOrdersView } from './orders.js';
import { renderProfileView } from './profile.js';
import { initAddresses } from './addresses.js';
import { initSettings } from './settings.js';
import { applyVoucherCode, initCart, removeCartItem, renderCartView } from './cart.js';

const VIEWS = ['home', 'categories', 'cart', 'orders', 'profile'];

/* ------------------------------------------------------------------ */
/* View switching                                                      */
/* ------------------------------------------------------------------ */

/* Top-level view of the current hash. Sub-routes (#/orders/<no>,
 * #/profile/<page>) map to their parent tab; the render functions read the
 * full hash themselves. */
function currentView() {
  const seg = (location.hash || '').replace(/^#\/?/, '').split('/')[0];
  return VIEWS.includes(seg) && seg ? seg : 'home';
}

function showView(name) {
  VIEWS.forEach((v) => {
    const el = document.querySelector('[data-view="' + v + '"]');
    if (el) el.classList.toggle('hidden', v !== name);
  });

  document.querySelectorAll('[data-nav]').forEach((el) => {
    const active = el.dataset.nav === name;
    el.classList.toggle('nav-item-active', active && el.classList.contains('nav-item'));
    el.classList.toggle('nav-link-active', active && el.classList.contains('nav-link'));
    if (active) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  if (name === 'categories') renderCategoriesView();
  if (name === 'cart') renderCartView();
  if (name === 'orders') renderOrdersView();
  if (name === 'profile') renderProfileView();

  window.scrollTo({ top: 0 });
}

function navigate(name) {
  if (name === currentView()) {
    showView(name);
    return;
  }
  location.hash = '/' + name; // hashchange drives showView
}

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
  const target = e.target.closest('[data-fav], [data-add], [data-category], [data-category-tab], [data-nav], [data-route], [data-banner-action], [data-recent], [data-recent-remove], [data-recent-clear], [data-suggest], [data-search-suggest], [data-soon], [data-cart-plus], [data-cart-minus], [data-cart-remove], [data-cart-select], [data-cart-select-all], [data-cart-save], [data-saved-move], [data-saved-remove], [data-voucher-pick], [data-voucher-remove], [data-results-clear]');
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
    if (currentView() === 'profile') renderProfileView();
    return;
  }

  const addId = target.getAttribute('data-add');
  if (addId) {
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
    if (currentView() === 'home') openResults({ type: 'category', id: cat });
    return;
  }

  const catTab = target.getAttribute('data-category-tab');
  if (catTab) {
    selectCategoryTab(catTab);
    return;
  }

  const nav = target.getAttribute('data-nav');
  if (nav) {
    navigate(nav);
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
    const entry = store.cart.find((i) => i.id === plus);
    if (entry) store.setQty(plus, entry.qty + 1);
    return;
  }

  const minus = target.getAttribute('data-cart-minus');
  if (minus) {
    const entry = store.cart.find((i) => i.id === minus);
    // Use the remove button (with confirmation) to delete an item.
    if (entry && entry.qty > 1) store.setQty(minus, entry.qty - 1);
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
    return;
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

  window.addEventListener('hashchange', () => showView(currentView()));

  store.subscribe(updateBadges);
  store.subscribe(() => {
    if (currentView() === 'cart') renderCartView();
  });
  updateBadges();

  initHome();
  showView(currentView());

  // Shareable deep links: /?q=... opens search results, /?cat=... opens a
  // category results view. Applied after home init so the results section
  // exists; the plain routes stay honest (no query, no results view).
  const params = new URLSearchParams(window.location.search);
  const deepQ = params.get('q');
  const deepCat = params.get('cat');
  if (deepQ) {
    store.addRecent(deepQ);
    openResults({ type: 'search', q: deepQ.trim() || ' ' });
  } else if (deepCat && deepCat !== 'more') {
    openResults({ type: 'category', id: deepCat });
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
