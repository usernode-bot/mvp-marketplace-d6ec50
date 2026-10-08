/* Step 3 of the catalog pipeline: insert the products, 100 at a time.
 *
 *   DATABASE_URL=postgres://... npm run seed:products
 *   npm run seed:products -- --dry-run          (no database: show what would go in)
 *   npm run seed:products -- --batch-size 50 --allow-missing-images
 *
 * Idempotent: every batch is one multi-row INSERT ... ON CONFLICT (id) DO
 * UPDATE inside a transaction, so running it twice leaves the same rows, a
 * crash mid-run leaves whole batches only, and re-running picks up where it
 * stopped. It also applies the table's schema and indexes first (the same
 * module the server runs on boot), so it works against a database the server
 * has never touched.
 *
 * Only products with 3 or more verified photos are inserted. Products
 * flagged by fetch-images.mjs (reports/no-suitable-image.json) are skipped
 * and listed, unless --allow-missing-images is passed (they then show the
 * placeholder).
 */

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data', 'generated');
const { ALL_COLUMNS, ensureProductsTable, upsertRows } = require('../src/schema.cjs');
const { toGeneratedRow } = require('../src/catalog-rows.cjs');

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const i = args.indexOf(name);
  return i > -1 ? args[i + 1] : fallback;
};
const BATCH = Math.max(1, Math.min(500, Number(value('--batch-size', 100)) || 100));
const MIN_IMAGES = 3;

const products = JSON.parse(readFileSync(join(DATA, 'products.json'), 'utf8'));
const mappingFile = join(DATA, 'image-mapping.json');
const mapping = existsSync(mappingFile) ? JSON.parse(readFileSync(mappingFile, 'utf8')).products : null;

if (!mapping && !flag('--allow-missing-images')) {
  console.error('data/generated/image-mapping.json is missing: run `npm run fetch:images` first');
  console.error('(or pass --allow-missing-images to insert products with the placeholder only).');
  process.exit(1);
}

const ready = [];
const skipped = [];
products.forEach((p, index) => {
  const credits = (mapping && mapping[p.id]) || [];
  if (credits.length < MIN_IMAGES && !flag('--allow-missing-images')) skipped.push(p.id);
  else ready.push(toGeneratedRow(p, index, credits));
});

console.log(`${ready.length} product(s) ready, ${skipped.length} skipped for fewer than ${MIN_IMAGES} photos.`);
if (skipped.length) console.log('Skipped: ' + skipped.slice(0, 12).join(', ') + (skipped.length > 12 ? ', ...' : ''));

if (flag('--dry-run')) {
  console.log(`Dry run: would insert ${Math.ceil(ready.length / BATCH)} batch(es) of up to ${BATCH}. Nothing written.`);
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it and run again (or use --dry-run).');
  process.exit(2);
}

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await ensureProductsTable(pool);
  let done = 0;
  for (let i = 0; i < ready.length; i += BATCH) {
    const batch = ready.slice(i, i + BATCH);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await upsertRows(client, batch, ALL_COLUMNS);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    done += batch.length;
    console.log(`batch ${Math.floor(i / BATCH) + 1}: ${done}/${ready.length}`);
  }
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM products WHERE generated');
  console.log(`Done. ${rows[0].n} generated product(s) in the database.`);
} catch (err) {
  console.error('Seed failed: ' + err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
