const express = require('express');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const { ROWS, parseParams, buildWhere, orderBy, toProduct } =
  require('./src/products.cjs');
const { BASE_COLUMNS, ALL_COLUMNS, ensureProductsTable, upsertRows } = require('./src/schema.cjs');
const marketplace = require('./src/marketplace.cjs');
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
// EventSource cannot set request headers, so the live reviews stream passes
// the same identity token in the query string; the middleware above reads it.
const PUBLIC_API_PATHS = new Set(['/health', '/api/profile', '/api/products', '/api/catalog/summary', '/api/reviews/stream']);

// Public GET routes whose path carries a parameter (a product id, say), so an
// exact-path Set cannot name them. Only GET is ever public: every write still
// requires a signed-in user (and the reviews stream, a GET, carries identity
// through the same token the rest of the API uses).
const PUBLIC_API_PREFIXES = ['/api/products/'];

function isPublicApiGet(req) {
  if (req.method !== 'GET') return false;
  return PUBLIC_API_PREFIXES.some((p) => req.path.startsWith(p));
}

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
    if (isPublicApiGet(req)) return next();
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
/* Reviews + orders                                                    */
/*                                                                     */
/* Reviews, their photos and the orders behind "Verified purchase" are */
/* stored here now. `reviews` and `review_images` are PUBLIC tables (a */
/* review and the photos on it are public content). `orders` and       */
/* `order_items` are staging:private (they name a buyer and what they  */
/* bought), so `reviews` keeps an OPAQUE order reference and never a   */
/* foreign key into a private table.                                   */
/*                                                                     */
/* Photos themselves are platform files: the browser uploads the       */
/* re-encoded bytes through the bridge and this app persists only the  */
/* returned URL, never image bytes. The server validates that URL shape*/
/* exactly the way the profile photo does.                             */
/* ------------------------------------------------------------------ */

const REVIEW_MAX_IMAGES = 5;
const REVIEW_MAX_TEXT = 2000;
const REVIEW_MAX_ALT = 200;
const REVIEW_URL_MAX = 2048;
const REVIEW_FILE_ID_MAX = 128;
const REVIEW_LIST_LIMIT = 50;

// Rate limits (per user, in-memory sliding windows). A guard rail against a
// runaway client, not a security boundary: a process restart clears it, and
// with more than one container it would need a shared store.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_WINDOW_MAX = 5;
const RATE_DAY_MS = 24 * 60 * 60 * 1000;
const RATE_DAY_MAX = 20;
const RATE_IMAGE_DAY_MAX = 20;

// Image moderation: OFF by default, with the interface in place. A pending
// review (status = 'pending' + the "Pending review" chip) already renders,
// but nothing is sent to the proxy yet. Enabling it means calling
// POST `${USERNODE_LLM_PROXY_URL}/v1/messages` with `x-usernode-app-token`
// and the reviewer's forwarded `x-usernode-token`, keeping the row pending on
// a refusal, and failing open to published (with a log) on any proxy error.
// Left off so no review is billed to a user's budget before that path is
// reviewed and tested; the platform proxy is absent in staging either way.
const MODERATION_ON = false;

const rateState = new Map();

function rateCount(times, now) {
  return times.filter((t) => now - t < RATE_DAY_MS).length;
}

function rateWindowCount(userId, kind, windowMs, now) {
  const arr = (rateState.get(userId + '|' + kind) || []).filter((t) => now - t < windowMs);
  rateState.set(userId + '|' + kind, arr);
  return arr.length;
}

// Returns an error object when any limit is already reached. Nothing is
// recorded until the write actually succeeds, so a rejected request does not
// spend the user's allowance.
function rateBlock(userId, addedImages) {
  const now = Date.now();
  if (rateWindowCount(userId, 'w10', RATE_WINDOW_MS, now) >= RATE_WINDOW_MAX) {
    return { status: 429, error: 'Too many reviews just now. Please try again in a few minutes.' };
  }
  if (rateWindowCount(userId, 'wday', RATE_DAY_MS, now) >= RATE_DAY_MAX) {
    return { status: 429, error: 'You have posted the maximum number of reviews for today. Please try again tomorrow.' };
  }
  const imagesToday = rateWindowCount(userId, 'iday', RATE_DAY_MS, now);
  if (addedImages > 0 && imagesToday + addedImages > RATE_IMAGE_DAY_MAX) {
    return { status: 429, error: 'You have attached the maximum number of photos for today. Please try again tomorrow.' };
  }
  return null;
}

function rateRecord(userId, addedImages) {
  const now = Date.now();
  const push = (kind) => {
    const arr = rateState.get(userId + '|' + kind) || [];
    arr.push(now);
    rateState.set(userId + '|' + kind, arr);
  };
  push('w10');
  push('wday');
  for (let i = 0; i < addedImages; i += 1) push('iday');
}

// An image URL is storable only if it is a platform file URL (or, in staging
// only, a data URI the seed used). Same shape rule as the profile photo:
// a crafted request must not persist an arbitrary or executable URL.
function validReviewImageUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.length > REVIEW_URL_MAX) return false;
  if (url.startsWith('data:image/')) return IS_STAGING;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.pathname.includes('/app-files/');
  } catch {
    return false;
  }
}

function cleanReviewImages(images) {
  if (!Array.isArray(images)) return { error: 'Invalid photos' };
  if (images.length > REVIEW_MAX_IMAGES) {
    return { error: 'You can attach up to ' + REVIEW_MAX_IMAGES + ' photos.' };
  }
  const out = [];
  for (const raw of images) {
    if (!raw || typeof raw !== 'object') return { error: 'Invalid photo' };
    if (!validReviewImageUrl(raw.url)) return { error: 'Invalid photo URL' };
    const fileId = typeof raw.fileId === 'string' && raw.fileId.length <= REVIEW_FILE_ID_MAX
      ? raw.fileId : null;
    const alt = typeof raw.alt === 'string' && raw.alt.length <= REVIEW_MAX_ALT
      ? raw.alt.trim() : '';
    out.push({ url: raw.url, fileId, alt });
  }
  return { images: out };
}

async function ensureReviewTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'published',
      order_ref TEXT,
      order_item_ref TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS review_images (
      id BIGSERIAL PRIMARY KEY,
      review_id BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      file_id TEXT,
      alt TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0
    )
  `);
  // Columns the marketplace catalog's reviews use: a headline, a helpful
  // count and an optional seller reply. A shopper's own review leaves them at
  // their defaults.
  await pool.query("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT ''");
  await pool.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS helpful INTEGER NOT NULL DEFAULT 0');
  await pool.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seller_reply TEXT');
  await pool.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seller_reply_at TIMESTAMPTZ');
  await pool.query('CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id, created_at DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS review_images_review_idx ON review_images (review_id, position)');
  // At most one review per purchased line. A second attempt at the same line
  // edits the first row instead of creating a duplicate. Keyed on the real
  // line reference, so rows without one (seed-only) do not collide.
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_item_idx
    ON reviews (user_id, product_id, order_item_ref)`);

  // Orders are personal information, so the schema is copied to staging and
  // the rows never are.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Processing',
      placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      total INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      shipping JSONB NOT NULL DEFAULT '{}'::jsonb,
      address JSONB NOT NULL DEFAULT '{}'::jsonb
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      qty INTEGER NOT NULL DEFAULT 1,
      price INTEGER NOT NULL DEFAULT 0
    )
  `);
  await pool.query('CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id, placed_at DESC)');
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS orders_user_number_idx ON orders (user_id, number)');
  await pool.query('CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id)');
  await pool.query("COMMENT ON TABLE orders IS 'staging:private'");
  await pool.query("COMMENT ON TABLE order_items IS 'staging:private'");
}

// A purchase counts as verified when the buyer has an order containing this
// product that was not cancelled or refunded. The seed creates one such order
// for a FAKE user so the chip is visible in a preview; the viewing account is
// deliberately given none, which is what keeps the refusal path testable.
async function findVerifiedLine(userId, productId) {
  const { rows } = await pool.query(
    `SELECT oi.id AS item_id, oi.order_id
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = $1 AND oi.product_id = $2
        AND o.status NOT IN ('Cancelled', 'Refunded', 'Failed')
      ORDER BY o.placed_at DESC
      LIMIT 1`,
    [String(userId), productId]);
  return rows[0] || null;
}

function reviewJson(row, images, viewerId) {
  return {
    id: String(row.id),
    productId: row.product_id,
    author: row.author,
    rating: row.rating,
    body: row.body,
    verified: row.verified,
    status: row.status,
    title: row.title || '',
    helpful: row.helpful || 0,
    sellerReply: row.seller_reply ? { text: row.seller_reply, at: row.seller_reply_at } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mine: viewerId != null && String(row.user_id) === String(viewerId),
    images: (images || []).map((im) => ({ id: String(im.id), url: im.url, alt: im.alt || '' })),
  };
}

async function loadReviewImages(reviewIds) {
  const byReview = new Map();
  if (!reviewIds.length) return byReview;
  const { rows } = await pool.query(
    'SELECT id, review_id, url, alt FROM review_images WHERE review_id = ANY($1::bigint[]) ORDER BY position, id',
    [reviewIds]);
  for (const im of rows) {
    const key = String(im.review_id);
    if (!byReview.has(key)) byReview.set(key, []);
    byReview.get(key).push(im);
  }
  return byReview;
}

/* Realtime fan-out: one process-local emitter, one channel per product id.
 * The client's SSE connection is a GET, so the token rides in the query the
 * same way the iframe's first load carries it. */
const reviewBus = new EventEmitter();
reviewBus.setMaxListeners(0);
let reviewStreamCount = 0;
const REVIEW_STREAM_MAX = 200;

function publishReview(productId, event) {
  reviewBus.emit('review:' + productId, event);
}

app.get('/api/products/:id/reviews', async (req, res) => {
  const productId = String(req.params.id);
  try {
    const { rows } = await pool.query(
      `SELECT * FROM reviews
        WHERE product_id = $1 AND status <> 'rejected'
        ORDER BY created_at DESC LIMIT ${REVIEW_LIST_LIMIT}`,
      [productId]);
    const images = await loadReviewImages(rows.map((r) => String(r.id)));
    const viewerId = req.user ? req.user.id : null;
    const items = rows.map((r) => reviewJson(r, images.get(String(r.id)), viewerId));
    let viewer = { signedIn: !!req.user, canReview: false, hasReviewed: false, reviewId: null };
    if (req.user) {
      const mine = rows.find((r) => String(r.user_id) === String(req.user.id));
      viewer.hasReviewed = !!mine;
      viewer.reviewId = mine ? String(mine.id) : null;
      viewer.canReview = !!await findVerifiedLine(req.user.id, productId);
    }
    // Exact breakdown of every published review (the list below is capped).
    // `exact` is true for marketplace products, whose card rating is this very
    // average; the bundled catalog keeps its own aggregate.
    const dist = await pool.query(
      `SELECT rating, COUNT(*)::int AS n FROM reviews
        WHERE product_id = $1 AND status <> 'rejected' GROUP BY rating`, [productId]);
    const counts = [0, 0, 0, 0, 0];
    dist.rows.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) counts[5 - r.rating] = r.n; });
    const total = counts.reduce((a, b) => a + b, 0);
    const sum = counts.reduce((a, n, i) => a + n * (5 - i), 0);
    const summary = {
      exact: marketplace.isMarketplaceId(productId),
      count: total,
      average: total ? Math.floor((sum * 20 + total) / (2 * total)) / 10 : 0,
      counts,
    };
    return res.json({ items, viewer, summary });
  } catch (err) {
    console.error('[reviews] load failed:', err.message);
    return res.status(500).json({ error: 'Could not load reviews' });
  }
});

async function insertReviewImages(client, reviewId, images) {
  for (let i = 0; i < images.length; i += 1) {
    const im = images[i];
    await client.query(
      'INSERT INTO review_images (review_id, url, file_id, alt, position) VALUES ($1, $2, $3, $4, $5)',
      [reviewId, im.url, im.fileId, im.alt, i]);
  }
}

app.post('/api/reviews', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'account_required' });
  const body = req.body || {};
  const productId = typeof body.productId === 'string' ? body.productId.slice(0, 64) : '';
  const rating = Number(body.rating);
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!productId) return res.status(400).json({ error: 'Missing product' });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars.' });
  }
  if (text.length > REVIEW_MAX_TEXT) {
    return res.status(400).json({ error: 'Review text is too long.' });
  }
  const cleaned = cleanReviewImages(body.images || []);
  if (cleaned.error) return res.status(400).json({ error: cleaned.error });
  const images = cleaned.images;

  try {
    const prod = await pool.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (!prod.rows.length) return res.status(404).json({ error: 'Product not found' });

    const line = await findVerifiedLine(req.user.id, productId);
    if (!line) {
      return res.status(403).json({ error: 'Only verified buyers can review this product.' });
    }

    const blocked = rateBlock(String(req.user.id), images.length);
    if (blocked) return res.status(blocked.status).json({ error: blocked.error });

    const author = String(req.user.username || 'Shopper').slice(0, 80);
    // Off unless the platform LLM proxy is configured; absent in staging, so
    // this is `published` there and the chip never appears by accident.
    const status = MODERATION_ON ? 'pending' : 'published';

    const client = await pool.connect();
    let row;
    try {
      await client.query('BEGIN');
      // One review per purchased line: a second attempt edits the first.
      const existing = await client.query(
        `SELECT id FROM reviews
          WHERE user_id = $1 AND product_id = $2 AND COALESCE(order_item_ref, '') = $3
          LIMIT 1`,
        [String(req.user.id), productId, String(line.item_id)]);
      if (existing.rows.length) {
        const updated = await client.query(
          `UPDATE reviews
              SET rating = $1, body = $2, status = $3, verified = TRUE,
                  order_ref = $4, order_item_ref = $5, updated_at = now()
            WHERE id = $6
            RETURNING *`,
          [rating, text, status, String(line.order_id), String(line.item_id), existing.rows[0].id]);
        row = updated.rows[0];
        await client.query('DELETE FROM review_images WHERE review_id = $1', [row.id]);
      } else {
        const inserted = await client.query(
          `INSERT INTO reviews
             (product_id, user_id, author, rating, body, verified, status, order_ref, order_item_ref)
           VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8)
           RETURNING *`,
          [productId, String(req.user.id), author, rating, text, status,
            String(line.order_id), String(line.item_id)]);
        row = inserted.rows[0];
      }
      await insertReviewImages(client, row.id, images);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }

    rateRecord(String(req.user.id), images.length);
    if (marketplace.isMarketplaceId(productId)) await marketplace.refreshMarketplaceRatings(pool, productId);
    const review = reviewJson(row, images.map((im, i) => ({ id: 'new-' + i, url: im.url, alt: im.alt })), req.user.id);
    review.mine = true;
    publishReview(productId, { type: 'upsert', productId, review });
    return res.status(201).json({ review });
  } catch (err) {
    console.error('[reviews] save failed:', err.message);
    return res.status(500).json({ error: 'Could not save your review' });
  }
});

// Load a review and confirm the caller owns it. Answers 403 without saying
// whether the row exists.
async function loadOwnReview(req, res) {
  const id = req.params.id;
  if (!/^\d+$/.test(String(id))) {
    res.status(404).json({ error: 'Review not found' });
    return null;
  }
  const { rows } = await pool.query('SELECT * FROM reviews WHERE id = $1', [id]);
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: 'Review not found' });
    return null;
  }
  if (!req.user || String(row.user_id) !== String(req.user.id)) {
    res.status(403).json({ error: 'Not your review' });
    return null;
  }
  return row;
}

app.patch('/api/reviews/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'account_required' });
  const body = req.body || {};
  let images = null;
  if (body.images !== undefined) {
    const cleaned = cleanReviewImages(body.images);
    if (cleaned.error) return res.status(400).json({ error: cleaned.error });
    images = cleaned.images;
  }
  const hasRating = body.rating !== undefined;
  const rating = hasRating ? Number(body.rating) : null;
  if (hasRating && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return res.status(400).json({ error: 'Choose a rating from 1 to 5 stars.' });
  }
  const hasText = body.body !== undefined;
  const text = hasText ? String(body.body).trim() : null;
  if (hasText && text.length > REVIEW_MAX_TEXT) {
    return res.status(400).json({ error: 'Review text is too long.' });
  }

  try {
    const row = await loadOwnReview(req, res);
    if (!row) return;
    const client = await pool.connect();
    let updatedRow;
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        `UPDATE reviews
            SET rating = COALESCE($1, rating),
                body = COALESCE($2, body),
                updated_at = now()
          WHERE id = $3
          RETURNING *`,
        [rating, text, row.id]);
      updatedRow = updated.rows[0];
      if (images) {
        await client.query('DELETE FROM review_images WHERE review_id = $1', [row.id]);
        await insertReviewImages(client, row.id, images);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
    if (marketplace.isMarketplaceId(row.product_id)) await marketplace.refreshMarketplaceRatings(pool, row.product_id);
    const imgRows = (await loadReviewImages([String(row.id)])).get(String(row.id)) || [];
    const review = reviewJson(updatedRow, imgRows, req.user.id);
    review.mine = true;
    publishReview(row.product_id, { type: 'upsert', productId: row.product_id, review });
    return res.json({ review });
  } catch (err) {
    console.error('[reviews] update failed:', err.message);
    return res.status(500).json({ error: 'Could not update your review' });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'account_required' });
  try {
    const row = await loadOwnReview(req, res);
    if (!row) return;
    await pool.query('DELETE FROM reviews WHERE id = $1', [row.id]);
    if (marketplace.isMarketplaceId(row.product_id)) await marketplace.refreshMarketplaceRatings(pool, row.product_id);
    publishReview(row.product_id, { type: 'delete', productId: row.product_id, id: String(row.id) });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[reviews] delete failed:', err.message);
    return res.status(500).json({ error: 'Could not delete your review' });
  }
});

/* Server-sent events: one channel per product. Long-lived, so it is capped,
 * and cleaned up the moment the client goes away. */
app.get('/api/reviews/stream', (req, res) => {
  const productId = String(req.query.product || '');
  if (!productId) return res.status(400).json({ error: 'Missing product' });
  if (reviewStreamCount >= REVIEW_STREAM_MAX) {
    return res.status(503).json({ error: 'Too many live connections' });
  }
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write('event: ready\ndata: {}\n\n');
  reviewStreamCount += 1;

  const channel = 'review:' + productId;
  const onEvent = (payload) => {
    try {
      res.write('data: ' + JSON.stringify(payload) + '\n\n');
    } catch {
      // The socket is gone; the close handler below tidies up.
    }
  };
  reviewBus.on(channel, onEvent);

  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* ignore */ }
  }, 25000);
  heartbeat.unref?.();

  const cleanup = () => {
    clearInterval(heartbeat);
    reviewBus.off(channel, onEvent);
    reviewStreamCount = Math.max(0, reviewStreamCount - 1);
  };
  req.on('close', cleanup);
  req.on('error', cleanup);
});

/* Orders mirror. The client still keeps its order locally (that path is what
 * makes "Place order" work offline), and this call mirrors it into Postgres so
 * a purchase can be verified later. Idempotent on (user, order number). */
app.post('/api/orders', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'account_required' });
  const body = req.body || {};
  const number = typeof body.number === 'string' ? body.number.slice(0, 60) : '';
  if (!number) return res.status(400).json({ error: 'Missing order number' });
  const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const total = Number.isInteger(body.total) ? body.total : 0;
  try {
    const client = await pool.connect();
    let orderId = String(body.id || '').slice(0, 80) || ('o_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    try {
      await client.query('BEGIN');
      const existing = await client.query(
        'SELECT id FROM orders WHERE user_id = $1 AND number = $2', [String(req.user.id), number]);
      if (existing.rows.length) {
        await client.query('COMMIT');
        return res.json({ ok: true, id: String(existing.rows[0].id), number });
      }
      await client.query(
        `INSERT INTO orders (id, user_id, number, status, total, currency, shipping, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, String(req.user.id), number,
          typeof body.status === 'string' ? body.status.slice(0, 40) : 'Processing',
          total, typeof body.currency === 'string' ? body.currency.slice(0, 8) : 'USD',
          JSON.stringify(body.shipping || {}), JSON.stringify(body.address || {})]);
      for (const it of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, qty, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [orderId, String(it.id || '').slice(0, 64), String(it.name || '').slice(0, 200),
            Number(it.qty) || 1, Number(it.price) || 0]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
    return res.status(201).json({ ok: true, id: orderId, number });
  } catch (err) {
    console.error('[orders] save failed:', err.message);
    return res.status(500).json({ error: 'Could not save your order' });
  }
});

app.get('/api/orders', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'account_required' });
  try {
    const { rows } = await pool.query(
      'SELECT id, number, status, placed_at, total, currency FROM orders WHERE user_id = $1 ORDER BY placed_at DESC LIMIT 50',
      [String(req.user.id)]);
    return res.json({ items: rows.map((o) => ({
      id: o.id, number: o.number, status: o.status, placedAt: o.placed_at,
      total: o.total, currency: o.currency,
    })) });
  } catch (err) {
    console.error('[orders] load failed:', err.message);
    return res.status(500).json({ error: 'Could not load orders' });
  }
});

/* Staging seed. Runs after the migrations, only under USERNODE_ENV=staging,
 * and is idempotent. Every row belongs to a FAKE identity, never to the
 * account that opens the preview, so a preview never hands the viewer a
 * purchase it did not make and the refusal path stays testable. Photos use
 * small data-URI placeholders, never /app-files/ URLs: platform files are
 * not cloned into staging, so a production URL would 404 there. */
function demoReviewImage(from, to) {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320">'
    + '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" stop-color="' + from + '"/><stop offset="1" stop-color="' + to + '"/>'
    + '</linearGradient></defs>'
    + '<rect width="320" height="320" fill="url(#g)"/>'
    + '<circle cx="160" cy="150" r="70" fill="#ffffff" fill-opacity="0.35"/></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

async function seedReviews() {
  if (!IS_STAGING) return;
  await pool.query(
    `INSERT INTO orders (id, user_id, number, status, placed_at, total, currency)
     VALUES ('o_demo_9001', 'staging-demo-user', 'BZ-DEMO-9001', 'Completed', now() - interval '12 days', 2600, 'USD')
     ON CONFLICT (id) DO NOTHING`);
  await pool.query(
    `INSERT INTO order_items (id, order_id, product_id, name, qty, price)
     VALUES (900101, 'o_demo_9001', 'p09', 'Staging demo product', 1, 2600)
     ON CONFLICT (id) DO NOTHING`);

  const reviews = [
    { id: 900001, product: 'p09', user: 'staging-demo-user', author: 'Staging demo shopper', rating: 5,
      body: 'Staging demo review: the cotton is soft and the fit is comfortably relaxed.',
      verified: true, order: 'o_demo_9001', item: '900101' },
    { id: 900002, product: 'p09', user: 'staging-demo-user-2', author: 'Staging demo buyer', rating: 4,
      body: 'Staging demo review: good value for the price and it washed well.',
      verified: false, order: null, item: null },
    { id: 900003, product: 'p19', user: 'staging-demo-user', author: 'Staging demo shopper', rating: 5,
      body: 'Staging demo review: the lamp warms the whole room nicely.',
      verified: false, order: null, item: null },
    { id: 900004, product: 'p09', user: 'staging-demo-user-3', author: 'Staging demo customer', rating: 3,
      body: 'Staging demo review: arrived on time and matches the photos, a little snug.',
      verified: false, order: null, item: null },
  ];
  for (const r of reviews) {
    await pool.query(
      `INSERT INTO reviews (id, product_id, user_id, author, rating, body, verified, status, order_ref, order_item_ref, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', $8, $9, now() - ($10 || ' days')::interval)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.product, r.user, r.author, r.rating, r.body, r.verified, r.order, r.item, String(20 - r.id % 10)]);
  }

  const images = [
    { id: 900011, review: 900001, url: demoReviewImage('#c7d2fe', '#4f46e5'), alt: 'Folded shirt on a table' },
    { id: 900012, review: 900001, url: demoReviewImage('#fde68a', '#b45309'), alt: 'Close-up of the fabric' },
    { id: 900021, review: 900002, url: demoReviewImage('#bbf7d0', '#15803d'), alt: 'Shirt hanging by a window' },
    { id: 900031, review: 900003, url: demoReviewImage('#fbcfe8', '#be185d'), alt: 'Lamp on a shelf at night' },
    { id: 900032, review: 900003, url: demoReviewImage('#a5f3fc', '#0e7490'), alt: 'Lamp in a reading corner' },
  ];
  for (let i = 0; i < images.length; i += 1) {
    const im = images[i];
    await pool.query(
      `INSERT INTO review_images (id, review_id, url, file_id, alt, position)
       VALUES ($1, $2, $3, NULL, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [im.id, im.review, im.url, im.alt, i]);
  }
}

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

  // Reviews, their photos and the order mirror. Reviews/review_images are
  // public; orders/order_items are staging:private. The staging seed only
  // runs under USERNODE_ENV=staging and only ever writes fake identities.
  await ensureReviewTables();
  await seedReviews();

  // The marketplace expansion (about 500 products and their reviews) comes
  // from data/marketplace/*.json in every environment: it is catalog content,
  // not a staging fixture. Ratings are then recomputed from the reviews so a
  // card always shows the average and count of the reviews behind it.
  await marketplace.seedMarketplaceProducts(pool);
  await marketplace.seedMarketplaceReviews(pool);
  await marketplace.refreshMarketplaceRatings(pool);

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
