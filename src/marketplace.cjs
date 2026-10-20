/* The marketplace expansion catalog: about 500 products (ids mx-0001...) and
 * their customer reviews, loaded from data/marketplace/*.json and written to
 * Postgres on every boot.
 *
 * The data lives in files, not in UI code: edit data/marketplace/products.json
 * or reviews.json (or re-run `npm run mx:generate`) and the next boot upserts
 * the change. Photos come from image-mapping.json, built by `npm run
 * mx:images` and cleaned by `npm run mx:validate`. A product with no photo
 * left shows the neutral placeholder for its category.
 *
 * Both tables are public (a catalog and public reviews). The seeded reviews
 * belong to fake reviewer ids ("seed:<product>:<n>"), never to a signed-in
 * user, so they can never grant anyone a verified purchase or an "already
 * reviewed" state.
 */

const fs = require('fs');
const path = require('path');
const { ALL_COLUMNS, upsertRows } = require('./schema.cjs');
const { toGeneratedRow } = require('./catalog-rows.cjs');

const DIR = path.join(__dirname, '..', 'data', 'marketplace');
const RANK_BASE = 200000;
const REVIEW_ID_BASE = 2000000;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  } catch {
    return fallback;
  }
}

/* Photos for one product as the credit records the product page reads:
 * [{ src, alt, photographer, photographerUrl, license, source }]. */
function creditsFor(p, mapping) {
  const ids = (mapping.products && mapping.products[p.id]) || [];
  const photos = ids.map((id) => mapping.photos && mapping.photos[id]).filter(Boolean);
  if (!photos.length) {
    return [{ src: '/images/placeholders/' + p.cat + '.svg', alt: p.name, photographer: '', source: 'placeholder' }];
  }
  return photos.map((ph) => ({
    src: ph.src,
    alt: p.name,
    photographer: ph.author,
    photographerUrl: ph.page,
    license: ph.license,
    source: 'commons',
  }));
}

function loadProducts() {
  const products = readJson('products.json', []);
  const mapping = readJson('image-mapping.json', { photos: {}, products: {} });
  return products.map((p, i) => {
    const row = toGeneratedRow(p, i, creditsFor(p, mapping));
    // The catalog fixes the seller's city; the id-hash rule would scatter them.
    return Object.assign(row, { province: p.province, city: p.city, rank: RANK_BASE + i });
  });
}

const REVIEW_COLUMNS = ['id', 'product_id', 'user_id', 'author', 'rating', 'body', 'verified', 'status',
  'created_at', 'updated_at', 'title', 'helpful', 'seller_reply', 'seller_reply_at'];

function loadReviews() {
  const reviews = readJson('reviews.json', []);
  const counters = new Map();
  return reviews.map((r, i) => {
    const n = (counters.get(r.pid) || 0) + 1;
    counters.set(r.pid, n);
    return {
      id: REVIEW_ID_BASE + i,
      product_id: r.pid,
      user_id: 'seed:' + r.pid + ':' + n,
      author: r.name,
      rating: r.rating,
      body: r.body,
      verified: !!r.verified,
      status: 'published',
      created_at: r.date,
      updated_at: r.date,
      title: r.title || '',
      helpful: r.helpful || 0,
      seller_reply: r.reply ? r.reply.text : null,
      seller_reply_at: r.reply ? r.reply.date : null,
    };
  });
}

async function seedMarketplaceProducts(pool) {
  const rows = loadProducts();
  for (let i = 0; i < rows.length; i += 100) await upsertRows(pool, rows.slice(i, i + 100), ALL_COLUMNS);
  return rows.length;
}

/* Reviews go in 300 at a time (14 columns each stays well under Postgres'
 * 65,535 parameter limit). Re-seeding refreshes text, never touches a
 * shopper's own review (those have ids below REVIEW_ID_BASE). */
async function seedMarketplaceReviews(pool) {
  const rows = loadReviews();
  const updates = REVIEW_COLUMNS.filter((c) => c !== 'id').map((c) => c + ' = EXCLUDED.' + c).join(', ');
  for (let i = 0; i < rows.length; i += 300) {
    const batch = rows.slice(i, i + 300);
    const values = [];
    const tuples = batch.map((row) => '(' + REVIEW_COLUMNS.map((c) => { values.push(row[c]); return '$' + values.length; }).join(', ') + ')');
    await pool.query(
      'INSERT INTO reviews (' + REVIEW_COLUMNS.join(', ') + ') VALUES ' + tuples.join(', ')
      + ' ON CONFLICT (id) DO UPDATE SET ' + updates, values);
  }
  return rows.length;
}

/* A marketplace product's card rating and review count ARE the average and
 * number of its reviews. Recomputed after seeding and whenever a shopper adds,
 * edits or removes a review, so the card and the product page cannot drift. */
async function refreshMarketplaceRatings(pool, productId) {
  const only = productId ? ' AND product_id = $1' : '';
  await pool.query(
    `UPDATE products p
        SET rating = a.avg, reviews = a.n
       FROM (SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg, COUNT(*)::int AS n
               FROM reviews
              WHERE status <> 'rejected' AND product_id LIKE 'mx-%'${only}
              GROUP BY product_id) a
      WHERE p.id = a.product_id`,
    productId ? [productId] : []);
}

const isMarketplaceId = (id) => /^mx-\d+$/.test(String(id));

module.exports = {
  loadProducts, loadReviews, seedMarketplaceProducts, seedMarketplaceReviews, refreshMarketplaceRatings, isMarketplaceId,
};
