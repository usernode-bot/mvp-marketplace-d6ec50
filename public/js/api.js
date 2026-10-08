/* The one place this app talks to its own server. It forwards the
 * platform-issued iframe token the way the auth middleware expects: the
 * shell injects it as ?token= on first load, and every later request carries
 * it as the x-usernode-token header.
 *
 * A non-2xx response or a network failure resolves to { ok: false } instead
 * of throwing, so callers render an error state and the gate's
 * no-console-errors check stays green offline. The app's own address (no
 * ?token=) relies on the platform edge adding the header, so we only add it
 * when we actually have one.
 */

function token() {
  try {
    return new URLSearchParams(window.location.search).get('token');
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  const headers = Object.assign({}, options.headers);
  const t = token();
  if (t) headers['x-usernode-token'] = t;
  if (options.body !== undefined && !headers['content-type']) {
    headers['content-type'] = 'application/json';
  }
  try {
    const resp = await fetch(path, Object.assign({}, options, { headers }));
    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = null;
    }
    if (!resp.ok) return { ok: false, status: resp.status, data };
    return { ok: true, status: resp.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/* Fetch one page of the product catalog. `params` is the plain object built
 * by the filter service (q/cat/sub/province/city/min/max/sort/page/limit);
 * empty values are dropped so the query string stays tidy. Returns the same
 * { ok, status, data } shape as apiFetch, with data
 * { items, total, page, limit, hasMore }.
 */
export function fetchProducts(params = {}) {
  const qs = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value === undefined || value === null || value === '') return;
    qs.set(key, String(value));
  });
  const query = qs.toString();
  return apiFetch('/api/products' + (query ? '?' + query : ''));
}

/* ------------------------------------------------------------------ */
/* Reviews + orders                                                    */
/* ------------------------------------------------------------------ */

/* One product's reviews plus the viewer's own situation on it: whether they
 * are signed in, whether a verified purchase lets them review, and whether
 * they already have one (so the composer can edit instead of create). */
export function fetchReviews(productId, params = {}) {
  const qs = new URLSearchParams();
  if (params.demo) qs.set('demo', '1');
  const query = qs.toString();
  return apiFetch('/api/products/' + encodeURIComponent(productId) + '/reviews' + (query ? '?' + query : ''));
}

export function createReview(payload) {
  return apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateReview(id, payload) {
  return apiFetch('/api/reviews/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deleteReview(id) {
  return apiFetch('/api/reviews/' + encodeURIComponent(id), { method: 'DELETE' });
}

/* Mirror a placed order server-side so a verified-purchase look-up has
 * something to find. Best effort: the local order already succeeded. */
export function createOrder(order) {
  return apiFetch('/api/orders', { method: 'POST', body: JSON.stringify(order) });
}

export function fetchOrders() {
  return apiFetch('/api/orders');
}

/* The live reviews stream. EventSource cannot send request headers, so the
 * iframe token rides in the query string exactly as it does on first load.
 * Returns null when there is no EventSource in this browser. */
export function openReviewStream(productId, { onEvent, onOpen, onError } = {}) {
  if (typeof EventSource !== 'function') return null;
  const qs = new URLSearchParams();
  qs.set('product', productId);
  const t = token();
  if (t) qs.set('token', t);
  let source;
  try {
    source = new EventSource('/api/reviews/stream?' + qs.toString());
  } catch {
    return null;
  }
  source.addEventListener('ready', () => { if (onOpen) onOpen(); });
  source.addEventListener('message', (e) => {
    if (!e.data) return;
    try {
      const payload = JSON.parse(e.data);
      if (onEvent) onEvent(payload);
    } catch {
      // A malformed frame is ignored; the next one is still applied.
    }
  });
  source.addEventListener('error', () => { if (onError) onError(); });
  return source;
}
