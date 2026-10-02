/* App bootstrap: icon hydration, hash routing (router.js), header/bottom-nav
 * bindings and one delegated click handler for all card buttons
 * (favorite / add-to-cart / category / banner CTA / search panel).
 *
 * Views and routes live in router.js: tabs (home/categories/cart/orders/
 * profile) render their own modules; category browse and search results
 * render through browse.js; product detail through product.js. Deep links
 * (?q=..., ?cat=...) are translated to hash routes on boot so the address
 * bar always carries the real screen.
 */

import { hydrateIcons, icon } from './icons.js';
import { productById } from './data.js';
import { store } from './store.js';
import { toast } from './ui.js';
import { clearResults, initHome, panelRows, runBannerAction, submitSearch } from './home.js';
import { renderCartView, renderProfileView } from './views.js';
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
  const target = e.target.closest('[data-fav], [data-add], [data-category], [data-nav], [data-banner-action], [data-recent], [data-recent-remove], [data-recent-clear], [data-suggest], [data-search-suggest], [data-soon], [data-cart-plus], [data-cart-minus], [data-cart-remove], [data-results-clear], [data-back]');
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
    if (entry) store.setQty(entry.key, entry.qty - 1);
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
    goToHash('#/home');
    return;
  }
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function boot() {
  hydrateIcons();

  document.addEventListener('click', handleClick);

  window.addEventListener('hashchange', renderRoute);

  store.subscribe(updateBadges);
  store.subscribe(() => {
    if (parseRoute().view === 'cart') renderCartView();
  });
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

  // Bell has no notification center yet; say so instead of doing nothing.
  const bell = document.getElementById('bell-btn');
  if (bell) {
    bell.addEventListener('click', () => toast('Notifications arrive in a later phase'));
  }
}

boot();