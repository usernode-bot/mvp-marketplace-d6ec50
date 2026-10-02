/* Secondary tabs: Categories, Orders and Profile. Cart lives in cart.js
 * (Phase 3). Categories browses the mock catalog, Orders and Profile are
 * honest empty/stub states for later phases.
 */

import { icon, productArt } from './icons.js';
import { CATEGORIES, PRODUCTS } from './data.js';
import { store } from './store.js';
import { fmtCount, fmtPrice, emptyState, productCard } from './ui.js';

const CATEGORY_TINTS = {
  electronics: ['bg-indigo-50', 'text-indigo-600'],
  fashion: ['bg-rose-50', 'text-rose-600'],
  beauty: ['bg-purple-50', 'text-purple-600'],
  home: ['bg-teal-50', 'text-teal-600'],
  sports: ['bg-orange-50', 'text-orange-600'],
  groceries: ['bg-green-50', 'text-green-600'],
  accessories: ['bg-slate-100', 'text-slate-600'],
};

const CATEGORY_ART = {
  electronics: 'speaker',
  fashion: 'shirt',
  beauty: 'sparkles',
  home: 'armchair',
  sports: 'dumbbell',
  groceries: 'basket',
  accessories: 'gem',
};

let selectedCategory = CATEGORIES[0].id;

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export function renderCategoriesView() {
  const view = document.getElementById('view-categories');
  const tiles = CATEGORIES.map((c) => {
    const [bg, fg] = CATEGORY_TINTS[c.id];
    const count = PRODUCTS.filter((p) => p.cat === c.id).length;
    const selected = c.id === selectedCategory;
    return '<button type="button" data-category-tab="' + c.id + '" class="card flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-card-lg">'
      + '<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ' + bg + ' ' + fg + '">' + icon(CATEGORY_ART[c.id], 'h-6 w-6') + '</span>'
      + '<span class="min-w-0"><span class="block truncate text-sm font-semibold ' + (selected ? 'text-brand-700' : 'text-zinc-900') + '">' + c.name + '</span>'
      + '<span class="block text-xs text-zinc-500">' + count + ' products</span></span>'
      + '</button>';
  }).join('');

  const products = PRODUCTS.filter((p) => p.cat === selectedCategory);
  view.innerHTML =
    '<h1 class="section-title">All categories</h1>'
    + '<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">' + tiles + '</div>'
    + '<section class="mt-8" aria-label="Products in category">'
    + '<div class="flex items-center gap-2"><h2 id="category-products-title" class="section-title">' + (CATEGORY_TINTS[selectedCategory] ? categoryName(selectedCategory) : '') + '</h2><span class="badge-soft">' + products.length + '</span></div>'
    + '<div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">'
    + products.map((p) => productCard(p)).join('')
    + '</div></section>';
}

function categoryName(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.name : 'Products';
}

export function selectCategoryTab(id) {
  if (!CATEGORY_TINTS[id]) return;
  selectedCategory = id;
  renderCategoriesView();
  const title = document.getElementById('category-products-title');
  if (title) title.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ------------------------------------------------------------------ */
/* Orders                                                              */
/* ------------------------------------------------------------------ */

export function renderOrdersView() {
  const view = document.getElementById('view-orders');
  view.innerHTML =
    '<h1 class="section-title">Orders</h1>'
    + '<div class="card mt-4">'
    + emptyState({
      icon: 'package',
      title: 'No orders yet',
      body: 'When you place an order, it will show up here with its status and delivery updates.',
      actionLabel: 'Browse products',
      actionAttr: 'data-nav="home"',
    })
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

function decodeUsername() {
  try {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return null;
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part + '='.repeat((4 - (part.length % 4)) % 4)));
    return typeof payload.username === 'string' ? payload.username : null;
  } catch {
    return null;
  }
}

export function renderProfileView() {
  const view = document.getElementById('view-profile');
  const name = decodeUsername();
  const initial = name ? name[0].toUpperCase() : 'G';

  const row = (iconName, label, attr) =>
    '<button type="button" data-soon="' + label + '" class="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50">'
    + '<span class="text-zinc-400">' + icon(iconName, 'h-5 w-5') + '</span>' + label
    + '<span class="ml-auto text-zinc-300">' + icon('chevronRight', 'h-4 w-4') + '</span></button>';

  view.innerHTML =
    '<h1 class="section-title">Profile</h1>'
    + '<div class="card mt-4 flex items-center gap-4 p-4">'
    + '<span class="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">' + initial + '</span>'
    + '<div><p class="text-base font-semibold text-zinc-900">' + (name ? '@' + name : 'Guest shopper') + '</p>'
    + '<p class="text-xs text-zinc-500">' + (name ? 'Signed in via Homeroom' : 'Sign in through Homeroom to sync your account') + '</p></div>'
    + '</div>'
    + '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">'
    + '<div class="flex items-center gap-3 px-4 py-3.5 text-sm"><span class="text-zinc-400">' + icon('heart', 'h-5 w-5') + '</span>Favorites<span class="ml-auto badge-brand">' + store.favoriteCount() + '</span></div>'
    + row('settings', 'Settings')
    + row('package', 'Addresses')
    + row('cart', 'Payment methods')
    + row('help', 'Help center')
    + row('logout', 'Log out')
    + '</div>';
}
