/* Step 1 of the catalog pipeline: generate about 1,000 products.
 *
 *   npm run generate:products
 *
 * Deterministic and offline (no API key, no database): the same run always
 * writes the same files.
 *   data/generated/products.json          every product, without photos yet
 *   data/generated/sample-products.json   3 products per category, for the
 *                                         preview and the staging demo rows
 *
 * Distribution, product types, specs, features and variants all come from
 * lib/taxonomy.mjs. Photos are attached later by fetch-images.mjs.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../public/js/data.js';
import { TAXONOMY, CATEGORY_NAMES } from './lib/taxonomy.mjs';
import { makeRng } from './lib/rng.mjs';
import { makeBrandPools } from './lib/brands.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT_DIR = join(ROOT, 'data', 'generated');
const REF_DATE = Date.parse('2026-10-01T09:00:00Z');
const DAY = 86400000;
const BRANDS_PER_CATEGORY = { electronics: 14, fashion: 12, beauty: 10, home: 10, sports: 8, groceries: 8, accessories: 8 };
const NO_WARRANTY = new Set(['groceries', 'beauty']);
const WARRANTY = { electronics: '24 months', fashion: '12 months', home: '12 months', sports: '12 months', accessories: '12 months' };

const lowerFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const pad = (n, w) => String(n).padStart(w, '0');

/* The type of each product slot in a subcategory: the count is split evenly
 * across its types, the remainder going to the first ones. */
function typeSlots(sub) {
  const slots = [];
  const base = Math.floor(sub.count / sub.types.length);
  let extra = sub.count - base * sub.types.length;
  sub.types.forEach((type) => {
    const n = base + (extra-- > 0 ? 1 : 0);
    for (let i = 0; i < n; i++) slots.push(type);
  });
  return slots;
}

function priceCents(rng, [min, max]) {
  const dollars = min + (max - min) * Math.pow(rng.next(), 1.6);
  const rounded = Math.max(min, Math.round(dollars));
  // Retail-style endings: $x.99 for most, whole dollars for pricier items.
  return rounded >= 100 && rng.next() < 0.4 ? rounded * 100 : Math.max(199, rounded * 100 - 1);
}

function describe(rng, name, brand, type, features, specs, uses) {
  const [u1, u2, u3] = rng.shuffle(uses);
  const [f1, f2, f3] = features.map(lowerFirst);
  const s = rng.shuffle(specs.filter((r) => r.v));
  const sp1 = s[0].l + ': ' + s[0].v;
  const sp2 = s[1].l + ': ' + s[1].v;
  const series = name.split(' ')[1];
  const templates = [
    () => `${name} is made for ${u1} and ${u2}. Standout features: ${f1}, ${f2} and ${f3}. ${sp1}; ${sp2}.`,
    () => `Looking for something dependable for ${u1}? ${name} delivers: ${f1}, ${f2} and ${f3}. ${sp1}; ${sp2}. A sensible pick from ${brand}.`,
    () => `This ${type.noun.toLowerCase()} from ${brand}'s ${series} line suits ${u1} as well as ${u2}. Highlights: ${f1} and ${f2}. ${sp1}; ${sp2}.`,
    () => `From ${u1} to ${u3}, ${name} keeps up. What you get: ${f1}, ${f2} and ${f3}. Plus ${sp1}; ${sp2}.`,
  ];
  return rng.pick(templates)();
}

export function generate() {
  const taken = PRODUCTS.map((p) => p.brand);
  const pools = makeBrandPools(BRANDS_PER_CATEGORY, taken);
  const products = [];
  const names = new Set();
  const descriptions = new Set();
  let n = 0;

  for (const cat of Object.keys(TAXONOMY)) {
    for (const subId of Object.keys(TAXONOMY[cat])) {
      const sub = TAXONOMY[cat][subId];
      for (const type of typeSlots(sub)) {
        n += 1;
        const id = 'gx-' + pad(n, 4);
        const rng = makeRng('product:' + id);
        const brand = rng.pick(pools[cat]);

        // A unique name: brand + series + model number + product noun.
        let series = rng.pick(type.series);
        let model;
        let name;
        let guard = 0;
        do {
          model = rng.pick(['', 'X', 'S', 'M', 'Z']) + rng.int(2, 99) * 10 + rng.pick(['', '', ' Pro', ' Plus', ' Lite', ' Max']);
          name = `${brand} ${series} ${model} ${type.noun}`.replace(/\s+/g, ' ');
          if (guard++ > 20) series = rng.pick(type.series);
        } while (names.has(name.toLowerCase()));
        names.add(name.toLowerCase());

        const specs = type.specs.map(([l, opts]) => ({ l, v: rng.pick(opts) }));
        const features = rng.shuffle(type.features).slice(0, Math.min(type.features.length, rng.int(5, 6)));
        const variants = type.variants.map(([vName, options]) => {
          const keep = options.length <= 3 ? options.length : rng.int(Math.min(3, options.length), options.length);
          return { name: vName, options: options.slice(0, keep) };
        });

        let description = describe(rng, name, brand, type, features, specs, type.uses);
        while (descriptions.has(description)) description += ' Model ' + id + '.';
        descriptions.add(description);

        const price = priceCents(rng, type.price);
        const onSale = rng.next() < 0.42;
        const pct = rng.pick([10, 15, 20, 25, 30, 35, 40, 50]);
        const orig = onSale ? Math.max(price + 100, Math.round(price / (1 - pct / 100) / 100) * 100 - 1) : null;

        const rating = Math.round((3.7 + 1.2 * Math.pow(rng.next(), 0.55)) * 10) / 10;
        const reviews = Math.floor(8 + Math.pow(rng.next(), 2.2) * 3600);
        const sold = Math.floor(reviews * (2 + rng.next() * 9));
        const roll = rng.next();
        const stock = roll < 0.06 ? 0 : roll < 0.16 ? rng.int(1, 9) : rng.int(12, 480);
        const age = rng.int(1, 150);
        const created = new Date(REF_DATE - age * DAY - rng.int(0, 86000) * 1000);

        specs.push(
          { l: 'Brand', v: brand },
          { l: 'Model', v: `${series} ${model}`.trim() },
          { l: 'Product ID', v: id },
        );
        if (!NO_WARRANTY.has(cat)) specs.push({ l: 'Warranty', v: WARRANTY[cat] });

        products.push({
          id, name, cat, sub: subId, brand, type: type.key, typeLabel: type.noun,
          price, orig, rating, reviews, sold, stock, age,
          createdAt: created.toISOString(),
          description, features, variants, specs,
          kw: [...new Set([type.noun, type.q, series, CATEGORY_NAMES[cat]].join(' ').toLowerCase().split(' '))].join(' '),
          imageQuery: type.q,
        });
      }
    }
  }
  return products;
}

/* Three per category, spread across its subcategories and product types. */
export function pickSample(products) {
  const out = [];
  for (const cat of Object.keys(TAXONOMY)) {
    const mine = products.filter((p) => p.cat === cat);
    const subs = Object.keys(TAXONOMY[cat]);
    const seenTypes = new Set();
    for (let i = 0; out.filter((p) => p.cat === cat).length < 3 && i < 30; i++) {
      const sub = subs[i % subs.length];
      const pick = mine.find((p) => p.sub === sub && !seenTypes.has(p.type));
      if (pick) { seenTypes.add(pick.type); out.push(pick); }
    }
  }
  return out;
}

function writeJson(file, list) {
  writeFileSync(file, '[\n' + list.map((p) => JSON.stringify(p)).join(',\n') + '\n]\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const products = generate();
  mkdirSync(OUT_DIR, { recursive: true });
  writeJson(join(OUT_DIR, 'products.json'), products);
  const sample = pickSample(products);
  writeJson(join(OUT_DIR, 'sample-products.json'), sample);
  const brands = new Set(products.map((p) => p.brand));
  console.log(`Generated ${products.length} products from ${brands.size} fictional brands.`);
  console.log(`Wrote data/generated/products.json and sample-products.json (${sample.length} products).`);
}
