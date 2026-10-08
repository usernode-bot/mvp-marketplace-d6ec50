/* Step 1 of the marketplace expansion: about 500 NEW products and their
 * customer reviews.
 *
 *   npm run mx:generate
 *
 * Offline and deterministic (no key, no database): the same run always writes
 * the same files.
 *   data/marketplace/products.json   500 products (ids mx-0001...), no photos yet
 *   data/marketplace/reviews.json    5-15 reviews per product
 *
 * Product types, specs, features and variants come from lib/taxonomy.mjs (the
 * same table the gx catalog uses); the counts per category, the brands, the
 * sellers' cities, the discounts, the stock and above all the ratings are this
 * script's own. A product's rating and review count are NOT drawn separately:
 * they are the average and the number of the reviews written for it, so the
 * card, the product page and the breakdown can never disagree.
 *
 * Photos are attached by fetch-marketplace-images.mjs; the server joins them
 * at boot.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../public/js/data.js';
import { LOCATIONS } from '../public/js/locations.js';
import { TAXONOMY, CATEGORY_NAMES } from './lib/taxonomy.mjs';
import { makeRng } from './lib/rng.mjs';
import { makeBrandPools } from './lib/brands.mjs';
import { generate as generateGx } from './generate-products.mjs';
import {
  ASPECTS, FRAGMENTS, GOOD_FRAMES, BAD_FRAMES, UNIVERSAL_CONS, SELLER_REPLIES, OPENERS, CLOSERS, MINOR_GRIPES, TITLES, FIRST_NAMES, LAST_NAMES,
} from './lib/review-bank.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT_DIR = join(ROOT, 'data', 'marketplace');
const REF_DATE = Date.parse('2026-10-07T09:00:00Z');
const DAY = 86400000;

/* About 70 a category, varied on purpose. The total is 500. */
export const CATEGORY_TARGETS = { electronics: 76, fashion: 72, beauty: 66, home: 74, sports: 70, groceries: 66, accessories: 76 };
const BRANDS_PER_CATEGORY = { electronics: 12, fashion: 11, beauty: 9, home: 10, sports: 8, groceries: 8, accessories: 9 };
const NO_WARRANTY = new Set(['groceries', 'beauty']);
const WARRANTY = { electronics: '24 months', fashion: '12 months', home: '12 months', sports: '12 months', accessories: '12 months' };

/* Seller cities, weighted roughly by how many sellers a marketplace has there.
 * Jakarta is one of the app's five Jakarta districts (its location list has no
 * plain "Jakarta"), and together they carry the largest share. */
const CITIES = [['Jakarta Selatan', 6], ['Jakarta Pusat', 4], ['Jakarta Barat', 4], ['Jakarta Timur', 4], ['Jakarta Utara', 4], ['Surabaya', 14], ['Bandung', 12], ['Medan', 8], ['Semarang', 8], ['Makassar', 8],
  ['Batam', 6], ['Depok', 7], ['Bogor', 7], ['Malang', 8]];
const PROVINCE_OF = new Map(LOCATIONS.flatMap((prov) => prov.cities.map((c) => [c.name, prov.name])));

const lowerFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const pad = (n, w) => String(n).padStart(w, '0');
const round1 = (x) => Math.round(x * 10) / 10;

function weighted(rng, pairs) {
  let r = rng.next() * pairs.reduce((n, [, w]) => n + w, 0);
  for (const [v, w] of pairs) { r -= w; if (r <= 0) return v; }
  return pairs[0][0];
}

/* Largest-remainder split of `total` across weights. */
function split(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const exact = weights.map((w) => (w / sum) * total);
  const out = exact.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  exact.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left-- > 0) out[i] += 1; });
  return out;
}

/* The type of each product slot in a category: subcategories take a share of
 * the target proportional to the gx catalog's, types share a subcategory
 * evenly. */
function slotsFor(cat) {
  const subs = Object.keys(TAXONOMY[cat]);
  const perSub = split(CATEGORY_TARGETS[cat], subs.map((s) => TAXONOMY[cat][s].count));
  const slots = [];
  subs.forEach((subId, i) => {
    const types = TAXONOMY[cat][subId].types;
    split(perSub[i], types.map(() => 1)).forEach((n, k) => { for (let j = 0; j < n; j++) slots.push({ subId, type: types[k] }); });
  });
  return slots;
}

function priceCents(rng, [min, max]) {
  const dollars = min + (max - min) * Math.pow(rng.next(), 1.6);
  const rounded = Math.max(min, Math.round(dollars));
  return rounded >= 100 && rng.next() < 0.4 ? rounded * 100 : Math.max(199, rounded * 100 - 1);
}

function describe(rng, name, brand, type, features, specs) {
  const [u1, u2, u3] = rng.shuffle(type.uses);
  const [f1, f2, f3] = features.map(lowerFirst);
  const s = rng.shuffle(specs.filter((r) => r.v));
  const sp1 = s[0].l + ': ' + s[0].v;
  const sp2 = s[1].l + ': ' + s[1].v;
  const series = name.split(' ')[1];
  return rng.pick([
    () => `${name} is made for ${u1} and ${u2}. Standout features: ${f1}, ${f2} and ${f3}. ${sp1}; ${sp2}.`,
    () => `Looking for something dependable for ${u1}? ${name} delivers: ${f1}, ${f2} and ${f3}. ${sp1}; ${sp2}. A sensible pick from ${brand}.`,
    () => `This ${type.noun.toLowerCase()} from ${brand}'s ${series} line suits ${u1} as well as ${u2}. Highlights: ${f1} and ${f2}. ${sp1}; ${sp2}.`,
    () => `From ${u1} to ${u3}, ${name} keeps up. What you get: ${f1}, ${f2} and ${f3}. Plus ${sp1}; ${sp2}.`,
  ])();
}

/* ---- ratings ---------------------------------------------------------- */

/* Share of 5..1 star reviews around a target mean (interpolated between the
 * shapes real listings have). */
const SHAPES = [
  [4.8, [0.86, 0.11, 0.02, 0.005, 0.005]],
  [4.5, [0.68, 0.22, 0.06, 0.02, 0.02]],
  [4.2, [0.52, 0.28, 0.1, 0.05, 0.05]],
  [3.9, [0.4, 0.28, 0.14, 0.09, 0.09]],
  [3.6, [0.3, 0.26, 0.17, 0.12, 0.15]],
  [3.3, [0.22, 0.22, 0.2, 0.16, 0.2]],
];
function shapeFor(mean) {
  if (mean >= SHAPES[0][0]) return SHAPES[0][1];
  for (let i = 0; i < SHAPES.length - 1; i++) {
    const [hi, a] = SHAPES[i];
    const [lo, b] = SHAPES[i + 1];
    if (mean <= hi && mean >= lo) {
      const t = (mean - lo) / (hi - lo);
      return a.map((x, k) => x * t + b[k] * (1 - t));
    }
  }
  return SHAPES[SHAPES.length - 1][1];
}

/* `n` star ratings whose average rounds to `mean` (to 0.1). Draws from the
 * shape, then nudges single reviews until the average is within 0.04. */
function starsFor(rng, n, mean) {
  const shape = shapeFor(mean);
  const draw = () => {
    let r = rng.next();
    for (let i = 0; i < 5; i++) { r -= shape[i]; if (r <= 0) return 5 - i; }
    return 1;
  };
  const stars = Array.from({ length: n }, draw);
  const avg = () => stars.reduce((a, b) => a + b, 0) / n;
  for (let guard = 0; guard < 400 && Math.abs(avg() - mean) > 0.04; guard++) {
    const up = avg() < mean;
    const pool = stars.map((s, i) => [s, i]).filter(([s]) => (up ? s < 5 : s > 1));
    if (!pool.length) break;
    const [, i] = rng.pick(pool);
    stars[i] += up ? 1 : -1;
  }
  return stars;
}

/* ---- reviews ---------------------------------------------------------- */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pickName(rng, taken) {
  for (let i = 0; i < 40; i++) {
    const first = rng.pick(FIRST_NAMES);
    const roll = rng.next();
    const name = roll < 0.45 ? `${first} ${rng.pick(LAST_NAMES)}`
      : roll < 0.7 ? `${first} ${rng.pick(LAST_NAMES)[0]}.`
        : roll < 0.85 ? first + rng.int(2, 99)
          : `${first} ${rng.pick(FIRST_NAMES)}`;
    if (!taken.has(name)) { taken.add(name); return name; }
  }
  const name = rng.pick(FIRST_NAMES) + ' ' + rng.pick(LAST_NAMES) + ' ' + rng.int(100, 999);
  taken.add(name);
  return name;
}

const fillTitle = (t, label) => t.replace('{t}', label.toLowerCase());

function aspectSentence(rng, aspect, band) {
  const A = aspect[0].toUpperCase() + aspect.slice(1);
  if (band === 'pos') {
    return rng.pick([
      `${A} is ${rng.pick(['excellent for the price', 'better than I expected', 'really solid', 'spot on', 'exactly what I wanted'])}.`,
      `I was most impressed by the ${aspect}.`,
      `The ${aspect} alone makes it worth buying.`,
      `Special mention for the ${aspect}, which feels well thought out.`,
    ]);
  }
  if (band === 'mid') {
    return rng.pick([
      `${A} is fine, but nothing special.`,
      `The ${aspect} is good, although I expected a bit more.`,
      `I like the ${aspect}, but it has its limits.`,
    ]);
  }
  return rng.pick([
    `${A} is ${rng.pick(['disappointing', 'not what I expected', 'mediocre at this price', 'worse than the listing suggested', 'the weak point'])}.`,
    `My biggest issue is the ${aspect}.`,
    `I really wish the ${aspect} were better.`,
  ]);
}

function reviewFor(rng, p, frags, aspects, stars, used, takenNames) {
  const band = stars >= 4 ? 'pos' : stars === 3 ? 'mid' : 'neg';
  const label = p.typeLabel;
  const variant = p.variants[0];
  const option = variant ? rng.pick(variant.options) : null;
  const unit = rng.pick(['weeks', 'days', 'months']);
  const dur = unit === 'months' ? rng.int(1, 5) : unit === 'weeks' ? rng.int(1, 6) : rng.int(3, 20);
  const good = () => rng.pick(GOOD_FRAMES).replace('{f}', rng.pick(frags[0]));
  const bad = () => rng.pick(BAD_FRAMES).replace('{f}', rng.pick(frags[1]));
  const variantLine = () => (/colou?r|finish|shade/i.test(variant.name) ? `Got mine in ${option}.` : `I bought the ${option} version.`);
  let body = '';
  for (let attempt = 0; attempt < 40; attempt++) {
    const bits = [rng.pick(OPENERS[band])];
    if (stars >= 4) {
      bits.push(good());
      bits.push(aspectSentence(rng, rng.pick(aspects), 'pos'));
      if (stars === 4 && rng.next() < 0.7) bits.push(rng.pick(MINOR_GRIPES));
    } else if (stars === 3) {
      bits.push(good());
      bits.push(aspectSentence(rng, rng.pick(aspects), 'mid'));
      bits.push(bad());
    } else {
      bits.push(rng.next() < 0.75 ? bad() : rng.pick(UNIVERSAL_CONS));
      bits.push(aspectSentence(rng, rng.pick(aspects), 'neg'));
      if (rng.next() < 0.4) bits.push(rng.pick(UNIVERSAL_CONS));
    }
    if (rng.next() < 0.5) bits.splice(2, 0, `Used it for ${dur} ${dur === 1 ? unit.slice(0, -1) : unit}.`);
    if (option && rng.next() < 0.3) bits.splice(2, 0, variantLine());
    bits.push(rng.pick(CLOSERS[band]));
    const seen = new Set();
    body = bits.filter((b) => !seen.has(b) && seen.add(b)).join(' ');
    if (attempt > 20) body += ` Order #${rng.int(10000, 99999)}.`;
    if (!used.has(body.toLowerCase())) break;
  }
  used.add(body.toLowerCase());
  return {
    name: pickName(rng, takenNames),
    rating: stars,
    title: fillTitle(rng.pick(TITLES[stars]), label),
    body,
  };
}

function reviewsFor(rng, p, stars, ctx) {
  const frags = FRAGMENTS[p.type];
  const aspects = ASPECTS[p.type];
  const takenNames = new Set();
  const born = Date.parse(p.createdAt);
  const span = Math.max(3, Math.floor((REF_DATE - born) / DAY));
  const out = stars.map((s) => {
    const r = reviewFor(rng, p, frags, aspects, s, ctx.used, takenNames);
    // Recent weeks get more reviews than old ones, never before the listing.
    const daysAgo = Math.min(span, Math.floor(Math.pow(rng.next(), 1.35) * span), 364);
    r.date = new Date(REF_DATE - daysAgo * DAY - rng.int(0, 80000) * 1000).toISOString();
    r.verified = rng.next() < 0.8;
    // Detailed, critical reviews are voted up more often than a plain "great".
    const base = s <= 2 ? 6 + rng.int(0, 34) : s === 3 ? 2 + rng.int(0, 16) : rng.int(0, 22);
    r.helpful = rng.next() < 0.3 ? rng.int(0, 2) : base;
    if (s <= 2 && rng.next() < 0.55) {
      const after = new Date(Date.parse(r.date) + rng.int(1, 4) * DAY);
      r.reply = { text: rng.pick(SELLER_REPLIES), date: new Date(Math.min(after.getTime(), REF_DATE)).toISOString() };
    }
    return r;
  });
  return out;
}

/* ---- products --------------------------------------------------------- */

export function generate() {
  const taken = PRODUCTS.map((p) => p.brand).concat(generateGx().map((p) => p.brand));
  const gxNames = new Set(generateGx().map((p) => p.name.toLowerCase()));
  const pools = makeBrandPools(BRANDS_PER_CATEGORY, taken, 'mx-brands:');
  const names = new Set(PRODUCTS.map((p) => p.name.toLowerCase()).concat([...gxNames]));
  const descriptions = new Set();
  const ctx = { used: new Set() };
  const products = [];
  const reviews = [];

  // Interleave the categories so the default (recommended) order is varied
  // instead of 76 electronics first.
  const queues = Object.keys(TAXONOMY).map((cat) => slotsFor(cat).map((s) => ({ cat, ...s })));
  const slots = [];
  for (let i = 0; queues.some((q) => i < q.length); i++) queues.forEach((q) => { if (i < q.length) slots.push(q[i]); });

  slots.forEach((slot, index) => {
    const { cat, subId, type } = slot;
    const id = 'mx-' + pad(index + 1, 4);
    const rng = makeRng('mx-product:' + id);
    const brand = rng.pick(pools[cat]);

    let series = rng.pick(type.series);
    let name;
    let model;
    let guard = 0;
    do {
      model = rng.pick(['', 'X', 'S', 'M', 'Z', 'V']) + rng.int(2, 99) * 10 + rng.pick(['', '', ' Pro', ' Plus', ' Lite', ' Max', ' II']);
      name = `${brand} ${series} ${model} ${type.noun}`.replace(/\s+/g, ' ');
      if (guard++ > 20) series = rng.pick(type.series);
    } while (names.has(name.toLowerCase()));
    names.add(name.toLowerCase());

    const specs = type.specs.map(([l, opts]) => ({ l, v: rng.pick(opts) }));
    const features = rng.shuffle(type.features).slice(0, Math.min(type.features.length, rng.int(3, 5)));
    const variants = type.variants.map(([vName, options]) => {
      const keep = options.length <= 3 ? options.length : rng.int(Math.min(3, options.length), options.length);
      return { name: vName, options: options.slice(0, keep) };
    });
    let description = describe(rng, name, brand, type, features, specs);
    while (descriptions.has(description)) description += ' Model ' + id + '.';
    descriptions.add(description);

    const price = priceCents(rng, type.price);
    const [lo, hi] = type.price;
    const priceRank = hi > lo ? Math.min(1, Math.max(0, (price / 100 - lo) / (hi - lo))) : 0.5;

    // Quality drives the rating and, with price, how many people bought it.
    const quality = Math.pow(rng.next(), 0.5);
    const mean = Math.round((3.3 + 1.55 * quality) * 20) / 20;
    const popularity = Math.min(1, Math.max(0, 0.45 * rng.next() + 0.35 * quality + 0.2 * (1 - priceRank)));
    const n = Math.min(15, Math.max(5, 5 + Math.round(popularity * popularity * 10 + (rng.next() - 0.5) * 2)));

    const roll = rng.next();
    const age = rng.int(25, 360);
    const created = new Date(REF_DATE - age * DAY - rng.int(0, 86000) * 1000);
    const product = {
      id, name, cat, sub: subId, brand, type: type.key, typeLabel: type.noun,
      createdAt: created.toISOString(),
    };

    const stars = starsFor(rng, n, mean);
    const mine = reviewsFor(rng, { ...product, variants }, stars, ctx);
    const rating = Math.floor((stars.reduce((a, b) => a + b, 0) * 20 + n) / (2 * n)) / 10;

    // Sold grows with popularity and falls with price; groceries move fastest.
    const volume = cat === 'groceries' ? 3.2 : cat === 'beauty' ? 1.8 : 1;
    const sold = Math.round(n * (14 + rng.next() * 40) * (0.5 + popularity * 2.2) * (1.6 - priceRank) * volume);

    // About half are on sale, 10-50% off; the badge is derived from price and
    // orig, so choosing orig from the percentage keeps them in step.
    let orig = null;
    if (rng.next() < 0.5) {
      const pct = weighted(rng, [[10, 14], [15, 16], [20, 18], [25, 14], [30, 14], [35, 8], [40, 8], [45, 4], [50, 4]]);
      orig = Math.round(price / (1 - pct / 100));
    }
    const city = weighted(rng, CITIES);
    const sold0 = roll < 0.05;
    const stock = sold0 ? 0 : roll < 0.15 ? rng.int(1, 9) : rng.int(12, 480);

    specs.push({ l: 'Brand', v: brand }, { l: 'Model', v: `${series} ${model}`.trim() }, { l: 'Product ID', v: id });
    if (!NO_WARRANTY.has(cat)) specs.push({ l: 'Warranty', v: WARRANTY[cat] });

    products.push({
      ...product, price, orig, rating, reviews: n, sold, stock, age,
      province: PROVINCE_OF.get(city), city,
      description, features, variants, specs,
      kw: [...new Set([type.noun, type.q, series, CATEGORY_NAMES[cat]].join(' ').toLowerCase().split(' '))].join(' '),
      imageQuery: type.q,
    });
    mine.forEach((r) => reviews.push({ pid: id, ...r }));
  });
  return { products, reviews };
}

function writeLines(file, list) {
  writeFileSync(file, '[\n' + list.map((x) => JSON.stringify(x)).join(',\n') + '\n]\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { products, reviews } = generate();
  mkdirSync(OUT_DIR, { recursive: true });
  writeLines(join(OUT_DIR, 'products.json'), products);
  writeLines(join(OUT_DIR, 'reviews.json'), reviews);
  const per = {};
  products.forEach((p) => { per[p.cat] = (per[p.cat] || 0) + 1; });
  console.log(`Generated ${products.length} products and ${reviews.length} reviews.`);
  console.log('Per category: ' + Object.entries(per).map(([c, n]) => `${c} ${n}`).join(', '));
}
