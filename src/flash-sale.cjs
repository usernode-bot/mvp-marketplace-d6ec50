/* Flash Sale campaigns: persisted daily campaigns, the daily product pick and
 * the purchase-time stock and price check.
 *
 * A campaign is one row in flash_campaigns (one per marketplace calendar day,
 * enforced by a unique date_key) and its products are rows in
 * flash_campaign_items, whose primary key (campaign_id, product_id) makes a
 * duplicate assignment impossible. The first request of a day creates that
 * day's campaign (under an advisory lock, so two containers never create two)
 * from the products that qualify (see isEligible in flash-sale-core.js) and
 * freezes the flash price and stock per product; every later request reads it
 * back, which is what keeps the selection identical for everyone all day.
 * A product can also be put in a campaign by hand: insert a row into
 * flash_campaign_items for that campaign.
 *
 * The rules (timezone, date key, eligibility, selection) are in
 * public/js/flash-sale-core.js, shared with the client's demo fallback.
 *
 * Both tables are public: a campaign and its prices are what every shopper
 * sees, nothing is personal.
 */
const core = require('../public/js/flash-sale-core.js');
const { toProduct } = require('./products.cjs');

const LOCK_ID = 7340112; // pg_advisory_xact_lock key for campaign creation

function marketplaceTimezone() {
  return core.resolveTimezone(process.env.MARKETPLACE_TIMEZONE || core.DEFAULT_TIMEZONE);
}

async function ensureFlashTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flash_campaigns (
      id SERIAL PRIMARY KEY,
      date_key TEXT NOT NULL UNIQUE,
      timezone TEXT NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CHECK (ends_at > starts_at)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flash_campaign_items (
      campaign_id INTEGER NOT NULL REFERENCES flash_campaigns(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      orig_price INTEGER NOT NULL,
      flash_price INTEGER NOT NULL,
      flash_stock INTEGER NOT NULL CHECK (flash_stock > 0),
      flash_sold INTEGER NOT NULL DEFAULT 0 CHECK (flash_sold >= 0),
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (campaign_id, product_id),
      CHECK (flash_price > 0 AND flash_price < orig_price),
      CHECK (flash_sold <= flash_stock)
    )
  `);
}

/* Every product that could go in a campaign today. The WHERE is the cheap
 * first cut; isEligible is the single rule that decides. */
async function eligiblePool(db) {
  const { rows } = await db.query(
    `SELECT * FROM products
      WHERE active AND NOT oos AND flash_eligible
        AND stock IS NOT NULL AND stock > 0
        AND orig IS NOT NULL AND orig > price AND price > 0
      ORDER BY id`);
  return rows.map((r) => Object.assign(toProduct(r), { active: r.active, flashEligible: r.flash_eligible }))
    .filter(core.isEligible);
}

async function campaignByKey(db, key) {
  const { rows } = await db.query('SELECT * FROM flash_campaigns WHERE date_key = $1', [key]);
  return rows[0] || null;
}

/* The campaign for a date, creating it on first use. Returns null when no
 * product qualifies (an empty pool is not persisted, so a day whose pool
 * fills later still gets a campaign). */
async function ensureCampaign(pool, key, tz, nowMs) {
  const found = await campaignByKey(pool, key);
  if (found) return found;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_ID]);
    const again = await campaignByKey(client, key);
    if (again) { await client.query('COMMIT'); return again; }

    const picks = core.selectDaily(await eligiblePool(client), key, core.FLASH_SIZE, await previousIds(client, key));
    if (!picks.length) { await client.query('COMMIT'); return null; }

    const win = core.campaignWindow(key, tz);
    const status = core.campaignStatus(win, nowMs);
    const inserted = await client.query(
      `INSERT INTO flash_campaigns (date_key, timezone, starts_at, ends_at, status)
       VALUES ($1, $2, to_timestamp($3 / 1000.0), to_timestamp($4 / 1000.0), $5) RETURNING *`,
      [key, tz, win.startsAt, win.endsAt, status]);
    const campaign = inserted.rows[0];
    for (let i = 0; i < picks.length; i++) {
      const o = core.offerFor(picks[i]);
      await client.query(
        `INSERT INTO flash_campaign_items (campaign_id, product_id, orig_price, flash_price, flash_stock, position)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (campaign_id, product_id) DO NOTHING`,
        [campaign.id, picks[i].id, o.orig, o.price, o.stock, i]);
    }
    await client.query('COMMIT');
    return campaign;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/* Product ids of the most recent earlier campaign: the ones to rest today. */
async function previousIds(db, key) {
  const { rows } = await db.query(
    `SELECT i.product_id FROM flash_campaign_items i
       JOIN flash_campaigns c ON c.id = i.campaign_id
      WHERE c.date_key = (SELECT MAX(date_key) FROM flash_campaigns WHERE date_key < $1)`, [key]);
  return rows.map((r) => r.product_id);
}

async function syncStatus(pool, campaign, status) {
  if (campaign.status === status) return;
  await pool.query('UPDATE flash_campaigns SET status = $2 WHERE id = $1', [campaign.id, status]);
  campaign.status = status;
}

/* What GET /api/flash-sale returns for the instant `nowMs`:
 *   state 'active'  - today's campaign and its products
 *   state 'empty'   - no product qualifies today (items is [])
 * `campaign` carries the real start/end instants the countdown runs to. */
async function currentFlashSale(pool, nowMs) {
  const tz = marketplaceTimezone();
  const key = core.dateKeyFor(nowMs, tz);
  const campaign = await ensureCampaign(pool, key, tz, nowMs);
  const serverNow = new Date(nowMs).toISOString();
  if (!campaign) {
    const win = core.campaignWindow(key, tz);
    return {
      state: 'empty', serverNow, items: [],
      campaign: { id: null, dateKey: key, timezone: tz, startsAt: win.startsAt, endsAt: win.endsAt, status: core.campaignStatus(win, nowMs) },
    };
  }
  const startsAt = new Date(campaign.starts_at).getTime();
  const endsAt = new Date(campaign.ends_at).getTime();
  const status = core.campaignStatus({ startsAt, endsAt }, nowMs);
  await syncStatus(pool, campaign, status);

  const { rows } = await pool.query(
    `SELECT p.*, i.flash_price, i.orig_price, i.flash_stock, i.flash_sold
       FROM flash_campaign_items i JOIN products p ON p.id = i.product_id
      WHERE i.campaign_id = $1 AND p.active AND NOT p.oos AND (p.stock IS NULL OR p.stock > 0)
      ORDER BY i.position, i.product_id`, [campaign.id]);
  const items = rows.map((r) => {
    const remaining = r.flash_stock - r.flash_sold;
    return {
      product: toProduct(r),
      offer: {
        price: r.flash_price, orig: r.orig_price, pct: core.discountFrom(r.flash_price, r.orig_price),
        stock: r.flash_stock, sold: r.flash_sold, remaining,
      },
    };
  });
  return {
    state: status === 'active' ? 'active' : status, serverNow, items,
    campaign: { id: campaign.id, dateKey: campaign.date_key, timezone: campaign.timezone, startsAt, endsAt, status },
  };
}

class FlashError extends Error {
  constructor(code, extra) {
    super(code);
    this.code = code;
    this.extra = extra || {};
  }
}

/* Checks and reserves Flash Sale units for a purchase, in one transaction.
 * `lines` are { productId, qty, price } where price is what the shopper was
 * shown. Every line must be in the campaign running at `nowMs`, at that exact
 * campaign price, with enough campaign stock and enough real product stock.
 * Anything wrong throws a FlashError and nothing is reserved. */
async function reserveFlashSale(pool, lines, nowMs) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 50) throw new FlashError('bad_request');
  const merged = new Map();
  for (const l of lines) {
    const qty = l && l.qty;
    if (!l || typeof l.productId !== 'string' || !Number.isInteger(qty) || qty < 1 || qty > 99
      || !Number.isInteger(l.price)) throw new FlashError('bad_request');
    const prior = merged.get(l.productId);
    if (prior && prior.price !== l.price) throw new FlashError('bad_request');
    merged.set(l.productId, { productId: l.productId, price: l.price, qty: (prior ? prior.qty : 0) + qty });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const camp = await client.query(
      `SELECT id FROM flash_campaigns
        WHERE starts_at <= to_timestamp($1 / 1000.0) AND ends_at > to_timestamp($1 / 1000.0)
        ORDER BY starts_at DESC LIMIT 1`, [nowMs]);
    if (!camp.rows.length) throw new FlashError('campaign_ended');
    const campaignId = camp.rows[0].id;
    const reserved = [];
    for (const line of [...merged.values()].sort((a, b) => (a.productId < b.productId ? -1 : 1))) {
      const { rows } = await client.query(
        `SELECT i.flash_price, i.orig_price, i.flash_stock, i.flash_sold, p.active, p.oos, p.stock
           FROM flash_campaign_items i JOIN products p ON p.id = i.product_id
          WHERE i.campaign_id = $1 AND i.product_id = $2 FOR UPDATE OF i`, [campaignId, line.productId]);
      const r = rows[0];
      if (!r) throw new FlashError('not_in_campaign', { productId: line.productId });
      if (!r.active || r.oos) throw new FlashError('unavailable', { productId: line.productId });
      if (!(r.flash_price > 0 && r.flash_price < r.orig_price)) throw new FlashError('invalid_price', { productId: line.productId });
      if (r.flash_price !== line.price) {
        throw new FlashError('price_changed', { productId: line.productId, price: r.flash_price });
      }
      const remaining = r.flash_stock - r.flash_sold;
      if (remaining < line.qty || (r.stock !== null && r.stock < line.qty)) {
        throw new FlashError('out_of_stock', { productId: line.productId, remaining: Math.max(0, Math.min(remaining, r.stock === null ? remaining : r.stock)) });
      }
      await client.query(
        'UPDATE flash_campaign_items SET flash_sold = flash_sold + $3 WHERE campaign_id = $1 AND product_id = $2',
        [campaignId, line.productId, line.qty]);
      reserved.push({ productId: line.productId, qty: line.qty, price: r.flash_price });
    }
    await client.query('COMMIT');
    return { campaignId, items: reserved };
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  ensureFlashTables, ensureCampaign, currentFlashSale, reserveFlashSale, eligiblePool,
  marketplaceTimezone, FlashError,
};
