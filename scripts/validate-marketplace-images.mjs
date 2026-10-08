/* Step 3 of the marketplace expansion: check that every photo loads.
 *
 *   npm run mx:validate
 *
 * Requests every distinct photo URL once (HEAD, falling back to a ranged GET)
 * and keeps only those answering HTTP 200 with an image content type. A product
 * whose photo failed gets another unused photo of the SAME product type from
 * the spares the search kept (still within the two-products-per-photo and
 * one-category rules). Only when a product has no photo left at all does it get
 * the neutral placeholder for its category, and it is listed in the report.
 *
 * Writes data/marketplace/image-mapping.json (cleaned) and
 * data/marketplace/image-report.json. If the network cannot be reached the
 * script says so, writes a report that says "not validated", and changes
 * nothing: it never claims a check it did not make.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'marketplace');
const UA = 'MVPMarketplaceCatalog/1.0 (image URL check for a demo marketplace)';
const CATEGORY_NAMES = { electronics: 'Electronics', fashion: 'Fashion', beauty: 'Beauty', home: 'Home', sports: 'Sports', groceries: 'Groceries', accessories: 'Accessories' };
const MAX_USES = 2;
const CONCURRENCY = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function placeholderSvg(cat) {
  const label = CATEGORY_NAMES[cat] || cat;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="' + label + ' product">'
    + '<rect width="800" height="800" fill="#e4e4e7"/>'
    + '<rect x="300" y="250" width="200" height="200" rx="24" fill="none" stroke="#a1a1aa" stroke-width="14"/>'
    + '<circle cx="360" cy="320" r="22" fill="#a1a1aa"/>'
    + '<path d="M310 440l70-70 50 50 30-30 30 50z" fill="#a1a1aa"/>'
    + '<text x="400" y="560" font-family="system-ui,sans-serif" font-size="44" font-weight="600" fill="#52525b" text-anchor="middle">' + label + '</text>'
    + '</svg>\n';
}
export const placeholderUrl = (cat) => '/images/placeholders/' + cat + '.svg';

/* One URL. 429 and 5xx mean "slow down", not "broken": they back off (the
 * server's Retry-After first) and try again, up to 8 times. A URL that is still
 * throttled after that is reported as `throttled`, never as OK and never as
 * broken. Anything else that is not a 200 image (404, 403, a non-image
 * content type, a connection error) is a real failure. */
async function probe(url) {
  let status = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      let res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, redirect: 'follow' });
      if (res.status === 405) res = await fetch(url, { headers: { 'User-Agent': UA, Range: 'bytes=0-1023' }, redirect: 'follow' });
      status = res.status;
      if (res.status === 429 || res.status >= 500) {
        const wait = (Number(res.headers.get('retry-after')) || 2 * (attempt + 1)) * 1000;
        await sleep(Math.min(wait, 20000));
        continue;
      }
      const type = res.headers.get('content-type') || '';
      return { ok: (res.status === 200 || res.status === 206) && type.startsWith('image/'), status: res.status, type };
    } catch (err) {
      if (attempt === 7) return { ok: false, status: 0, error: err.message };
      await sleep(1000 * (attempt + 1));
    }
  }
  return { ok: false, throttled: true, status };
}

async function main() {
  const products = JSON.parse(readFileSync(join(DATA, 'products.json'), 'utf8'));
  const state = JSON.parse(readFileSync(join(DATA, 'image-mapping.json'), 'utf8'));
  const byId = new Map(products.map((p) => [p.id, p]));
  const report = { checkedAt: new Date().toISOString(), network: true, source: state.source };

  mkdirSync(join(ROOT, 'public', 'images', 'placeholders'), { recursive: true });
  for (const cat of Object.keys(CATEGORY_NAMES)) writeFileSync(join(ROOT, 'public', 'images', 'placeholders', cat + '.svg'), placeholderSvg(cat));

  // Is the network there at all? One known-good URL decides, so an offline
  // sandbox is reported as such instead of as 2,000 failed photos.
  const sample = Object.values(state.photos)[0];
  const reach = sample ? await probe(sample.src) : { ok: false };
  if (!reach.ok && !reach.status) {
    report.network = false;
    report.note = 'The network could not be reached, so NO photo URL was validated. Nothing was changed.';
    writeFileSync(join(DATA, 'image-report.json'), JSON.stringify(report, null, 1) + '\n');
    console.log(report.note);
    process.exit(3);
  }

  const used = new Set(Object.values(state.products).flat());
  const ids = [...used];
  const result = new Map();
  let next = 0;
  let done = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < ids.length) {
      const id = ids[next++];
      result.set(id, await probe(state.photos[id].src));
      if (++done % 200 === 0) console.log(`  checked ${done}/${ids.length}`);
    }
  }));
  // Throttled URLs are neither OK nor broken: they stay in the mapping, listed as unverified.
  const throttled = ids.filter((id) => result.get(id).throttled);
  const failed = new Set(ids.filter((id) => !result.get(id).ok && !result.get(id).throttled));

  // Re-count how often each photo is used, then replace the failures.
  const uses = new Map();
  Object.values(state.products).forEach((list) => list.forEach((id) => { if (!failed.has(id)) uses.set(id, (uses.get(id) || 0) + 1); }));
  const typeOf = (p) => p.type;
  const replaced = [];
  const placeholders = [];
  for (const [pid, list] of Object.entries(state.products)) {
    const p = byId.get(pid);
    const keep = list.filter((id) => !failed.has(id));
    const lost = list.length - keep.length;
    if (lost) {
      const spares = (state.pools[typeOf(p)] || []).filter((id) => !keep.includes(id) && !failed.has(id) && (uses.get(id) || 0) < MAX_USES);
      for (const id of spares) {
        if (keep.length >= list.length) break;
        if (!result.has(id)) result.set(id, await probe(state.photos[id].src));
        if (!result.get(id).ok) { failed.add(id); continue; }
        keep.push(id);
        uses.set(id, (uses.get(id) || 0) + 1);
        replaced.push({ id: pid, instead: id });
      }
    }
    state.products[pid] = keep;
    if (!keep.length) placeholders.push({ id: pid, name: p.name, cat: p.cat, type: p.type, placeholder: placeholderUrl(p.cat) });
  }
  // Products the search never gave a photo to are placeholders too.
  for (const p of products) if (!state.products[p.id]) { state.products[p.id] = []; placeholders.push({ id: p.id, name: p.name, cat: p.cat, type: p.type, placeholder: placeholderUrl(p.cat) }); }

  const remaining = new Set(Object.values(state.products).flat());
  for (const id of Object.keys(state.photos)) if (!remaining.has(id) && !(Object.values(state.pools).some((l) => l.includes(id) && !failed.has(id)))) delete state.photos[id];
  const short = products.filter((p) => state.products[p.id].length > 0 && state.products[p.id].length < 3).map((p) => ({ id: p.id, name: p.name, photos: state.products[p.id].length }));
  const perCat = {};
  products.forEach((p) => {
    const c = perCat[p.cat] || (perCat[p.cat] = { products: 0, discounted: 0, soldOut: 0 });
    c.products += 1;
    if (p.orig) c.discounted += 1;
    if (p.stock === 0) c.soldOut += 1;
  });
  Object.assign(report, {
    products: products.length,
    productsPerCategory: perCat,
    discounted: products.filter((p) => p.orig).length,
    soldOut: products.filter((p) => p.stock === 0).length,
    photoUrlsChecked: ids.length,
    photoUrlsOk: ids.filter((id) => result.get(id).ok).length,
    photoUrlsUnverifiedThrottled: throttled.length,
    photoUrlsFailed: [...ids].filter((id) => failed.has(id)).map((id) => ({ id, src: state.photos[id] && state.photos[id].src, status: result.get(id).status })),
    replacedWithSameTypePhoto: replaced.length,
    placeholderFallbacks: placeholders,
    productsWithFewerThanThreePhotos: short,
    photosPerProduct: Object.fromEntries([0, 1, 2, 3, 4].map((n) => [n, products.filter((p) => state.products[p.id].length === n).length])),
  });
  writeFileSync(join(DATA, 'image-mapping.json'), JSON.stringify(state) + '\n');
  writeFileSync(join(DATA, 'image-report.json'), JSON.stringify(report, null, 1) + '\n');
  console.log(`Checked ${ids.length} photo URLs: ${report.photoUrlsOk} OK, ${report.photoUrlsFailed.length} failed, ${throttled.length} still rate-limited after 8 tries (kept, unverified); ${replaced.length} replacements from the same type.`);
  console.log(`${placeholders.length} product(s) fell back to a category placeholder; ${short.length} have fewer than 3 photos.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}
