import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const core = await import(path.join(root, 'public', 'js', 'flash-sale-core.js'));
const demo = await import(path.join(root, 'public', 'js', 'flash-demo.js'));

const TZ = 'Asia/Jakarta'; // UTC+7, no DST
const at = (iso) => Date.parse(iso);

function product(n, extra = {}) {
  return Object.assign({
    id: 'fx-' + String(n).padStart(3, '0'), name: 'Product ' + n, image: '/p/' + n + '.jpg',
    price: 800, orig: 1000, stock: 40, oos: false,
  }, extra);
}
const pool = (count, extra) => Array.from({ length: count }, (_, i) => product(i + 1, extra));

/* ----------------------------- pure rules ----------------------------- */

test('the date key follows the marketplace timezone, not UTC', () => {
  // 2026-10-12 18:00 UTC is already the 13th in Jakarta, still the 12th in New York.
  assert.equal(core.dateKeyFor(at('2026-10-12T18:00:00Z'), TZ), '2026-10-13');
  assert.equal(core.dateKeyFor(at('2026-10-12T18:00:00Z'), 'America/New_York'), '2026-10-12');
  assert.equal(core.dateKeyFor(at('2026-10-12T16:59:59Z'), TZ), '2026-10-12');
  assert.equal(core.dateKeyFor(at('2026-10-12T17:00:00Z'), TZ), '2026-10-13');
  // An unknown zone falls back to the default instead of throwing.
  assert.equal(core.resolveTimezone('Not/AZone'), core.DEFAULT_TIMEZONE);
});

test('a campaign runs from local midnight to the next local midnight', () => {
  const w = core.campaignWindow('2026-10-12', TZ);
  assert.equal(new Date(w.startsAt).toISOString(), '2026-10-11T17:00:00.000Z');
  assert.equal(new Date(w.endsAt).toISOString(), '2026-10-12T17:00:00.000Z');
});

test('a daylight-saving day is 23 hours long and the end is still local midnight', () => {
  const w = core.campaignWindow('2026-03-08', 'America/New_York'); // clocks go forward
  assert.equal((w.endsAt - w.startsAt) / 3600000, 23);
  assert.equal(new Date(w.startsAt).toISOString(), '2026-03-08T05:00:00.000Z');
  assert.equal(new Date(w.endsAt).toISOString(), '2026-03-09T04:00:00.000Z');
});

test('the countdown reaches zero exactly at the campaign end', () => {
  const w = core.campaignWindow('2026-10-12', TZ);
  assert.equal(core.remainingMs(w.endsAt, w.endsAt - 1), 1);
  assert.equal(core.remainingMs(w.endsAt, w.endsAt), 0);
  assert.equal(core.remainingMs(w.endsAt, w.endsAt + 5000), 0);
  assert.equal(core.campaignStatus(w, w.startsAt - 1), 'scheduled');
  assert.equal(core.campaignStatus(w, w.startsAt), 'active');
  assert.equal(core.campaignStatus(w, w.endsAt - 1), 'active');
  assert.equal(core.campaignStatus(w, w.endsAt), 'ended');
});

test('eligibility excludes zero stock, bad discounts, missing photo, name or price', () => {
  assert.equal(core.isEligible(product(1)), true);
  const bad = [
    { stock: 0 }, { stock: null }, { stock: -3 }, { oos: true }, { active: false }, { flashEligible: false },
    { orig: 800 }, { orig: 700 }, { orig: null }, { price: 0 }, { price: -5 }, { price: 12.5 },
    { image: '' }, { image: null, images: [] }, { name: '  ' }, { name: '' },
  ];
  for (const extra of bad) {
    assert.equal(core.isEligible(product(1, extra)), false, JSON.stringify(extra));
  }
  assert.equal(core.isEligible(product(1, { image: null, images: ['/a.jpg'] })), true);
});

test('the discount percentage is computed from the actual prices', () => {
  assert.equal(core.discountFrom(800, 1000), 20);
  assert.equal(core.discountFrom(333, 1000), 67);
  assert.equal(core.discountFrom(1000, 1000), 0);
  assert.deepEqual(core.offerFor(product(1, { stock: 400 })), { price: 800, orig: 1000, pct: 20, stock: core.FLASH_STOCK_CAP });
  assert.equal(core.offerFor(product(1, { stock: 7 })).stock, 7);
});

test('the same day always gives the same products, in the same order', () => {
  const p = pool(60);
  const a = core.selectDaily(p, '2026-10-12').map((x) => x.id);
  const b = core.selectDaily(p, '2026-10-12').map((x) => x.id);
  const shuffled = core.selectDaily([...p].reverse(), '2026-10-12').map((x) => x.id);
  assert.deepEqual(a, b);
  assert.deepEqual(a, shuffled, 'input order must not matter');
  assert.equal(a.length, core.FLASH_SIZE);
  assert.equal(new Set(a).size, a.length);
});

test('the next calendar day picks a different set, and rests the previous one', () => {
  const p = pool(60);
  const day1 = core.selectDaily(p, '2026-10-12').map((x) => x.id);
  const day2 = core.selectDaily(p, '2026-10-13', core.FLASH_SIZE, day1).map((x) => x.id);
  assert.notDeepEqual(day1, day2);
  assert.deepEqual(day2.filter((id) => day1.includes(id)), []);
  // Without the previous day's list the dates alone already reorder the pool.
  assert.notDeepEqual(day1, core.selectDaily(p, '2026-10-13').map((x) => x.id));
});

test('ineligible products and duplicate ids never get picked', () => {
  const p = pool(20).concat([product(1), product(99, { stock: 0 }), product(98, { orig: 800 })]);
  const ids = core.selectDaily(p, '2026-10-12', 25).map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(!ids.includes('fx-099') && !ids.includes('fx-098'));
  assert.equal(ids.length, 20);
});

test('an empty pool gives an empty selection; a short pool gives what exists', () => {
  assert.deepEqual(core.selectDaily([], '2026-10-12'), []);
  assert.deepEqual(core.selectDaily(null, '2026-10-12'), []);
  assert.deepEqual(core.selectDaily(pool(5, { stock: 0 }), '2026-10-12'), []);
  assert.equal(core.selectDaily(pool(5), '2026-10-12').length, 5);
});

test('when too few fresh products exist, the previous day is used only to top up', () => {
  const p = pool(14);
  const day1 = core.selectDaily(p, '2026-10-12').map((x) => x.id);
  const day2 = core.selectDaily(p, '2026-10-13', core.FLASH_SIZE, day1).map((x) => x.id);
  assert.equal(day2.length, core.FLASH_SIZE);
  assert.equal(new Set(day2).size, core.FLASH_SIZE);
  const freshIds = p.map((x) => x.id).filter((id) => !day1.includes(id));
  assert.equal(freshIds.length, 2);
  assert.deepEqual(day2.slice(0, 2).sort(), freshIds.sort(), 'the two fresh products come first');
});

test('the demo fallback rotates daily, is stable within a day and uses the same rules', () => {
  const a1 = demo.buildDemoCampaign(at('2026-10-12T03:00:00Z'));
  const a2 = demo.buildDemoCampaign(at('2026-10-12T15:00:00Z')); // same Jakarta day
  const b = demo.buildDemoCampaign(at('2026-10-12T17:00:00Z')); // midnight in Jakarta
  const ids = (c) => c.items.map((i) => i.product.id);
  assert.deepEqual(ids(a1), ids(a2));
  assert.equal(a1.campaign.demo, true);
  assert.equal(a1.campaign.dateKey, '2026-10-12');
  assert.equal(b.campaign.dateKey, '2026-10-13');
  assert.notDeepEqual(ids(a1), ids(b));
  assert.equal(a1.campaign.endsAt, b.campaign.startsAt);
});

/* ----------------------- persisted campaigns (Postgres) ----------------------- */

const baseUrl = process.env.TEST_DATABASE_URL || process.env.INLOOP_DATABASE_URL || process.env.DATABASE_URL;
let pg = null;
let admin = null;
let db = null;
let dbName = null;
let skipReason = baseUrl ? null : 'no database URL (set TEST_DATABASE_URL)';
let flash = null;

before(async () => {
  if (skipReason) return;
  try {
    const { Pool } = require('pg');
    pg = { Pool };
    admin = new Pool({ connectionString: baseUrl });
    dbName = 'flash_test_' + process.pid;
    await admin.query('CREATE DATABASE ' + dbName);
    const url = new URL(baseUrl);
    url.pathname = '/' + dbName;
    db = new Pool({ connectionString: url.toString() });
    const { ensureProductsTable } = require('../src/schema.cjs');
    flash = require('../src/flash-sale.cjs');
    await ensureProductsTable(db);
    await flash.ensureFlashTables(db);
    process.env.MARKETPLACE_TIMEZONE = TZ;
  } catch (err) {
    skipReason = 'database unavailable: ' + err.message;
    if (admin) await admin.end().catch(() => {});
    admin = null;
  }
});

after(async () => {
  if (db) await db.end();
  if (admin) {
    await admin.query('DROP DATABASE IF EXISTS ' + dbName + ' WITH (FORCE)').catch(() => {});
    await admin.end();
  }
});

async function reset(products) {
  await db.query('DELETE FROM flash_campaigns');
  await db.query('DELETE FROM products');
  for (const p of products) {
    await db.query(
      `INSERT INTO products (id, name, cat, brand, price, orig, rating, image, images, stock, oos, active, flash_eligible)
       VALUES ($1, $2, 'electronics', 'Acme', $3, $4, 4.5, $5, $6::jsonb, $7, $8, $9, $10)`,
      [p.id, p.name, p.price, p.orig, p.image || null, JSON.stringify(p.images || (p.image ? [p.image] : [])),
        p.stock === undefined ? null : p.stock, !!p.oos, p.active !== false, p.flashEligible !== false]);
  }
}
const ids = (sale) => sale.items.map((i) => i.product.id);
const DAY1 = at('2026-10-12T05:00:00Z'); // 12:00 in Jakarta

test('the campaign is built from eligible products only', async (t) => {
  if (skipReason) return t.skip(skipReason);
  const eligible = pool(15);
  const excluded = [
    product(100, { stock: 0 }), product(101, { stock: null }), product(102, { orig: 800 }), product(103, { orig: null }),
    product(104, { oos: true }), product(105, { active: false }), product(106, { flashEligible: false }),
    product(107, { image: '' }), product(108, { name: '' }), product(109, { price: 0, orig: 0 }),
  ];
  await reset(eligible.concat(excluded));
  const sale = await flash.currentFlashSale(db, DAY1);
  assert.equal(sale.state, 'active');
  assert.equal(sale.items.length, core.FLASH_SIZE);
  for (const id of ids(sale)) assert.ok(eligible.some((p) => p.id === id), id + ' should not be in the sale');
  const first = sale.items[0];
  assert.equal(first.offer.price, 800);
  assert.equal(first.offer.orig, 1000);
  assert.equal(first.offer.pct, 20);
  assert.equal(first.offer.stock, 40);
  assert.equal(first.offer.remaining, 40);
});

test('refreshing or loading later the same day returns the same products, from one stored campaign', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(40));
  const a = await flash.currentFlashSale(db, at('2026-10-11T17:00:01Z')); // 00:00:01 local
  const b = await flash.currentFlashSale(db, at('2026-10-12T16:59:59Z')); // 23:59:59 local
  assert.deepEqual(ids(a), ids(b));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM flash_campaigns')).rows[0].n, 1);
  assert.equal(a.campaign.dateKey, '2026-10-12');
  assert.equal(a.campaign.endsAt, at('2026-10-12T17:00:00Z'));
  // Two requests racing on a fresh day still create exactly one campaign.
  const [c, d] = await Promise.all([
    flash.currentFlashSale(db, at('2026-10-13T05:00:00Z')),
    flash.currentFlashSale(db, at('2026-10-13T05:00:01Z')),
  ]);
  assert.deepEqual(ids(c), ids(d));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM flash_campaigns')).rows[0].n, 2);
});

test('the next calendar day gets a new campaign with different products', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(40));
  const day1 = await flash.currentFlashSale(db, DAY1);
  const day2 = await flash.currentFlashSale(db, DAY1 + 24 * 3600 * 1000);
  assert.notEqual(day1.campaign.id, day2.campaign.id);
  assert.equal(day2.campaign.dateKey, '2026-10-13');
  assert.deepEqual(ids(day2).filter((id) => ids(day1).includes(id)), [], 'no repeat from the day before');
  assert.equal(day2.campaign.status, 'active');
  assert.equal((await db.query("SELECT status FROM flash_campaigns WHERE date_key = '2026-10-12'")).rows[0].status, 'active');
});

test('the date key follows the configured timezone', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(20));
  process.env.MARKETPLACE_TIMEZONE = 'America/New_York';
  try {
    const sale = await flash.currentFlashSale(db, at('2026-10-12T18:00:00Z')); // the 13th in Jakarta
    assert.equal(sale.campaign.dateKey, '2026-10-12');
    assert.equal(sale.campaign.timezone, 'America/New_York');
    assert.equal(sale.campaign.endsAt, at('2026-10-13T04:00:00Z'));
  } finally {
    process.env.MARKETPLACE_TIMEZONE = TZ;
  }
});

test('an empty pool shows an empty state and creates no campaign; a short pool shows what exists', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset([product(1, { stock: 0 }), product(2, { orig: 800 })]);
  const empty = await flash.currentFlashSale(db, DAY1);
  assert.equal(empty.state, 'empty');
  assert.deepEqual(empty.items, []);
  assert.equal(empty.campaign.endsAt, at('2026-10-12T17:00:00Z'));
  assert.equal((await db.query('SELECT count(*)::int AS n FROM flash_campaigns')).rows[0].n, 0);

  await reset(pool(5));
  const short = await flash.currentFlashSale(db, DAY1);
  assert.equal(short.items.length, 5);
  assert.equal(new Set(ids(short)).size, 5);
});

test('with too few fresh products the previous day tops up, without duplicates', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(14));
  const day1 = await flash.currentFlashSale(db, DAY1);
  const day2 = await flash.currentFlashSale(db, DAY1 + 24 * 3600 * 1000);
  assert.equal(day2.items.length, core.FLASH_SIZE);
  assert.equal(new Set(ids(day2)).size, core.FLASH_SIZE);
  const fresh = pool(14).map((p) => p.id).filter((id) => !ids(day1).includes(id));
  assert.deepEqual(ids(day2).slice(0, 2).sort(), fresh.sort());
});

test('a product cannot be assigned twice to the same campaign', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(20));
  const sale = await flash.currentFlashSale(db, DAY1);
  await assert.rejects(db.query(
    'INSERT INTO flash_campaign_items (campaign_id, product_id, orig_price, flash_price, flash_stock) VALUES ($1, $2, 1000, 800, 5)',
    [sale.campaign.id, ids(sale)[0]]), /duplicate key/);
  // The database also refuses a flash price that is not below the original.
  const other = (await db.query('SELECT id FROM products WHERE id <> ALL($1)', [ids(sale)])).rows[0].id;
  await assert.rejects(db.query(
    'INSERT INTO flash_campaign_items (campaign_id, product_id, orig_price, flash_price, flash_stock) VALUES ($1, $2, 1000, 1000, 5)',
    [sale.campaign.id, other]), /check constraint/);
});

test('a product that sells out of the real catalog drops out of a running campaign', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(20));
  const sale = await flash.currentFlashSale(db, DAY1);
  await db.query('UPDATE products SET stock = 0 WHERE id = $1', [ids(sale)[0]]);
  const again = await flash.currentFlashSale(db, DAY1 + 1000);
  assert.equal(again.items.length, core.FLASH_SIZE - 1);
  assert.ok(!ids(again).includes(ids(sale)[0]));
});

test('purchase check: reserves stock at the campaign price', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(20));
  const sale = await flash.currentFlashSale(db, DAY1);
  const [a, b] = ids(sale);
  const res = await flash.reserveFlashSale(db, [{ productId: a, qty: 3, price: 800 }, { productId: b, qty: 1, price: 800 }], DAY1);
  assert.equal(res.items.length, 2);
  const after1 = await flash.currentFlashSale(db, DAY1);
  assert.equal(after1.items.find((i) => i.product.id === a).offer.remaining, 37);
  assert.equal(after1.items.find((i) => i.product.id === a).offer.sold, 3);
});

test('purchase check: refuses a changed price, too much stock, an ended campaign and unknown items', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(20));
  const sale = await flash.currentFlashSale(db, DAY1);
  const [a, b] = ids(sale);
  const code = (p) => p.then(() => null, (e) => e.code);
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: a, qty: 1, price: 900 }], DAY1)), 'price_changed');
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: a, qty: 41, price: 800 }], DAY1)), 'out_of_stock');
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: 'fx-zzz', qty: 1, price: 800 }], DAY1)), 'not_in_campaign');
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: a, qty: 0, price: 800 }], DAY1)), 'bad_request');
  // The instant the campaign ends, purchases stop.
  const end = sale.campaign.endsAt;
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: a, qty: 1, price: 800 }], end - 1)), null);
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: a, qty: 1, price: 800 }], end)), 'campaign_ended');
  // A product taken off sale is refused.
  await db.query('UPDATE products SET active = FALSE WHERE id = $1', [b]);
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: b, qty: 1, price: 800 }], DAY1)), 'unavailable');
  // Real stock lower than the quantity is refused even if campaign stock remains.
  const c = ids(sale)[2];
  await db.query('UPDATE products SET stock = 2 WHERE id = $1', [c]);
  assert.equal(await code(flash.reserveFlashSale(db, [{ productId: c, qty: 3, price: 800 }], DAY1)), 'out_of_stock');
});

test('purchase check: one bad line reserves nothing, and the last unit cannot be sold twice', async (t) => {
  if (skipReason) return t.skip(skipReason);
  await reset(pool(20).map((p, i) => (i === 0 ? Object.assign(p, { stock: 1 }) : p)));
  const sale = await flash.currentFlashSale(db, DAY1);
  const [a, b] = ids(sale);
  const sumSold = async () => (await db.query('SELECT COALESCE(SUM(flash_sold), 0)::int AS n FROM flash_campaign_items')).rows[0].n;
  await assert.rejects(flash.reserveFlashSale(db, [{ productId: a, qty: 1, price: 800 }, { productId: b, qty: 1, price: 1 }], DAY1));
  assert.equal(await sumSold(), 0);
  const limited = await db.query('SELECT product_id FROM flash_campaign_items WHERE flash_stock = 1');
  if (limited.rows.length) {
    const only = limited.rows[0].product_id;
    const results = await Promise.allSettled([
      flash.reserveFlashSale(db, [{ productId: only, qty: 1, price: 800 }], DAY1),
      flash.reserveFlashSale(db, [{ productId: only, qty: 1, price: 800 }], DAY1),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  }
});
