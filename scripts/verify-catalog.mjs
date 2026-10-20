/* Verification checklist for the generated catalog.
 *
 *   npm run verify:catalog              checks the generated files (offline)
 *   npm run verify:catalog -- --db      also checks the database (DATABASE_URL)
 *
 * Prints one line per check, [PASS] / [FAIL] / [SKIP], and exits non-zero if
 * anything failed. Image checks are skipped until `npm run fetch:images` has
 * produced a mapping; database checks are skipped without --db.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../public/js/data.js';
import { TAXONOMY, targetCounts, totalTarget } from './lib/taxonomy.mjs';
import { isRealBrand } from './lib/brands.mjs';

const require = createRequire(import.meta.url);
const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'generated');
const results = [];
const check = (name, ok, detail = '') => results.push({ name, status: ok ? 'PASS' : 'FAIL', detail });
const skip = (name, why) => results.push({ name, status: 'SKIP', detail: why });
const readJson = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));

if (!existsSync(join(DATA, 'products.json'))) {
  console.error('data/generated/products.json is missing. Run `npm run generate:products` first.');
  process.exit(1);
}
const products = readJson('products.json');
const sample = existsSync(join(DATA, 'sample-products.json')) ? readJson('sample-products.json') : [];
const bad = (list, fn) => list.filter((p) => !fn(p)).map((p) => p.id);
const ids = (list) => (list.length ? ' e.g. ' + list.slice(0, 5).join(', ') : '');

/* ---- Distribution ------------------------------------------------------ */
check('About 1,000 products', products.length >= 950 && products.length <= 1050, products.length + ' products');
const want = targetCounts();
const off = [];
for (const cat of Object.keys(want)) {
  for (const sub of Object.keys(want[cat])) {
    const n = products.filter((p) => p.cat === cat && p.sub === sub).length;
    if (n !== want[cat][sub]) off.push(`${cat}/${sub} ${n}/${want[cat][sub]}`);
  }
}
check('Category and subcategory counts match the distribution', off.length === 0 && products.length === totalTarget(), off.join('; '));
const appCats = new Set(['electronics', 'fashion', 'beauty', 'home', 'sports', 'groceries', 'accessories']);
check('Every category and subcategory exists in the app', products.every((p) => appCats.has(p.cat) && TAXONOMY[p.cat][p.sub]));

/* ---- Uniqueness -------------------------------------------------------- */
const dup = (key) => {
  const seen = new Set();
  return products.filter((p) => { const v = key(p); const d = seen.has(v); seen.add(v); return d; }).map((p) => p.id);
};
const dupIds = dup((p) => p.id);
check('Product ids are unique', dupIds.length === 0, ids(dupIds));
const dupNames = dup((p) => p.name.toLowerCase());
check('Product names are unique', dupNames.length === 0, ids(dupNames));
const dupDesc = dup((p) => p.description);
check('Descriptions are unique', dupDesc.length === 0, ids(dupDesc));
const brands = new Set(products.map((p) => p.brand));
check('Brands are fictional (none is a known real brand)', ![...brands].some(isRealBrand), [...brands].filter(isRealBrand).join(', '));
const existing = new Set(PRODUCTS.map((p) => p.brand.toLowerCase()));
check('No brand collides with a brand the app already ships', ![...brands].some((b) => existing.has(b.toLowerCase())));
check('At least 40 distinct brands', brands.size >= 40, brands.size + ' brands');

/* ---- Content ----------------------------------------------------------- */
const kinds = new Set(products.map((p) => p.cat + '/' + p.type));
check('Specs are category-specific (4+ product-specific rows each)', bad(products, (p) => p.specs.filter((r) => !['Brand', 'Model', 'Product ID', 'Warranty'].includes(r.l)).length >= 4) .length === 0);
check('No empty spec values', bad(products, (p) => p.specs.every((r) => r.l && r.v)).length === 0);
check('Key features: 4 to 8 per product', bad(products, (p) => p.features.length >= 4 && p.features.length <= 8).length === 0);
check('Variants present on every product', bad(products, (p) => p.variants.length >= 1 && p.variants.every((v) => v.options.length >= 2)).length === 0);
check('Prices are integer cents', bad(products, (p) => Number.isInteger(p.price) && p.price > 0 && (p.orig === null || (Number.isInteger(p.orig) && p.orig > p.price))).length === 0);
check('Ratings are 3.5 to 5.0', bad(products, (p) => p.rating >= 3.5 && p.rating <= 5).length === 0);
check('Stock is a non-negative integer', bad(products, (p) => Number.isInteger(p.stock) && p.stock >= 0).length === 0);
const withStock = products.filter((p) => p.stock === 0).length;
check('A realistic share is sold out (2% to 12%)', withStock >= products.length * 0.02 && withStock <= products.length * 0.12, withStock + ' sold out');
check('Listing dates span at least 90 days', (Math.max(...products.map((p) => p.age)) - Math.min(...products.map((p) => p.age))) >= 90);
const text = (p) => [p.name, p.description, ...p.features, ...p.specs.map((r) => r.l + ' ' + r.v), ...p.variants.flatMap((v) => [v.name, ...v.options])].join(' ');
const banned = /\b(gun|rifle|pistol|weapon|knife|sword|nude|sexy|sex|casino|gambl\w*|betting|lottery|loot box|alcohol|beer|wine|vodka|whiskey|cannabis|tobacco|cigarette)\b/i;
check('Content rules: no weapons, sexual, gambling or alcohol content', bad(products, (p) => !banned.test(text(p))).length === 0, ids(bad(products, (p) => !banned.test(text(p)))));
check('No em dashes in user-facing text', bad(products, (p) => !/[—]/.test(text(p))).length === 0);

/* ---- Sample ------------------------------------------------------------ */
const sampleCats = {};
sample.forEach((p) => { sampleCats[p.cat] = (sampleCats[p.cat] || 0) + 1; });
check('Sample preview: exactly 3 products per category', sample.length === 21 && Object.values(sampleCats).every((n) => n === 3) && Object.keys(sampleCats).length === 7, JSON.stringify(sampleCats));
check('Sample products exist in the full set', sample.every((s) => products.some((p) => p.id === s.id)));

/* ---- Images ------------------------------------------------------------ */
const mapFile = join(DATA, 'image-mapping.json');
if (!existsSync(mapFile)) {
  skip('Images: 3 to 5 verified photos per product', 'no image-mapping.json yet (run `npm run fetch:images` with PEXELS_API_KEY)');
  skip('Images: attribution saved for every photo', 'no image-mapping.json yet');
  skip('Images: report files written', 'no image-mapping.json yet');
} else {
  const mapping = readJson('image-mapping.json').products;
  const flaggedFile = join(DATA, 'reports', 'no-suitable-image.json');
  const flagged = existsSync(flaggedFile) ? new Set(JSON.parse(readFileSync(flaggedFile, 'utf8')).products.map((p) => p.id)) : new Set();
  const photos = (p) => mapping[p.id] || [];
  const lack = products.filter((p) => (photos(p).length < 3 || photos(p).length > 5) && !flagged.has(p.id)).map((p) => p.id);
  check('Images: 3 to 5 verified photos per product (or flagged)', lack.length === 0, ids(lack));
  check('Images: no photo repeated within a product', bad(products, (p) => new Set(photos(p).map((c) => c.id)).size === photos(p).length).length === 0);
  check('Images: attribution saved for every photo', bad(products, (p) => photos(p).every((c) => c.photographer && c.photographerUrl && c.pexelsUrl && /^https:\/\/images\.pexels\.com\//.test(c.src))).length === 0);
  check('Images: report files written', existsSync(flaggedFile) && existsSync(join(DATA, 'reports', 'image-mapping-report.json')));
  console.log(`  (${flagged.size} product(s) flagged for no suitable image)`);
}

/* ---- Database ---------------------------------------------------------- */
if (!process.argv.includes('--db')) {
  skip('Database: rows, indexes and queries', 'pass --db with DATABASE_URL to check the database');
} else if (!process.env.DATABASE_URL) {
  check('Database: DATABASE_URL is set', false, 'export DATABASE_URL and run again');
} else {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const n = (await pool.query('SELECT COUNT(*)::int AS n FROM products WHERE generated')).rows[0].n;
    check('Database: generated products inserted', n > 0, n + ' rows');
    const dupDb = (await pool.query('SELECT COUNT(*)::int AS n FROM (SELECT id FROM products GROUP BY id HAVING COUNT(*) > 1) d')).rows[0].n;
    check('Database: no duplicate ids', dupDb === 0);
    const idx = (await pool.query("SELECT indexdef FROM pg_indexes WHERE tablename = 'products'")).rows.map((r) => r.indexdef).join('\n');
    for (const [label, re] of [['category', /\(cat\)/], ['subcategory', /\(cat, sub\)/], ['brand', /\(brand\)/], ['price', /\(price\)/], ['rating', /\(rating/], ['created_at', /\(created_at/], ['text search', /gin/i]]) {
      check('Database: index on ' + label, re.test(idx));
    }
    const noPhoto = (await pool.query("SELECT COUNT(*)::int AS n FROM products WHERE generated AND jsonb_array_length(images) < 3")).rows[0].n;
    check('Database: every generated product has 3+ photos', noPhoto === 0, noPhoto + ' without');
  } finally {
    await pool.end();
  }
}

/* ---- Report ------------------------------------------------------------ */
let failed = 0;
for (const r of results) {
  if (r.status === 'FAIL') failed += 1;
  console.log(`[${r.status}] ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`);
}
console.log(`\n${results.filter((r) => r.status === 'PASS').length} passed, ${failed} failed, ${results.filter((r) => r.status === 'SKIP').length} skipped.`);
process.exit(failed ? 1 : 0);
