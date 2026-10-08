const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { ROWS, parseParams, buildWhere, orderBy, toProduct } =
  require('./src/products.cjs');
const { BASE_COLUMNS, ALL_COLUMNS, ensureProductsTable, upsertRows } = require('./src/schema.cjs');
const { toGeneratedRow } = require('./src/catalog-rows.cjs');

const app = express();
const port = process.env.PORT || 3000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Staging vs production. Used only to swap the DATA behind a route (the
// demo avatar on ?demo=1); it never gates a feature or a code path.
const IS_STAGING = process.env.USERNODE_ENV === 'staging';

// The platform signs user-identity tokens with an RSA private key it never
// shares. Containers get only the PUBLIC half, so this app can verify who a
// user is but cannot mint an identity — and neither can any other app.
const JWT_PUBLIC_KEY = (process.env.USERNODE_JWT_PUBLIC_KEY || '')
  .replace(/\\n/g, '\n');

// Tokens are minted for one app: the audience is this app's numeric id, so a
// token issued for a different app is rejected below rather than accepted as
// a valid user.
const APP_AUDIENCE = process.env.USERNODE_APP_ID
  ? 'usernode:app:' + process.env.USERNODE_APP_ID
  : null;

// Paths that stay open without authentication. Add a path here (and add it
// with `app.get`/`app.post` below) if you deliberately want it public.
// Everything else requires a valid platform-issued JWT.
// GET /api/profile is public and identity-optional: it returns only the
// caller's own avatar URL (already public content), and nulls when there is
// no signed-in user, so a signed-out preview or a guest can render the page
// without a spurious 401. The write routes below stay authenticated.
const PUBLIC_API_PATHS = new Set(['/health', '/api/profile', '/api/products', '/api/catalog/summary']);
// One product by id (GET /api/products/<id>) is public like the list.
const PUBLIC_API_PREFIXES = ['/api/products/'];

app.use(express.json());

// The platform's three centrally hosted files — the bridge, the native UI
// kit and the Tailwind runtime — are reachable at these paths on this app's
// OWN origin, so index.html can load them with a RELATIVE path and never
// name the platform's hostname. A hostname baked into an app is what breaks
// every app at once when the platform's domain moves.
//
// In production and on a staging preview the platform's edge answers these
// before the request ever reaches this process (a per-app Ingress rule on
// Kubernetes, the wildcard site's matcher on the docker runtime). This
// handler is what makes the same relative paths work under a plain
// `node server.js`, where there is no edge in front of the app at all.
//
// Registered BEFORE the auth middleware because these three files are
// public: the platform serves them anonymously from any app origin, and a
// login redirect arriving where a <script> was expected is exactly the
// failure a relative path is meant to avoid.
// The platform's origin, at RUNTIME, and ONLY from the variable the platform
// injects. No hostname is written into this file: a baked-in one is what left
// the whole fleet pointing at a domain the platform had moved away from.
// Unset only outside the platform (a plain local `node server.js`) — set
// USERNODE_PLATFORM_ORIGIN there too if you want the hosted assets locally.
const PLATFORM_ORIGIN = (process.env.USERNODE_PLATFORM_ORIGIN || '')
  .replace(/\/+$/, '');

app.get(/^\/usernode-(?:bridge|native|tailwind)\//, async (req, res) => {
  try {
    if (!PLATFORM_ORIGIN) return res.sendStatus(503);
    const upstream = await fetch(PLATFORM_ORIGIN + req.path);
    if (!upstream.ok) return res.sendStatus(upstream.status);
    const type = upstream.headers.get('content-type');
    if (type) res.type(type);
    // max-age=0 with revalidation, never a long TTL: the whole point of
    // central hosting is that a platform-side fix lands on the next load.
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    console.warn('hosted asset fetch failed: ' + err.message);
    return res.sendStatus(502);
  }
});

// Verify platform-issued JWT if one was passed, then enforce auth on
// anything not explicitly marked public. The iframe adds `?token=…`
// on load; the frontend script forwards the token via `x-usernode-token`
// on subsequent fetches.
app.use((req, res, next) => {
  const token = req.query.token || req.headers['x-usernode-token'];
  if (token && JWT_PUBLIC_KEY && APP_AUDIENCE) {
    try {
      // Pin the algorithm, issuer and audience. Without `algorithms` a
      // caller could hand us an HS256 token signed with the public PEM
      // (which every app knows) and forge any user.
      const claims = jwt.verify(token, JWT_PUBLIC_KEY, {
        algorithms: ['RS256'],
        issuer: 'usernode',
        audience: APP_AUDIENCE,
      });
      // `pur` names what the token is for. Only user-identity tokens
      // authenticate a person here.
      if (claims && claims.pur === 'iframe') req.user = claims;
    } catch {}
  }

  // Static assets (CSS/JS/images) are always served; the API and the HTML
  // shell are gated so direct hits to the staging/prod subdomain don't
  // leak app data to the public internet.
  if (req.method !== 'GET' || req.path.startsWith('/api/')) {
    if (PUBLIC_API_PATHS.has(req.path)) return next();
    if (req.method === 'GET' && PUBLIC_API_PREFIXES.some((p) => req.path.startsWith(p))) return next();
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
});

app.get('/health', (_req, res) => {
  // 503 while draining so anything polling readiness sees the container
  // leaving rotation rather than a healthy app.
  if (shuttingDown) return res.status(503).json({ status: 'draining' });
  res.json({ status: 'ok' });
});

// The template ships no favicon file; index.html carries an inline SVG
// icon instead. Answer 204 here so anything that still probes
// /favicon.ico (older browsers, direct visits) doesn't fall through to
// the auth-gated catch-all and surface a 401 in the console on every
// fresh load.
app.get('/favicon.ico', (_req, res) => res.status(204).end());

/* ------------------------------------------------------------------ */
/* Profile photo (Phase 6)                                             */
/*                                                                     */
/* Avatars are stored platform-side; this app's DB keeps only the      */
/* returned URL and file id. The upload itself goes through the        */
/* bridge (usernode.uploadFile) on the client, so no storage secret    */
/* is needed here — staging does not carry USERNODE_STORAGE_TOKEN.     */
/* ------------------------------------------------------------------ */

// A staging-only demo avatar: an obviously fake inline SVG circle with a
// white "S". It lets a preview (and the ?demo=1 dapp.json check) show the
// set-photo state without writing a row owned by whoever opened it.
const DEMO_AVATAR_URL = 'data:image/svg+xml,'
  + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
    + '<rect width="128" height="128" fill="#7c3aed"/>'
    + '<text x="64" y="86" font-family="system-ui,sans-serif" font-size="64" font-weight="700"'
    + ' fill="#ffffff" text-anchor="middle">S</text></svg>');

// Only a platform file URL (or the demo data URI) is storable: a crafted
// request must not be able to persist an arbitrary or executable URL that
// the client later renders into an <img>.
function validAvatarUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.length > 2048) return false;
  if (url.startsWith('data:image/')) return IS_STAGING;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.pathname.includes('/app-files/');
  } catch {
    return false;
  }
}

app.get('/api/profile', async (req, res) => {
  if (IS_STAGING && req.query.demo === '1') {
    return res.json({ avatarUrl: DEMO_AVATAR_URL, avatarFileId: null });
  }
  if (!req.user) return res.json({ avatarUrl: null, avatarFileId: null });
  try {
    const { rows } = await pool.query(
      'SELECT avatar_url, avatar_file_id FROM user_profiles WHERE user_id = $1',
      [String(req.user.id)]);
    const row = rows[0];
    return res.json({
      avatarUrl: row ? row.avatar_url : null,
      avatarFileId: row ? row.avatar_file_id : null,
    });
  } catch (err) {
    console.error('[profile] load failed:', err.message);
    return res.status(500).json({ error: 'Could not load profile photo' });
  }
});

app.put('/api/profile/photo', async (req, res) => {
  const url = req.body && req.body.url;
  const fileId = req.body && req.body.fileId;
  if (!validAvatarUrl(url)) {
    return res.status(400).json({ error: 'Invalid photo URL' });
  }
  const cleanFileId = typeof fileId === 'string' && fileId.length <= 128 ? fileId : null;
  try {
    await pool.query(
      `INSERT INTO user_profiles (user_id, avatar_url, avatar_file_id, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE
         SET avatar_url = EXCLUDED.avatar_url,
             avatar_file_id = EXCLUDED.avatar_file_id,
             updated_at = now()`,
      [String(req.user.id), url, cleanFileId]);
    return res.json({ avatarUrl: url, avatarFileId: cleanFileId });
  } catch (err) {
    console.error('[profile] save failed:', err.message);
    return res.status(500).json({ error: 'Could not save profile photo' });
  }
});

app.delete('/api/profile/photo', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO user_profiles (user_id, avatar_url, avatar_file_id, updated_at)
       VALUES ($1, NULL, NULL, now())
       ON CONFLICT (user_id) DO UPDATE
         SET avatar_url = NULL, avatar_file_id = NULL, updated_at = now()`,
      [String(req.user.id)]);
    return res.json({ avatarUrl: null, avatarFileId: null });
  } catch (err) {
    console.error('[profile] remove failed:', err.message);
    return res.status(500).json({ error: 'Could not remove profile photo' });
  }
});

/* ------------------------------------------------------------------ */
/* Product catalog (Phase 7)                                           */
/*                                                                     */
/* Browsing and filtering moved server-side: the route filters, orders */
/* and pages in Postgres and answers one page at a time. It is public  */
/* and identity-optional (like /api/profile) so a signed-out preview   */
/* can still browse. Idempotent boot migration + a staging-only seed   */
/* keep the table truthful in every environment.                       */
/* ------------------------------------------------------------------ */

/* Idempotent upsert of the bundled catalog as a flat table, 100 rows a
 * statement. Re-running on every boot refreshes rows edited in the catalog
 * without duplicating them; it never deletes a row, so the generated
 * marketplace products (inserted by `npm run seed:products`) are left alone. */
async function seedCatalog(rows) {
  for (let i = 0; i < rows.length; i += 100) {
    await upsertRows(pool, rows.slice(i, i + 100), BASE_COLUMNS);
  }
}

/* Staging-only demo rows. The marketplace catalog (`npm run seed:products`)
 * is inserted into production by hand, so a staging preview of a fresh
 * database has none of it. This inserts the 21-product sample (3 per
 * category) so the product page, shelves and category counts can be reviewed.
 * They are obviously fake: ids and names carry "staging-demo" / "Staging
 * demo", and their photos are plain generated panels, not real pictures.
 * ON CONFLICT DO NOTHING keeps the block idempotent across rebuilds. */
const DEMO_HUES = {
  electronics: '#6366f1', fashion: '#e11d48', beauty: '#a855f7', home: '#0d9488',
  sports: '#ea580c', groceries: '#16a34a', accessories: '#64748b',
};

function demoPhoto(cat, n) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">'
    + '<rect width="800" height="800" fill="' + DEMO_HUES[cat] + '"/>'
    + '<circle cx="' + (200 + n * 140) + '" cy="260" r="150" fill="#ffffff" opacity="0.18"/>'
    + '<text x="400" y="420" font-family="system-ui,sans-serif" font-size="44" font-weight="700" fill="#ffffff" text-anchor="middle">Staging demo photo ' + (n + 1) + '</text></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

async function seedStagingDemo() {
  let sample;
  try {
    sample = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'generated', 'sample-products.json'), 'utf8'));
  } catch {
    return; // no sample file in this build: nothing to seed
  }
  const rows = sample.map((p, i) => {
    const credits = [0, 1, 2, 3].map((n) => ({
      src: demoPhoto(p.cat, n), alt: 'Staging demo photo', photographer: 'Staging demo', photographerUrl: '', pexelsUrl: '',
    }));
    const demo = Object.assign({}, p, {
      id: 'staging-demo-' + p.id,
      name: 'Staging demo ' + p.name,
      specs: p.specs.map((r) => (r.l === 'Product ID' ? { l: r.l, v: 'staging-demo-' + p.id } : r)),
    });
    // One fixed city (no location filter is declared for it), so these rows
    // never change the counts of the city and province filters on Home.
    return Object.assign(toGeneratedRow(demo, i, credits), { province: 'Sulawesi Selatan', city: 'Makassar' });
  });
  for (const row of rows) {
    const marks = ALL_COLUMNS.map((_, i) => '$' + (i + 1)).join(', ');
    await pool.query(
      'INSERT INTO products (' + ALL_COLUMNS.join(', ') + ') VALUES (' + marks + ') ON CONFLICT (id) DO NOTHING',
      ALL_COLUMNS.map((c) => (row[c] === undefined ? null : row[c])));
  }
}

app.get('/api/products', async (req, res) => {
  const params = parseParams(req.query);
  const where = buildWhere(params);
  const offset = (params.page - 1) * params.limit;
  try {
    const totalResult = await pool.query(
      'SELECT COUNT(*)::int AS total FROM products ' + where.clause, where.values);
    const total = totalResult.rows[0].total;
    const listResult = await pool.query(
      'SELECT * FROM products ' + where.clause + ' ' + orderBy(params.sort)
      + ' LIMIT $' + (where.values.length + 1) + ' OFFSET $' + (where.values.length + 2),
      where.values.concat([params.limit, offset]));
    const items = listResult.rows.map(toProduct);
    return res.json({
      items,
      total,
      page: params.page,
      limit: params.limit,
      hasMore: offset + items.length < total,
    });
  } catch (err) {
    console.error('[products] load failed:', err.message);
    return res.status(500).json({ error: 'Could not load products' });
  }
});

/* One product by id, with the detail fields (description, key features,
 * variants, stock, photo credits) the product page needs. */
app.get('/api/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    return res.json(toProduct(rows[0]));
  } catch (err) {
    console.error('[products] detail failed:', err.message);
    return res.status(500).json({ error: 'Could not load product' });
  }
});

/* Home-page aggregates computed from the table, never hand-listed: per
 * category and subcategory counts, plus the Featured, Trending and Deals
 * shelves. Featured = best rating weighted by review volume; Trending =
 * sales per day since listing; Deals = deepest discounts. Sold-out rows are
 * left out of the shelves. */
const SHELF_SIZE = 12;
async function shelf(orderSql, extraWhere) {
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE NOT oos' + (extraWhere ? ' AND ' + extraWhere : '')
    + ' ORDER BY ' + orderSql + ', id ASC LIMIT ' + SHELF_SIZE);
  return rows.map(toProduct);
}

app.get('/api/catalog/summary', async (_req, res) => {
  try {
    const [cats, subs, featured, trending, deals] = await Promise.all([
      pool.query('SELECT cat, COUNT(*)::int AS count FROM products GROUP BY cat'),
      pool.query('SELECT cat, sub, COUNT(*)::int AS count FROM products GROUP BY cat, sub'),
      shelf('rating * LN(reviews + 1) DESC'),
      shelf('sold::float / GREATEST(age, 1) DESC'),
      shelf('discount DESC, sold DESC', 'discount >= 30'),
    ]);
    return res.json({
      categories: cats.rows,
      subcategories: subs.rows,
      total: cats.rows.reduce((n, r) => n + r.count, 0),
      featured, trending, deals,
    });
  } catch (err) {
    console.error('[catalog] summary failed:', err.message);
    return res.status(500).json({ error: 'Could not load catalog summary' });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// HTML shell: serve the app if authenticated. Unauthenticated top-level
// visits (share links pasted into a browser — Sec-Fetch-Dest: document)
// are sent to the platform's chromeless view of this app, where the shell
// embeds it with a real token so the link just works. Every other
// tokenless case (iframe loads with an expired token, old browsers
// without Sec-Fetch-*) gets the "open in Homeroom" landing page instead
// of a redirect, so the platform shell is never loaded INSIDE its own
// app iframe and stray visits still don't reveal the app.
app.get('*', (req, res) => {
  if (!req.user) {
    // Deep-link pass-through (platform #743): carry the visited
    // path+query into the chromeless view so share links land on the
    // shared screen, not Home. The clean platform route stores `path`
    // as one encoded query value so an inner ?, &, or = survives. The
    // shell decodes and validates it as relative-only before use. The
    // character test keeps the
    // value attribute-safe for the landing anchor below — anything
    // unusual falls back to the bare link.
    const deepPath = /^\/[A-Za-z0-9\-._~!$&()*+,;=:@\/%?]*$/.test(req.originalUrl)
      ? '?path=' + encodeURIComponent(req.originalUrl) : '';
    if (PLATFORM_ORIGIN && req.get('sec-fetch-dest') === 'document') {
      return res.redirect(302, PLATFORM_ORIGIN + '/app/mvp-marketplace-d6ec50/full' + deepPath);
    }
    return res.status(401).send(`<!doctype html><meta charset=utf-8><title>Open in Homeroom</title>
<body style="font-family:system-ui;background:#09090b;color:#e4e4e7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
  <div style="max-width:24rem;padding:2rem;text-align:center">
    <h1 style="font-size:1.25rem;margin:0 0 0.5rem">Open this app inside Homeroom</h1>
    <p style="color:#a1a1aa;font-size:0.9rem;margin:0 0 1.25rem">This page is served via the platform; direct visits aren't authenticated.</p>
    <a href="${PLATFORM_ORIGIN}/app/mvp-marketplace-d6ec50/full${deepPath}" style="display:inline-block;padding:0.5rem 1rem;background:#7c3aed;color:white;border-radius:0.5rem;text-decoration:none;font-size:0.9rem">Open in Homeroom</a>
  </div>
</body>`);
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function start() {
  // Schema is applied idempotently on every boot. `user_profiles` backs the
  // profile photo: a public table (a user's avatar URL, nothing sensitive),
  // so staging copies its rows; it is new, so staging starts empty and the
  // letter fallback IS the empty state. No seed needed.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      avatar_url TEXT,
      avatar_file_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Product catalog: create the table + its filter/sort indexes and load the
  // bundled catalog. The catalog is a public table, so staging starts with a
  // copy of production's rows; the upsert below also makes a fresh table
  // non-empty. Development/testing runs against a fresh local database, so
  // the same upsert is what fills it there.
  await ensureProductsTable(pool);
  await seedCatalog(ROWS);
  if (IS_STAGING) await seedStagingDemo();

  const server = app.listen(port, () => console.log(`Listening on :${port}`));
  // Let Envoy retire idle upstream connections at 60s, with a 15s margin.
  server.keepAliveTimeout = 75_000;

  // Graceful shutdown: stop accepting connections, drain in-flight requests
  // under a hard deadline, close the pool, exit. Idempotent — a repeat
  // signal during the drain must be a no-op.
  const DRAIN_MS = 3000;
  shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} received, draining`);
    server.close(() => {});
    server.closeIdleConnections?.();
    const t = setTimeout(() => server.closeAllConnections?.(), DRAIN_MS);
    t.unref?.();
    try {
      await pool.end();
    } catch (e) {
      console.error('[shutdown] pool.end failed', e.message);
    }
    process.exit(0);
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

let shuttingDown = false;

start().catch(err => { console.error(err); process.exit(1); });
