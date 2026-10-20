/* Step 2 of the marketplace expansion: find real photographs for every type
 * of product and deal them out to the products.
 *
 *   npm run mx:images
 *   npm run mx:images -- --plan          (no network: show the searches)
 *   npm run mx:images -- --only electronics/audio
 *
 * Source: Wikimedia Commons' search API, inside curated categories (lib/photo-terms.mjs). It needs no API key (Pexels and
 * Unsplash's search both do, and none is configured for this app); every file
 * is a real photograph under a free licence, served from a stable
 * upload.wikimedia.org URL, and we keep the author and licence for the credit
 * line the product page shows. Commons is searched once per product TYPE
 * ("wireless earbuds"), not once per product, and a photo is only kept when
 * its TITLE names the type (lib/photo-terms.mjs) and none of the reject words.
 *
 * Dealing rules (verified again by verify-marketplace.mjs):
 *   - 3 to 4 distinct photos per product, the first is the card thumbnail
 *   - a photo is on at most 2 products
 *   - a photo is never on products of two different categories
 *
 * Outputs (data/marketplace/):
 *   image-mapping.json   { photos: { <id>: {...} }, products: { <productId>: [<id>] },
 *                          pools: { <typeKey>: [<id>] } }   (pools = spares for the validator)
 * Every API answer is cached under .cache/commons, so a re-run costs nothing.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TAXONOMY } from './lib/taxonomy.mjs';
import { PHOTO_TERMS, CATEGORIES, GLOBAL_NOT, DENY_IDS } from './lib/photo-terms.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'marketplace');
const CACHE = join(ROOT, '.cache', 'commons');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'MVPMarketplaceCatalog/1.0 (product photo sourcing for a demo marketplace; contact via app owner)';
const MIN_GAP_MS = 350;
const THUMB_WIDTH = 960;
const MAX_USES = 2;

const REJECT = ['erotic', 'sexy', 'fetish', 'gravure', 'idol', 'cosplay', 'topless', 'strip', 'selfie', 'logo', 'illustration', 'vector', 'drawing', 'painting', 'sketch', 'toy', 'miniature', 'cartoon', 'poster', 'diagram',
  'icon', 'map', 'screenshot', 'advertisement', 'advert', 'stamp', 'coin', 'museum', 'exhibition', 'protest', 'crowd', 'war', 'military',
  'soldier', 'police', 'baby', 'naked', 'nude', 'bikini', 'lingerie', 'gun', 'rifle', 'weapon', 'sword', 'knife', 'cigarette', 'beer', 'wine',
  'vodka', 'whisky', 'casino', 'poker', 'dice', 'blood', 'accident', 'fire', 'damaged', 'broken', 'drawn', 'clipart', 'wikipedia'];

const args = process.argv.slice(2);
const argValue = (name) => { const i = args.indexOf(name); return i > -1 ? args[i + 1] : null; };
const ONLY = argValue('--only');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);

function matcher(words) {
  const re = new RegExp('\\b(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(s|es)?\\b', 'i');
  return (text) => re.test(text);
}
const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

let last = 0;
async function commons(params) {
  const url = API + '?' + new URLSearchParams({ format: 'json', formatversion: '2', ...params }).toString();
  const file = join(CACHE, createHash('sha1').update(url).digest('hex') + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  for (let attempt = 0; attempt < 5; attempt++) {
    const gap = MIN_GAP_MS - (Date.now() - last);
    if (gap > 0) await sleep(gap);
    last = Date.now();
    let res;
    try { res = await fetch(url, { headers: { 'User-Agent': UA, 'Api-User-Agent': UA } }); } catch { await sleep(1500 * 2 ** attempt); continue; }
    if (res.ok) {
      const body = await res.json();
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(file, JSON.stringify(body));
      return body;
    }
    if (res.status === 429 || res.status >= 500) { await sleep((Number(res.headers.get('retry-after')) || 4) * 1000 * (attempt + 1)); continue; }
    throw new Error('Commons answered HTTP ' + res.status);
  }
  throw new Error('Commons kept failing for ' + url.slice(0, 120));
}

/* Is this file a usable photograph of the type? Returns null when yes, else
 * why not. The TITLE must name the product (lib/photo-terms.mjs) and neither
 * the title nor the categories may say it is something else; category-only
 * matches are not trusted, which is what let "Headphones on desk" through for
 * earbuds in the first pass. */
export function judge(page, type, viaCategory = false) {
  const ii = page.imageinfo && page.imageinfo[0];
  if (!ii) return 'no image info';
  if (DENY_IDS.has(String(page.pageid))) return 'rejected after review';
  if (ii.mime !== 'image/jpeg') return 'not a jpeg';
  if (ii.width < 900 || ii.height < 600) return 'too small';
  const ratio = ii.width / ii.height;
  if (ratio > 1.9 || ratio < 0.55) return 'extreme aspect ratio';
  const meta = ii.extmetadata || {};
  const title = page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/[_]/g, ' ');
  const cats = stripHtml(meta.Categories && meta.Categories.value).replace(/\|/g, ' ');
  const [any, not] = PHOTO_TERMS[type.key];
  if (!viaCategory && !matcher(any)(title)) return 'title does not name the product';
  if (matcher(not.concat(GLOBAL_NOT))(title)) return 'title says it is something else';
  if (matcher(REJECT.concat(type.reject || []))(title + ' ' + cats)) return 'matches the reject list';
  if (!(meta.LicenseShortName && meta.LicenseShortName.value)) return 'no licence';
  return null;
}

function toPhoto(page) {
  const ii = page.imageinfo[0];
  const meta = ii.extmetadata || {};
  const title = page.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/_/g, ' ');
  return {
    id: String(page.pageid),
    src: ii.thumburl || ii.url,
    alt: title,
    author: stripHtml(meta.Artist && meta.Artist.value).slice(0, 80) || 'Unknown author',
    license: stripHtml(meta.LicenseShortName && meta.LicenseShortName.value),
    page: ii.descriptionurl,
    width: ii.width,
    height: ii.height,
  };
}

/* `enough` is how many usable photos the type needs (every product 4 photos,
 * each photo on at most 2 products, plus spares for the validator). A photo
 * must satisfy BOTH signals: it sits in one of the type's curated categories
 * (incategory:"...") AND its title names the product (lib/photo-terms.mjs).
 * Either alone is noisy: categories also hold people who merely use the item,
 * titles also hold "Dumbbell Nebula". Only when that leaves the type short
 * does the search widen to a title-only query, still under the same title
 * rules; the mapping records which types needed it. */
async function searchType(type, enough) {
  const entry = CATEGORIES[type.key];
  const [any] = PHOTO_TERMS[type.key];
  const byCategory = entry ? entry.cats.map((c) => 'incategory:"' + c + '"') : [];
  const byTitle = [...any.slice(0, 3).map((w) => 'intitle:"' + w + '"'), type.q];
  const found = new Map();
  const rejected = [];
  let widened = !entry;
  for (const query of byCategory.concat(byTitle)) {
    if (byTitle.includes(query) && found.size >= enough) break;
    if (byTitle.includes(query)) widened = true;
    for (let offset = 0; offset < 150; offset += 50) {
      const body = await commons({
        action: 'query', generator: 'search', gsrnamespace: '6', gsrsearch: query + ' filetype:bitmap', gsrlimit: '50', gsroffset: String(offset),
        prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: String(THUMB_WIDTH),
        iiextmetadatafilter: 'ImageDescription|Artist|LicenseShortName|Categories',
      });
      const pages = (body.query && body.query.pages) || [];
      pages.sort((a, b) => a.index - b.index);
      for (const page of pages) {
        if (found.has(String(page.pageid))) continue;
        const why = judge(page, type);
        if (why) { rejected.push({ title: page.title, reason: why }); continue; }
        found.set(String(page.pageid), toPhoto(page));
      }
      if (!body.continue || found.size >= enough) break;
    }
  }
  return { photos: [...found.values()], rejected, viaCategory: !widened };
}

function typeIndex() {
  const out = {};
  for (const cat of Object.keys(TAXONOMY)) for (const sub of Object.keys(TAXONOMY[cat])) {
    for (const type of TAXONOMY[cat][sub].types) out[type.key] = { ...type, cat, sub };
  }
  return out;
}

/* Deal photos to a type's products under the three rules. `uses` and `owner`
 * are shared across types so the limits are global. */
export function deal(products, pool, uses, owner, cat) {
  const out = {};
  const usable = pool.filter((p) => !owner.has(p.id) || owner.get(p.id) === cat);
  usable.forEach((p) => owner.set(p.id, cat));
  const take = (list, product, want) => {
    for (const photo of usable) {
      if (list.length >= want) break;
      if ((uses.get(photo.id) || 0) >= MAX_USES || list.includes(photo.id)) continue;
      list.push(photo.id);
      uses.set(photo.id, (uses.get(photo.id) || 0) + 1);
    }
  };
  // Pass 1 gives everyone 3 photos, pass 2 a 4th while spares last, so a thin
  // pool is spread evenly rather than starving the last products.
  products.forEach((p) => { out[p.id] = []; });
  for (const want of [1, 2, 3, 4]) products.forEach((p) => take(out[p.id], p, want));
  return out;
}

async function main() {
  const products = readJson(join(DATA, 'products.json'), null);
  if (!products) { console.error('data/marketplace/products.json is missing. Run `npm run mx:generate` first.'); process.exit(1); }
  const types = typeIndex();
  const groups = new Map();
  for (const p of products) {
    if (ONLY && !(p.cat + '/' + p.sub).startsWith(ONLY)) continue;
    if (!groups.has(p.type)) groups.set(p.type, []);
    groups.get(p.type).push(p);
  }
  if (args.includes('--plan')) {
    console.log(`${groups.size} product types; up to 6 Commons requests each.`);
    for (const [key, list] of groups) console.log(`  ${(types[key].cat + '/' + key).padEnd(34)} ${String(list.length).padStart(3)} products  "${types[key].q}"`);
    return;
  }

  const state = readJson(join(DATA, 'image-mapping.json'), { source: 'wikimedia-commons', photos: {}, products: {}, pools: {} });
  const uses = new Map();
  const owner = new Map();
  for (const [pid, ids] of Object.entries(state.products)) {
    const cat = (products.find((p) => p.id === pid) || {}).cat;
    ids.forEach((id) => { uses.set(id, (uses.get(id) || 0) + 1); owner.set(id, cat); });
  }
  for (const [key, list] of groups) {
    if (state.pools[key] && !args.includes('--force')) { console.log(`skip ${key} (done)`); continue; }
    const type = types[key];
    process.stdout.write(`search ${key} "${type.q}" for ${list.length} products ... `);
    const { photos, rejected, viaCategory } = await searchType(type, Math.ceil((list.length * 4) / MAX_USES) + Math.ceil(list.length * 1.5));
    state.sources = state.sources || {};
    state.sources[key] = viaCategory ? 'category+title' : 'title-widened';
    const need = Math.ceil((list.length * 4) / MAX_USES);
    const dealt = deal(list, photos, uses, owner, type.cat);
    Object.assign(state.products, dealt);
    const used = new Set();
    Object.values(dealt).forEach((ids) => ids.forEach((id) => used.add(id)));
    photos.filter((p) => owner.get(p.id) === type.cat).forEach((p) => { state.photos[p.id] = p; });
    state.pools[key] = photos.filter((p) => owner.get(p.id) === type.cat).map((p) => p.id);
    console.log(`${photos.length} usable, ${rejected.length} rejected, ${used.size} dealt (wanted ${need}).`);
    writeFileSync(join(DATA, 'image-mapping.json'), JSON.stringify(state) + '\n');
  }
  const short = products.filter((p) => (state.products[p.id] || []).length < 3);
  console.log(`Done. ${short.length} product(s) have fewer than 3 photos; the validator reports them.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}
