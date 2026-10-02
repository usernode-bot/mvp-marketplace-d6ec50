/* Mock data for Phase 1. All prices are integer cents. Names, brands and
 * copy are invented; later phases swap this module for the real API without
 * touching the rendering code (same shape: { id, name, cat, price, orig,
 * rating, reviews, sold, art, flash, pct }).
 */

export const CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'home', name: 'Home' },
  { id: 'sports', name: 'Sports' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'accessories', name: 'Accessories' },
];

/* Promotional carousel. tone picks the gradient (whole literal classes in
 * home.js); action is what the CTA does. */
export const BANNERS = [
  {
    id: 'mega-weekend',
    tone: 'brand',
    icon: 'percent',
    title: 'Mega Weekend Sale',
    subtitle: 'Up to 60% off across every category. Ends Sunday.',
    cta: 'Shop the deals',
    action: { type: 'deals' },
  },
  {
    id: 'flash-live',
    tone: 'rose',
    icon: 'flame',
    title: 'Flash Sale Live Now',
    subtitle: 'Lightning deals on bestsellers. Gone when the clock hits zero.',
    cta: 'See flash deals',
    action: { type: 'scroll', target: 'flash' },
  },
  {
    id: 'new-season',
    tone: 'slate',
    icon: 'sparkles',
    title: 'New Season Arrivals',
    subtitle: 'Fresh fits and fresh tech just dropped in Fashion and Electronics.',
    cta: 'Explore new in',
    action: { type: 'category', id: 'fashion' },
  },
];

export const TRENDING = [
  'wireless earbuds',
  'skincare set',
  'running shoes',
  'desk lamp',
  'coffee beans',
  'phone case',
];

export const PRODUCTS = [
  // Electronics
  { id: 'p01', variant: 'Midnight Black', name: 'Aurex Over-Ear Wireless Headphones', cat: 'electronics', art: 'headphones', price: 5999, orig: 8999, rating: 4.7, reviews: 2314, sold: 8231, flash: true, pct: 78 },
  { id: 'p02', variant: '128GB / Graphite', name: 'Novo X4 Pro Smartphone, 128GB', cat: 'electronics', art: 'smartphone', price: 24999, orig: 29999, rating: 4.6, reviews: 1877, sold: 5102, flash: true, pct: 64 },
  { id: 'p03', variant: 'Standard', name: 'Klarita 4K Action Camera', cat: 'electronics', art: 'camera', price: 8999, orig: 11999, rating: 4.5, reviews: 942, sold: 3210, flash: false },
  { id: 'p04', variant: '55 inch', name: 'Vantia 55" Smart TV', cat: 'electronics', art: 'tv', price: 32999, orig: 39999, rating: 4.4, reviews: 655, sold: 1204, flash: false },
  { id: 'p05', variant: 'Slate Grey', name: 'Pikol Mini Bluetooth Speaker', cat: 'electronics', art: 'speaker', price: 2999, orig: 4499, rating: 4.8, reviews: 3201, sold: 9877, flash: true, pct: 85 },
  { id: 'p06', variant: 'White', name: 'Aurex Wireless Earbuds Pro', cat: 'electronics', art: 'headphones', price: 4499, orig: 6999, rating: 4.6, reviews: 2870, sold: 11320, flash: true, pct: 91 },
  { id: 'p07', variant: '14 inch / Navy', name: 'Mendo Laptop Sleeve 14 inch', cat: 'electronics', art: 'laptop', price: 1299, orig: 1999, rating: 4.3, reviews: 512, sold: 2244, flash: false },
  { id: 'p08', variant: 'Black / M', name: 'Strida Smart Watch Fit', cat: 'electronics', art: 'watch', price: 4999, orig: 7999, rating: 4.5, reviews: 1420, sold: 4530, flash: true, pct: 55 },

  // Fashion
  { id: 'p09', variant: 'Beige / M', name: 'Vantia Oversized Cotton Tee', cat: 'fashion', art: 'shirt', price: 1499, orig: 2299, rating: 4.6, reviews: 2103, sold: 7655, flash: true, pct: 67 },
  { id: 'p10', variant: 'Indigo / L', name: 'Ombra Classic Denim Jacket', cat: 'fashion', art: 'shirt', price: 4999, orig: 6999, rating: 4.7, reviews: 986, sold: 3120, flash: false },
  { id: 'p11', variant: 'Tan', name: 'Pikol Everyday Crossbody Bag', cat: 'fashion', art: 'bag', price: 3999, orig: 5599, rating: 4.5, reviews: 1240, sold: 4021, flash: false },
  { id: 'p12', variant: 'Tortoise', name: 'Ombra Retro Sunglasses', cat: 'fashion', art: 'glasses', price: 1799, orig: 2599, rating: 4.4, reviews: 733, sold: 2890, flash: false },
  { id: 'p13', variant: 'Natural', name: 'Pikol Canvas Tote Bag', cat: 'fashion', art: 'bag', price: 999, orig: 1499, rating: 4.5, reviews: 1655, sold: 6201, flash: false },

  // Beauty
  { id: 'p14', variant: '30ml', name: 'Klarita Vitamin C Glow Serum', cat: 'beauty', art: 'droplet', price: 2199, orig: 3299, rating: 4.8, reviews: 3120, sold: 12040, flash: true, pct: 88 },
  { id: 'p15', variant: 'Warm Neutrals', name: 'Luma 12-Shade Eyeshadow Palette', cat: 'beauty', art: 'sparkles', price: 1899, orig: 2699, rating: 4.6, reviews: 1502, sold: 5230, flash: false },
  { id: 'p16', variant: '100ml', name: 'Ombra Rosewater Face Mist', cat: 'beauty', art: 'droplet', price: 1299, orig: 1799, rating: 4.7, reviews: 2210, sold: 8140, flash: false },
  { id: 'p17', variant: '5 treatments', name: 'Strida Clay Mask Kit', cat: 'beauty', art: 'sparkles', price: 1699, orig: 2399, rating: 4.5, reviews: 890, sold: 3120, flash: false },

  // Home
  { id: 'p18', variant: 'Oatmeal', name: 'Vantia Cloud Armchair', cat: 'home', art: 'armchair', price: 19999, orig: 25999, rating: 4.6, reviews: 421, sold: 980, flash: true, pct: 42 },
  { id: 'p19', variant: 'Sand', name: 'Mendo Ceramic Table Lamp', cat: 'home', art: 'lamp', price: 3999, orig: 4999, rating: 4.7, reviews: 812, sold: 2210, flash: false },
  { id: 'p20', variant: 'Queen / White', name: 'Klarita Cotton Bed Sheet Set', cat: 'home', art: 'bed', price: 2999, orig: 4299, rating: 4.5, reviews: 1533, sold: 5312, flash: false },
  { id: 'p21', variant: '5kg / Grey', name: 'Vantia Weighted Blanket 5kg', cat: 'home', art: 'bed', price: 5499, orig: 7499, rating: 4.7, reviews: 1108, sold: 3450, flash: false },

  // Sports
  { id: 'p22', variant: '2 x 10kg', name: 'Strida Adjustable Dumbbell Set', cat: 'sports', art: 'dumbbell', price: 7999, orig: 9999, rating: 4.7, reviews: 940, sold: 2100, flash: true, pct: 59 },
  { id: 'p23', variant: 'Size 5', name: 'Mendo Match Soccer Ball', cat: 'sports', art: 'ball', price: 1899, orig: 2499, rating: 4.5, reviews: 640, sold: 2450, flash: false },
  { id: 'p24', variant: '1L / Ocean Blue', name: 'Aurex Sport Water Bottle 1L', cat: 'sports', art: 'bottle', price: 1099, orig: 1599, rating: 4.6, reviews: 1870, sold: 6710, flash: false },
  { id: 'p25', variant: 'Matte Black', name: 'Pikol Trail Sport Sunglasses', cat: 'sports', art: 'glasses', price: 2399, orig: 3299, rating: 4.4, reviews: 430, sold: 1520, flash: false },

  // Groceries
  { id: 'p26', variant: 'Whole bean / 1kg', name: 'Mendo Arabica Coffee Beans 1kg', cat: 'groceries', art: 'coffee', price: 1499, orig: 1899, rating: 4.8, reviews: 4210, sold: 15330, flash: true, pct: 93 },
  { id: 'p27', variant: '6 pack', name: 'Pikol Organic Apples, 6 Pack', cat: 'groceries', art: 'apple', price: 599, orig: 0, rating: 4.6, reviews: 980, sold: 4210, flash: false },
  { id: 'p28', variant: '750ml', name: 'Klarita Extra Virgin Olive Oil 750ml', cat: 'groceries', art: 'bottle', price: 1299, orig: 1699, rating: 4.7, reviews: 1310, sold: 5820, flash: false },
  { id: 'p29', variant: '500g', name: 'Ombra Wildflower Honey 500g', cat: 'groceries', art: 'jar', price: 899, orig: 1199, rating: 4.7, reviews: 1670, sold: 6105, flash: false },

  // Accessories
  { id: 'p30', variant: 'Silver / 38mm', name: 'Strida Minimal Steel Watch', cat: 'accessories', art: 'watch', price: 5999, orig: 8999, rating: 4.6, reviews: 1105, sold: 3340, flash: true, pct: 48 },
  { id: 'p31', variant: 'Cognac', name: 'Ombra Leather Card Wallet', cat: 'accessories', art: 'wallet', price: 2499, orig: 3499, rating: 4.6, reviews: 780, sold: 2560, flash: false },
  { id: 'p32', variant: 'Amethyst', name: 'Pikol Gemstone Stud Earrings', cat: 'accessories', art: 'gem', price: 2999, orig: 4299, rating: 4.5, reviews: 620, sold: 1830, flash: false },
  { id: 'p33', variant: 'Medium / Sage', name: 'Vantia Travel Organizer Pouch', cat: 'accessories', art: 'bag', price: 1599, orig: 2199, rating: 4.4, reviews: 540, sold: 1980, flash: false },
];

/* Vouchers (Phase 3). Types: 'percent' (value = % off), 'fixed'
 * (value = cents off), 'ship' (free shipping). min = subtotal in cents the
 * order must reach before the voucher applies. Later phases swap this for a
 * real voucher API without touching the cart (same shape).
 */
export const VOUCHERS = [
  { code: 'WELCOME10', type: 'percent', value: 10, min: 2000 },
  { code: 'SAVE5', type: 'fixed', value: 500, min: 3000 },
  { code: 'FREESHIP', type: 'ship', value: 0, min: 2500 },
];

export function voucherByCode(code) {
  if (typeof code !== 'string') return null;
  const c = code.trim().toUpperCase();
  return VOUCHERS.find((v) => v.code === c) || null;
}

export function discountPct(p) {
  if (!p.orig || p.orig <= p.price) return 0;
  return Math.round((1 - p.price / p.orig) * 100);
}

export function productById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}
