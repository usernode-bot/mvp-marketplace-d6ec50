/* Categories tab (Phase 1). Since Phase 5, Orders lives in orders.js,
 * Profile (with its sub-pages) in profile.js and Cart in cart.js — each
 * owns its own view and actions.
 */

import { icon } from './icons.js';
import { CATEGORIES, PRODUCTS } from './data.js';
import { fetchCatalogSummary } from './api.js';

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
  electronics: 'smartphone',
  fashion: 'shirt',
  beauty: 'sparkles',
  home: 'armchair',
  sports: 'dumbbell',
  groceries: 'basket',
  accessories: 'gem',
};

/* The Categories tab is now a directory: every tile opens the full category
 * browse page (subcategories, filters, sorting) via the data-category
 * handler in app.js. */
export function renderCategoriesView() {
  const view = document.getElementById('view-categories');
  const tiles = CATEGORIES.map((c) => {
    const [bg, fg] = CATEGORY_TINTS[c.id];
    // Until the server answers, the bundled catalog's count; then the real
    // table's (updateCategoryCounts), which includes the marketplace catalog.
    const count = PRODUCTS.filter((p) => p.cat === c.id).length;
    return '<button type="button" data-category="' + c.id + '" class="card flex items-center gap-3 p-4 text-left transition-shadow hover:shadow-card-lg">'
      + '<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ' + bg + ' ' + fg + '">' + icon(CATEGORY_ART[c.id], 'h-6 w-6') + '</span>'
      + '<span class="min-w-0"><span class="block truncate text-sm font-semibold text-zinc-900">' + c.name + '</span>'
      + '<span data-category-count="' + c.id + '" class="block text-xs text-zinc-500">' + count + ' products</span></span>'
      + '<span class="ml-auto shrink-0 text-zinc-300">' + icon('chevronRight', 'h-4 w-4') + '</span>'
      + '</button>';
  }).join('');

  view.innerHTML =
    '<h1 class="section-title">All categories</h1>'
    + '<div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">' + tiles + '</div>';
  updateCategoryCounts();
}

/* Category counts computed from the products table. A failed request keeps
 * the bundled counts already on screen. */
export async function updateCategoryCounts() {
  const res = await fetchCatalogSummary();
  if (!res.ok || !res.data) return;
  res.data.categories.forEach((row) => {
    const el = document.querySelector('[data-category-count="' + row.cat + '"]');
    if (el) el.textContent = row.count + (row.count === 1 ? ' product' : ' products');
  });
}
