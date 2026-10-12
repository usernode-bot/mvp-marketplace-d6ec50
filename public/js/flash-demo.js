/* DEMO FALLBACK for the Flash Sale. Not production data.
 *
 * The real campaign comes from GET /api/flash-sale (persisted campaigns in
 * Postgres, see src/flash-sale.cjs). This module is used only when that
 * request fails outright (offline, or no backend reachable), so the row still
 * shows something instead of an error. It builds a campaign from the bundled
 * mock catalog with the SAME selection rules (flash-sale-core.js) and the same
 * marketplace timezone default, so the demo rotates daily and is stable within
 * a day. Differences from the real thing:
 *   - the bundled catalog has no stock counts, so each demo product is given
 *     DEMO_STOCK units;
 *   - nothing is persisted, so "yesterday" is recomputed instead of read, and
 *     no purchase can be validated or reserved on a server;
 *   - the clock is the device clock.
 * Backend integration needed to retire it: none beyond what exists. Delete
 * this file and its one call in flash-sale.js once the app is always online.
 */
import { PRODUCTS } from './data.js';
import {
  DEFAULT_TIMEZONE, FLASH_SIZE, campaignWindow, campaignStatus, dateKeyFor, addDays,
  selectDaily, offerFor,
} from './flash-sale-core.js';

const DEMO_STOCK = 25;

function demoPool() {
  return PRODUCTS.filter((p) => p.flash).map((p) => Object.assign({}, p, { stock: DEMO_STOCK }));
}

export function buildDemoCampaign(nowMs, tz = DEFAULT_TIMEZONE) {
  const key = dateKeyFor(nowMs, tz);
  const pool = demoPool();
  const yesterday = selectDaily(pool, addDays(key, -1), FLASH_SIZE, []).map((p) => p.id);
  const picks = selectDaily(pool, key, FLASH_SIZE, yesterday);
  const win = campaignWindow(key, tz);
  return {
    campaign: Object.assign({
      id: 0, dateKey: key, timezone: tz, status: campaignStatus(win, nowMs), demo: true,
    }, win),
    items: picks.map((p) => ({ product: p, offer: Object.assign(offerFor(p), { sold: 0, remaining: Math.min(p.stock, 50) }) })),
  };
}
