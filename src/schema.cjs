/* Products table schema, shared by the server's boot migration and the
 * `npm run seed:products` batch insert, so there is exactly one definition.
 *
 * Everything is idempotent (CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT
 * EXISTS): the server runs it on every boot and the seed script runs it
 * before inserting, so either can come first against any database.
 *
 * The table is public (a product catalog, nothing sensitive), so staging
 * copies its rows from production.
 */

/* Columns every row carries (the bundled catalog and generated products). */
const BASE_COLUMNS = [
  'id', 'name', 'cat', 'sub', 'brand', 'art', 'price', 'orig', 'discount',
  'rating', 'reviews', 'sold', 'oos', 'age', 'province', 'city', 'kw',
  'image', 'images', 'specs', 'flash', 'pct', 'rank', 'search_text',
];

/* Columns only the generated marketplace catalog fills. A bundled row leaves
 * them at their defaults (empty description, no stock number, generated =
 * false). */
const EXTRA_COLUMNS = [
  'description', 'features', 'variants', 'stock', 'image_credits', 'generated', 'created_at',
];

const ALL_COLUMNS = BASE_COLUMNS.concat(EXTRA_COLUMNS);

async function ensureProductsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cat TEXT NOT NULL,
      sub TEXT NOT NULL DEFAULT '',
      brand TEXT NOT NULL,
      art TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL,
      orig INTEGER,
      discount INTEGER NOT NULL DEFAULT 0,
      rating NUMERIC(2,1) NOT NULL,
      reviews INTEGER NOT NULL DEFAULT 0,
      sold INTEGER NOT NULL DEFAULT 0,
      oos BOOLEAN NOT NULL DEFAULT FALSE,
      age INTEGER NOT NULL DEFAULT 0,
      province TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      kw TEXT NOT NULL DEFAULT '',
      image TEXT,
      images JSONB NOT NULL DEFAULT '[]'::jsonb,
      specs JSONB NOT NULL DEFAULT '[]'::jsonb,
      flash BOOLEAN NOT NULL DEFAULT FALSE,
      pct INTEGER NOT NULL DEFAULT 0,
      rank INTEGER NOT NULL DEFAULT 0,
      search_text TEXT NOT NULL DEFAULT ''
    )
  `);
  // Columns added after the table first shipped.
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb");
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '[]'::jsonb");
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT ''");
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb");
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb");
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER');
  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_credits JSONB NOT NULL DEFAULT '[]'::jsonb");
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS generated BOOLEAN NOT NULL DEFAULT FALSE');
  await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()');

  // Indexes for every filter and sort column: category, subcategory, brand,
  // price, rating, created_at, plus the location pair the home filter uses.
  await pool.query('CREATE INDEX IF NOT EXISTS products_cat_idx ON products (cat)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_sub_idx ON products (cat, sub)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_brand_idx ON products (brand)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_price_idx ON products (price)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_rating_idx ON products (rating DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_city_idx ON products (city)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_province_idx ON products (province)');
  await pool.query('CREATE INDEX IF NOT EXISTS products_province_city_idx ON products (province, city)');

  // Text search. The route searches with `search_text LIKE '%term%'`, which a
  // trigram GIN index serves directly. pg_trgm needs a privilege some managed
  // databases withhold, so fall back to a full-text GIN index on the same
  // column rather than failing the boot.
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    await pool.query('CREATE INDEX IF NOT EXISTS products_search_trgm_idx ON products USING gin (search_text gin_trgm_ops)');
  } catch (err) {
    console.warn('[products] pg_trgm unavailable, using full-text index: ' + err.message);
    await pool.query("CREATE INDEX IF NOT EXISTS products_search_fts_idx ON products USING gin (to_tsvector('simple', search_text))");
  }
}

/* Multi-row idempotent upsert of one batch. `rows` use the column names in
 * `columns`; JSON columns arrive pre-serialized. Re-running never
 * duplicates a row and refreshes the ones that changed; it never deletes. */
async function upsertRows(pool, rows, columns) {
  if (!rows.length) return 0;
  const values = [];
  const tuples = rows.map((row) => {
    const marks = columns.map((c) => {
      values.push(row[c] === undefined ? null : row[c]);
      return '$' + values.length;
    });
    return '(' + marks.join(', ') + ')';
  });
  const updates = columns.filter((c) => c !== 'id').map((c) => c + ' = EXCLUDED.' + c).join(', ');
  await pool.query(
    'INSERT INTO products (' + columns.join(', ') + ') VALUES ' + tuples.join(', ')
    + ' ON CONFLICT (id) DO UPDATE SET ' + updates, values);
  return rows.length;
}

module.exports = { BASE_COLUMNS, EXTRA_COLUMNS, ALL_COLUMNS, ensureProductsTable, upsertRows };
