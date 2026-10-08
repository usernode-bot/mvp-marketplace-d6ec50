/* Step 2 of the catalog pipeline: find, verify and record photos.
 *
 *   PEXELS_API_KEY=... npm run fetch:images
 *   npm run fetch:images -- --plan        (no key, no network: show the plan)
 *
 * The key is read ONLY from the PEXELS_API_KEY environment variable; there is
 * no file or flag for it and nothing here ever prints or stores it.
 *
 * Products are grouped by product type ("wireless earbuds"), so about 70
 * searches cover all 1,000 products instead of one search per product, which
 * is also what keeps this inside Pexels' free rate limit. For each group the
 * script searches, rejects photos whose description does not match the type
 * (or matches its reject list), then deals 3 to 5 distinct photos to each
 * product in the group. Photos stay on Pexels' CDN; what we store is the URL
 * plus the photographer attribution Pexels asks for.
 *
 *   throttling   a minimum gap between requests, plus a wait for the reset
 *                time whenever Pexels reports the hourly quota is spent
 *   retries      429 and 5xx answers retry with backoff (Retry-After honoured)
 *   cache        every API answer is saved under .cache/pexels, so a re-run
 *                costs no requests
 *   resume       finished groups are saved to the mapping after each group;
 *                a re-run skips them (--force redoes everything)
 *
 * Outputs (data/generated/):
 *   image-mapping.json        productId -> [{ id, src, alt, photographer, ... }]
 *   reports/image-mapping-report.json  per-group and per-product outcome
 *   reports/no-suitable-image.json     products flagged for fewer than 3 photos
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TAXONOMY } from './lib/taxonomy.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'generated');
const CACHE = join(ROOT, '.cache', 'pexels');
const MAPPING_FILE = join(DATA, 'image-mapping.json');
const REPORT_DIR = join(DATA, 'reports');

const MIN_IMAGES = 3;
const MAX_IMAGES = 5;
const PER_PAGE = 80;
const MIN_GAP_MS = Number(process.env.PEXELS_MIN_GAP_MS || 1200);
const MAX_RETRIES = 5;
const DEFAULT_REJECT = ['logo', 'illustration', 'vector', 'drawing', 'painting', 'sketch', 'toy', 'miniature', 'cartoon', 'poster', 'text'];

const args = new Set(process.argv.slice(2));
const argValue = (name) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : null;
};
const MAX_PAGES = Number(argValue('--max-pages') || 3);
const ONLY = argValue('--only');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (file, fallback) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback);

/* One word-boundary matcher per token list, so "watch" does not match
 * "watching" and "ball" does not match "ballroom". */
function matcher(words) {
  const re = new RegExp('\\b(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(s|es)?\\b', 'i');
  return (text) => re.test(text);
}

export function judgePhoto(photo, type) {
  const alt = String(photo.alt || '').trim();
  if (!alt) return 'no description to verify';
  if (!matcher(type.must)(alt)) return 'description does not mention the product';
  if (matcher(DEFAULT_REJECT.concat(type.reject || []))(alt)) return 'description matches the reject list';
  if (Math.min(photo.width, photo.height) < 600) return 'too small';
  const ratio = photo.width / photo.height;
  if (ratio > 2.2 || ratio < 0.45) return 'extreme aspect ratio';
  return null;
}

/* Product groups, in taxonomy order. */
function groupsOf(products) {
  const types = {};
  for (const cat of Object.keys(TAXONOMY)) {
    for (const sub of Object.keys(TAXONOMY[cat])) {
      for (const type of TAXONOMY[cat][sub].types) types[cat + '/' + sub + '/' + type.key] = type;
    }
  }
  const groups = new Map();
  for (const p of products) {
    const key = p.cat + '/' + p.sub + '/' + p.type;
    if (!groups.has(key)) groups.set(key, { key, type: types[key], products: [] });
    groups.get(key).products.push(p);
  }
  return [...groups.values()];
}

/* ---- Pexels client: throttle, retry, cache ---------------------------- */

let lastRequestAt = 0;
let quota = { remaining: null, reset: null };
let requests = 0;

async function pexelsGet(url, key) {
  const file = join(CACHE, createHash('sha1').update(url).digest('hex') + '.json');
  if (existsSync(file)) return { body: JSON.parse(readFileSync(file, 'utf8')), cached: true };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Throttle: a minimum gap, and a full wait when the quota is spent.
    if (quota.remaining !== null && quota.remaining <= 1 && quota.reset) {
      const wait = quota.reset * 1000 - Date.now() + 2000;
      if (wait > 0) {
        console.log(`  quota spent, waiting ${Math.ceil(wait / 60000)} min for the reset`);
        await sleep(wait);
      }
    }
    const gap = MIN_GAP_MS - (Date.now() - lastRequestAt);
    if (gap > 0) await sleep(gap);
    lastRequestAt = Date.now();
    requests += 1;

    let res;
    try {
      res = await fetch(url, { headers: { Authorization: key } });
    } catch (err) {
      await sleep(2000 * 2 ** attempt);
      continue;
    }
    const remaining = res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-reset');
    if (remaining !== null) quota = { remaining: Number(remaining), reset: Number(reset) || null };

    if (res.ok) {
      const body = await res.json();
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(file, JSON.stringify(body));
      return { body, cached: false };
    }
    if (res.status === 401 || res.status === 403) throw new Error('Pexels rejected the API key (HTTP ' + res.status + ').');
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after'));
      const wait = retryAfter > 0 ? retryAfter * 1000 : 3000 * 2 ** attempt;
      console.log(`  HTTP ${res.status}, retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    throw new Error('Pexels answered HTTP ' + res.status + ' for ' + url.split('?')[0]);
  }
  throw new Error('Pexels kept failing after ' + MAX_RETRIES + ' retries.');
}

async function searchGroup(group, key) {
  const accepted = [];
  const rejected = [];
  const seen = new Set();
  const need = group.products.length * MAX_IMAGES;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = 'https://api.pexels.com/v1/search?query=' + encodeURIComponent(group.type.q)
      + '&per_page=' + PER_PAGE + '&page=' + page;
    const { body } = await pexelsGet(url, key);
    for (const photo of body.photos || []) {
      if (seen.has(photo.id)) continue;
      seen.add(photo.id);
      const why = judgePhoto(photo, group.type);
      if (why) { rejected.push({ id: photo.id, alt: photo.alt || '', reason: why }); continue; }
      accepted.push({
        id: photo.id,
        src: photo.src.large,
        alt: photo.alt,
        width: photo.width,
        height: photo.height,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        pexelsUrl: photo.url,
      });
    }
    if (accepted.length >= need || !body.next_page) break;
  }
  return { accepted, rejected };
}

/* Deal photos to the group's products: 3 to 5 each, never the same photo
 * twice within a product, and no photo reused across products until the pool
 * runs out (then it wraps, offset so neighbours still differ). */
export function deal(products, pool) {
  const out = {};
  let cursor = 0;
  products.forEach((p, i) => {
    if (pool.length < MIN_IMAGES) { out[p.id] = pool.slice(); return; }
    const want = MIN_IMAGES + (i % (MAX_IMAGES - MIN_IMAGES + 1));
    const take = Math.min(want, pool.length);
    out[p.id] = [];
    for (let k = 0; k < take; k++) out[p.id].push(pool[(cursor + k) % pool.length]);
    cursor += take;
  });
  return out;
}

async function main() {
  const products = readJson(join(DATA, 'products.json'), null);
  if (!products) {
    console.error('data/generated/products.json is missing. Run `npm run generate:products` first.');
    process.exit(1);
  }
  let groups = groupsOf(products);
  if (ONLY) groups = groups.filter((g) => g.key.startsWith(ONLY));

  if (args.has('--plan')) {
    console.log(`${groups.length} product types, up to ${MAX_PAGES} requests each (${groups.length * MAX_PAGES} at most).`);
    console.log(`At the free tier's 200 requests an hour that is about ${Math.ceil(groups.length * MAX_PAGES / 200)} hour(s) worst case; cached pages cost nothing on a re-run.`);
    groups.forEach((g) => console.log(`  ${g.key.padEnd(44)} ${String(g.products.length).padStart(3)} products  query "${g.type.q}"`));
    return;
  }

  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    console.error('PEXELS_API_KEY is not set. Export it and run again (nothing was fetched).');
    console.error('Use `npm run fetch:images -- --plan` to see what would be requested without a key.');
    process.exit(2);
  }

  mkdirSync(REPORT_DIR, { recursive: true });
  const state = readJson(MAPPING_FILE, { version: 1, source: 'pexels', groups: {}, products: {} });
  const report = readJson(join(REPORT_DIR, 'image-mapping-report.json'), { groups: {} });

  for (const group of groups) {
    if (state.groups[group.key] && !args.has('--force')) {
      console.log(`skip ${group.key} (done)`);
      continue;
    }
    console.log(`search ${group.key} "${group.type.q}" for ${group.products.length} products`);
    const { accepted, rejected } = await searchGroup(group, key);
    const dealt = deal(group.products, accepted);
    Object.assign(state.products, dealt);
    state.groups[group.key] = { query: group.type.q, accepted: accepted.length, rejected: rejected.length };
    report.groups[group.key] = {
      query: group.type.q,
      products: group.products.length,
      accepted: accepted.length,
      rejected: rejected.length,
      rejectedSamples: rejected.slice(0, 10),
      photosPerProductPoolOk: accepted.length >= group.products.length * MIN_IMAGES,
    };
    // Written after every group so an interrupted run resumes here.
    writeFileSync(MAPPING_FILE, JSON.stringify(state, null, 1) + '\n');
    writeFileSync(join(REPORT_DIR, 'image-mapping-report.json'), JSON.stringify(report, null, 1) + '\n');
  }

  const flagged = products
    .filter((p) => (state.products[p.id] || []).length < MIN_IMAGES)
    .map((p) => ({ id: p.id, name: p.name, query: p.imageQuery, found: (state.products[p.id] || []).length }));
  writeFileSync(join(REPORT_DIR, 'no-suitable-image.json'), JSON.stringify({ count: flagged.length, products: flagged }, null, 1) + '\n');
  console.log(`Done. ${requests} API request(s). ${flagged.length} product(s) flagged for no suitable image (reports/no-suitable-image.json).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err.message); process.exit(1); });
}
