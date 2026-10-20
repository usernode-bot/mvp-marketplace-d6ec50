/* Offline checks on data/marketplace/*.json. Exit code 1 when any fails.
 *
 *   npm run mx:verify
 *
 * Asserts what the expansion promises: product counts, unique names, the
 * discount and sold-out shares, ratings that equal the average of the reviews
 * behind them, review text that is varied and dated inside the last year,
 * and (when the photos have been fetched) the image rules.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discountPct } from '../public/js/data.js';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'marketplace');
const read = (f) => JSON.parse(readFileSync(join(DATA, f), 'utf8'));
const products = read('products.json');
const reviews = read('reviews.json');
const mapping = existsSync(join(DATA, 'image-mapping.json')) ? read('image-mapping.json') : null;

const CATEGORIES = ['electronics', 'fashion', 'beauty', 'home', 'sports', 'groceries', 'accessories'];
const CITIES = new Set(['Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Surabaya', 'Bandung',
  'Medan', 'Semarang', 'Makassar', 'Batam', 'Depok', 'Bogor', 'Malang']);
const REF = Date.parse('2026-10-07T09:00:00Z');
const failures = [];
const check = (ok, msg) => { if (!ok) failures.push(msg); };

check(products.length >= 480 && products.length <= 520, `about 500 products, found ${products.length}`);
check(new Set(products.map((p) => p.id)).size === products.length, 'product ids are unique');
check(new Set(products.map((p) => p.name.toLowerCase())).size === products.length, 'product names are unique');
CATEGORIES.forEach((c) => {
  const n = products.filter((p) => p.cat === c).length;
  check(n >= 60 && n <= 80, `category ${c} has ${n} products (expected roughly 70)`);
});

const byProduct = new Map();
reviews.forEach((r) => { if (!byProduct.has(r.pid)) byProduct.set(r.pid, []); byProduct.get(r.pid).push(r); });

products.forEach((p) => {
  const where = p.id + ' ' + p.name;
  check(CITIES.has(p.city), `${where}: city ${p.city} is not an allowed seller city`);
  check(p.features.length >= 3 && p.features.length <= 5, `${where}: needs 3-5 spec bullets`);
  check(p.description && p.price > 0 && Number.isInteger(p.price), `${where}: description and integer price`);
  if (p.orig) {
    const pct = discountPct(p);
    check(pct >= 10 && pct <= 50, `${where}: discount ${pct}% outside 10-50`);
  }
  const mine = byProduct.get(p.id) || [];
  check(mine.length >= 5 && mine.length <= 15, `${where}: ${mine.length} reviews (expected 5-15)`);
  check(p.reviews === mine.length, `${where}: reviews ${p.reviews} != ${mine.length} generated`);
  const sum = mine.reduce((a, r) => a + r.rating, 0);
  const avg = Math.floor((sum * 20 + mine.length) / (2 * mine.length)) / 10;
  check(p.rating === avg, `${where}: rating ${p.rating} != review average ${avg}`);
  check(p.rating >= 3.2 && p.rating <= 4.9, `${where}: rating ${p.rating} outside 3.2-4.9`);
  // Sentiment follows the rating.
  const high = mine.filter((r) => r.rating >= 4).length / mine.length;
  if (p.rating >= 4.5) check(high >= 0.6, `${where}: rated ${p.rating} but only ${Math.round(high * 100)}% of reviews are 4-5 stars`);
  if (p.rating <= 3.5) check(mine.filter((r) => r.rating <= 3).length >= 2, `${where}: rated ${p.rating} but has fewer than 2 reviews of 3 stars or less`);
});

const bodies = new Set();
reviews.forEach((r) => {
  check(r.rating >= 1 && r.rating <= 5 && r.title && r.body && r.name, `review of ${r.pid}: rating, title, body and name are needed`);
  const age = (REF - Date.parse(r.date)) / 86400000;
  check(age >= 0 && age <= 365, `review of ${r.pid} is ${Math.round(age)} days old (must be within a year)`);
  check(typeof r.verified === 'boolean' && Number.isInteger(r.helpful), `review of ${r.pid}: verified flag and helpful count`);
  check(!bodies.has(r.body.toLowerCase()), `two reviews share the text "${r.body.slice(0, 40)}..."`);
  bodies.add(r.body.toLowerCase());
  if (r.reply) check(r.rating <= 2, `review of ${r.pid}: seller replies only on negative reviews`);
});
check(reviews.filter((r) => r.rating <= 2).length >= 100, 'there are honest 1-2 star reviews');
check(reviews.filter((r) => r.reply).length >= 40, 'some negative reviews carry a seller reply');

const discounted = products.filter((p) => p.orig).length / products.length;
check(discounted >= 0.4 && discounted <= 0.6, `about half the products are discounted (${Math.round(discounted * 100)}%)`);
const soldOut = products.filter((p) => p.stock === 0).length / products.length;
check(soldOut >= 0.03 && soldOut <= 0.08, `about 5% sold out (${Math.round(soldOut * 1000) / 10}%)`);

if (mapping) {
  const uses = new Map();
  const cats = new Map();
  products.forEach((p) => {
    const ids = mapping.products[p.id] || [];
    check(ids.length === new Set(ids).size, `${p.id}: a photo is repeated within the product`);
    // 3-4 photos when the type's pool allows; fewer is reported, never padded with a repeat. 0 means the category placeholder.
    check(ids.length <= 4, `${p.id}: ${ids.length} photos (max 4)`);
    ids.forEach((id) => {
      uses.set(id, (uses.get(id) || 0) + 1);
      if (cats.has(id) && cats.get(id) !== p.cat) failures.push(`photo ${id} is on products of two categories`);
      cats.set(id, p.cat);
    });
  });
  uses.forEach((n, id) => check(n <= 2, `photo ${id} is on ${n} products (max 2)`));
} else {
  console.log('No image-mapping.json yet: image rules not checked.');
}

if (failures.length) {
  console.error(failures.length + ' check(s) failed:');
  failures.slice(0, 40).forEach((f) => console.error('  - ' + f));
  process.exit(1);
}
if (mapping) {
  const n = (f) => products.filter((p) => f((mapping.products[p.id] || []).length)).length;
  console.log(`Photos: ${n((c) => c >= 3)} products have 3-4, ${n((c) => c > 0 && c < 3)} have 1-2, ${n((c) => c === 0)} use the category placeholder.`);
}
console.log(`OK: ${products.length} products, ${reviews.length} reviews${mapping ? ', image rules hold' : ''}.`);
