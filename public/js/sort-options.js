/* The one sort vocabulary for the marketplace.
 *
 * Shared by the client (the SortDropdown and the mobile filter sheet render
 * these labels) and by the server (server.js orders rows by the same ids), so
 * the label a shopper picks is exactly the order the endpoint applies. The
 * id is the URL value (`#/home?sort=price_asc`); adding an order is a data
 * edit here, not a new branch on either side. `label` is the English name
 * (the server never renders it); `labelKey` is the dictionary key the client
 * translates at render time (see sortText in filters.js).
 */

export const SORT_OPTIONS = [
  { id: 'recommended', labelKey: 'filters.sort.recommended', label: 'Recommended' },
  { id: 'price_asc', labelKey: 'filters.sort.price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', labelKey: 'filters.sort.price_desc', label: 'Price: High to Low' },
  { id: 'top_rated', labelKey: 'filters.sort.top_rated', label: 'Top rated' },
  { id: 'best_selling', labelKey: 'filters.sort.best_selling', label: 'Best selling' },
  { id: 'biggest_discount', labelKey: 'filters.sort.biggest_discount', label: 'Biggest discount' },
];

export const DEFAULT_SORT = 'recommended';

export function sortLabel(id) {
  const row = SORT_OPTIONS.find((o) => o.id === id);
  return row ? row.label : SORT_OPTIONS[0].label;
}
