/* Hash routing for the app shell.
 *
 * Routes:
 *   #/home #/categories #/cart #/orders #/profile   Phase 1 tabs
 *   #/checkout                   Checkout (reached from the cart)
 *   #/category/<id>              Category browse page
 *   #/search?q=...               Search results page
 *   #/product/<id>               Product detail page
 *
 * The container elements stay in index.html permanently; each route renders
 * into its own [data-view] div. goToHash is the one way to navigate: it
 * re-renders even when the target hash equals the current one (searching the
 * same term twice) by re-dispatching the hashchange event.
 */

import { renderBrowse } from './browse.js';
import { renderProduct } from './product.js';
import { renderCategoriesView } from './views.js';
import { renderOrdersView } from './orders.js';
import { renderProfileView } from './profile.js';
import { renderCartView } from './cart.js';
import { renderCheckoutView } from './checkout.js';

const TABS = ['home', 'categories', 'cart', 'checkout', 'orders', 'profile'];
const VIEW_NAMES = TABS.concat(['browse', 'product']);

export function parseRoute() {
  const raw = (location.hash || '').replace(/^#\/?/, '');
  const qIndex = raw.indexOf('?');
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const query = new URLSearchParams(qIndex === -1 ? '' : raw.slice(qIndex + 1));
  const seg = path.split('/').filter(Boolean);
  if (seg[0] === 'category' && seg[1]) {
    return { view: 'browse', mode: 'category', id: seg[1], sub: query.get('sub') || '' };
  }
  if (seg[0] === 'search') {
    return { view: 'browse', mode: 'search', q: query.get('q') || '' };
  }
  if (seg[0] === 'product' && seg[1]) {
    return { view: 'product', id: seg[1] };
  }
  if (TABS.includes(seg[0])) return { view: seg[0] };
  return { view: 'home' };
}

export function goToHash(hash) {
  if (location.hash === hash) {
    window.dispatchEvent(new Event('hashchange'));
  } else {
    location.hash = hash;
  }
}

function showView(name) {
  VIEW_NAMES.forEach((v) => {
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

  // The product page is a focused screen: it swaps the mobile bottom
  // navigation for its own sticky Add to Cart / Buy Now bar.
  const bottomNav = document.getElementById('bottom-nav');
  if (bottomNav) bottomNav.classList.toggle('hidden', name === 'product');

  if (name === 'categories') renderCategoriesView();
  if (name === 'cart') renderCartView();
  if (name === 'checkout') renderCheckoutView();
  if (name === 'orders') renderOrdersView();
  if (name === 'profile') renderProfileView();
  if (name === 'browse') renderBrowse(parseRoute());
  if (name === 'product') renderProduct(parseRoute().id);

  window.scrollTo({ top: 0 });
}

export function renderRoute() {
  showView(parseRoute().view);
}