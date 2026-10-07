/* The one sort vocabulary for the marketplace.
 *
 * Shared by the client (the SortDropdown and the mobile filter sheet render
 * these labels) and by the server (server.js orders rows by the same ids), so
 * the label a shopper picks is exactly the order the endpoint applies. The
 * id is the URL value (`#/home?sort=price_asc`); adding an order is a data
 * edit here, not a new branch on either side.
 */

import { t } from './i18n.js';

/* Labels are translated lazily (a getter), so the sort menu follows the
 * active locale after a switch without re-importing this module. The server
 * require()s this file only for the ids, so the getter never runs there. */
const SORTS = [
  { id: 'recommended', key: 'filter.sort.recommended' },
  { id: 'price_asc', key: 'filter.sort.price_asc' },
  { id: 'price_desc', key: 'filter.sort.price_desc' },
  { id: 'top_rated', key: 'filter.sort.top_rated' },
  { id: 'best_selling', key: 'filter.sort.best_selling' },
  { id: 'biggest_discount', key: 'filter.sort.biggest_discount' },
];

export const SORT_OPTIONS = SORTS.map((o) => ({
  id: o.id,
  key: o.key,
  get label() { return t(o.key); },
}));

export const DEFAULT_SORT = 'recommended';

export function sortLabel(id) {
  const row = SORT_OPTIONS.find((o) => o.id === id);
  return row ? row.label : SORT_OPTIONS[0].label;
}
