/* Categories tab (Phase 1). Since Phase 5, Orders lives in orders.js,
 * Profile (with its sub-pages) in profile.js and Cart in cart.js — each
 * owns its own view and actions.
 */

import { icon } from './icons.js';
import { CATEGORIES, PRODUCTS } from './data.js';
import { productCard } from './ui.js';

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
