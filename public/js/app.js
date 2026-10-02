/* App bootstrap: icon hydration, hash-based tab routing, header/bottom-nav
 * bindings and one delegated click handler for all card buttons
 * (favorite / add-to-cart / category / banner CTA / search panel).
 */

import { hydrateIcons, icon } from './icons.js';
import { productById } from './data.js';
import { store } from './store.js';
import { toast } from './ui.js';
import { clearResults, initHome, openResults, panelRows, submitSearch } from './home.js';
import { renderCartView, renderCategoriesView, renderOrdersView, renderProfileView, selectCategoryTab } from './views.js';
import { renderCheckoutView } from './checkout.js';

const VIEWS = ['home', 'categories', 'cart', 'checkout', 'orders', 'profile'];

/* ------------------------------------------------------------------ */
/* View switching                                                      */
/* ------------------------------------------------------------------ */

function currentView() {
  const name = (location.hash || '').replace(/^#\/?/, '');
  return VIEWS.includes(name) ? name : 'home';
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
  if (name === 'checkout') renderCheckoutView();
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
  const target = e.target.closest('[data-fav], [data-add], [data-category], [data-category-tab], [data-nav], [data-banner-action], [data-recent], [data-recent-remove], [data-recent-clear], [data-suggest], [data-search-suggest], [data-soon], [data-cart-plus], [data-cart-minus], [data-cart-remove], [data-results-clear]');
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
    if (entry) store.setQty(minus, entry.qty - 1);
    return;
  }

  const remove = target.getAttribute('data-cart-remove');
  if (remove) {
    store.removeFromCart(remove);
    toast('Removed from cart');
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

  window.addEventListener('hashchange', () => showView(currentView()));

  store.subscribe(updateBadges);
  store.subscribe(() => {
    if (currentView() === 'cart') renderCartView();
  });

  // Demo seed for proposal checks and staging screenshots: ?demo=checkout
  // fills the cart with a few mock items, in memory only (they persist only
  // if the shopper then changes something). Plain routes never hit this.
  if (new URLSearchParams(window.location.search).get('demo') === 'checkout') {
    store.cart = [
      { id: 'p01', qty: 1 },
      { id: 'p14', qty: 2 },
      { id: 'p26', qty: 1 },
    ];
  }

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

  // Bell has no notification center yet; say so instead of doing nothing.
  const bell = document.getElementById('bell-btn');
  if (bell) {
    bell.addEventListener('click', () => toast('Notifications arrive in a later phase'));
  }
}

boot();
