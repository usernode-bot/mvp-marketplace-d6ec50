/* Turns one generated product (data/generated/products.json) into a
 * database row for the `products` table. Used by the seed script and by the
 * server's staging demo rows, so both write exactly the same shape.
 *
 * `credits` are the verified photos for the product, from
 * data/generated/image-mapping.json: [{ src, alt, photographer, ... }]. The
 * first one is the card photo and the whole list is the detail gallery. */

const { LOCATIONS } = require('../public/js/locations.js');
const { subcategoryName } = require('../public/js/data.js');

const CITY_ROWS = LOCATIONS.flatMap((province) =>
  province.cities.map((city) => ({ province: province.name, city: city.name })));

/* Same deterministic id-to-city rule the bundled catalog uses. */
function locationFor(id) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s += id.charCodeAt(i);
  return CITY_ROWS[s % CITY_ROWS.length];
}

/* Generated rows sort after the curated Recommended list (ranks 0..~200). */
const RANK_BASE = 100000;

function toGeneratedRow(p, index, credits) {
  const photos = Array.isArray(credits) ? credits : [];
  const urls = photos.map((c) => c.src);
  const loc = locationFor(p.id);
  const discount = p.orig && p.orig > p.price ? Math.round((1 - p.price / p.orig) * 100) : 0;
  return {
    id: p.id,
    name: p.name,
    cat: p.cat,
    sub: p.sub,
    brand: p.brand,
    art: '',
    price: p.price,
    orig: p.orig || null,
    discount,
    rating: p.rating,
    reviews: p.reviews,
    sold: p.sold,
    oos: p.stock === 0,
    age: p.age,
    province: loc.province,
    city: loc.city,
    kw: p.kw,
    image: urls[0] || null,
    images: JSON.stringify(urls),
    specs: JSON.stringify(p.specs),
    flash: false,
    pct: 0,
    rank: RANK_BASE + index,
    search_text: [p.name, p.brand, p.cat, subcategoryName(p.cat, p.sub), p.kw].join(' ').toLowerCase(),
    description: p.description,
    features: JSON.stringify(p.features),
    variants: JSON.stringify(p.variants),
    stock: p.stock,
    image_credits: JSON.stringify(photos),
    generated: true,
    created_at: p.createdAt,
  };
}

module.exports = { toGeneratedRow, locationFor };
