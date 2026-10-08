/* Mock catalog data. All prices are integer cents. Names, brands and copy
 * are invented; later phases swap this module for the real API without
 * touching the rendering code (same shape: { id, name, cat, price, orig,
 * rating, reviews, sold, art, image?, flash, pct }). `image` is a
 * committed product photo (optional `imageFit: 'contain'`).
 *
 * Phase 2 additions: subcategories, brands, sellers, product descriptions,
 * specifications, color/size variants, gallery image views, customer
 * reviews and browse helpers (search matching, shipping).
 *
 * The Recommended grid's own catalog lives in recommended-data.js and is
 * mapped into PRODUCTS below, so a new recommendation is a data edit there
 * rather than a rendering change.
 */

import { RECOMMENDED_PRODUCTS } from './recommended-data.js';
import { LOCATIONS, allCities } from './locations.js';

export const CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'home', name: 'Home' },
  { id: 'sports', name: 'Sports' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'accessories', name: 'Accessories' },
];

/* Subcategory per category. Product rows carry `sub` (a subcategory id). */
export const SUBCATEGORIES = {
  electronics: [
    { id: 'audio', name: 'Audio' },
    { id: 'phones', name: 'Phones' },
    { id: 'computing', name: 'Computing' },
    { id: 'cameras', name: 'Cameras' },
    { id: 'tv', name: 'TV & Video' },
    { id: 'wearables', name: 'Wearables' },
    { id: 'smarthome', name: 'Smart Home' },
  ],
  fashion: [
    { id: 'tops', name: 'Tops' },
    { id: 'dresses', name: 'Dresses' },
    { id: 'outerwear', name: 'Outerwear' },
    { id: 'bags', name: 'Bags' },
    { id: 'eyewear', name: 'Eyewear' },
  ],
  beauty: [
    { id: 'skincare', name: 'Skincare' },
    { id: 'makeup', name: 'Makeup' },
  ],
  home: [
    { id: 'furniture', name: 'Furniture' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'bedding', name: 'Bedding' },
    { id: 'decor', name: 'Decor' },
  ],
  sports: [
    { id: 'fitness', name: 'Fitness' },
    { id: 'outdoor', name: 'Outdoor' },
    { id: 'team-sports', name: 'Team Sports' },
  ],
  groceries: [
    { id: 'beverages', name: 'Beverages' },
    { id: 'pantry', name: 'Pantry' },
    { id: 'fresh', name: 'Fresh Produce' },
  ],
  accessories: [
    { id: 'watches', name: 'Watches' },
    { id: 'jewelry', name: 'Jewelry' },
    { id: 'small-goods', name: 'Bags & Wallets' },
    { id: 'travel', name: 'Travel' },
  ],
};

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

/* Popular searches on the search page: trending terms plus proven
 * catalog-matching phrases. */
export const POPULAR_SEARCHES = [
  ...TRENDING,
  'denim jacket',
  'face serum',
  'coffee beans',
  'weighted blanket',
  'lipstick',
];

/* ---------------------------------------------------------------------------
 * Sellers. Mock marketplace: each brand is its own storefront.
 * ------------------------------------------------------------------------- */
export const SELLERS = {
  Aurex: { rating: 4.8, since: 2021, followers: '12.4k', response: '96%', badge: 'Official store' },
  Novo: { rating: 4.7, since: 2022, followers: '9.1k', response: '94%', badge: 'Official store' },
  Klarita: { rating: 4.8, since: 2020, followers: '15.2k', response: '97%', badge: 'Official store' },
  Vantia: { rating: 4.6, since: 2019, followers: '18.9k', response: '92%', badge: 'Official store' },
  Pikol: { rating: 4.7, since: 2021, followers: '11.3k', response: '95%', badge: 'Verified seller' },
  Mendo: { rating: 4.6, since: 2020, followers: '8.7k', response: '93%', badge: 'Verified seller' },
  Strida: { rating: 4.7, since: 2021, followers: '10.5k', response: '95%', badge: 'Verified seller' },
  Ombra: { rating: 4.5, since: 2019, followers: '7.9k', response: '90%', badge: 'Verified seller' },
  Luma: { rating: 4.6, since: 2022, followers: '5.4k', response: '91%', badge: 'Official store' },
};

/* ---------------------------------------------------------------------------
 * Variants. `colors` maps a swatch key to [display name, hex]; helpers below
 * turn them into the per-product arrays.
 * ------------------------------------------------------------------------- */
const C = {
  black: ['Midnight Black', '#1F2937'],
  white: ['Cloud White', '#E5E7EB'],
  violet: ['Royal Violet', '#7C3AED'],
  blue: ['Ocean Blue', '#3B82F6'],
  teal: ['Deep Teal', '#0D9488'],
  green: ['Forest Green', '#16A34A'],
  red: ['Coral Red', '#F43F5E'],
  pink: ['Blush Pink', '#F9A8D4'],
  beige: ['Sand Beige', '#D9C5A0'],
  silver: ['Silver Grey', '#CBD5E1'],
  brown: ['Walnut Brown', '#92400E'],
  navy: ['Navy', '#1E3A8A'],
};

function col(...keys) {
  return keys.map((k) => ({ name: C[k][0], hex: C[k][1] }));
}

const APPAREL_SIZES = ['S', 'M', 'L', 'XL'];
const SHOE_SIZES = ['38', '39', '40', '41', '42', '43'];

export const PRODUCTS = [
  // Electronics
  {
    id: 'p01', name: 'Aurex Over-Ear Wireless Headphones', cat: 'electronics', sub: 'audio', brand: 'Aurex', art: 'headphones',
    image: './images/products/headphones-1.jpg',
    price: 5999, orig: 8999, rating: 4.7, reviews: 2314, sold: 8231, flash: true, pct: 78, age: 34,
    colors: col('black', 'silver', 'violet'), kw: 'headphones audio bluetooth anc music wireless headset',
    desc: 'Studio-grade over-ear headphones with hybrid active noise cancelling, plush memory-foam cups and a 40-hour battery that charges over USB-C in under two hours.',
  },
  {
    id: 'p02', name: 'Novo X4 Pro Smartphone, 128GB', cat: 'electronics', sub: 'phones', brand: 'Novo', art: 'smartphone',
    image: './images/products/smartphone-1.jpg',
    imageFit: 'contain',
    price: 24999, orig: 29999, rating: 4.6, reviews: 1877, sold: 5102, flash: true, pct: 64, age: 12,
    colors: col('black', 'blue', 'silver'), kw: 'phone smartphone 5g mobile android unlocked 128gb',
    desc: 'A 120 Hz AMOLED flagship killer with a 50 MP triple camera, 5000 mAh battery and 65 W fast charging. Dual SIM, unlocked for every carrier.',
  },
  {
    id: 'p03', name: 'Klarita 4K Action Camera', cat: 'electronics', sub: 'cameras', brand: 'Klarita', art: 'camera',
    image: './images/products/camera-1.jpg',
    price: 8999, orig: 11999, rating: 4.5, reviews: 942, sold: 3210, flash: false, age: 55,
    colors: col('black'), kw: 'camera action gopro waterproof vlog 4k helmet',
    desc: 'Pocket-sized 4K60 action camera with 3-axis stabilisation, waterproof to 10 m without a case, and a touch rear screen for framing on the go.',
  },
  {
    id: 'p04', name: 'Vantia 55" Smart TV', cat: 'electronics', sub: 'tv', brand: 'Vantia', art: 'tv',
    image: './images/products/tv-1.jpg',
    price: 32999, orig: 39999, rating: 4.4, reviews: 655, sold: 1204, flash: false, age: 88, oos: true,
    colors: col('black'), kw: 'television smart tv 4k streaming uhd led',
    desc: 'A 55-inch 4K UHD smart TV with three HDMI ports, built-in streaming apps and a slim bezel-less frame that disappears into the wall.',
  },
  {
    id: 'p05', name: 'Pikol Mini Bluetooth Speaker', cat: 'electronics', sub: 'audio', brand: 'Pikol', art: 'speaker',
    image: './images/products/speaker-8.jpg',
    price: 2999, orig: 4499, rating: 4.8, reviews: 3201, sold: 9877, flash: true, pct: 85, age: 21,
    colors: col('blue', 'teal', 'red'), kw: 'speaker bluetooth portable music mini shower',
    desc: 'A pocket speaker with a surprising low end, IPX7 waterproofing for pool days and 18 hours of playtime per charge.',
  },
  {
    id: 'p06', name: 'Aurex Wireless Earbuds Pro', cat: 'electronics', sub: 'audio', brand: 'Aurex', art: 'headphones',
    image: './images/products/headphones-2.jpg',
    price: 4499, orig: 6999, rating: 4.6, reviews: 2870, sold: 11320, flash: true, pct: 91, age: 8,
    colors: col('white', 'black'), kw: 'earbuds tws bluetooth wireless earbuds airpods buds',
    desc: 'True wireless earbuds with adaptive noise cancelling, six hours per charge and a slim case that adds three more top-ups. Instant pairing on both platforms.',
  },
  {
    id: 'p07', name: 'Mendo Laptop Sleeve 14 inch', cat: 'electronics', sub: 'computing', brand: 'Mendo', art: 'laptop',
    image: './images/products/sleeve-1.jpg',
    price: 1299, orig: 1999, rating: 4.3, reviews: 512, sold: 2244, flash: false, age: 66,
    colors: col('silver', 'navy', 'brown'), kw: 'laptop sleeve case bag 14 inch macbook cover',
    desc: 'A water-repellent sleeve with 8 mm foam padding, a front zip for chargers and a fit that slides into any backpack without bulking it up.',
  },
  {
    id: 'p08', name: 'Strida Smart Watch Fit', cat: 'electronics', sub: 'wearables', brand: 'Strida', art: 'watch',
    image: './images/products/steelwatch-1.jpg',
    price: 4999, orig: 7999, rating: 4.5, reviews: 1420, sold: 4530, flash: true, pct: 55, age: 15,
    colors: col('black', 'pink', 'blue'), kw: 'smartwatch fitness tracker watch heart rate sleep',
    desc: 'A 1.4" AMOLED smartwatch with heart-rate and SpO2 tracking, 100+ workout modes and a 10-day battery. Swim-proof to 5 ATM.',
  },
  {
    id: 'p34', name: 'Luma Wireless Charging Stand', cat: 'electronics', sub: 'phones', brand: 'Luma', art: 'smartphone',
    image: './images/products/smartphone-2.jpg',
    imageFit: 'contain',
    price: 2599, orig: 3599, rating: 4.5, reviews: 640, sold: 1890, flash: false, age: 10,
    colors: col('black', 'white'), kw: 'charger wireless charging stand qi fast phone',
    desc: 'A 15 W Qi wireless stand that props your phone at a readable angle while it charges, with a silicone cradle that grips without scratching.',
  },
  {
    id: 'p35', name: 'Novo USB-C Hub, 7-in-1', cat: 'electronics', sub: 'computing', brand: 'Novo', art: 'laptop',
    image: './images/products/usbhub-6.jpg',
    price: 3999, orig: 4999, rating: 4.6, reviews: 720, sold: 2410, flash: false, age: 14,
    colors: col('silver'), kw: 'usb hub type-c docking adapter hdmi sd laptop',
    desc: 'Seven ports in an aluminum shell: 4K HDMI, 100 W USB-C power pass-through, two USB-A, plus SD and microSD card readers for quick photo offloads.',
  },
  {
    id: 'p44', name: 'Mendo Smart Home Hub', cat: 'electronics', sub: 'smarthome', brand: 'Mendo', art: 'smarthome',
    image: './images/products/smarthome-1.jpg',
    price: 11999, orig: 14100, rating: 4.8, reviews: 1100, sold: 4200, flash: false, age: 9,
    colors: col('white', 'black'), kw: 'smart home hub orb assistant automation zigbee matter sensors lights',
    desc: 'A spherical smart home hub that unifies your lights, locks and sensors, with a glowing status light, offline automations and support for the major voice assistants.',
  },
  {
    id: 'p45', name: 'Ombra Vertical Mouse', cat: 'electronics', sub: 'computing', brand: 'Ombra', art: 'mouse',
    image: './images/products/mouse-6.jpg',
    price: 4999, orig: 5550, rating: 4.6, reviews: 950, sold: 3100, flash: false, age: 6,
    colors: col('black', 'silver'), kw: 'vertical mouse ergonomic wireless rechargeable wrist handshake silent',
    desc: 'A vertical ergonomic mouse that holds your wrist at a natural handshake angle, with a silent scroll wheel, six programmable buttons and weeks of battery per charge.',
  },
  {
    id: 'p46', name: 'Aurex Mechanical Keyboard, RGB Backlit', cat: 'electronics', sub: 'computing', brand: 'Aurex', art: 'keyboard',
    image: './images/products/keyboard-7.jpg',
    price: 7999, orig: 9999, rating: 4.7, reviews: 1160, sold: 3980, flash: true, pct: 58, age: 11,
    colors: col('black', 'silver'), kw: 'keyboard mechanical rgb backlit gaming hot swappable typing usb',
    desc: 'A hot-swappable mechanical keyboard with gasket mounting, per-key RGB and a volume knob. Wired USB-C with a detachable cable for a clean desk.',
  },
  {
    id: 'p47', name: 'Klarita Drone Camera, 4K GPS', cat: 'electronics', sub: 'cameras', brand: 'Klarita', art: 'drone',
    image: './images/products/drone-6.jpg',
    price: 19999, orig: 25999, rating: 4.5, reviews: 380, sold: 940, flash: false, age: 20, oos: true,
    colors: col('black'), kw: 'drone quadcopter camera 4k gps aerial foldable return home flying',
    desc: 'A foldable GPS drone with a 3-axis gimbal 4K camera, 30-minute flights and automatic return-to-home. Beginner flight modes make the first takeoff easy.',
  },

  // Fashion
  {
    id: 'p09', name: 'Vantia Oversized Cotton Tee', cat: 'fashion', sub: 'tops', brand: 'Vantia', art: 'shirt',
    image: './images/products/tee-1.jpg',
    price: 1499, orig: 2299, rating: 4.6, reviews: 2103, sold: 7655, flash: true, pct: 67, age: 29,
    colors: col('white', 'black', 'beige'), sizes: APPAREL_SIZES, kw: 'tshirt tee cotton top oversized unisex',
    desc: 'A heavyweight 240 gsm combed-cotton tee with a true oversized cut, dropped shoulders and a neckline that keeps its shape wash after wash.',
  },
  {
    id: 'p10', name: 'Ombra Classic Denim Jacket', cat: 'fashion', sub: 'outerwear', brand: 'Ombra', art: 'shirt',
    image: './images/products/denim-1.jpg',
    price: 4999, orig: 6999, rating: 4.7, reviews: 986, sold: 3120, flash: false, age: 47,
    colors: col('blue', 'navy'), sizes: APPAREL_SIZES, kw: 'denim jacket jeans coat trucker outerwear',
    desc: 'A rigid 13 oz denim jacket that breaks in fast: classic trucker cut, copper hardware and a fit that layers over hoodies without pulling.',
  },
  {
    id: 'p11', name: 'Pikol Everyday Crossbody Bag', cat: 'fashion', sub: 'bags', brand: 'Pikol', art: 'bag',
    image: './images/products/bag-6.jpg',
    price: 3999, orig: 5599, rating: 4.5, reviews: 1240, sold: 4021, flash: false, age: 33,
    colors: col('black', 'beige', 'brown'), kw: 'crossbody bag purse shoulder small everyday',
    desc: 'A compact crossbody with a padded phone slot, inner zip pocket and an adjustable webbing strap that switches from shoulder to crossbody in seconds.',
  },
  {
    id: 'p12', name: 'Ombra Retro Sunglasses', cat: 'fashion', sub: 'eyewear', brand: 'Ombra', art: 'glasses',
    image: './images/products/sunglasses-6.jpg',
    imageFit: 'contain',
    price: 1799, orig: 2599, rating: 4.4, reviews: 733, sold: 2890, flash: false, age: 74,
    colors: col('brown', 'black'), kw: 'sunglasses retro uv shades polarised vintage',
    desc: 'Keyhole-bridge acetate frames with UV400 polarised lenses and a hand-polished finish. Comes with a hard case and cleaning cloth.',
  },
  {
    id: 'p13', name: 'Pikol Canvas Tote Bag', cat: 'fashion', sub: 'bags', brand: 'Pikol', art: 'bag',
    image: './images/products/bag-7.jpg',
    price: 999, orig: 1499, rating: 4.5, reviews: 1655, sold: 6201, flash: false, age: 41,
    colors: col('beige', 'navy', 'green'), kw: 'tote bag canvas shopping market everyday',
    desc: 'A 12 oz duck-canvas tote with a reinforced base and an inner zip for keys and cards. Carries groceries on Monday and a laptop on Tuesday.',
  },
  {
    id: 'p36', name: 'Vantia Linen Summer Dress', cat: 'fashion', sub: 'dresses', brand: 'Vantia', art: 'shirt',
    image: './images/products/linen_dress-1.jpg',
    price: 4599, orig: 6299, rating: 4.7, reviews: 830, sold: 2640, flash: true, pct: 61, age: 16,
    colors: col('beige', 'pink', 'navy'), sizes: APPAREL_SIZES, kw: 'dress linen summer sundress midi',
    desc: 'A breathable washed-linen midi with adjustable shoulder ties and side pockets. Cut for airflow, made to wrinkle gracefully.',
  },
  {
    id: 'p37', name: 'Pikol Knit Cardigan', cat: 'fashion', sub: 'outerwear', brand: 'Pikol', art: 'shirt',
    image: './images/products/cardigan-1.jpg',
    price: 3899, orig: 5499, rating: 4.5, reviews: 410, sold: 1320, flash: false, age: 23,
    colors: col('beige', 'navy', 'brown'), sizes: APPAREL_SIZES, kw: 'cardigan knit sweater wool button',
    desc: 'A mid-weight lambswool-blend cardigan with corozo buttons and ribbed cuffs. Warm enough for autumn, light enough for the office.',
  },
  {
    id: 'p48', name: 'Strida Fleece Hoodie, Pullover', cat: 'fashion', sub: 'tops', brand: 'Strida', art: 'shirt',
    image: './images/products/hoodie-1.jpg',
    price: 3499, orig: 4999, rating: 4.6, reviews: 1520, sold: 5240, flash: false, age: 18,
    colors: col('navy', 'green', 'black'), sizes: APPAREL_SIZES, kw: 'hoodie fleece pullover sweatshirt warm casual kangaroo pocket',
    desc: 'A brushed-back fleece hoodie with a double-lined hood, kangaroo pocket and ribbed cuffs that hold their shape. Boxy, true-to-size cut.',
  },
  {
    id: 'p49', name: 'Ombra Wrap Midi Dress, Belted', cat: 'fashion', sub: 'dresses', brand: 'Ombra', art: 'shirt',
    image: './images/products/wrap_dress-1.jpg',
    price: 4299, orig: 5899, rating: 4.7, reviews: 690, sold: 2180, flash: false, age: 25,
    colors: col('navy', 'red', 'beige'), sizes: APPAREL_SIZES, kw: 'wrap dress midi belted office elegant v-neck',
    desc: 'A faux-wrap midi in fluid crepe with a tie belt, V-neckline and a hem that moves well. Fully lined through the bodice and no zipper to fight with.',
  },
  {
    id: 'p50', name: 'Mendo Leather Backpack, 15 inch', cat: 'fashion', sub: 'bags', brand: 'Mendo', art: 'bag',
    image: './images/products/bag-8.jpg',
    price: 6999, orig: 8999, rating: 4.6, reviews: 540, sold: 1240, flash: false, age: 30,
    colors: col('brown', 'black'), kw: 'backpack leather laptop 15 inch school travel rucksack padded',
    desc: 'A full-grain leather backpack with a padded 15-inch laptop sleeve, a hidden back pocket for valuables and waxed straps that soften with wear.',
  },

  // Beauty
  {
    id: 'p14', name: 'Klarita Vitamin C Glow Serum', cat: 'beauty', sub: 'skincare', brand: 'Klarita', art: 'droplet',
    image: './images/products/droplet-1.jpg',
    price: 2199, orig: 3299, rating: 4.8, reviews: 3120, sold: 12040, flash: true, pct: 88, age: 19,
    kw: 'serum vitamin c skincare glow face brightening skincare set',
    desc: 'A 15% vitamin C serum with ferulic acid and hyaluronic acid. Lightweight, non-sticky, and stable in an airless pump so the last drop is as potent as the first.',
  },
  {
    id: 'p15', name: 'Luma 12-Shade Eyeshadow Palette', cat: 'beauty', sub: 'makeup', brand: 'Luma', art: 'sparkles',
    image: './images/products/sparkles-1.jpg',
    price: 1899, orig: 2699, rating: 4.6, reviews: 1502, sold: 5230, flash: false, age: 49,
    kw: 'eyeshadow palette makeup shadow matte shimmer neutral',
    desc: 'Twelve everyday shades, nine matte and three shimmer, pressed soft so they blend without patchiness. Talc-free and fragrance-free.',
  },
  {
    id: 'p16', name: 'Ombra Rosewater Face Mist', cat: 'beauty', sub: 'skincare', brand: 'Ombra', art: 'droplet',
    image: './images/products/droplet-2.jpg',
    price: 1299, orig: 1799, rating: 4.7, reviews: 2210, sold: 8140, flash: false, age: 62,
    kw: 'face mist rosewater toner spray hydrating refresh',
    desc: 'Steam-distilled rosewater with a fine, even spritz that sets makeup or refreshes skin mid-day. No alcohol, no fragrance added.',
  },
  {
    id: 'p17', name: 'Strida Clay Mask Kit', cat: 'beauty', sub: 'skincare', brand: 'Strida', art: 'sparkles',
    image: './images/products/sparkles-2.jpg',
    price: 1699, orig: 2399, rating: 4.5, reviews: 890, sold: 3120, flash: false, age: 71,
    kw: 'clay mask skincare detox kit skincare set pores',
    desc: 'Three single-use kaolin clay masks with a bamboo brush and headband. Ten minutes to clearer-looking skin, no scrubbing required.',
  },
  {
    id: 'p38', name: 'Luma Matte Lipstick Set', cat: 'beauty', sub: 'makeup', brand: 'Luma', art: 'sparkles',
    image: './images/products/sparkles-3.jpg',
    price: 1699, orig: 2399, rating: 4.6, reviews: 1210, sold: 4820, flash: false, age: 9,
    kw: 'lipstick matte set makeup lip long lasting',
    desc: 'Five weightless matte lipsticks in nudes through berries, with a velvet finish that wears for hours without drying.',
  },
  {
    id: 'p51', name: 'Klarita Hyaluronic Day Cream, 50ml', cat: 'beauty', sub: 'skincare', brand: 'Klarita', art: 'cream',
    image: './images/products/cream-1.jpg',
    price: 2599, orig: 3399, rating: 4.8, reviews: 1980, sold: 7420, flash: true, pct: 82, age: 7,
    kw: 'moisturizer day cream hyaluronic hydrating skincare face gel',
    desc: 'A gel-cream with three weights of hyaluronic acid plus ceramides. Sinks in fast under makeup, fragrance-free and safe for sensitive skin.',
  },
  {
    id: 'p52', name: 'Luma Liquid Blush Wand, Rosy', cat: 'beauty', sub: 'makeup', brand: 'Luma', art: 'droplet',
    image: './images/products/droplet-3.jpg',
    price: 1399, orig: 1899, rating: 4.5, reviews: 860, sold: 3210, flash: false, age: 6,
    kw: 'blush liquid wand makeup rosy cheek tint blendable',
    desc: 'A cushion-applicator liquid blush that blends with fingers before it sets. Sheer at the first tap, buildable to a soft flush in rosy pink.',
  },
  {
    id: 'p53', name: 'Strida Vitamin E Night Cream', cat: 'beauty', sub: 'skincare', brand: 'Strida', art: 'jar',
    image: './images/products/vitaminc-1.jpg',
    price: 2199, orig: 2899, rating: 4.6, reviews: 1120, sold: 4050, flash: false, age: 35,
    kw: 'night cream vitamin e skincare repair moisturizing overnight',
    desc: 'A richer overnight cream with vitamin E, squalane and shea butter that seals your serum in. Wake up to skin that feels cushioned, not greasy.',
  },

  // Home
  {
    id: 'p18', name: 'Vantia Cloud Armchair', cat: 'home', sub: 'furniture', brand: 'Vantia', art: 'armchair',
    image: './images/products/armchair-1.jpg',
    price: 19999, orig: 25999, rating: 4.6, reviews: 421, sold: 980, flash: true, pct: 42, age: 95,
    colors: col('beige', 'green', 'navy'), kw: 'armchair chair lounge furniture reading accent',
    desc: 'A deep-seated lounge chair with a feather-wrapped foam cushion and solid-oak legs. Upholstered in a soft weave that stands up to daily use.',
  },
  {
    id: 'p19', name: 'Mendo Ceramic Table Lamp', cat: 'home', sub: 'lighting', brand: 'Mendo', art: 'lamp',
    image: './images/products/lamp-7.jpg',
    price: 3999, orig: 4999, rating: 4.7, reviews: 812, sold: 2210, flash: false, age: 60,
    colors: col('white', 'beige'), kw: 'lamp table ceramic bedside light desk lamp',
    desc: 'A hand-glazed ceramic base with a linen shade that throws a warm, even light. Inline dimmer switch on the cord.',
  },
  {
    id: 'p20', name: 'Klarita Cotton Bed Sheet Set', cat: 'home', sub: 'bedding', brand: 'Klarita', art: 'bed',
    image: './images/products/bed-1.jpg',
    price: 2999, orig: 4299, rating: 4.5, reviews: 1533, sold: 5312, flash: false, age: 52,
    colors: col('white', 'silver', 'blue'), sizes: ['Double', 'Queen', 'King'], kw: 'bed sheets cotton bedding set pillowcases',
    desc: 'A 300-thread-count percale set: flat sheet, fitted sheet with deep corners and two pillowcases. Gets softer with every wash.',
  },
  {
    id: 'p21', name: 'Vantia Weighted Blanket 5kg', cat: 'home', sub: 'bedding', brand: 'Vantia', art: 'bed',
    image: './images/products/bed-2.jpg',
    price: 5499, orig: 7499, rating: 4.7, reviews: 1108, sold: 3450, flash: false, age: 70,
    colors: col('silver', 'navy'), kw: 'weighted blanket sleep 5kg anxiety gravity',
    desc: 'A 5 kg glass-bead blanket quilted into small pockets so the weight stays put. Removable machine-washable cover in a cooling jersey.',
  },
  {
    id: 'p39', name: 'Mendo Scented Candle Trio', cat: 'home', sub: 'decor', brand: 'Mendo', art: 'jar',
    image: './images/products/candle-1.jpg',
    price: 2199, orig: 2999, rating: 4.8, reviews: 980, sold: 3410, flash: false, age: 31,
    colors: col('white', 'beige'), kw: 'candles scented trio soy home decor gift',
    desc: 'Three soy-wax candles, 25 hours each: cedar and smoke, fig and cassis, and plain unscented. Cotton wicks, reusable glass vessels.',
  },
  {
    id: 'p54', name: 'Luma LED Desk Lamp, Dimmable', cat: 'home', sub: 'lighting', brand: 'Luma', art: 'lamp',
    image: './images/products/lamp-8.jpg',
    price: 3299, orig: 4299, rating: 4.7, reviews: 1310, sold: 4620, flash: true, pct: 64, age: 13,
    colors: col('white', 'black'), kw: 'desk lamp led dimmable reading touch office light usb',
    desc: 'A slim LED desk lamp with five brightness levels and three color temperatures, a touch dimmer and a USB port on the base for charging your phone.',
  },
  {
    id: 'p55', name: 'Klarita Oak Side Table, Round', cat: 'home', sub: 'furniture', brand: 'Klarita', art: 'table',
    image: './images/products/table-1.jpg',
    imageFit: 'contain',
    price: 8999, orig: 11999, rating: 4.5, reviews: 360, sold: 810, flash: false, age: 42,
    colors: col('brown'), kw: 'side table oak round end wood furniture living room',
    desc: 'A round solid-oak side table with a tapered three-leg base and a food-safe hardwax oil finish. 45 cm tall, sized to sit beside any sofa arm.',
  },
  {
    id: 'p56', name: 'Mendo Wool Throw Blanket, Checkered', cat: 'home', sub: 'bedding', brand: 'Mendo', art: 'bed',
    image: './images/products/bed-3.jpg',
    price: 4599, orig: 5999, rating: 4.8, reviews: 940, sold: 2870, flash: false, age: 16,
    colors: col('beige', 'navy', 'green'), kw: 'throw blanket wool checkered sofa cozy couch decor',
    desc: 'A woven merino-blend throw in a classic check, 130 × 180 cm with fringe ends. Warm without weight and soft from the first unpack.',
  },

  // Sports
  {
    id: 'p22', name: 'Strida Adjustable Dumbbell Set', cat: 'sports', sub: 'fitness', brand: 'Strida', art: 'dumbbell',
    image: './images/products/dumbbell-1.jpg',
    price: 7999, orig: 9999, rating: 4.7, reviews: 940, sold: 2100, flash: true, pct: 59, age: 44,
    colors: col('black'), kw: 'dumbbell weights gym fitness set adjustable home',
    desc: 'Two adjustable dumbbells, 2.5-24 kg each, with a twist-lock collar and a compact cradle that replaces a whole rack.',
  },
  {
    id: 'p23', name: 'Mendo Match Soccer Ball', cat: 'sports', sub: 'team-sports', brand: 'Mendo', art: 'ball',
    image: './images/products/ball-1.jpg',
    price: 1899, orig: 2499, rating: 4.5, reviews: 640, sold: 2450, flash: false, age: 81,
    colors: col('white', 'red', 'blue'), sizes: ['4', '5'], kw: 'soccer ball football match fifa training',
    desc: 'A machine-stitched match ball with a butyl bladder that holds air for weeks. Available in size 4 and 5.',
  },
  {
    id: 'p24', name: 'Aurex Sport Water Bottle 1L', cat: 'sports', sub: 'outdoor', brand: 'Aurex', art: 'bottle',
    image: './images/products/bottle-6.jpg',
    price: 1099, orig: 1599, rating: 4.6, reviews: 1870, sold: 6710, flash: false, age: 26,
    colors: col('blue', 'black', 'green'), kw: 'water bottle sport 1l flask gym insulated',
    desc: 'Double-walled stainless steel keeps drinks cold for 24 hours. One-hand flip lid, leak-proof in any bag, 1 L capacity.',
  },
  {
    id: 'p25', name: 'Pikol Trail Sport Sunglasses', cat: 'sports', sub: 'outdoor', brand: 'Pikol', art: 'glasses',
    image: './images/products/sunglasses-7.jpg',
    price: 2399, orig: 3299, rating: 4.4, reviews: 430, sold: 1520, flash: false, age: 92,
    colors: col('black', 'red'), kw: 'sunglasses sport trail running cycling uv wrap',
    desc: 'A grippy wrap-around frame that stays put at pace, with shatterproof UV400 lenses and vented sides to stop fogging.',
  },
  {
    id: 'p40', name: 'Pikol Resistance Band Set', cat: 'sports', sub: 'fitness', brand: 'Pikol', art: 'dumbbell',
    image: './images/products/dumbbell-2.jpg',
    price: 1899, orig: 2699, rating: 4.4, reviews: 520, sold: 1730, flash: false, age: 27,
    colors: col('teal'), kw: 'resistance bands workout home gym stretching',
    desc: 'Five latex loop bands from 5 to 25 kg of pull, with cotton-carabiner handles, ankle straps and a door anchor in a mesh travel bag.',
  },
  {
    id: 'p42', name: 'Strida Trail Runner Shoes', cat: 'sports', sub: 'outdoor', brand: 'Strida', art: 'shoe',
    image: './images/products/shoe-7.jpg',
    imageFit: 'contain',
    price: 5499, orig: 7999, rating: 4.6, reviews: 1610, sold: 5210, flash: true, pct: 51, age: 7,
    colors: col('black', 'red'), sizes: SHOE_SIZES, kw: 'running shoes sneakers trail sport trainers',
    desc: 'A cushioned trail runner with a rock plate, 4 mm lugs for loose gravel, and a mesh upper that drains after stream crossings.',
  },
  {
    id: 'p57', name: 'Strida Yoga Mat, 6mm Non-Slip', cat: 'sports', sub: 'fitness', brand: 'Strida', art: 'mat',
    image: './images/products/mat-1.jpg',
    price: 2799, orig: 3799, rating: 4.6, reviews: 1740, sold: 6180, flash: true, pct: 74, age: 22,
    colors: col('teal', 'violet'), kw: 'yoga mat non slip 6mm exercise pilates fitness carrying strap',
    desc: 'A 6 mm TPE mat with a textured grip that holds wet hands, alignment lines for pose checks and a carry strap. Closed-cell, so it wipes clean.',
  },
  {
    id: 'p58', name: 'Mendo Camping Tent, 2 Person', cat: 'sports', sub: 'outdoor', brand: 'Mendo', art: 'tent',
    image: './images/products/tent-6.jpg',
    price: 8999, orig: 11499, rating: 4.5, reviews: 420, sold: 960, flash: false, age: 58,
    colors: col('green'), kw: 'tent camping 2 person waterproof hiking dome backpacking',
    desc: 'A freestanding two-person dome with a 3000 mm waterproof fly, two doors and a 12-minute pitch. Packs down to 4.2 kg for backpacking trips.',
  },

  // Groceries
  {
    id: 'p26', name: 'Mendo Arabica Coffee Beans 1kg', cat: 'groceries', sub: 'pantry', brand: 'Mendo', art: 'coffee',
    image: './images/products/coffee-1.jpg',
    price: 1499, orig: 1899, rating: 4.8, reviews: 4210, sold: 15330, flash: true, pct: 93, age: 18,
    sizes: ['250g', '500g', '1kg'], kw: 'coffee beans arabica espresso 1kg roast whole bean',
    desc: 'Single-origin Colombian arabica, medium roasted in small batches for chocolate-and-caramel notes. Rested 5 days before shipping, whole bean.',
  },
  {
    id: 'p27', name: 'Pikol Organic Apples, 6 Pack', cat: 'groceries', sub: 'fresh', brand: 'Pikol', art: 'apple',
    image: './images/products/apple-1.jpg',
    price: 599, orig: 0, rating: 4.6, reviews: 980, sold: 4210, flash: false, age: 5,
    kw: 'apples organic fruit fresh pack crisp',
    desc: 'Six crisp orchard apples, certified organic, picked at peak ripeness and packed in a protective molded tray.',
  },
  {
    id: 'p28', name: 'Klarita Extra Virgin Olive Oil 750ml', cat: 'groceries', sub: 'pantry', brand: 'Klarita', art: 'bottle',
    image: './images/products/bottle-7.jpg',
    price: 1299, orig: 1699, rating: 4.7, reviews: 1310, sold: 5820, flash: false, age: 63,
    sizes: ['500ml', '750ml'], kw: 'olive oil extra virgin cooking dressing cold pressed',
    desc: 'Cold-pressed within 6 hours of harvest from a single Greek grove. Peppery finish, under 0.3% acidity, in a UV-blocking dark bottle.',
  },
  {
    id: 'p29', name: 'Ombra Wildflower Honey 500g', cat: 'groceries', sub: 'pantry', brand: 'Ombra', art: 'jar',
    image: './images/products/honey-1.jpg',
    price: 899, orig: 1199, rating: 4.7, reviews: 1670, sold: 6105, flash: false, age: 77,
    sizes: ['250g', '500g'], kw: 'honey wildflower natural raw 500g sweet',
    desc: 'Raw, unfiltered wildflower honey from mountain apiaries. Naturally crystallises in cool weather, which is exactly how real honey behaves.',
  },
  {
    id: 'p41', name: 'Klarita Green Tea, 100 Bags', cat: 'groceries', sub: 'beverages', brand: 'Klarita', art: 'coffee',
    image: './images/products/teabag-1.jpg',
    price: 1099, orig: 1499, rating: 4.7, reviews: 1440, sold: 6120, flash: false, age: 13,
    sizes: ['50 bags', '100 bags'], kw: 'green tea bags organic sencha matcha brew',
    desc: 'First-flush sencha in oxygen-barrier sachets, 100 to a box. Clean, grassy cup with zero bitterness at a 2-minute steep.',
  },
  {
    id: 'p59', name: 'Aurex Sparkling Water, 12 Pack', cat: 'groceries', sub: 'beverages', brand: 'Aurex', art: 'bottle',
    image: './images/products/bottle-8.jpg',
    price: 999, orig: 1299, rating: 4.4, reviews: 2260, sold: 8930, flash: true, pct: 88, age: 4,
    sizes: ['6 pack', '12 pack'], kw: 'sparkling water cans 12 pack fizzy zero sugar drinks',
    desc: 'Twelve 330 ml cans of lightly carbonated mineral water with nothing added: no sweeteners, no sodium, no calories. Chill-ready slim cans.',
  },
  {
    id: 'p60', name: 'Strida Strawberry Preserve, 340g', cat: 'groceries', sub: 'pantry', brand: 'Strida', art: 'jar',
    image: './images/products/jam-1.jpg',
    price: 799, orig: 1099, rating: 4.7, reviews: 1010, sold: 3840, flash: false, age: 45, oos: true,
    sizes: ['340g'], kw: 'strawberry jam preserve spread breakfast toast 340g fruit',
    desc: 'Small-batch preserve with whole strawberries and cane sugar, cooked in copper pans. 55 g of fruit per 100 g, on the jammy side of spreadable.',
  },
  {
    id: 'p61', name: 'Pikol Bananas, 1kg', cat: 'groceries', sub: 'fresh', brand: 'Pikol', art: 'banana',
    image: './images/products/banana-1.jpg',
    price: 349, orig: 0, rating: 4.5, reviews: 1420, sold: 5710, flash: false, age: 2,
    kw: 'bananas fresh fruit 1kg bunch sweet',
    desc: 'A full kilo of sweet Cavendish bananas, picked yellow-green so they ripen on your counter through the week. Packed to arrive unbruised.',
  },

  // Accessories
  {
    id: 'p30', name: 'Strida Minimal Steel Watch', cat: 'accessories', sub: 'watches', brand: 'Strida', art: 'watch',
    image: './images/products/steelwatch-2.jpg',
    price: 5999, orig: 8999, rating: 4.6, reviews: 1105, sold: 3340, flash: true, pct: 48, age: 38,
    colors: col('silver', 'black'), kw: 'watch steel minimal analog quartz bracelet',
    desc: 'A 38 mm brushed-steel case on a mesh bracelet, with a sapphire-coated crystal and a slim Swiss quartz movement. Quick-release strap pins.',
  },
  {
    id: 'p31', name: 'Ombra Leather Card Wallet', cat: 'accessories', sub: 'small-goods', brand: 'Ombra', art: 'wallet',
    image: './images/products/wallet-6.jpg',
    price: 2499, orig: 3499, rating: 4.6, reviews: 780, sold: 2560, flash: false, age: 58,
    colors: col('brown', 'black', 'navy'), kw: 'wallet leather card holder slim bifold rf ID',
    desc: 'Full-grain vegetable-tanned leather, six card slots and a hidden cash fold. RFID-blocking layer between the walls. Ages into a patina.',
  },
  {
    id: 'p32', name: 'Pikol Gemstone Stud Earrings', cat: 'accessories', sub: 'jewelry', brand: 'Pikol', art: 'gem',
    image: './images/products/gem-1.jpg',
    price: 2999, orig: 4299, rating: 4.5, reviews: 620, sold: 1830, flash: false, age: 85,
    colors: col('silver'), kw: 'earrings studs gemstone silver jewelry gift hypoallergenic',
    desc: '4 mm lab-grown gemstones in rhodium-plated sterling silver settings with hypoallergenic posts. Comes gift-boxed.',
  },
  {
    id: 'p33', name: 'Vantia Travel Organizer Pouch', cat: 'accessories', sub: 'travel', brand: 'Vantia', art: 'bag',
    image: './images/products/bag-9.jpg',
    price: 1599, orig: 2199, rating: 4.4, reviews: 540, sold: 1980, flash: false, age: 68,
    colors: col('navy', 'teal', 'black'), kw: 'travel pouch organizer packing cubes cables passport',
    desc: 'A zippered organizer with elastic loops for cables, a slip pocket for passports and a padded phone sleeve. Water-repellent shell.',
  },
  {
    id: 'p62', name: 'Novo Leather Belt, Reversible', cat: 'accessories', sub: 'small-goods', brand: 'Novo', art: 'belt',
    image: './images/products/belt-1.jpg',
    price: 2999, orig: 3999, rating: 4.6, reviews: 930, sold: 3420, flash: false, age: 28,
    colors: col('brown', 'black'), sizes: ['S', 'M', 'L', 'XL'], kw: 'belt leather reversible buckle formal casual rotating',
    desc: 'One belt, two colors: a rotating buckle flips between smooth brown and black full-grain leather. Cut to length at the strap, not the buckle.',
  },
  {
    id: 'p63', name: 'Klarita Pearl Pendant Necklace', cat: 'accessories', sub: 'jewelry', brand: 'Klarita', art: 'gem',
    image: './images/products/gem-2.jpg',
    price: 4499, orig: 5999, rating: 4.7, reviews: 610, sold: 1930, flash: false, age: 24,
    colors: col('silver'), kw: 'necklace pearl pendant jewelry gift elegant freshwater',
    desc: 'A single 8 mm freshwater pearl on a fine 45 cm sterling chain with a lobster clasp. Arrives in a gift box, ready to give.',
  },
  {
    id: 'p64', name: 'Vantia Weekender Duffel, 40L', cat: 'accessories', sub: 'travel', brand: 'Vantia', art: 'bag',
    image: './images/products/bag-10.jpg',
    imageFit: 'contain',
    price: 5999, orig: 7999, rating: 4.5, reviews: 480, sold: 1470, flash: false, age: 36,
    colors: col('navy', 'brown'), kw: 'duffel bag weekender 40l travel gym overnight carry',
    desc: 'A 40 L weekend duffel in coated canvas with a trolley sleeve, a shoe compartment and a detachable shoulder strap. Carry-on sized for most airlines.',
  },
  {
    id: 'p65', name: 'Pikol Signet Ring, Sterling Silver', cat: 'accessories', sub: 'jewelry', brand: 'Pikol', art: 'gem',
    image: './images/products/gem-3.jpg',
    price: 3499, orig: 4799, rating: 4.4, reviews: 340, sold: 890, flash: false, age: 61,
    colors: col('silver'), sizes: ['52', '56', '60'], kw: 'ring signet sterling silver jewelry engraved classic',
    desc: 'A 10 mm oval signet in rhodium-plated sterling silver with a flat face ready for engraving. Comfort-fit inner curve, sizes 52 to 60.',
  },
  {
    id: 'p43', name: 'Novo Clear Case for X4 Pro', cat: 'electronics', sub: 'phones', brand: 'Novo', art: 'smartphone',
    image: './images/products/smartphone-3.jpg',
    price: 899, orig: 1299, rating: 4.4, reviews: 2210, sold: 7330, flash: false, age: 11,
    colors: col('white'), kw: 'phone case cover clear x4 pro shockproof slim',
    desc: 'A 1.2 mm shock-absorbing case with raised bezels for the camera and screen. Stays optically clear with an anti-yellowing coating.',
  },

  // Recommended-for-you catalog (recommended-data.js). Same product shape as
  // the rows above, so browse, search, product detail, cart and wishlist all
  // read these recommendations without any rendering change.
  ...RECOMMENDED_PRODUCTS,
];

/* ---------------------------------------------------------------------------
 * Locations. Every catalog row carries a `location` drawn from the shared
 * taxonomy in locations.js, so the home filter bar, the browse filter sheet,
 * the product card's city line and the server's products table all agree on
 * the same province/city names. A city row written by hand later still
 * resolves its province through provinceByCity, and the assignment is
 * deterministic per product id (idSum), so the same item always ships from
 * the same city across boots, orders and the server's seeded table.
 * ------------------------------------------------------------------------- */
const CITY_ROWS = LOCATIONS.flatMap((province) =>
  province.cities.map((city) => ({ province: province.name, city: city.name })));

function locationForProduct(id) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s += id.charCodeAt(i);
  return CITY_ROWS[s % CITY_ROWS.length];
}

// Assign in place so PRODUCTS (and the RECOMMENDED_PRODUCTS rows spread into
// it below) carry location whether the row came from this file or the
// recommended catalog.
PRODUCTS.forEach((p) => { p.location = locationForProduct(p.id); });

/* How many committed photos exist for each product's image basename
 * (public/images/products/<base>-<n>.jpg, numbered from 1 with no gaps). A
 * product's `image` names its first photo; this table lets the catalog give
 * every product an ordered `images` array read by BOTH the listing cards and
 * the product detail gallery, so the two surfaces can never disagree. Only
 * basenames with more than one file are listed; a photo with no entry is a
 * single-image product. A product with no `image` at all keeps an empty
 * array, which renders the neutral placeholder. */
const IMAGE_SET_COUNTS = {
  airfryer: 5, backpack: 6, bag: 10, bed: 3, bottle: 8, cable: 5, cap: 5,
  case: 5, charger: 5, coffeeMaker: 5, diffuser: 5, drone: 6, droplet: 3,
  dumbbell: 2, gem: 3, headphones: 2, jacket: 6, keyboard: 7, lamp: 8,
  monitor: 5, mouse: 6, notebook: 6, powerbank: 6, shoe: 7, smartphone: 3,
  smartwatch: 10, sparkles: 3, speaker: 8, steelwatch: 2, sunglasses: 7,
  tablet: 5, tent: 6, usbhub: 6, vacuum: 5, wallet: 6, webcam: 5,
};

/* Build a product's ordered image list from its photo basename. The current
 * `image` is always entry 0 (so the card photo leads the gallery), then every
 * other committed file for that basename follows in numeric order. */
function imagesForProduct(p) {
  const src = p.image;
  if (!src) return [];
  const m = /^(.*\/)([^/]+?)-(\d+)\.jpg$/.exec(src);
  if (!m) return [src];
  const prefix = m[1];
  const base = m[2];
  const first = Number(m[3]);
  const count = IMAGE_SET_COUNTS[base] || 1;
  const rest = [];
  for (let i = 1; i <= count; i += 1) if (i !== first) rest.push(prefix + base + '-' + i + '.jpg');
  return [src].concat(rest);
}

// Every catalog row carries a derived `images` array. `image` stays as the
// first entry (back-compat); a record with no photo gets an empty array.
PRODUCTS.forEach((p) => {
  p.images = imagesForProduct(p);
  p.image = p.images[0] || null;
});

/* ---------------------------------------------------------------------------
 * Lookups and derived helpers.
 * ------------------------------------------------------------------------- */

/* The home page's Recommended grid leads with the centralized recommendations
 * (recommended-data.js), then continues through the older catalog, so the
 * expanded list is the first thing a visitor sees. Browse, search and the
 * product pages keep iterating PRODUCTS in its declared order. */
const RECOMMENDED_IDS = new Set(RECOMMENDED_PRODUCTS.map((p) => p.id));
export const RECOMMENDED_FOR_YOU = [
  ...RECOMMENDED_PRODUCTS,
  ...PRODUCTS.filter((p) => !RECOMMENDED_IDS.has(p.id)),
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

/* One-line description of a voucher ("10% off your order · orders over
 * $20.00"). Shared by the cart's voucher block and the profile's Coupons
 * page so both always word it the same way. */
export function voucherDescription(v) {
  const base = v.type === 'percent'
    ? v.value + '% off your order'
    : v.type === 'fixed'
      ? '$' + (v.value / 100).toFixed(2) + ' off your order'
      : 'Free shipping on your order';
  return base + ' · orders over ' + '$' + (v.min / 100).toFixed(2);
}

export function discountPct(p) {
  if (!p.orig || p.orig <= p.price) return 0;
  return Math.round((1 - p.price / p.orig) * 100);
}

/* Orders (Phase 5). Mock seed data, like the catalog: there is no checkout
 * yet, so nothing in the app creates an order. Statuses: 'to_pay' | 'to_ship'
 * | 'shipped' | 'completed' | 'cancelled'. dates are expressed as daysAgo so
 * the history always looks recent; orders.js turns them into timestamps.
 * Each order snapshots the shipping address used at purchase (later phases
 * replace these seeds with real order storage).
 */
export const ORDER_SEEDS = [
  {
    no: 'BZ-48219', status: 'to_pay', daysAgo: 0.2,
    items: [{ id: 'p09', qty: 1 }, { id: 'p13', qty: 1 }],
    payment: 'Visa ending in 4242', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    countryName: 'United States', courierName: 'UPS Ground',
    shipping: 399,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-48073', status: 'to_ship', daysAgo: 1.3,
    items: [{ id: 'p05', qty: 2 }],
    payment: 'MVP Marketplace Pay', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    countryName: 'United States', courierName: 'USPS Priority Mail',
    shipping: 0,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-47156', status: 'shipped', daysAgo: 2.6,
    items: [{ id: 'p22', qty: 1 }],
    payment: 'Visa ending in 4242', shipMethod: 'Express delivery', shipEta: '1-2 business days',
    countryName: 'United States', courierName: 'FedEx Express Saver',
    shipping: 799,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-46402', status: 'shipped', daysAgo: 3.4,
    items: [{ id: 'p06', qty: 1 }, { id: 'p07', qty: 1 }],
    payment: 'MVP Marketplace Pay', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    countryName: 'United States', courierName: 'UPS Ground',
    shipping: 0,
    address: { name: 'Sam Taylor', phone: '+1 555 0198', line1: '8 Cedar Lane', city: 'Austin, TX', zip: '78701' },
  },
  {
    no: 'BZ-45201', status: 'completed', daysAgo: 9,
    items: [{ id: 'p19', qty: 1 }, { id: 'p20', qty: 1 }],
    payment: 'Visa ending in 4242', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    countryName: 'United States', courierName: 'UPS Ground',
    shipping: 0,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-43810', status: 'completed', daysAgo: 15,
    items: [{ id: 'p14', qty: 3 }],
    payment: 'MVP Marketplace Pay', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    countryName: 'United States', courierName: 'USPS Priority Mail',
    shipping: 0,
    address: { name: 'Sam Taylor', phone: '+1 555 0198', line1: '8 Cedar Lane', city: 'Austin, TX', zip: '78701' },
  },
  {
    no: 'BZ-42087', status: 'cancelled', daysAgo: 21, cancelledAfterHours: 5,
    items: [{ id: 'p23', qty: 1 }, { id: 'p24', qty: 1 }],
    payment: 'Visa ending in 4242', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    countryName: 'United States', courierName: 'UPS Ground',
    shipping: 399,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
];

/* Products that live only on the server (the generated marketplace catalog).
 * The bundled PRODUCTS array stays the offline fallback; rows fetched from
 * GET /api/products are registered here so the cart, orders, favorites and
 * the product page can look them up by id exactly like a bundled product.
 * The ones a shopper touched (cart, saved, viewed) are snapshotted to
 * localStorage so a reload does not lose a cart line whose product has not
 * been fetched yet. */
const EXTRA_KEY = 'bazario:extra-products';
const EXTRA_MAX = 150;
const BUNDLED = new Map(PRODUCTS.map((p) => [p.id, p]));
const EXTRA = new Map();

try {
  const saved = JSON.parse(localStorage.getItem(EXTRA_KEY) || '[]');
  if (Array.isArray(saved)) saved.forEach((p) => { if (p && p.id && !BUNDLED.has(p.id)) EXTRA.set(p.id, p); });
} catch {
  // No storage (private mode, Node): server products simply are not cached.
}

export function registerProducts(list) {
  (list || []).forEach((p) => { if (p && p.id && !BUNDLED.has(p.id)) EXTRA.set(p.id, p); });
}

export function rememberProduct(id) {
  const p = EXTRA.get(id);
  if (!p) return;
  try {
    const saved = JSON.parse(localStorage.getItem(EXTRA_KEY) || '[]');
    const rest = (Array.isArray(saved) ? saved : []).filter((x) => x && x.id !== id);
    localStorage.setItem(EXTRA_KEY, JSON.stringify(rest.concat([p]).slice(-EXTRA_MAX)));
  } catch {
    // Storage refused: the product is still usable for this session.
  }
}

export function productById(id) {
  return BUNDLED.get(id) || EXTRA.get(id) || null;
}

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function subcategoryById(catId, subId) {
  const subs = SUBCATEGORIES[catId] || [];
  return subs.find((s) => s.id === subId) || null;
}

export function subcategoryName(catId, subId) {
  const s = subcategoryById(catId, subId);
  return s ? s.name : '';
}

/* Full-text search across name, brand, category, subcategory and keywords. */
export function matchSearch(p, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const hay = [p.name, p.brand, p.cat, subcategoryName(p.cat, p.sub), p.kw || '']
    .join(' ')
    .toLowerCase();
  return terms.every((t) => hay.includes(t));
}

/* Products sorted by a simple relevance score (rating, sales, flash deals). */
export function score(p) {
  return p.rating * 2 + p.sold / 5000 + (p.flash ? 0.5 : 0);
}

/* Gallery image indices. The artwork generator (icons.js) draws four
 * believable "photos" per product by varying the composition, gradient and
 * zoom of the same product illustration. */
export function imagesFor(p) {
  return [0, 1, 2, 3];
}

/* ---------------------------------------------------------------------------
 * Specifications. Each product renders a clean two-column table. Rows are
 * keyed with a translation key (see public/js/i18n.js) and an English label
 * that is the fallback; a row whose value is empty is dropped, so a field
 * that does not apply is HIDDEN rather than shown as "N/A".
 *
 * The label set is chosen by category, per the product it is:
 *   - laptops / computing notebooks: Display, Processor, RAM, Storage,
 *     Graphics, Battery, Weight, Operating System, Ports
 *   - phones: Display, Chipset, RAM, Storage, Camera, Battery, OS, SIM
 *   - clothing / fashion: Material, Size options, Fit, Care, Origin
 *   - everything else: Dimensions, Weight, Material, Power / Capacity
 * Every product also shows Brand, Model, Product ID and Stock, plus a
 * Warranty row where one applies (electronics, home, sports, accessories and
 * fashion; not groceries or beauty).
 * ------------------------------------------------------------------------- */

function row(k, l, v) { return { k: k, l: l, v: v }; }

const LAPTOP_SPECS = [
  row('spec.display', 'Display', '14" IPS, 1920 x 1200'),
  row('spec.processor', 'Processor', 'Intel Core i5-1335U'),
  row('spec.ram', 'RAM', '16 GB DDR4'),
  row('spec.storage', 'Storage', '512 GB NVMe SSD'),
  row('spec.graphics', 'Graphics', 'Intel Iris Xe'),
  row('spec.battery', 'Battery', 'Up to 12 hours'),
  row('spec.weight', 'Weight', '1.3 kg'),
  row('spec.os', 'Operating System', 'Windows 11 Home'),
  row('spec.ports', 'Ports', '2x USB-C, 2x USB-A, HDMI'),
];

const PHONE_SPECS = [
  row('spec.display', 'Display', '6.7" AMOLED, 120 Hz'),
  row('spec.chipset', 'Chipset', 'Snapdragon 8 Gen 2'),
  row('spec.ram', 'RAM', '8 GB'),
  row('spec.storage', 'Storage', '128 GB'),
  row('spec.camera', 'Camera', '50 MP triple'),
  row('spec.battery', 'Battery', '5000 mAh, 65 W fast charge'),
  row('spec.os', 'Operating System', 'Android 14'),
  row('spec.sim', 'SIM', 'Dual SIM, unlocked'),
];

const CLOTHING_SPECS = [
  row('spec.material', 'Material', 'Combed cotton blend'),
  row('spec.sizes', 'Size options', 'S, M, L, XL'),
  row('spec.fit', 'Fit', 'True to size'),
  row('spec.care', 'Care instructions', 'Machine wash 30°C'),
  row('spec.origin', 'Origin', 'Made in Portugal'),
];

/* Dimensions, Weight, Material and Power / Capacity for every non-laptop,
 * non-phone, non-clothing kind. Values stay plausible for the item. */
const OTHER_SPECS = {
  headphones: [row('spec.dimensions', 'Dimensions', '18 × 17 × 8 cm'), row('spec.weight', 'Weight', '255 g'), row('spec.material', 'Material', 'Aluminium + memory foam'), row('spec.power', 'Power / Capacity', 'USB-C, 40 h per charge')],
  camera: [row('spec.dimensions', 'Dimensions', '6 × 4 × 3 cm'), row('spec.weight', 'Weight', '154 g'), row('spec.material', 'Material', 'Polycarbonate body'), row('spec.power', 'Power / Capacity', '4K60 video, 10 m waterproof')],
  tv: [row('spec.dimensions', 'Dimensions', '123 × 71 × 8 cm'), row('spec.weight', 'Weight', '12.4 kg'), row('spec.material', 'Material', 'Aluminium frame'), row('spec.power', 'Power / Capacity', '55" 4K UHD, 120 W')],
  speaker: [row('spec.dimensions', 'Dimensions', '10 × 10 × 9 cm'), row('spec.weight', 'Weight', '320 g'), row('spec.material', 'Material', 'Silicone + mesh'), row('spec.power', 'Power / Capacity', '12 W, IPX7, 18 h')],
  watch: [row('spec.dimensions', 'Dimensions', '44 × 38 × 10 mm'), row('spec.weight', 'Weight', '45 g'), row('spec.material', 'Material', 'Aluminium case'), row('spec.power', 'Power / Capacity', '10-day battery, 5 ATM')],
  bag: [row('spec.dimensions', 'Dimensions', '26 × 20 × 9 cm'), row('spec.weight', 'Weight', '480 g'), row('spec.material', 'Material', 'Water-resistant canvas'), row('spec.power', 'Power / Capacity', '12 L capacity')],
  glasses: [row('spec.dimensions', 'Dimensions', '142 × 45 × 20 mm'), row('spec.weight', 'Weight', '24 g'), row('spec.material', 'Material', 'Hand-polished acetate'), row('spec.power', 'Power / Capacity', 'UV400 polarised')],
  droplet: [row('spec.dimensions', 'Dimensions', '30 ml bottle'), row('spec.weight', 'Weight', '75 g'), row('spec.material', 'Material', 'Glass bottle, dropper'), row('spec.power', 'Power / Capacity', '30 ml')],
  sparkles: [row('spec.dimensions', 'Dimensions', '12 × 8 × 2 cm'), row('spec.weight', 'Weight', '120 g'), row('spec.material', 'Material', 'Talc-free pressed powder'), row('spec.power', 'Power / Capacity', 'Standard retail size')],
  cream: [row('spec.dimensions', 'Dimensions', '50 ml jar'), row('spec.weight', 'Weight', '95 g'), row('spec.material', 'Material', 'Hyaluronic acid base'), row('spec.power', 'Power / Capacity', '50 ml')],
  jar: [row('spec.dimensions', 'Dimensions', '13 × 9 × 9 cm'), row('spec.weight', 'Weight', '560 g'), row('spec.material', 'Material', 'Glass jar, metal lid'), row('spec.power', 'Power / Capacity', 'See pack size')],
  armchair: [row('spec.dimensions', 'Dimensions', '82 W × 88 D × 78 H cm'), row('spec.weight', 'Weight', '24 kg'), row('spec.material', 'Material', 'Woven polyester, oak legs'), row('spec.power', 'Power / Capacity', 'Seats one')],
  lamp: [row('spec.dimensions', 'Dimensions', '18 × 18 × 46 cm'), row('spec.weight', 'Weight', '1.4 kg'), row('spec.material', 'Material', 'Ceramic base, linen shade'), row('spec.power', 'Power / Capacity', 'E27, 8 W LED')],
  bed: [row('spec.dimensions', 'Dimensions', '220 × 240 cm'), row('spec.weight', 'Weight', '1.8 kg'), row('spec.material', 'Material', '300 TC cotton percale'), row('spec.power', 'Power / Capacity', 'Double + 2 pillowcases')],
  table: [row('spec.dimensions', 'Dimensions', '45 Ø × 45 H cm'), row('spec.weight', 'Weight', '6.2 kg'), row('spec.material', 'Material', 'Solid oak'), row('spec.power', 'Power / Capacity', 'Hardwax oil finish')],
  dumbbell: [row('spec.dimensions', 'Dimensions', '32 × 20 × 20 cm'), row('spec.weight', 'Weight', '20 kg set'), row('spec.material', 'Material', 'Steel, rubber-coated'), row('spec.power', 'Power / Capacity', '5-20 kg adjustable')],
  ball: [row('spec.dimensions', 'Dimensions', '22 cm diameter'), row('spec.weight', 'Weight', '410 g'), row('spec.material', 'Material', 'Machine-stitched TPU'), row('spec.power', 'Power / Capacity', 'Size 5 match ball')],
  bottle: [row('spec.dimensions', 'Dimensions', '8 × 8 × 26 cm'), row('spec.weight', 'Weight', '320 g'), row('spec.material', 'Material', '18/8 stainless steel'), row('spec.power', 'Power / Capacity', '1 L, cold 24 h / hot 12 h')],
  apple: [row('spec.dimensions', 'Dimensions', '6-pack tray'), row('spec.weight', 'Weight', 'About 1.1 kg'), row('spec.material', 'Material', 'Fresh organic fruit'), row('spec.power', 'Power / Capacity', '6 apples')],
  coffee: [row('spec.dimensions', 'Dimensions', '10 × 8 × 24 cm'), row('spec.weight', 'Weight', '1 kg'), row('spec.material', 'Material', 'Arabica beans'), row('spec.power', 'Power / Capacity', 'Medium roast, whole bean')],
  wallet: [row('spec.dimensions', 'Dimensions', '10.5 × 8 cm'), row('spec.weight', 'Weight', '72 g'), row('spec.material', 'Material', 'Full-grain vegetable-tanned leather'), row('spec.power', 'Power / Capacity', '6 cards + cash fold')],
  gem: [row('spec.dimensions', 'Dimensions', 'Small, gift boxed'), row('spec.weight', 'Weight', '4 g'), row('spec.material', 'Material', 'Rhodium-plated 925 silver'), row('spec.power', 'Power / Capacity', 'Gift box included')],
  shoe: [row('spec.dimensions', 'Dimensions', 'EU 38-43'), row('spec.weight', 'Weight', '285 g per shoe'), row('spec.material', 'Material', 'Draining mesh, EVA midsole'), row('spec.power', 'Power / Capacity', '8 mm heel drop')],
  mat: [row('spec.dimensions', 'Dimensions', '183 × 61 cm'), row('spec.weight', 'Weight', '1.1 kg'), row('spec.material', 'Material', 'TPE, closed-cell'), row('spec.power', 'Power / Capacity', '6 mm thick, non-slip')],
  tent: [row('spec.dimensions', 'Dimensions', 'Packed 60 × 18 cm'), row('spec.weight', 'Weight', '4.2 kg'), row('spec.material', 'Material', 'Ripstop polyester'), row('spec.power', 'Power / Capacity', '2 person, 3000 mm fly')],
  banana: [row('spec.dimensions', 'Dimensions', '1 kg bunch'), row('spec.weight', 'Weight', 'About 1 kg'), row('spec.material', 'Material', 'Fresh fruit'), row('spec.power', 'Power / Capacity', 'About 9 bananas')],
  belt: [row('spec.dimensions', 'Dimensions', 'Length S-XL'), row('spec.weight', 'Weight', '180 g'), row('spec.material', 'Material', 'Full-grain leather'), row('spec.power', 'Power / Capacity', '3.5 cm, reversible buckle')],
  mouse: [row('spec.dimensions', 'Dimensions', '12 × 7 × 7 cm'), row('spec.weight', 'Weight', '105 g'), row('spec.material', 'Material', 'Recycled ABS'), row('spec.power', 'Power / Capacity', 'Wireless, weeks per charge')],
  keyboard: [row('spec.dimensions', 'Dimensions', '32 × 13 × 4 cm'), row('spec.weight', 'Weight', '820 g'), row('spec.material', 'Material', 'Aluminium + PBT keycaps'), row('spec.power', 'Power / Capacity', 'USB-C, detachable')],
  drone: [row('spec.dimensions', 'Dimensions', 'Folded 18 × 10 cm'), row('spec.weight', 'Weight', '249 g'), row('spec.material', 'Material', 'Composite shell'), row('spec.power', 'Power / Capacity', 'Up to 30 min flight')],
  monitor: [row('spec.dimensions', 'Dimensions', '61 × 36 cm panel'), row('spec.weight', 'Weight', '5.4 kg'), row('spec.material', 'Material', 'IPS panel, metal stand'), row('spec.power', 'Power / Capacity', '27" QHD, 165 Hz')],
  webcam: [row('spec.dimensions', 'Dimensions', '9 × 3 × 3 cm'), row('spec.weight', 'Weight', '95 g'), row('spec.material', 'Material', 'ABS housing'), row('spec.power', 'Power / Capacity', '1080p60, USB-C')],
  powerbank: [row('spec.dimensions', 'Dimensions', '14 × 7 × 3 cm'), row('spec.weight', 'Weight', '395 g'), row('spec.material', 'Material', 'Aluminium shell'), row('spec.power', 'Power / Capacity', '20000 mAh, 65 W USB-C PD')],
  charger: [row('spec.dimensions', 'Dimensions', '9 × 9 × 12 cm'), row('spec.weight', 'Weight', '165 g'), row('spec.material', 'Material', 'ABS, non-slip silicone'), row('spec.power', 'Power / Capacity', '15 W Qi wireless')],
  cable: [row('spec.dimensions', 'Dimensions', '2 m braided'), row('spec.weight', 'Weight', '60 g'), row('spec.material', 'Material', 'Braided nylon'), row('spec.power', 'Power / Capacity', '100 W USB-C PD, 480 Mbps')],
  usbhub: [row('spec.dimensions', 'Dimensions', '11 × 4 × 2 cm'), row('spec.weight', 'Weight', '78 g'), row('spec.material', 'Material', 'Aluminium shell'), row('spec.power', 'Power / Capacity', '7-in-1, 100 W pass-through')],
  case: [row('spec.dimensions', 'Dimensions', 'Fits X4 Pro'), row('spec.weight', 'Weight', '32 g'), row('spec.material', 'Material', 'Shock-absorbing TPU'), row('spec.power', 'Power / Capacity', '1.2 mm, anti-yellowing')],
  airfryer: [row('spec.dimensions', 'Dimensions', '36 × 30 × 32 cm'), row('spec.weight', 'Weight', '5.6 kg'), row('spec.material', 'Material', 'Plastic + non-stick basket'), row('spec.power', 'Power / Capacity', '5 L, 1500 W')],
  vacuum: [row('spec.dimensions', 'Dimensions', '35 × 35 × 10 cm'), row('spec.weight', 'Weight', '3.4 kg'), row('spec.material', 'Material', 'Recycled plastic'), row('spec.power', 'Power / Capacity', 'LiDAR, 180 min, self-empty')],
  coffeeMaker: [row('spec.dimensions', 'Dimensions', '32 × 30 × 40 cm'), row('spec.weight', 'Weight', '7.2 kg'), row('spec.material', 'Material', 'Stainless steel'), row('spec.power', 'Power / Capacity', '15 bar, 1.8 L tank')],
  diffuser: [row('spec.dimensions', 'Dimensions', '12 × 12 × 18 cm'), row('spec.weight', 'Weight', '580 g'), row('spec.material', 'Material', 'Bamboo + BPA-free plastic'), row('spec.power', 'Power / Capacity', '300 ml, up to 10 h')],
  backpack: [row('spec.dimensions', 'Dimensions', '46 × 30 × 16 cm'), row('spec.weight', 'Weight', '880 g'), row('spec.material', 'Material', 'Recycled nylon'), row('spec.power', 'Power / Capacity', '20 L, fits 15" laptop')],
  smarthome: [row('spec.dimensions', 'Dimensions', '12 cm sphere'), row('spec.weight', 'Weight', '410 g'), row('spec.material', 'Material', 'Polycarbonate shell'), row('spec.power', 'Power / Capacity', 'Mains, Wi-Fi + Zigbee')],
};

/* Kinds that use the clothing label set. */
const CLOTHING_ART = new Set(['shirt', 'jacket', 'cap']);

/* Per-product value overrides: when an item's category is right but its own
 * details differ from the category default (a linen dress, a laptop sleeve,
 * a phone case), replace the matching row and/or add rows. Keyed by product
 * id; a row replaces one with the same label, otherwise it is appended. */
const PRODUCT_SPEC_OVERRIDES = {
  // Fashion: the description names the real material.
  p09: [row('spec.material', 'Material', '240 gsm combed cotton')],
  p10: [row('spec.material', 'Material', '13 oz rigid denim')],
  p36: [row('spec.material', 'Material', 'Washed linen'), row('spec.fit', 'Fit', 'Relaxed, midi length')],
  p37: [row('spec.material', 'Material', 'Lambswool blend')],
  p48: [row('spec.material', 'Material', 'Brushed-back fleece')],
  p49: [row('spec.material', 'Material', 'Fluid crepe, lined')],
  p50: [row('spec.material', 'Material', 'Full-grain leather')],
  p62: [row('spec.material', 'Material', 'Full-grain leather'), row('spec.sizes', 'Size options', 'S, M, L, XL')],
  // Products whose artwork kind is a gadget but whose category is not.
  p07: [row('spec.dimensions', 'Dimensions', 'Fits up to 14" laptops'), row('spec.weight', 'Weight', '260 g'), row('spec.material', 'Material', 'Water-repellent polyester'), row('spec.power', 'Power / Capacity', '8 mm foam padding')],
  p35: [row('spec.dimensions', 'Dimensions', '11 × 4 × 2 cm'), row('spec.weight', 'Weight', '78 g'), row('spec.material', 'Material', 'Aluminium shell'), row('spec.power', 'Power / Capacity', '7-in-1, 100 W pass-through')],
  p34: [row('spec.dimensions', 'Dimensions', '9 × 9 × 12 cm'), row('spec.weight', 'Weight', '165 g'), row('spec.material', 'Material', 'ABS, non-slip silicone'), row('spec.power', 'Power / Capacity', '15 W Qi wireless')],
  p43: [row('spec.dimensions', 'Dimensions', 'Fits X4 Pro'), row('spec.weight', 'Weight', '32 g'), row('spec.material', 'Material', 'Shock-absorbing TPU'), row('spec.power', 'Power / Capacity', '1.2 mm, anti-yellowing')],
};

/* A short model name: the product name without its leading brand. */
function modelOf(p) {
  const name = p.name || '';
  const brand = p.brand || '';
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase() + ' ')) {
    return name.slice(brand.length + 1).trim();
  }
  return name;
}

/* Rows of [translation key, English label, value]. Identity rows are appended
 * to every product; Warranty is omitted where it does not apply. */
export function specsFor(p) {
  const art = p.art;
  let rows;
  if (art === 'notebook') rows = LAPTOP_SPECS.slice();
  else if (art === 'smartphone') rows = PHONE_SPECS.slice();
  else if (CLOTHING_ART.has(art)) rows = CLOTHING_SPECS.slice();
  else rows = (OTHER_SPECS[art] || OTHER_SPECS.bag).slice();

  const overrides = PRODUCT_SPEC_OVERRIDES[p.id];
  if (overrides) {
    for (const o of overrides) {
      const i = rows.findIndex((r) => r.l === o.l);
      if (i === -1) rows.push(o);
      else rows[i] = o;
    }
  }

  rows = rows.concat([
    row('spec.brand', 'Brand', p.brand),
    row('spec.model', 'Model', modelOf(p)),
    row('spec.sku', 'Product ID', p.id),
    row('spec.stock', 'Stock', p.oos ? 'Sold out' : 'In stock'),
  ]);
  if (p.cat !== 'groceries' && p.cat !== 'beauty') {
    rows.push(row('spec.warranty', 'Warranty', p.cat === 'electronics' ? '24 months' : '12 months'));
  }
  return rows.filter((r) => r.v !== undefined && r.v !== null && r.v !== '');
}

/* ---------------------------------------------------------------------------
 * Shipping.
 * ------------------------------------------------------------------------- */

function idSum(id) {
  let s = 0;
  for (let i = 0; i < id.length; i++) s += id.charCodeAt(i);
  return s;
}

export function shippingFor(p) {
  return {
    fee: p.price >= 3500 ? 0 : 499,
    eta: idSum(p.id) % 3 === 0 ? '3-5 business days' : '2-4 business days',
    returns: '30-day free returns',
  };
}

/* ---------------------------------------------------------------------------
 * Reviews. Deterministic per product: reviewer roster, rating pattern and
 * photo placement are seeded from the product id, so every render is the
 * same without storing per-product review text.
 * ------------------------------------------------------------------------- */

const REVIEW_AUTHORS = [
  ['Amelia', 'bg-rose-100', 'text-rose-600'],
  ['Dev', 'bg-indigo-100', 'text-indigo-600'],
  ['Sofia', 'bg-purple-100', 'text-purple-600'],
  ['Marcus', 'bg-teal-100', 'text-teal-600'],
  ['Priya', 'bg-orange-100', 'text-orange-600'],
  ['Tomás', 'bg-green-100', 'text-green-600'],
  ['Nadia', 'bg-blue-100', 'text-blue-600'],
  ['Kwame', 'bg-amber-100', 'text-amber-700'],
];

const REVIEW_TEXTS = {
  5: [
    'Exactly as described. Arrived two days early and the quality genuinely surprised me for the price.',
    'Second one I have bought. Works perfectly and the {brand} packaging felt really premium.',
    'Best purchase this month. Does everything promised and it looks far more expensive than it is.',
    'Bought this after reading the reviews and I get it now. Five stars, no notes.',
    'Really impressed. You can tell it was designed properly rather than copied from something else.',
  ],
  4: [
    'Really solid overall. One star off because the finish could be a touch better, but I would buy again.',
    'Good value for the money. Shipping was quick and it matched the pictures exactly.',
    'Happy with it after a week of daily use. Minor nitpick: the instructions are very short.',
    'Does what it should and feels well made. Docked one star for the shipping box arriving dented.',
  ],
  3: [
    'It does the job, but the material feels lighter than I expected from the photos. Decent for the price.',
    'Fine overall, though delivery took longer than the estimate and support was slow to reply.',
  ],
  2: [
    'Not for me. It works, but smaller than pictured and I misread the dimensions. Check them first.',
  ],
};

/* Ratings pattern per product rating band, interleaved so the average of the
 * visible list sits close to the product's overall rating. */
function ratingPattern(rating) {
  if (rating >= 4.65) return [5, 5, 4, 5, 5, 4, 5, 3];
  if (rating >= 4.4) return [5, 4, 5, 4, 5, 5, 3, 4];
  return [4, 5, 4, 3, 4, 5, 2, 4];
}

const REVIEW_AGES = ['3 days ago', '1 week ago', '2 weeks ago', '2 weeks ago', '3 weeks ago', '1 month ago', '2 months ago', '3 months ago'];

export function reviewsFor(p) {
  const start = idSum(p.id) % REVIEW_AUTHORS.length;
  const pattern = ratingPattern(p.rating);
  const count = p.reviews >= 2000 ? 8 : 6;
  const out = [];
  for (let i = 0; i < count; i++) {
    const author = REVIEW_AUTHORS[(start + i) % REVIEW_AUTHORS.length];
    const rating = pattern[i % pattern.length];
    const texts = REVIEW_TEXTS[rating] || REVIEW_TEXTS[4];
    const text = texts[(idSum(p.id) + i) % texts.length].replace('{brand}', p.brand);
    const withPhotos = p.sold > 2000 && (i === 1 || i === 4);
    out.push({
      id: p.id + '-r' + i,
      author: author[0],
      tintBg: author[1],
      tintFg: author[2],
      rating,
      text,
      when: REVIEW_AGES[i],
      verified: i % 4 !== 2,
      images: withPhotos ? (i === 1 ? [1] : [0, 2]) : [],
    });
  }
  return out;
}

/* Rating distribution shares for the summary bars, nearest to the product's
 * rating so 4.8-star products skew visibly toward 5-star reviews. */
const DISTRIBUTIONS = [
  [4.75, [0.82, 0.13, 0.03, 0.01, 0.01]],
  [4.5, [0.72, 0.2, 0.05, 0.02, 0.01]],
  [4.25, [0.62, 0.26, 0.08, 0.03, 0.01]],
  [4.0, [0.55, 0.3, 0.1, 0.04, 0.01]],
  [3.5, [0.42, 0.32, 0.17, 0.06, 0.03]],
];

export function ratingDistribution(rating) {
  let best = DISTRIBUTIONS[0];
  let bestDist = Infinity;
  for (const row of DISTRIBUTIONS) {
    const d = Math.abs(row[0] - rating);
    if (d < bestDist) {
      bestDist = d;
      best = row;
    }
  }
  return best[1];
}
