/* The one sort vocabulary for the marketplace.
 *
 * Shared by the client (the SortDropdown and the mobile filter sheet render
 * these labels) and by the server (server.js orders rows by the same ids), so
 * the label a shopper picks is exactly the order the endpoint applies. The
 * id is the URL value (`#/home?sort=price_asc`); adding an order is a data
 * edit here, not a new branch on either side.
 */

export const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'top_rated', label: 'Top rated' },
  { id: 'best_selling', label: 'Best selling' },
  { id: 'biggest_discount', label: 'Biggest discount' },
];

export const DEFAULT_SORT = 'recommended';

export function sortLabel(id) {
  const row = SORT_OPTIONS.find((o) => o.id === id);
  return row ? row.label : SORT_OPTIONS[0].label;
}
