/* Sample preview: 3 products per category, printed in full so the data can
 * be judged before the real image fetch and the full seed are run.
 *
 *   npm run preview:sample
 *
 * Offline: needs no API key and no database. It reads
 * data/generated/sample-products.json (run `npm run generate:products`
 * first) and, when image-mapping.json exists, shows each product's photos.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'generated');
const sampleFile = join(DATA, 'sample-products.json');
if (!existsSync(sampleFile)) {
  console.error('data/generated/sample-products.json is missing. Run `npm run generate:products` first.');
  process.exit(1);
}
const sample = JSON.parse(readFileSync(sampleFile, 'utf8'));
const mapFile = join(DATA, 'image-mapping.json');
const mapping = existsSync(mapFile) ? JSON.parse(readFileSync(mapFile, 'utf8')).products : {};
const money = (c) => '$' + (c / 100).toFixed(2);

let lastCat = '';
for (const p of sample) {
  if (p.cat !== lastCat) {
    console.log('\n=== ' + p.cat.toUpperCase() + ' ===');
    lastCat = p.cat;
  }
  const photos = mapping[p.id] || [];
  console.log(`\n${p.id}  ${p.name}`);
  console.log(`  ${p.cat} / ${p.sub} / ${p.type}   brand ${p.brand}`);
  console.log(`  ${money(p.price)}${p.orig ? ` (was ${money(p.orig)})` : ''}   rating ${p.rating}   ${p.reviews} reviews   stock ${p.stock}`);
  console.log('  ' + p.description);
  console.log('  Key features: ' + p.features.join(' | '));
  console.log('  Variants: ' + p.variants.map((v) => v.name + ': ' + v.options.join(', ')).join('; '));
  console.log('  Specs: ' + p.specs.map((r) => r.l + ' ' + r.v).join('; '));
  console.log('  Image search: "' + p.imageQuery + '"   photos: ' + (photos.length ? photos.length + ' verified' : 'not fetched yet'));
}
console.log(`\n${sample.length} sample products, ${new Set(sample.map((p) => p.cat)).size} categories.`);
