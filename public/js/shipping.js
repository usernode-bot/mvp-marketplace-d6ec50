/* Shipping / expedition (checkout). The catalogue of destination countries
 * and their courier options lives in the one typed config below — every
 * courier carries { id, name, service, eta, etaDays, price }, so adding a
 * courier is a data edit, not a new branch of rendering code.
 *
 * Rules:
 *  - Every country offers at least three couriers (a check in this module
 *    and a dapp.json test enforce the floor).
 *  - Each country names a `defaultCourier`, the option preselected at
 *    checkout for a shopper whose saved address is in that country.
 *  - Prices are integer cents, formatted with fmtPrice() like the rest of
 *    the app. `etaDays` drives the estimated-delivery date range shown on
 *    the success screen and the Orders tab.
 *
 * Like the rest of checkout this is mock and client-side: nothing contacts a
 * real courier. The chosen country + courier are snapshotted onto the order
 * at placement, so later edits here never rewrite order history.
 */

export const COUNTRIES = [
  {
    id: 'us',
    name: 'United States',
    defaultCourier: 'us-ups-ground',
    couriers: [
      { id: 'us-ups-ground', name: 'UPS', service: 'Ground', eta: '3-5 business days', etaDays: [3, 5], price: 599 },
      { id: 'us-fedex-express', name: 'FedEx', service: 'Express Saver', eta: '1-2 business days', etaDays: [1, 2], price: 1299 },
      { id: 'us-usps-priority', name: 'USPS', service: 'Priority Mail', eta: '2-3 business days', etaDays: [2, 3], price: 799 },
      { id: 'us-dhl', name: 'DHL', service: 'Express Worldwide', eta: '1-2 business days', etaDays: [1, 2], price: 1499 },
    ],
  },
  {
    id: 'id',
    name: 'Indonesia',
    defaultCourier: 'id-jne-reg',
    couriers: [
      { id: 'id-jne-reg', name: 'JNE', service: 'Reguler', eta: '2-4 business days', etaDays: [2, 4], price: 2500 },
      { id: 'id-jnt-express', name: 'J&T Express', service: 'EZ', eta: '2-3 business days', etaDays: [2, 3], price: 2200 },
      { id: 'id-sicepat', name: 'SiCepat', service: 'REG', eta: '2-4 business days', etaDays: [2, 4], price: 2000 },
      { id: 'id-anteraja', name: 'AnterAja', service: 'Reguler', eta: '3-5 business days', etaDays: [3, 5], price: 1900 },
      { id: 'id-ninja', name: 'Ninja Xpress', service: 'Standard', eta: '3-5 business days', etaDays: [3, 5], price: 2100 },
    ],
  },
  {
    id: 'sg',
    name: 'Singapore',
    defaultCourier: 'sg-singpost',
    couriers: [
      { id: 'sg-singpost', name: 'SingPost', service: 'SmartPac', eta: '2-3 business days', etaDays: [2, 3], price: 500 },
      { id: 'sg-ninjavan', name: 'Ninja Van', service: 'Standard', eta: '1-2 business days', etaDays: [1, 2], price: 600 },
      { id: 'sg-jnt', name: 'J&T Express', service: 'Standard', eta: '2-3 business days', etaDays: [2, 3], price: 550 },
    ],
  },
  {
    id: 'my',
    name: 'Malaysia',
    defaultCourier: 'my-poslaju',
    couriers: [
      { id: 'my-poslaju', name: 'PosLaju', service: 'Domestic', eta: '2-3 business days', etaDays: [2, 3], price: 1200 },
      { id: 'my-jnt', name: 'J&T Express', service: 'Standard', eta: '1-2 business days', etaDays: [1, 2], price: 1100 },
      { id: 'my-ninjavan', name: 'Ninja Van', service: 'Standard', eta: '2-3 business days', etaDays: [2, 3], price: 1000 },
      { id: 'my-dhl', name: 'DHL', service: 'eCommerce', eta: '2-4 business days', etaDays: [2, 4], price: 1800 },
    ],
  },
  {
    id: 'gb',
    name: 'United Kingdom',
    defaultCourier: 'gb-royalmail',
    couriers: [
      { id: 'gb-royalmail', name: 'Royal Mail', service: 'Tracked 24', eta: '1-2 business days', etaDays: [1, 2], price: 599 },
      { id: 'gb-dpd', name: 'DPD', service: 'Next Day', eta: '1 business day', etaDays: [1, 1], price: 999 },
      { id: 'gb-evri', name: 'Evri', service: 'Standard', eta: '2-4 business days', etaDays: [2, 4], price: 499 },
    ],
  },
  {
    id: 'au',
    name: 'Australia',
    defaultCourier: 'au-auspost',
    couriers: [
      { id: 'au-auspost', name: 'Australia Post', service: 'Parcel Post', eta: '2-5 business days', etaDays: [2, 5], price: 899 },
      { id: 'au-startrack', name: 'StarTrack', service: 'Express', eta: '1-2 business days', etaDays: [1, 2], price: 1399 },
      { id: 'au-couriersplease', name: 'CouriersPlease', service: 'Standard', eta: '3-5 business days', etaDays: [3, 5], price: 799 },
    ],
  },
  {
    id: 'jp',
    name: 'Japan',
    defaultCourier: 'jp-yamato',
    couriers: [
      { id: 'jp-yamato', name: 'Yamato', service: 'Takkyubin', eta: '1-2 business days', etaDays: [1, 2], price: 800 },
      { id: 'jp-sagawa', name: 'Sagawa', service: 'Standard', eta: '2-3 business days', etaDays: [2, 3], price: 750 },
      { id: 'jp-japanpost', name: 'Japan Post', service: 'Yu-Pack', eta: '2-3 business days', etaDays: [2, 3], price: 700 },
    ],
  },
];

const COUNTRY_LOOKUP = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));

export function countryById(id) {
  return COUNTRY_LOOKUP[id] || null;
}

export function courierById(countryId, courierId) {
  const c = countryById(countryId);
  if (!c) return null;
  return c.couriers.find((x) => x.id === courierId) || null;
}

/* The country's default courier, or its first option when the named default
 * is missing (so the picker always preselects something valid). */
export function defaultCourierId(countryId) {
  const c = countryById(countryId);
  if (!c) return null;
  return c.couriers.some((x) => x.id === c.defaultCourier) ? c.defaultCourier : (c.couriers[0] ? c.couriers[0].id : null);
}

/* Common names for each country's free-text address fields: the country name
 * itself plus the major cities a mock address is likely to name, so a saved
 * "Jakarta" or "London" address lands on the right destination. */
const COUNTRY_ALIASES = {
  us: ['united states', 'usa', 'u.s.a', 'u.s.', 'us', 'new york', 'los angeles', 'chicago', 'houston', 'portland', 'austin', 'seattle', 'san francisco', 'boston', 'denver', 'miami'],
  id: ['indonesia', 'indonesian', 'jakarta', 'surabaya', 'bandung', 'medan', 'semarang', 'makassar', 'denpasar', 'bali'],
  sg: ['singapore'],
  my: ['malaysia', 'kuala lumpur', 'penang', 'johor bahru'],
  gb: ['united kingdom', 'uk', 'great britain', 'england', 'scotland', 'wales', 'london', 'manchester', 'birmingham', 'edinburgh', 'glasgow'],
  au: ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'adelaide'],
  jp: ['japan', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya', 'sapporo'],
};

export function countryForAddress(address) {
  return countryMatch(address) || COUNTRIES[0];
}

/* The country a saved address clearly belongs to, or null when nothing in the
 * address names one. Checkout uses the null case to leave the shopper's own
 * country choice alone rather than snapping back to the first country. */
export function countryMatch(address) {
  const hay = [address && address.city, address && address.postal, address && address.state]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  for (const c of COUNTRIES) {
    const names = COUNTRY_ALIASES[c.id] || [c.name.toLowerCase()];
    if (names.some((n) => matchesPhrase(hay, n))) return c;
  }
  return null;
}

/* Whole-word phrase match: "us" matches "Portland, US" but not "austin", and
 * "au" never sneaks into "australia". */
function matchesPhrase(hay, phrase) {
  if (!hay || !phrase) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i').test(hay);
}

/* Every country must offer at least this many couriers. The dapp.json
 * checkout test asserts the same floor on the rendered screen; keeping the
 * invariant here makes a bad config edit fail loudly in development. */
export const MIN_COURIERS_PER_COUNTRY = 3;

export function countriesBelowMinimum() {
  return COUNTRIES.filter((c) => c.couriers.length < MIN_COURIERS_PER_COUNTRY).map((c) => c.id);
}

/* Config invariant: every country must offer at least MIN_COURIERS_PER_COUNTRY
 * couriers. A violation is surfaced as a console error so the platform's
 * "loads with no console errors" check fails the moment a bad edit lands,
 * instead of quietly shipping a country with too few choices. Silent when the
 * config is valid. */
if (typeof console !== 'undefined') {
  const bad = countriesBelowMinimum();
  if (bad.length) {
    console.error('shipping.js: countries with fewer than ' + MIN_COURIERS_PER_COUNTRY + ' couriers: ' + bad.join(', '));
  }
}
