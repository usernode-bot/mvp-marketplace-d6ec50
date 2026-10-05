/* Mock catalog data. All prices are integer cents. Names, brands and copy
 * are invented; later phases swap this module for the real API without
 * touching the rendering code (same shape: { id, name, cat, price, orig,
 * rating, reviews, sold, art, flash, pct }).
 *
 * Phase 2 additions: subcategories, brands, sellers, product descriptions,
 * specifications, color/size variants, gallery image views, customer
 * reviews and browse helpers (search matching, shipping).
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
    { id: 'bottoms', name: 'Bottoms' },
    { id: 'footwear', name: 'Footwear' },
    { id: 'bags', name: 'Bags' },
    { id: 'eyewear', name: 'Eyewear' },
    { id: 'accessories', name: 'Accessories' },
  ],
  beauty: [
    { id: 'skincare', name: 'Skincare' },
    { id: 'makeup', name: 'Makeup' },
    { id: 'haircare', name: 'Haircare' },
    { id: 'fragrance', name: 'Fragrance' },
  ],
  home: [
    { id: 'furniture', name: 'Furniture' },
    { id: 'lighting', name: 'Lighting' },
    { id: 'bedding', name: 'Bedding' },
    { id: 'decor', name: 'Decor' },
    { id: 'kitchen', name: 'Kitchen' },
  ],
  sports: [
    { id: 'fitness', name: 'Fitness' },
    { id: 'outdoor', name: 'Outdoor' },
    { id: 'team-sports', name: 'Team Sports' },
    { id: 'cycling', name: 'Cycling' },
    { id: 'apparel', name: 'Sportswear' },
  ],
  groceries: [
    { id: 'beverages', name: 'Beverages' },
    { id: 'pantry', name: 'Pantry' },
    { id: 'fresh', name: 'Fresh Produce' },
    { id: 'snacks', name: 'Snacks' },
  ],
  accessories: [
    { id: 'watches', name: 'Watches' },
    { id: 'jewelry', name: 'Jewelry' },
    { id: 'small-goods', name: 'Bags & Wallets' },
    { id: 'travel', name: 'Travel' },
    { id: 'headwear', name: 'Headwear' },
    { id: 'eyewear', name: 'Eyewear' },
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
  Freshly: { rating: 4.6, since: 2021, followers: '6.8k', response: '92%', badge: 'Verified seller' },
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
    price: 5999, orig: 8999, rating: 4.7, reviews: 2314, sold: 8231, flash: true, pct: 78, age: 34,
    colors: col('black', 'silver', 'violet'), kw: 'headphones audio bluetooth anc music wireless headset',
    desc: 'Studio-grade over-ear headphones with hybrid active noise cancelling, plush memory-foam cups and a 40-hour battery that charges over USB-C in under two hours.',
  },
  {
    id: 'p02', name: 'Novo X4 Pro Smartphone, 128GB', cat: 'electronics', sub: 'phones', brand: 'Novo', art: 'smartphone',
    price: 24999, orig: 29999, rating: 4.6, reviews: 1877, sold: 5102, flash: true, pct: 64, age: 12,
    colors: col('black', 'blue', 'silver'), kw: 'phone smartphone 5g mobile android unlocked 128gb',
    desc: 'A 120 Hz AMOLED flagship killer with a 50 MP triple camera, 5000 mAh battery and 65 W fast charging. Dual SIM, unlocked for every carrier.',
  },
  {
    id: 'p03', name: 'Klarita 4K Action Camera', cat: 'electronics', sub: 'cameras', brand: 'Klarita', art: 'camera',
    price: 8999, orig: 11999, rating: 4.5, reviews: 942, sold: 3210, flash: false, age: 55,
    colors: col('black'), kw: 'camera action gopro waterproof vlog 4k helmet',
    desc: 'Pocket-sized 4K60 action camera with 3-axis stabilisation, waterproof to 10 m without a case, and a touch rear screen for framing on the go.',
  },
  {
    id: 'p04', name: 'Vantia 55" Smart TV', cat: 'electronics', sub: 'tv', brand: 'Vantia', art: 'tv',
    price: 32999, orig: 39999, rating: 4.4, reviews: 655, sold: 1204, flash: false, age: 88, oos: true,
    colors: col('black'), kw: 'television smart tv 4k streaming uhd led',
    desc: 'A 55-inch 4K UHD smart TV with three HDMI ports, built-in streaming apps and a slim bezel-less frame that disappears into the wall.',
  },
  {
    id: 'p05', name: 'Pikol Mini Bluetooth Speaker', cat: 'electronics', sub: 'audio', brand: 'Pikol', art: 'speaker',
    price: 2999, orig: 4499, rating: 4.8, reviews: 3201, sold: 9877, flash: true, pct: 85, age: 21,
    colors: col('blue', 'teal', 'red'), kw: 'speaker bluetooth portable music mini shower',
    desc: 'A pocket speaker with a surprising low end, IPX7 waterproofing for pool days and 18 hours of playtime per charge.',
  },
  {
    id: 'p06', name: 'Aurex Wireless Earbuds Pro', cat: 'electronics', sub: 'audio', brand: 'Aurex', art: 'headphones',
    price: 4499, orig: 6999, rating: 4.6, reviews: 2870, sold: 11320, flash: true, pct: 91, age: 8,
    colors: col('white', 'black'), kw: 'earbuds tws bluetooth wireless earbuds airpods buds',
    desc: 'True wireless earbuds with adaptive noise cancelling, six hours per charge and a slim case that adds three more top-ups. Instant pairing on both platforms.',
  },
  {
    id: 'p07', name: 'Mendo Laptop Sleeve 14 inch', cat: 'electronics', sub: 'computing', brand: 'Mendo', art: 'laptop',
    price: 1299, orig: 1999, rating: 4.3, reviews: 512, sold: 2244, flash: false, age: 66,
    colors: col('silver', 'navy', 'brown'), kw: 'laptop sleeve case bag 14 inch macbook cover',
    desc: 'A water-repellent sleeve with 8 mm foam padding, a front zip for chargers and a fit that slides into any backpack without bulking it up.',
  },
  {
    id: 'p08', name: 'Strida Smart Watch Fit', cat: 'electronics', sub: 'wearables', brand: 'Strida', art: 'watch',
    price: 4999, orig: 7999, rating: 4.5, reviews: 1420, sold: 4530, flash: true, pct: 55, age: 15,
    colors: col('black', 'pink', 'blue'), kw: 'smartwatch fitness tracker watch heart rate sleep',
    desc: 'A 1.4" AMOLED smartwatch with heart-rate and SpO2 tracking, 100+ workout modes and a 10-day battery. Swim-proof to 5 ATM.',
  },
  {
    id: 'p34', name: 'Luma Wireless Charging Stand', cat: 'electronics', sub: 'phones', brand: 'Luma', art: 'smartphone',
    price: 2599, orig: 3599, rating: 4.5, reviews: 640, sold: 1890, flash: false, age: 10,
    colors: col('black', 'white'), kw: 'charger wireless charging stand qi fast phone',
    desc: 'A 15 W Qi wireless stand that props your phone at a readable angle while it charges, with a silicone cradle that grips without scratching.',
  },
  {
    id: 'p35', name: 'Novo USB-C Hub, 7-in-1', cat: 'electronics', sub: 'computing', brand: 'Novo', art: 'laptop',
    price: 3999, orig: 4999, rating: 4.6, reviews: 720, sold: 2410, flash: false, age: 14,
    colors: col('silver'), kw: 'usb hub type-c docking adapter hdmi sd laptop',
    desc: 'Seven ports in an aluminum shell: 4K HDMI, 100 W USB-C power pass-through, two USB-A, plus SD and microSD card readers for quick photo offloads.',
  },
  {
    id: 'p44', name: 'Mendo Smart Home Hub', cat: 'electronics', sub: 'smarthome', brand: 'Mendo', art: 'smarthome',
    price: 11999, orig: 14100, rating: 4.8, reviews: 1100, sold: 4200, flash: false, age: 9,
    colors: col('white', 'black'), kw: 'smart home hub orb assistant automation zigbee matter sensors lights',
    desc: 'A spherical smart home hub that unifies your lights, locks and sensors, with a glowing status light, offline automations and support for the major voice assistants.',
  },
  {
    id: 'p45', name: 'Ombra Vertical Mouse', cat: 'electronics', sub: 'computing', brand: 'Ombra', art: 'mouse',
    price: 4999, orig: 5550, rating: 4.6, reviews: 950, sold: 3100, flash: false, age: 6,
    colors: col('black', 'silver'), kw: 'vertical mouse ergonomic wireless rechargeable wrist handshake silent',
    desc: 'A vertical ergonomic mouse that holds your wrist at a natural handshake angle, with a silent scroll wheel, six programmable buttons and weeks of battery per charge.',
  },
  {
    id: 'p46', name: 'Aurex Mechanical Keyboard, RGB Backlit', cat: 'electronics', sub: 'computing', brand: 'Aurex', art: 'keyboard',
    price: 7999, orig: 9999, rating: 4.7, reviews: 1160, sold: 3980, flash: true, pct: 58, age: 11,
    colors: col('black', 'silver'), kw: 'keyboard mechanical rgb backlit gaming hot swappable typing usb',
    desc: 'A hot-swappable mechanical keyboard with gasket mounting, per-key RGB and a volume knob. Wired USB-C with a detachable cable for a clean desk.',
  },
  {
    id: 'p47', name: 'Klarita Drone Camera, 4K GPS', cat: 'electronics', sub: 'cameras', brand: 'Klarita', art: 'drone',
    price: 19999, orig: 25999, rating: 4.5, reviews: 380, sold: 940, flash: false, age: 20, oos: true,
    colors: col('black'), kw: 'drone quadcopter camera 4k gps aerial foldable return home flying',
    desc: 'A foldable GPS drone with a 3-axis gimbal 4K camera, 30-minute flights and automatic return-to-home. Beginner flight modes make the first takeoff easy.',
  },

  // Fashion
  {
    id: 'p09', name: 'Vantia Oversized Cotton Tee', cat: 'fashion', sub: 'tops', brand: 'Vantia', art: 'shirt',
    price: 1499, orig: 2299, rating: 4.6, reviews: 2103, sold: 7655, flash: true, pct: 67, age: 29,
    colors: col('white', 'black', 'beige'), sizes: APPAREL_SIZES, kw: 'tshirt tee cotton top oversized unisex',
    desc: 'A heavyweight 240 gsm combed-cotton tee with a true oversized cut, dropped shoulders and a neckline that keeps its shape wash after wash.',
  },
  {
    id: 'p10', name: 'Ombra Classic Denim Jacket', cat: 'fashion', sub: 'outerwear', brand: 'Ombra', art: 'shirt',
    price: 4999, orig: 6999, rating: 4.7, reviews: 986, sold: 3120, flash: false, age: 47,
    colors: col('blue', 'navy'), sizes: APPAREL_SIZES, kw: 'denim jacket jeans coat trucker outerwear',
    desc: 'A rigid 13 oz denim jacket that breaks in fast: classic trucker cut, copper hardware and a fit that layers over hoodies without pulling.',
  },
  {
    id: 'p11', name: 'Pikol Everyday Crossbody Bag', cat: 'fashion', sub: 'bags', brand: 'Pikol', art: 'bag',
    price: 3999, orig: 5599, rating: 4.5, reviews: 1240, sold: 4021, flash: false, age: 33,
    colors: col('black', 'beige', 'brown'), kw: 'crossbody bag purse shoulder small everyday',
    desc: 'A compact crossbody with a padded phone slot, inner zip pocket and an adjustable webbing strap that switches from shoulder to crossbody in seconds.',
  },
  {
    id: 'p12', name: 'Ombra Retro Sunglasses', cat: 'fashion', sub: 'eyewear', brand: 'Ombra', art: 'glasses',
    price: 1799, orig: 2599, rating: 4.4, reviews: 733, sold: 2890, flash: false, age: 74,
    colors: col('brown', 'black'), kw: 'sunglasses retro uv shades polarised vintage',
    desc: 'Keyhole-bridge acetate frames with UV400 polarised lenses and a hand-polished finish. Comes with a hard case and cleaning cloth.',
  },
  {
    id: 'p13', name: 'Pikol Canvas Tote Bag', cat: 'fashion', sub: 'bags', brand: 'Pikol', art: 'bag',
    price: 999, orig: 1499, rating: 4.5, reviews: 1655, sold: 6201, flash: false, age: 41,
    colors: col('beige', 'navy', 'green'), kw: 'tote bag canvas shopping market everyday',
    desc: 'A 12 oz duck-canvas tote with a reinforced base and an inner zip for keys and cards. Carries groceries on Monday and a laptop on Tuesday.',
  },
  {
    id: 'p36', name: 'Vantia Linen Summer Dress', cat: 'fashion', sub: 'dresses', brand: 'Vantia', art: 'shirt',
    price: 4599, orig: 6299, rating: 4.7, reviews: 830, sold: 2640, flash: true, pct: 61, age: 16,
    colors: col('beige', 'pink', 'navy'), sizes: APPAREL_SIZES, kw: 'dress linen summer sundress midi',
    desc: 'A breathable washed-linen midi with adjustable shoulder ties and side pockets. Cut for airflow, made to wrinkle gracefully.',
  },
  {
    id: 'p37', name: 'Pikol Knit Cardigan', cat: 'fashion', sub: 'outerwear', brand: 'Pikol', art: 'shirt',
    price: 3899, orig: 5499, rating: 4.5, reviews: 410, sold: 1320, flash: false, age: 23,
    colors: col('beige', 'navy', 'brown'), sizes: APPAREL_SIZES, kw: 'cardigan knit sweater wool button',
    desc: 'A mid-weight lambswool-blend cardigan with corozo buttons and ribbed cuffs. Warm enough for autumn, light enough for the office.',
  },
  {
    id: 'p48', name: 'Strida Fleece Hoodie, Pullover', cat: 'fashion', sub: 'tops', brand: 'Strida', art: 'shirt',
    price: 3499, orig: 4999, rating: 4.6, reviews: 1520, sold: 5240, flash: false, age: 18,
    colors: col('navy', 'green', 'black'), sizes: APPAREL_SIZES, kw: 'hoodie fleece pullover sweatshirt warm casual kangaroo pocket',
    desc: 'A brushed-back fleece hoodie with a double-lined hood, kangaroo pocket and ribbed cuffs that hold their shape. Boxy, true-to-size cut.',
  },
  {
    id: 'p49', name: 'Ombra Wrap Midi Dress, Belted', cat: 'fashion', sub: 'dresses', brand: 'Ombra', art: 'shirt',
    price: 4299, orig: 5899, rating: 4.7, reviews: 690, sold: 2180, flash: false, age: 25,
    colors: col('navy', 'red', 'beige'), sizes: APPAREL_SIZES, kw: 'wrap dress midi belted office elegant v-neck',
    desc: 'A faux-wrap midi in fluid crepe with a tie belt, V-neckline and a hem that moves well. Fully lined through the bodice and no zipper to fight with.',
  },
  {
    id: 'p50', name: 'Mendo Leather Backpack, 15 inch', cat: 'fashion', sub: 'bags', brand: 'Mendo', art: 'bag',
    price: 6999, orig: 8999, rating: 4.6, reviews: 540, sold: 1240, flash: false, age: 30,
    colors: col('brown', 'black'), kw: 'backpack leather laptop 15 inch school travel rucksack padded',
    desc: 'A full-grain leather backpack with a padded 15-inch laptop sleeve, a hidden back pocket for valuables and waxed straps that soften with wear.',
  },

  // Beauty
  {
    id: 'p14', name: 'Klarita Vitamin C Glow Serum', cat: 'beauty', sub: 'skincare', brand: 'Klarita', art: 'droplet',
    price: 2199, orig: 3299, rating: 4.8, reviews: 3120, sold: 12040, flash: true, pct: 88, age: 19,
    kw: 'serum vitamin c skincare glow face brightening skincare set',
    desc: 'A 15% vitamin C serum with ferulic acid and hyaluronic acid. Lightweight, non-sticky, and stable in an airless pump so the last drop is as potent as the first.',
  },
  {
    id: 'p15', name: 'Luma 12-Shade Eyeshadow Palette', cat: 'beauty', sub: 'makeup', brand: 'Luma', art: 'sparkles',
    price: 1899, orig: 2699, rating: 4.6, reviews: 1502, sold: 5230, flash: false, age: 49,
    kw: 'eyeshadow palette makeup shadow matte shimmer neutral',
    desc: 'Twelve everyday shades, nine matte and three shimmer, pressed soft so they blend without patchiness. Talc-free and fragrance-free.',
  },
  {
    id: 'p16', name: 'Ombra Rosewater Face Mist', cat: 'beauty', sub: 'skincare', brand: 'Ombra', art: 'droplet',
    price: 1299, orig: 1799, rating: 4.7, reviews: 2210, sold: 8140, flash: false, age: 62,
    kw: 'face mist rosewater toner spray hydrating refresh',
    desc: 'Steam-distilled rosewater with a fine, even spritz that sets makeup or refreshes skin mid-day. No alcohol, no fragrance added.',
  },
  {
    id: 'p17', name: 'Strida Clay Mask Kit', cat: 'beauty', sub: 'skincare', brand: 'Strida', art: 'sparkles',
    price: 1699, orig: 2399, rating: 4.5, reviews: 890, sold: 3120, flash: false, age: 71,
    kw: 'clay mask skincare detox kit skincare set pores',
    desc: 'Three single-use kaolin clay masks with a bamboo brush and headband. Ten minutes to clearer-looking skin, no scrubbing required.',
  },
  {
    id: 'p38', name: 'Luma Matte Lipstick Set', cat: 'beauty', sub: 'makeup', brand: 'Luma', art: 'sparkles',
    price: 1699, orig: 2399, rating: 4.6, reviews: 1210, sold: 4820, flash: false, age: 9,
    kw: 'lipstick matte set makeup lip long lasting',
    desc: 'Five weightless matte lipsticks in nudes through berries, with a velvet finish that wears for hours without drying.',
  },
  {
    id: 'p51', name: 'Klarita Hyaluronic Day Cream, 50ml', cat: 'beauty', sub: 'skincare', brand: 'Klarita', art: 'cream',
    price: 2599, orig: 3399, rating: 4.8, reviews: 1980, sold: 7420, flash: true, pct: 82, age: 7,
    kw: 'moisturizer day cream hyaluronic hydrating skincare face gel',
    desc: 'A gel-cream with three weights of hyaluronic acid plus ceramides. Sinks in fast under makeup, fragrance-free and safe for sensitive skin.',
  },
  {
    id: 'p52', name: 'Luma Liquid Blush Wand, Rosy', cat: 'beauty', sub: 'makeup', brand: 'Luma', art: 'droplet',
    price: 1399, orig: 1899, rating: 4.5, reviews: 860, sold: 3210, flash: false, age: 6,
    kw: 'blush liquid wand makeup rosy cheek tint blendable',
    desc: 'A cushion-applicator liquid blush that blends with fingers before it sets. Sheer at the first tap, buildable to a soft flush in rosy pink.',
  },
  {
    id: 'p53', name: 'Strida Vitamin E Night Cream', cat: 'beauty', sub: 'skincare', brand: 'Strida', art: 'jar',
    price: 2199, orig: 2899, rating: 4.6, reviews: 1120, sold: 4050, flash: false, age: 35,
    kw: 'night cream vitamin e skincare repair moisturizing overnight',
    desc: 'A richer overnight cream with vitamin E, squalane and shea butter that seals your serum in. Wake up to skin that feels cushioned, not greasy.',
  },

  // Home
  {
    id: 'p18', name: 'Vantia Cloud Armchair', cat: 'home', sub: 'furniture', brand: 'Vantia', art: 'armchair',
    price: 19999, orig: 25999, rating: 4.6, reviews: 421, sold: 980, flash: true, pct: 42, age: 95,
    colors: col('beige', 'green', 'navy'), kw: 'armchair chair lounge furniture reading accent',
    desc: 'A deep-seated lounge chair with a feather-wrapped foam cushion and solid-oak legs. Upholstered in a soft weave that stands up to daily use.',
  },
  {
    id: 'p19', name: 'Mendo Ceramic Table Lamp', cat: 'home', sub: 'lighting', brand: 'Mendo', art: 'lamp',
    price: 3999, orig: 4999, rating: 4.7, reviews: 812, sold: 2210, flash: false, age: 60,
    colors: col('white', 'beige'), kw: 'lamp table ceramic bedside light desk lamp',
    desc: 'A hand-glazed ceramic base with a linen shade that throws a warm, even light. Inline dimmer switch on the cord.',
  },
  {
    id: 'p20', name: 'Klarita Cotton Bed Sheet Set', cat: 'home', sub: 'bedding', brand: 'Klarita', art: 'bed',
    price: 2999, orig: 4299, rating: 4.5, reviews: 1533, sold: 5312, flash: false, age: 52,
    colors: col('white', 'silver', 'blue'), sizes: ['Double', 'Queen', 'King'], kw: 'bed sheets cotton bedding set pillowcases',
    desc: 'A 300-thread-count percale set: flat sheet, fitted sheet with deep corners and two pillowcases. Gets softer with every wash.',
  },
  {
    id: 'p21', name: 'Vantia Weighted Blanket 5kg', cat: 'home', sub: 'bedding', brand: 'Vantia', art: 'bed',
    price: 5499, orig: 7499, rating: 4.7, reviews: 1108, sold: 3450, flash: false, age: 70,
    colors: col('silver', 'navy'), kw: 'weighted blanket sleep 5kg anxiety gravity',
    desc: 'A 5 kg glass-bead blanket quilted into small pockets so the weight stays put. Removable machine-washable cover in a cooling jersey.',
  },
  {
    id: 'p39', name: 'Mendo Scented Candle Trio', cat: 'home', sub: 'decor', brand: 'Mendo', art: 'jar',
    price: 2199, orig: 2999, rating: 4.8, reviews: 980, sold: 3410, flash: false, age: 31,
    colors: col('white', 'beige'), kw: 'candles scented trio soy home decor gift',
    desc: 'Three soy-wax candles, 25 hours each: cedar and smoke, fig and cassis, and plain unscented. Cotton wicks, reusable glass vessels.',
  },
  {
    id: 'p54', name: 'Luma LED Desk Lamp, Dimmable', cat: 'home', sub: 'lighting', brand: 'Luma', art: 'lamp',
    price: 3299, orig: 4299, rating: 4.7, reviews: 1310, sold: 4620, flash: true, pct: 64, age: 13,
    colors: col('white', 'black'), kw: 'desk lamp led dimmable reading touch office light usb',
    desc: 'A slim LED desk lamp with five brightness levels and three color temperatures, a touch dimmer and a USB port on the base for charging your phone.',
  },
  {
    id: 'p55', name: 'Klarita Oak Side Table, Round', cat: 'home', sub: 'furniture', brand: 'Klarita', art: 'table',
    price: 8999, orig: 11999, rating: 4.5, reviews: 360, sold: 810, flash: false, age: 42,
    colors: col('brown'), kw: 'side table oak round end wood furniture living room',
    desc: 'A round solid-oak side table with a tapered three-leg base and a food-safe hardwax oil finish. 45 cm tall, sized to sit beside any sofa arm.',
  },
  {
    id: 'p56', name: 'Mendo Wool Throw Blanket, Checkered', cat: 'home', sub: 'bedding', brand: 'Mendo', art: 'bed',
    price: 4599, orig: 5999, rating: 4.8, reviews: 940, sold: 2870, flash: false, age: 16,
    colors: col('beige', 'navy', 'green'), kw: 'throw blanket wool checkered sofa cozy couch decor',
    desc: 'A woven merino-blend throw in a classic check, 130 × 180 cm with fringe ends. Warm without weight and soft from the first unpack.',
  },

  // Sports
  {
    id: 'p22', name: 'Strida Adjustable Dumbbell Set', cat: 'sports', sub: 'fitness', brand: 'Strida', art: 'dumbbell',
    price: 7999, orig: 9999, rating: 4.7, reviews: 940, sold: 2100, flash: true, pct: 59, age: 44,
    colors: col('black'), kw: 'dumbbell weights gym fitness set adjustable home',
    desc: 'Two adjustable dumbbells, 2.5-24 kg each, with a twist-lock collar and a compact cradle that replaces a whole rack.',
  },
  {
    id: 'p23', name: 'Mendo Match Soccer Ball', cat: 'sports', sub: 'team-sports', brand: 'Mendo', art: 'ball',
    price: 1899, orig: 2499, rating: 4.5, reviews: 640, sold: 2450, flash: false, age: 81,
    colors: col('white', 'red', 'blue'), sizes: ['4', '5'], kw: 'soccer ball football match fifa training',
    desc: 'A machine-stitched match ball with a butyl bladder that holds air for weeks. Available in size 4 and 5.',
  },
  {
    id: 'p24', name: 'Aurex Sport Water Bottle 1L', cat: 'sports', sub: 'outdoor', brand: 'Aurex', art: 'bottle',
    price: 1099, orig: 1599, rating: 4.6, reviews: 1870, sold: 6710, flash: false, age: 26,
    colors: col('blue', 'black', 'green'), kw: 'water bottle sport 1l flask gym insulated',
    desc: 'Double-walled stainless steel keeps drinks cold for 24 hours. One-hand flip lid, leak-proof in any bag, 1 L capacity.',
  },
  {
    id: 'p25', name: 'Pikol Trail Sport Sunglasses', cat: 'sports', sub: 'outdoor', brand: 'Pikol', art: 'glasses',
    price: 2399, orig: 3299, rating: 4.4, reviews: 430, sold: 1520, flash: false, age: 92,
    colors: col('black', 'red'), kw: 'sunglasses sport trail running cycling uv wrap',
    desc: 'A grippy wrap-around frame that stays put at pace, with shatterproof UV400 lenses and vented sides to stop fogging.',
  },
  {
    id: 'p40', name: 'Pikol Resistance Band Set', cat: 'sports', sub: 'fitness', brand: 'Pikol', art: 'dumbbell',
    price: 1899, orig: 2699, rating: 4.4, reviews: 520, sold: 1730, flash: false, age: 27,
    colors: col('teal'), kw: 'resistance bands workout home gym stretching',
    desc: 'Five latex loop bands from 5 to 25 kg of pull, with cotton-carabiner handles, ankle straps and a door anchor in a mesh travel bag.',
  },
  {
    id: 'p42', name: 'Strida Trail Runner Shoes', cat: 'sports', sub: 'outdoor', brand: 'Strida', art: 'shoe',
    price: 5499, orig: 7999, rating: 4.6, reviews: 1610, sold: 5210, flash: true, pct: 51, age: 7,
    colors: col('black', 'red'), sizes: SHOE_SIZES, kw: 'running shoes sneakers trail sport trainers',
    desc: 'A cushioned trail runner with a rock plate, 4 mm lugs for loose gravel, and a mesh upper that drains after stream crossings.',
  },
  {
    id: 'p57', name: 'Strida Yoga Mat, 6mm Non-Slip', cat: 'sports', sub: 'fitness', brand: 'Strida', art: 'mat',
    price: 2799, orig: 3799, rating: 4.6, reviews: 1740, sold: 6180, flash: true, pct: 74, age: 22,
    colors: col('teal', 'violet'), kw: 'yoga mat non slip 6mm exercise pilates fitness carrying strap',
    desc: 'A 6 mm TPE mat with a textured grip that holds wet hands, alignment lines for pose checks and a carry strap. Closed-cell, so it wipes clean.',
  },
  {
    id: 'p58', name: 'Mendo Camping Tent, 2 Person', cat: 'sports', sub: 'outdoor', brand: 'Mendo', art: 'tent',
    price: 8999, orig: 11499, rating: 4.5, reviews: 420, sold: 960, flash: false, age: 58,
    colors: col('green'), kw: 'tent camping 2 person waterproof hiking dome backpacking',
    desc: 'A freestanding two-person dome with a 3000 mm waterproof fly, two doors and a 12-minute pitch. Packs down to 4.2 kg for backpacking trips.',
  },

  // Groceries
  {
    id: 'p26', name: 'Mendo Arabica Coffee Beans 1kg', cat: 'groceries', sub: 'pantry', brand: 'Mendo', art: 'coffee',
    price: 1499, orig: 1899, rating: 4.8, reviews: 4210, sold: 15330, flash: true, pct: 93, age: 18,
    sizes: ['250g', '500g', '1kg'], kw: 'coffee beans arabica espresso 1kg roast whole bean',
    desc: 'Single-origin Colombian arabica, medium roasted in small batches for chocolate-and-caramel notes. Rested 5 days before shipping, whole bean.',
  },
  {
    id: 'p27', name: 'Pikol Organic Apples, 6 Pack', cat: 'groceries', sub: 'fresh', brand: 'Pikol', art: 'apple',
    price: 599, orig: 0, rating: 4.6, reviews: 980, sold: 4210, flash: false, age: 5,
    kw: 'apples organic fruit fresh pack crisp',
    desc: 'Six crisp orchard apples, certified organic, picked at peak ripeness and packed in a protective molded tray.',
  },
  {
    id: 'p28', name: 'Klarita Extra Virgin Olive Oil 750ml', cat: 'groceries', sub: 'pantry', brand: 'Klarita', art: 'bottle',
    price: 1299, orig: 1699, rating: 4.7, reviews: 1310, sold: 5820, flash: false, age: 63,
    sizes: ['500ml', '750ml'], kw: 'olive oil extra virgin cooking dressing cold pressed',
    desc: 'Cold-pressed within 6 hours of harvest from a single Greek grove. Peppery finish, under 0.3% acidity, in a UV-blocking dark bottle.',
  },
  {
    id: 'p29', name: 'Ombra Wildflower Honey 500g', cat: 'groceries', sub: 'pantry', brand: 'Ombra', art: 'jar',
    price: 899, orig: 1199, rating: 4.7, reviews: 1670, sold: 6105, flash: false, age: 77,
    sizes: ['250g', '500g'], kw: 'honey wildflower natural raw 500g sweet',
    desc: 'Raw, unfiltered wildflower honey from mountain apiaries. Naturally crystallises in cool weather, which is exactly how real honey behaves.',
  },
  {
    id: 'p41', name: 'Klarita Green Tea, 100 Bags', cat: 'groceries', sub: 'beverages', brand: 'Klarita', art: 'coffee',
    price: 1099, orig: 1499, rating: 4.7, reviews: 1440, sold: 6120, flash: false, age: 13,
    sizes: ['50 bags', '100 bags'], kw: 'green tea bags organic sencha matcha brew',
    desc: 'First-flush sencha in oxygen-barrier sachets, 100 to a box. Clean, grassy cup with zero bitterness at a 2-minute steep.',
  },
  {
    id: 'p59', name: 'Aurex Sparkling Water, 12 Pack', cat: 'groceries', sub: 'beverages', brand: 'Aurex', art: 'bottle',
    price: 999, orig: 1299, rating: 4.4, reviews: 2260, sold: 8930, flash: true, pct: 88, age: 4,
    sizes: ['6 pack', '12 pack'], kw: 'sparkling water cans 12 pack fizzy zero sugar drinks',
    desc: 'Twelve 330 ml cans of lightly carbonated mineral water with nothing added: no sweeteners, no sodium, no calories. Chill-ready slim cans.',
  },
  {
    id: 'p60', name: 'Strida Strawberry Preserve, 340g', cat: 'groceries', sub: 'pantry', brand: 'Strida', art: 'jar',
    price: 799, orig: 1099, rating: 4.7, reviews: 1010, sold: 3840, flash: false, age: 45, oos: true,
    sizes: ['340g'], kw: 'strawberry jam preserve spread breakfast toast 340g fruit',
    desc: 'Small-batch preserve with whole strawberries and cane sugar, cooked in copper pans. 55 g of fruit per 100 g, on the jammy side of spreadable.',
  },
  {
    id: 'p61', name: 'Pikol Bananas, 1kg', cat: 'groceries', sub: 'fresh', brand: 'Pikol', art: 'banana',
    price: 349, orig: 0, rating: 4.5, reviews: 1420, sold: 5710, flash: false, age: 2,
    kw: 'bananas fresh fruit 1kg bunch sweet',
    desc: 'A full kilo of sweet Cavendish bananas, picked yellow-green so they ripen on your counter through the week. Packed to arrive unbruised.',
  },

  // Accessories
  {
    id: 'p30', name: 'Strida Minimal Steel Watch', cat: 'accessories', sub: 'watches', brand: 'Strida', art: 'watch',
    price: 5999, orig: 8999, rating: 4.6, reviews: 1105, sold: 3340, flash: true, pct: 48, age: 38,
    colors: col('silver', 'black'), kw: 'watch steel minimal analog quartz bracelet',
    desc: 'A 38 mm brushed-steel case on a mesh bracelet, with a sapphire-coated crystal and a slim Swiss quartz movement. Quick-release strap pins.',
  },
  {
    id: 'p31', name: 'Ombra Leather Card Wallet', cat: 'accessories', sub: 'small-goods', brand: 'Ombra', art: 'wallet',
    price: 2499, orig: 3499, rating: 4.6, reviews: 780, sold: 2560, flash: false, age: 58,
    colors: col('brown', 'black', 'navy'), kw: 'wallet leather card holder slim bifold rf ID',
    desc: 'Full-grain vegetable-tanned leather, six card slots and a hidden cash fold. RFID-blocking layer between the walls. Ages into a patina.',
  },
  {
    id: 'p32', name: 'Pikol Gemstone Stud Earrings', cat: 'accessories', sub: 'jewelry', brand: 'Pikol', art: 'gem',
    price: 2999, orig: 4299, rating: 4.5, reviews: 620, sold: 1830, flash: false, age: 85,
    colors: col('silver'), kw: 'earrings studs gemstone silver jewelry gift hypoallergenic',
    desc: '4 mm lab-grown gemstones in rhodium-plated sterling silver settings with hypoallergenic posts. Comes gift-boxed.',
  },
  {
    id: 'p33', name: 'Vantia Travel Organizer Pouch', cat: 'accessories', sub: 'travel', brand: 'Vantia', art: 'bag',
    price: 1599, orig: 2199, rating: 4.4, reviews: 540, sold: 1980, flash: false, age: 68,
    colors: col('navy', 'teal', 'black'), kw: 'travel pouch organizer packing cubes cables passport',
    desc: 'A zippered organizer with elastic loops for cables, a slip pocket for passports and a padded phone sleeve. Water-repellent shell.',
  },
  {
    id: 'p62', name: 'Novo Leather Belt, Reversible', cat: 'accessories', sub: 'small-goods', brand: 'Novo', art: 'belt',
    price: 2999, orig: 3999, rating: 4.6, reviews: 930, sold: 3420, flash: false, age: 28,
    colors: col('brown', 'black'), sizes: ['S', 'M', 'L', 'XL'], kw: 'belt leather reversible buckle formal casual rotating',
    desc: 'One belt, two colors: a rotating buckle flips between smooth brown and black full-grain leather. Cut to length at the strap, not the buckle.',
  },
  {
    id: 'p63', name: 'Klarita Pearl Pendant Necklace', cat: 'accessories', sub: 'jewelry', brand: 'Klarita', art: 'gem',
    price: 4499, orig: 5999, rating: 4.7, reviews: 610, sold: 1930, flash: false, age: 24,
    colors: col('silver'), kw: 'necklace pearl pendant jewelry gift elegant freshwater',
    desc: 'A single 8 mm freshwater pearl on a fine 45 cm sterling chain with a lobster clasp. Arrives in a gift box, ready to give.',
  },
  {
    id: 'p64', name: 'Vantia Weekender Duffel, 40L', cat: 'accessories', sub: 'travel', brand: 'Vantia', art: 'bag',
    price: 5999, orig: 7999, rating: 4.5, reviews: 480, sold: 1470, flash: false, age: 36,
    colors: col('navy', 'brown'), kw: 'duffel bag weekender 40l travel gym overnight carry',
    desc: 'A 40 L weekend duffel in coated canvas with a trolley sleeve, a shoe compartment and a detachable shoulder strap. Carry-on sized for most airlines.',
  },
  {
    id: 'p65', name: 'Pikol Signet Ring, Sterling Silver', cat: 'accessories', sub: 'jewelry', brand: 'Pikol', art: 'gem',
    price: 3499, orig: 4799, rating: 4.4, reviews: 340, sold: 890, flash: false, age: 61,
    colors: col('silver'), sizes: ['52', '56', '60'], kw: 'ring signet sterling silver jewelry engraved classic',
    desc: 'A 10 mm oval signet in rhodium-plated sterling silver with a flat face ready for engraving. Comfort-fit inner curve, sizes 52 to 60.',
  },
  {
    id: 'p43', name: 'Novo Clear Case for X4 Pro', cat: 'electronics', sub: 'phones', brand: 'Novo', art: 'smartphone',
    price: 899, orig: 1299, rating: 4.4, reviews: 2210, sold: 7330, flash: false, age: 11,
    colors: col('white'), kw: 'phone case cover clear x4 pro shockproof slim',
    desc: 'A 1.2 mm shock-absorbing case with raised bezels for the camera and screen. Stays optically clear with an anti-yellowing coating.',
  },

  // Electronics (expanded)
  {
    id: 'p66', name: 'Aurex On-Ear Bluetooth Headphones, 30h', cat: 'electronics', sub: 'audio', brand: 'Aurex', art: 'headphones',
    price: 3499, orig: 4499, rating: 4.5, reviews: 640, sold: 2810, flash: false, age: 9,
    colors: col('black', 'silver'), kw: 'headphones on ear bluetooth wireless 30 hour music',
    desc: 'Lightweight on-ear headphones with a folding frame, warm balanced sound and a 30-hour battery. USB-C charging and a built-in mic for calls.',
  },
  {
    id: 'p67', name: 'Pikol Bone Conduction Headphones, IP68', cat: 'electronics', sub: 'audio', brand: 'Pikol', art: 'headphones',
    price: 4999, orig: 0, rating: 4.4, reviews: 410, sold: 1320, flash: false, age: 27, oos: true,
    colors: col('black', 'teal'), kw: 'bone conduction headphones open ear swimming ip68 running',
    desc: 'Open-ear headphones that leave your ears free to hear traffic, IP68 sealed for pool swims, with eight hours of playback and 32 GB of onboard music.',
  },
  {
    id: 'p68', name: 'Novo Power Bank 20000mAh, Fast Charge', cat: 'electronics', sub: 'phones', brand: 'Novo', art: 'powerbank',
    price: 2999, orig: 3999, rating: 4.7, reviews: 1980, sold: 8640, flash: true, pct: 70, age: 6,
    colors: col('black', 'silver'), kw: 'power bank charger 20000mah battery portable usb c fast',
    desc: 'A 20,000 mAh battery that tops a phone up four times, with 22.5 W USB-C output and a small display showing the exact percentage left.',
  },
  {
    id: 'p69', name: 'Ombra Aluminium Laptop Stand, Adjustable', cat: 'electronics', sub: 'computing', brand: 'Ombra', art: 'laptop stand',
    price: 2799, orig: 3699, rating: 4.6, reviews: 720, sold: 2430, flash: false, age: 16,
    colors: col('silver', 'black'), kw: 'laptop stand aluminium adjustable riser ergonomic desk',
    desc: 'A single-piece aluminium riser with six height stops and a hinged base that folds flat for travel. Lifts a laptop to eye level and keeps airflow underneath.',
  },
  {
    id: 'p70', name: 'Luma 1080p Webcam with Ring Light', cat: 'electronics', sub: 'computing', brand: 'Luma', art: 'webcam',
    price: 4499, orig: 0, rating: 4.5, reviews: 530, sold: 1740, flash: false, age: 34,
    colors: col('black'), kw: 'webcam 1080p ring light streaming video calls usb',
    desc: 'A full HD webcam with a three-tone ring light, a noise-reducing dual mic and a privacy shutter. Clips to any laptop lid or stands on a monitor.',
  },
  {
    id: 'p71', name: 'Mendo Noise-Cancelling Wireless Headphones', cat: 'electronics', sub: 'audio', brand: 'Mendo', art: 'headphones',
    price: 8999, orig: 11999, rating: 4.8, reviews: 1120, sold: 3980, flash: false, age: 12,
    colors: col('black', 'navy'), kw: 'headphones noise cancelling wireless over ear premium travel',
    desc: 'Flagship over-ear headphones with adaptive noise cancelling, 45 mm drivers and a 40-hour battery. Comes with a hard travel case and a 3.5 mm cable.',
  },
  {
    id: 'p72', name: 'Vantia 27 inch 4K Monitor, IPS', cat: 'electronics', sub: 'computing', brand: 'Vantia', art: 'monitor',
    price: 27999, orig: 32999, rating: 4.6, reviews: 430, sold: 920, flash: true, pct: 52, age: 20,
    colors: col('black'), kw: 'monitor 27 inch 4k ips display usb c computer screen',
    desc: 'A 27-inch 4K IPS panel with 99% sRGB coverage, a single-cable USB-C input that also charges a laptop, and a fully adjustable stand.',
  },
  {
    id: 'p73', name: 'Klarita Compact Mirrorless Camera, Body Only', cat: 'electronics', sub: 'cameras', brand: 'Klarita', art: 'camera',
    price: 49999, orig: 57999, rating: 4.8, reviews: 360, sold: 610, flash: false, age: 44,
    colors: col('black', 'silver'), kw: 'mirrorless camera compact photography aps-c body travel',
    desc: 'A pocketable APS-C mirrorless body with in-body stabilisation, a tilting touchscreen and 4K video. Ships as a body only for use with your own lenses.',
  },
  {
    id: 'p74', name: 'Luma 65W GaN Fast Charger, 3 Port', cat: 'electronics', sub: 'phones', brand: 'Luma', art: 'charger',
    price: 2299, orig: 2999, rating: 4.7, reviews: 1410, sold: 5320, flash: false, age: 8,
    colors: col('white', 'black'), kw: 'charger gan 65w usb c fast wall laptop phone three port',
    desc: 'A palm-sized 65 W charger with two USB-C ports and one USB-A, gallium nitride internals that stay cool, and folding prongs for a bag.',
  },
  {
    id: 'p75', name: 'Aurex Studio Microphone, USB-C', cat: 'electronics', sub: 'audio', brand: 'Aurex', art: 'microphone',
    price: 5999, orig: 7499, rating: 4.6, reviews: 480, sold: 1560, flash: false, age: 25,
    colors: col('black'), kw: 'microphone usb condenser studio podcast recording streaming',
    desc: 'A side-address condenser mic with a cardioid capsule, zero-latency headphone monitoring and a desktop stand. Plugs straight into USB-C with no interface.',
  },
  {
    id: 'p76', name: 'Novo Smart Watch Pro, AMOLED', cat: 'electronics', sub: 'wearables', brand: 'Novo', art: 'smartwatch',
    price: 9999, orig: 12999, rating: 4.7, reviews: 890, sold: 3140, flash: true, pct: 60, age: 10,
    colors: col('black', 'silver', 'violet'), kw: 'smartwatch pro amoled gps heart rate sleep calls wearable',
    desc: 'A stainless-bodied smartwatch with a 1.5-inch AMOLED display, dual-band GPS, call answering over Bluetooth and a two-week battery in saver mode.',
  },
  {
    id: 'p77', name: 'Pikol Bluetooth Karaoke Speaker, RGB', cat: 'electronics', sub: 'audio', brand: 'Pikol', art: 'speaker',
    price: 3999, orig: 5199, rating: 4.4, reviews: 610, sold: 2180, flash: false, age: 30,
    colors: col('black', 'red'), kw: 'speaker bluetooth karaoke rgb party microphone portable',
    desc: 'A 40 W party speaker with two wireless mics, reactive RGB rings and a strap for carrying. Pairs a second unit for true stereo.',
  },
  {
    id: 'p78', name: 'Mendo Smart Video Doorbell, 2K', cat: 'electronics', sub: 'smarthome', brand: 'Mendo', art: 'doorbell',
    price: 11999, orig: 0, rating: 4.5, reviews: 350, sold: 1080, flash: false, age: 38, oos: true,
    colors: col('silver', 'black'), kw: 'video doorbell smart home 2k camera wireless security',
    desc: 'A 2K video doorbell with a wide head-to-toe view, package detection and two-way talk. Wired or battery powered, with local storage on a microSD card.',
  },
  {
    id: 'p79', name: 'Luma Smart LED Bulb 4-Pack, Colour', cat: 'electronics', sub: 'smarthome', brand: 'Luma', art: 'bulb',
    price: 3499, orig: 4599, rating: 4.6, reviews: 1620, sold: 5240, flash: false, age: 5,
    colors: col('white'), kw: 'smart bulb led colour wifi light four pack alexa',
    desc: 'Four Wi-Fi colour bulbs with 16 million shades, tunable whites and scene scheduling. No hub needed, and they remember their last state after a power cut.',
  },
  {
    id: 'p80', name: 'Aurex Tablet Stand, Foldable Aluminium', cat: 'electronics', sub: 'computing', brand: 'Aurex', art: 'tablet stand',
    price: 1999, orig: 2699, rating: 4.5, reviews: 540, sold: 1990, flash: false, age: 22,
    colors: col('silver'), kw: 'tablet stand foldable aluminium ipad holder desk adjustable',
    desc: 'A folding aluminium stand that holds a tablet at two viewing angles for reading or drawing, with silicone pads that grip without scratching.',
  },
  {
    id: 'p81', name: 'Klarita Ring Light Kit, 18 inch', cat: 'electronics', sub: 'cameras', brand: 'Klarita', art: 'ring light',
    price: 6499, orig: 8499, rating: 4.5, reviews: 290, sold: 870, flash: false, age: 47,
    colors: col('black'), kw: 'ring light 18 inch kit streaming makeup stand phone holder',
    desc: 'An 18-inch ring light with a phone holder, a light stand and a colour-temperature dial from warm to daylight. Perfect for video calls and filming.',
  },
  {
    id: 'p82', name: 'Novo Wireless Mouse, Silent Click', cat: 'electronics', sub: 'computing', brand: 'Novo', art: 'mouse',
    price: 1599, orig: 2199, rating: 4.6, reviews: 2040, sold: 7460, flash: true, pct: 72, age: 4,
    colors: col('black', 'white'), kw: 'mouse wireless silent click bluetooth office ergonomic',
    desc: 'A quiet-travel mouse with a near-silent click, dual Bluetooth and 2.4 GHz modes, and a year of battery on a single AA.',
  },
  {
    id: 'p83', name: 'Vantia Soundbar, 120W with Subwoofer', cat: 'electronics', sub: 'tv', brand: 'Vantia', art: 'soundbar',
    price: 14999, orig: 18999, rating: 4.6, reviews: 470, sold: 1290, flash: false, age: 33,
    colors: col('black'), kw: 'soundbar subwoofer 120w tv surround bluetooth hdmi',
    desc: 'A 120 W soundbar with a wireless subwoofer, three equaliser presets and HDMI ARC for one-cable hookup. Dialogue mode lifts quiet speech.',
  },
  {
    id: 'p84', name: 'Luma Gaming Headset, 7.1 Surround', cat: 'electronics', sub: 'audio', brand: 'Luma', art: 'headset',
    price: 4999, orig: 6499, rating: 4.5, reviews: 980, sold: 3210, flash: false, age: 14,
    colors: col('black', 'red'), kw: 'gaming headset surround 7.1 microphone pc console wired',
    desc: 'A wired gaming headset with virtual 7.1 surround, memory-foam cups and a detachable noise-cancelling mic on a flexible boom.',
  },
  {
    id: 'p85', name: 'Ombra Security Camera, Indoor 2K', cat: 'electronics', sub: 'smarthome', brand: 'Ombra', art: 'security camera',
    price: 5499, orig: 7299, rating: 4.5, reviews: 760, sold: 2480, flash: false, age: 18,
    colors: col('white'), kw: 'security camera indoor 2k smart home wifi motion night vision',
    desc: 'An indoor 2K camera with pan and tilt, colour night vision, motion alerts and a two-way speaker. Stores clips locally on a microSD card.',
  },

  // Fashion (expanded)
  {
    id: 'p86', name: 'Vantia Merino Crewneck Sweater, Men\u2019s', cat: 'fashion', sub: 'tops', brand: 'Vantia', art: 'sweater',
    price: 5499, orig: 6999, rating: 4.7, reviews: 720, sold: 2140, flash: false, age: 24,
    colors: col('navy', 'beige', 'black'), sizes: APPAREL_SIZES, kw: 'sweater merino wool crewneck knit men warm',
    desc: 'A fine-gauge extra-fine merino crewneck that breathes in an overheated office and layers under a jacket without bulk. Machine washable on cold.',
  },
  {
    id: 'p87', name: 'Ombra Slim Chino Trousers, Stretch', cat: 'fashion', sub: 'bottoms', brand: 'Ombra', art: 'trousers',
    price: 3999, orig: 0, rating: 4.5, reviews: 640, sold: 1980, flash: false, age: 41,
    colors: col('navy', 'beige', 'black'), sizes: APPAREL_SIZES, kw: 'chino trousers slim stretch cotton pants men',
    desc: 'Slim chinos in a cotton twill with 2% elastane, a clean five-pocket cut and a mid rise. Dressy enough for the office, easy enough for the weekend.',
  },
  {
    id: 'p88', name: 'Pikol High-Waist Leggings, Compression', cat: 'fashion', sub: 'bottoms', brand: 'Pikol', art: 'leggings',
    price: 2499, orig: 3299, rating: 4.7, reviews: 2210, sold: 9120, flash: true, pct: 78, age: 3,
    colors: col('black', 'navy', 'violet'), sizes: APPAREL_SIZES, kw: 'leggings high waist compression yoga squat proof women',
    desc: 'Squat-proof high-waist leggings in a four-way-stretch knit with a wide waistband that stays put and two hidden pockets at the hips.',
  },
  {
    id: 'p89', name: 'Strida Fleece Joggers, Tapered', cat: 'fashion', sub: 'bottoms', brand: 'Strida', art: 'joggers',
    price: 2999, orig: 3999, rating: 4.6, reviews: 1120, sold: 4030, flash: false, age: 15,
    colors: col('black', 'navy', 'green'), sizes: APPAREL_SIZES, kw: 'joggers fleece tapered sweatpants casual men women',
    desc: 'Tapered fleece joggers with a brushed interior, zip side pockets that actually hold a phone, and ribbed cuffs that stay clean.',
  },
  {
    id: 'p90', name: 'Pikol Canvas High-Top Sneakers, Unisex', cat: 'fashion', sub: 'footwear', brand: 'Pikol', art: 'sneakers',
    price: 3499, orig: 4599, rating: 4.5, reviews: 980, sold: 3410, flash: false, age: 29,
    colors: col('white', 'black', 'red'), sizes: SHOE_SIZES, kw: 'sneakers canvas high top unisex casual shoes',
    desc: 'Classic high-top canvas sneakers with a vulcanised rubber sole, cotton laces and a cushioned footbed you can pull out and wash.',
  },
  {
    id: 'p91', name: 'Strida Leather Chelsea Boots, Men\u2019s', cat: 'fashion', sub: 'footwear', brand: 'Strida', art: 'boots',
    price: 8999, orig: 11499, rating: 4.7, reviews: 430, sold: 1180, flash: false, age: 55, oos: true,
    colors: col('brown', 'black'), sizes: SHOE_SIZES, kw: 'chelsea boots leather ankle men smart casual',
    desc: 'Full-grain leather Chelsea boots with elastic side gores, a leather lining and a resolable rubber sole. Break in over a week of wear.',
  },
  {
    id: 'p92', name: 'Mendo Linen Shirt, Short Sleeve', cat: 'fashion', sub: 'tops', brand: 'Mendo', art: 'shirt',
    price: 3899, orig: 0, rating: 4.6, reviews: 560, sold: 1720, flash: false, age: 37,
    colors: col('white', 'beige', 'navy'), sizes: APPAREL_SIZES, kw: 'linen shirt short sleeve summer breathable men women',
    desc: 'A washed-linen button-up with a relaxed collar, a straight hem and mother-of-pearl buttons. Wears cool and only improves with washing.',
  },
  {
    id: 'p93', name: 'Vantia Wool-Blend Overcoat, Longline', cat: 'fashion', sub: 'outerwear', brand: 'Vantia', art: 'overcoat',
    price: 12999, orig: 16999, rating: 4.8, reviews: 320, sold: 760, flash: false, age: 66,
    colors: col('navy', 'beige', 'black'), sizes: APPAREL_SIZES, kw: 'overcoat wool blend longline coat winter smart',
    desc: 'A longline overcoat in a wool blend with a notched lapel, a full satin lining and a belt you can leave off. Warm without the puffer bulk.',
  },
  {
    id: 'p94', name: 'Ombra Cropped Denim Jacket, Women\u2019s', cat: 'fashion', sub: 'outerwear', brand: 'Ombra', art: 'jacket',
    price: 5499, orig: 6999, rating: 4.5, reviews: 470, sold: 1380, flash: false, age: 32,
    colors: col('blue', 'black'), sizes: APPAREL_SIZES, kw: 'denim jacket cropped women jeans casual',
    desc: 'A cropped denim jacket with a boxy cut, raw hem and silver hardware. Sits at the natural waist over a dress or high-rise jeans.',
  },
  {
    id: 'p95', name: 'Klarita Silk Scarf, Hand-Rolled', cat: 'fashion', sub: 'accessories', brand: 'Klarita', art: 'scarf',
    price: 2999, orig: 3999, rating: 4.7, reviews: 380, sold: 1240, flash: false, age: 50,
    colors: col('beige', 'navy', 'red'), kw: 'silk scarf hand rolled print accessory women gift',
    desc: 'A 90 cm pure-silk square with a hand-rolled edge and a print drawn in the studio. Wear it at the neck, the wrist or on a bag.',
  },
  {
    id: 'p96', name: 'Pikol Woven Leather Belt, 3.5cm', cat: 'fashion', sub: 'accessories', brand: 'Pikol', art: 'belt',
    price: 2599, orig: 0, rating: 4.5, reviews: 320, sold: 1120, flash: false, age: 59,
    colors: col('brown', 'black'), sizes: ['S', 'M', 'L', 'XL'], kw: 'belt woven leather braided casual men women',
    desc: 'A braided full-grain leather belt that adjusts at any point along its length, finished with a brushed pin buckle.',
  },
  {
    id: 'p97', name: 'Strida Thermal Puffer Vest, Packable', cat: 'fashion', sub: 'outerwear', brand: 'Strida', art: 'vest',
    price: 4599, orig: 5999, rating: 4.6, reviews: 410, sold: 1260, flash: false, age: 21,
    colors: col('black', 'green', 'navy'), sizes: APPAREL_SIZES, kw: 'puffer vest thermal packable gilet men women',
    desc: 'A recycled-fill puffer vest that stuffs into its own pocket. Adds a warm core layer over a hoodie without restricting your arms.',
  },
  {
    id: 'p98', name: 'Mendo Pleated Midi Skirt, Satin', cat: 'fashion', sub: 'dresses', brand: 'Mendo', art: 'skirt',
    price: 3999, orig: 0, rating: 4.6, reviews: 350, sold: 980, flash: false, age: 45,
    colors: col('beige', 'navy', 'green'), sizes: APPAREL_SIZES, kw: 'skirt pleated midi satin women elegant',
    desc: 'A knife-pleated satin midi skirt with an elasticated waist and a swishy drape. Dresses up a tee or down a blouse.',
  },
  {
    id: 'p99', name: 'Vantia Ribbed Tank Top, Cotton', cat: 'fashion', sub: 'tops', brand: 'Vantia', art: 'tank top',
    price: 1299, orig: 1799, rating: 4.5, reviews: 1420, sold: 5810, flash: false, age: 7,
    colors: col('white', 'black', 'pink'), sizes: APPAREL_SIZES, kw: 'tank top ribbed cotton basic women layer',
    desc: 'A fitted ribbed cotton tank with a scooped neck and a longer hem that stays tucked. The layer under everything.',
  },
  {
    id: 'p100', name: 'Ombra Quilted Shoulder Bag, Chain Strap', cat: 'fashion', sub: 'bags', brand: 'Ombra', art: 'shoulder bag',
    price: 5999, orig: 7999, rating: 4.6, reviews: 290, sold: 860, flash: false, age: 26,
    colors: col('black', 'beige'), kw: 'shoulder bag quilted chain strap women evening',
    desc: 'A quilted shoulder bag with a detachable chain strap, a magnetic flap and a lined interior with one zip pocket. Small but not precious.',
  },

  // Beauty (expanded)
  {
    id: 'p101', name: 'Luma Shampoo for Dry Hair, 400ml', cat: 'beauty', sub: 'haircare', brand: 'Luma', art: 'shampoo',
    price: 1499, orig: 1999, rating: 4.6, reviews: 1820, sold: 6410, flash: false, age: 11,
    kw: 'shampoo dry hair sulfate free moisturizing haircare 400ml',
    desc: 'A sulfate-free shampoo with argan oil and panthenol that cleans without stripping. Leaves dry, frizzy hair soft and easy to comb.',
  },
  {
    id: 'p102', name: 'Klarita Repair Hair Mask, 250ml', cat: 'beauty', sub: 'haircare', brand: 'Klarita', art: 'hair mask',
    price: 1999, orig: 2799, rating: 4.7, reviews: 1240, sold: 4280, flash: true, pct: 66, age: 6,
    kw: 'hair mask repair deep conditioning keratin damage treatment 250ml',
    desc: 'A weekly bond-repair mask with hydrolysed keratin and shea butter. Five minutes in the shower is enough to smooth heat-damaged ends.',
  },
  {
    id: 'p103', name: 'Ombra Argan Hair Oil, 100ml', cat: 'beauty', sub: 'haircare', brand: 'Ombra', art: 'hair oil',
    price: 1699, orig: 0, rating: 4.6, reviews: 890, sold: 3120, flash: false, age: 39, oos: true,
    kw: 'hair oil argan serum frizz shine 100ml haircare',
    desc: 'A lightweight argan and jojoba oil that smooths flyaways and adds shine without weighing hair down. A few drops on damp or dry ends.',
  },
  {
    id: 'p104', name: 'Vantia Eau de Parfum, Cedar and Amber', cat: 'beauty', sub: 'fragrance', brand: 'Vantia', art: 'perfume',
    price: 4999, orig: 6499, rating: 4.8, reviews: 640, sold: 2140, flash: false, age: 17,
    kw: 'perfume eau de parfum cedar amber fragrance unisex 50ml',
    desc: 'A warm woody fragrance opening on bergamot, settling into cedar, amber and a whisper of vanilla. Eight-hour wear in a 50 ml bottle.',
  },
  {
    id: 'p105', name: 'Klarita Rose Body Lotion, 400ml', cat: 'beauty', sub: 'skincare', brand: 'Klarita', art: 'body lotion',
    price: 1299, orig: 1699, rating: 4.5, reviews: 1560, sold: 5240, flash: false, age: 23,
    kw: 'body lotion rose moisturizer dry skin shea 400ml',
    desc: 'A fast-absorbing body lotion with rose extract, shea butter and glycerin. Keeps skin comfortable all day without a greasy film.',
  },
  {
    id: 'p106', name: 'Ombra Volumizing Mascara, Waterproof', cat: 'beauty', sub: 'makeup', brand: 'Ombra', art: 'mascara',
    price: 1599, orig: 2199, rating: 4.6, reviews: 2210, sold: 8140, flash: true, pct: 74, age: 4,
    kw: 'mascara volumizing waterproof makeup lashes smudge proof',
    desc: 'A buildable mascara that fans lashes without clumps, with a tapered brush for corners and a waterproof formula that survives a swim.',
  },
  {
    id: 'p107', name: 'Luma Foundation, SPF 30, 30ml', cat: 'beauty', sub: 'makeup', brand: 'Luma', art: 'foundation',
    price: 2499, orig: 3299, rating: 4.5, reviews: 980, sold: 3410, flash: false, age: 28,
    kw: 'foundation spf 30 makeup medium coverage 30ml',
    desc: 'A natural-finish liquid foundation with SPF 30 in a pump bottle. Medium, buildable coverage that does not oxidise or settle into lines.',
  },
  {
    id: 'p108', name: 'Ombra Nail Polish Set, 6 Colours', cat: 'beauty', sub: 'makeup', brand: 'Ombra', art: 'nail polish',
    price: 1499, orig: 1999, rating: 4.5, reviews: 720, sold: 2680, flash: false, age: 42,
    kw: 'nail polish set six colours makeup manicure gift',
    desc: 'Six long-wear polishes in nudes and berries with a wide brush and a glossy top coat. Air-dries in about ten minutes.',
  },
  {
    id: 'p109', name: 'Klarita Body Scrub, Coffee and Sugar', cat: 'beauty', sub: 'skincare', brand: 'Klarita', art: 'body scrub',
    price: 1399, orig: 0, rating: 4.6, reviews: 1110, sold: 4020, flash: false, age: 35,
    kw: 'body scrub coffee sugar exfoliating smooth skin 250ml',
    desc: 'A coffee-and-sugar scrub with coconut oil that buffs rough elbows and knees and rinses clean without a slippery residue.',
  },
  {
    id: 'p110', name: 'Luma Hair Dryer, Ionic 2000W', cat: 'beauty', sub: 'haircare', brand: 'Luma', art: 'hair dryer',
    price: 3499, orig: 4599, rating: 4.6, reviews: 840, sold: 2740, flash: false, age: 13,
    kw: 'hair dryer ionic 2000w fast drying salon haircare',
    desc: 'A 2000 W ionic hair dryer with three heat and two speed settings, a cool shot to set a style and a diffuser in the box.',
  },
  {
    id: 'p111', name: 'Strida Electric Toothbrush, Sonic', cat: 'beauty', sub: 'skincare', brand: 'Strida', art: 'toothbrush',
    price: 2999, orig: 3999, rating: 4.7, reviews: 1320, sold: 4620, flash: false, age: 9,
    kw: 'electric toothbrush sonic rechargeable dental care timer',
    desc: 'A sonic toothbrush with five cleaning modes, a two-minute quadrant timer and a 30-day battery per charge. Two heads included.',
  },
  {
    id: 'p112', name: 'Vantia Lip Balm Trio, Tinted', cat: 'beauty', sub: 'makeup', brand: 'Vantia', art: 'lip balm',
    price: 999, orig: 1399, rating: 4.6, reviews: 1680, sold: 6120, flash: true, pct: 80, age: 5,
    kw: 'lip balm trio tinted moisturizing shea gift set',
    desc: 'Three tinted lip balms in sheer rose, peach and berry, made with shea and vitamin E. Slip one into every bag.',
  },

  // Home (expanded)
  {
    id: 'p113', name: 'Mendo Chef Knife, 20cm Stainless', cat: 'home', sub: 'kitchen', brand: 'Mendo', art: 'knife',
    price: 3999, orig: 4999, rating: 4.8, reviews: 980, sold: 3410, flash: false, age: 19,
    colors: col('black', 'silver'), kw: 'chef knife 20cm stainless steel kitchen cooking',
    desc: 'A 20 cm forged chef knife in high-carbon stainless steel with a full tang and a pakkawood handle. Takes a keen edge and holds it.',
  },
  {
    id: 'p114', name: 'Luma Stand Mixer, 5L 1000W', cat: 'home', sub: 'kitchen', brand: 'Luma', art: 'blender',
    price: 14999, orig: 18999, rating: 4.7, reviews: 620, sold: 1620, flash: true, pct: 58, age: 12,
    colors: col('white', 'violet', 'black'), kw: 'stand mixer 5l 1000w baking dough beater kitchen',
    desc: 'A 1000 W stand mixer with a 5 L bowl, a dough hook, a whisk and a beater. Ten speeds handle everything from meringue to bread.',
  },
  {
    id: 'p115', name: 'Klarita Non-Stick Frying Pan, 28cm', cat: 'home', sub: 'kitchen', brand: 'Klarita', art: 'frying pan',
    price: 2999, orig: 3999, rating: 4.6, reviews: 1420, sold: 5210, flash: false, age: 22,
    colors: col('black'), kw: 'frying pan non stick 28cm induction kitchen cookware',
    desc: 'A 28 cm forged aluminium pan with a ceramic non-stick coating free of PFOA, an induction base and a stay-cool riveted handle.',
  },
  {
    id: 'p116', name: 'Aurex Electric Kettle, 1.7L Glass', cat: 'home', sub: 'kitchen', brand: 'Aurex', art: 'kettle',
    price: 3499, orig: 0, rating: 4.6, reviews: 1110, sold: 3980, flash: false, age: 30,
    colors: col('silver', 'black'), kw: 'electric kettle 1.7l glass fast boil kitchen',
    desc: 'A 1.7 L borosilicate glass kettle with blue illumination, a concealed element and auto shut-off. Boils in under three minutes.',
  },
  {
    id: 'p117', name: 'Vantia Velvet Accent Chair, Green', cat: 'home', sub: 'furniture', brand: 'Vantia', art: 'accent chair',
    price: 14999, orig: 18999, rating: 4.5, reviews: 280, sold: 720, flash: false, age: 48,
    colors: col('green', 'navy', 'pink'), kw: 'accent chair velvet furniture living room bedroom',
    desc: 'A tub accent chair in soft velvet with a solid beech frame and tapered legs. Small enough for a corner, comfy enough to stay in.',
  },
  {
    id: 'p118', name: 'Mendo Bedside Table, Two Drawer', cat: 'home', sub: 'furniture', brand: 'Mendo', art: 'nightstand',
    price: 9999, orig: 12499, rating: 4.6, reviews: 310, sold: 690, flash: false, age: 53,
    colors: col('brown', 'white'), kw: 'bedside table two drawer wood nightstand furniture',
    desc: 'A solid-wood bedside table with two soft-close drawers on brass runners and a cable cut-out at the back.',
  },
  {
    id: 'p119', name: 'Luma Floor Lamp, Arched Brass', cat: 'home', sub: 'lighting', brand: 'Luma', art: 'floor lamp',
    price: 8999, orig: 11499, rating: 4.7, reviews: 420, sold: 1130, flash: false, age: 43,
    colors: col('beige', 'black'), kw: 'floor lamp arched brass living room reading light',
    desc: 'An arched floor lamp with a weighted marble base and a linen drum shade. Reaches over a sofa or reading chair without a table.',
  },
  {
    id: 'p120', name: 'Klarita String Lights, 10m Warm White', cat: 'home', sub: 'lighting', brand: 'Klarita', art: 'string lights',
    price: 1599, orig: 2199, rating: 4.6, reviews: 1980, sold: 7120, flash: false, age: 14,
    colors: col('white'), kw: 'string lights 10m warm white garden patio decor',
    desc: 'Ten metres of warm-white string lights on a green cable with 100 bulbs and eight lighting modes. IP44 rated for patios and balconies.',
  },
  {
    id: 'p121', name: 'Vantia Ceramic Planter Set, 3 Pieces', cat: 'home', sub: 'decor', brand: 'Vantia', art: 'planter',
    price: 2799, orig: 3599, rating: 4.5, reviews: 760, sold: 2540, flash: false, age: 27,
    colors: col('white', 'beige'), kw: 'planter ceramic pot set three indoor plants decor',
    desc: 'Three matte ceramic planters in graduated sizes with drainage holes and matching saucers. Simple enough for any shelf.',
  },
  {
    id: 'p122', name: 'Ombra Framed Wall Mirror, 60cm Round', cat: 'home', sub: 'decor', brand: 'Ombra', art: 'mirror',
    price: 5499, orig: 0, rating: 4.7, reviews: 540, sold: 1720, flash: false, age: 36,
    colors: col('black', 'beige'), kw: 'wall mirror framed round 60cm decor hallway',
    desc: 'A 60 cm round mirror with a slim metal frame and a shatter-resistant backing. Hangs flush or leans on a shelf.',
  },
  {
    id: 'p123', name: 'Pikol Bath Towel Set, 4 Piece Cotton', cat: 'home', sub: 'bedding', brand: 'Pikol', art: 'bath towel',
    price: 3499, orig: 4599, rating: 4.6, reviews: 1210, sold: 4310, flash: false, age: 20,
    colors: col('white', 'silver', 'blue'), kw: 'bath towel set four piece cotton soft bath',
    desc: 'Two bath towels and two hand towels in long-staple Turkish cotton, 600 GSM, with a dobby border. Softens with every wash.',
  },
  {
    id: 'p124', name: 'Aurex Stainless Cookware Set, 5 Piece', cat: 'home', sub: 'kitchen', brand: 'Aurex', art: 'cookware',
    price: 19999, orig: 24999, rating: 4.7, reviews: 390, sold: 890, flash: true, pct: 45, age: 17,
    colors: col('silver'), kw: 'cookware set stainless steel five piece pots pans kitchen',
    desc: 'A five-piece tri-ply stainless set: two saucepans, a frying pan and a stockpot, all oven-safe to 260 degrees and induction ready.',
  },

  // Sports (expanded)
  {
    id: 'p125', name: 'Strida Kettlebell, Cast Iron 12kg', cat: 'sports', sub: 'fitness', brand: 'Strida', art: 'kettlebell',
    price: 3999, orig: 5199, rating: 4.7, reviews: 720, sold: 2430, flash: false, age: 26,
    colors: col('black'), kw: 'kettlebell cast iron 12kg home gym strength fitness',
    desc: 'A single-cast 12 kg kettlebell with a wide smooth handle and a powder-coat finish that grips without shredding your hands.',
  },
  {
    id: 'p126', name: 'Pikol Foam Roller, Grid Textured', cat: 'sports', sub: 'fitness', brand: 'Pikol', art: 'foam roller',
    price: 1899, orig: 2499, rating: 4.6, reviews: 1340, sold: 4820, flash: true, pct: 68, age: 8,
    colors: col('teal', 'black'), kw: 'foam roller grid recovery muscle massage mobility fitness',
    desc: 'A 33 cm hollow-core foam roller with a multi-density grid that mimics a massage. Rolls out tight legs and back after training.',
  },
  {
    id: 'p127', name: 'Strida Speed Jump Rope, Weighted', cat: 'sports', sub: 'fitness', brand: 'Strida', art: 'jump rope',
    price: 999, orig: 1499, rating: 4.5, reviews: 1620, sold: 5910, flash: false, age: 5,
    colors: col('black', 'red'), kw: 'jump rope speed weighted skipping training cardio fitness',
    desc: 'A tangle-free speed rope on sealed ball bearings, with two removable weights and an adjustable steel cable for double-unders.',
  },
  {
    id: 'p128', name: 'Mendo Insulated Gym Bottle, 750ml', cat: 'sports', sub: 'fitness', brand: 'Mendo', art: 'bottle',
    price: 1499, orig: 0, rating: 4.6, reviews: 1810, sold: 6340, flash: false, age: 11,
    colors: col('teal', 'black', 'violet'), kw: 'gym bottle insulated 750ml stainless steel water',
    desc: 'A 750 ml stainless bottle with a wide mouth for ice, a leak-proof lid and a silicone boot that stops the clang on gym floors.',
  },
  {
    id: 'p129', name: 'Klarita Road Bike Helmet, MIPS', cat: 'sports', sub: 'cycling', brand: 'Klarita', art: 'helmet',
    price: 5999, orig: 7499, rating: 4.7, reviews: 430, sold: 1320, flash: false, age: 33,
    colors: col('white', 'black', 'red'), sizes: ['S', 'M', 'L'], kw: 'bike helmet road mips cycling safety ventilated',
    desc: 'A ventilated road helmet with a MIPS liner, 22 air vents and a dial fit system. Weighs 260 g and comes with a spare pad set.',
  },
  {
    id: 'p130', name: 'Pikol Cycling Gloves, Gel Padded', cat: 'sports', sub: 'cycling', brand: 'Pikol', art: 'gloves',
    price: 1499, orig: 1999, rating: 4.5, reviews: 620, sold: 2140, flash: false, age: 29,
    colors: col('black', 'red'), sizes: SHOE_SIZES, kw: 'cycling gloves gel padded fingerless grip bike',
    desc: 'Fingerless cycling gloves with gel pads that damp road buzz and a pull tab that comes off mid-ride. Touchscreen-friendly thumbs.',
  },
  {
    id: 'p131', name: 'Aurex 2-Person Camping Chair, Reclining', cat: 'sports', sub: 'outdoor', brand: 'Aurex', art: 'camping chair',
    price: 5499, orig: 6999, rating: 4.5, reviews: 380, sold: 1180, flash: false, age: 44,
    colors: col('green', 'navy'), kw: 'camping chair reclining two person outdoor folding',
    desc: 'A two-person folding bench with a steel frame, padded seats and cup holders, plus a carry bag. Folds flat in about a minute.',
  },
  {
    id: 'p132', name: 'Strida Hiking Backpack, 40L', cat: 'sports', sub: 'outdoor', brand: 'Strida', art: 'hiking backpack',
    price: 7999, orig: 9999, rating: 4.7, reviews: 540, sold: 1620, flash: false, age: 35,
    colors: col('green', 'navy', 'black'), kw: 'hiking backpack 40l outdoor trekking rucksack rain cover',
    desc: 'A 40 L trekking pack with a ventilated back panel, a rain cover in the base and a hip belt that carries the load off your shoulders.',
  },
  {
    id: 'p133', name: 'Mendo Sleeping Bag, 3 Season Mummy', cat: 'sports', sub: 'outdoor', brand: 'Mendo', art: 'sleeping bag',
    price: 6499, orig: 0, rating: 4.6, reviews: 320, sold: 940, flash: false, age: 40,
    colors: col('green', 'navy'), kw: 'sleeping bag three season mummy camping outdoor warm',
    desc: 'A mummy sleeping bag rated to -2 degrees with a synthetic fill that still insulates if it gets damp, and a compression sack.',
  },
  {
    id: 'p134', name: 'Vantia Table Tennis Set, 4 Player', cat: 'sports', sub: 'team-sports', brand: 'Vantia', art: 'table tennis',
    price: 2499, orig: 3299, rating: 4.5, reviews: 760, sold: 2680, flash: false, age: 24,
    colors: col('black', 'red'), kw: 'table tennis set four player paddles balls ping pong',
    desc: 'Four tournament paddles and eight balls in a zip case, with a retractable net that clamps to any table. Ready in seconds.',
  },

  // Groceries (expanded)
  {
    id: 'p135', name: 'Klarita Cold-Pressed Orange Juice, 1L', cat: 'groceries', sub: 'beverages', brand: 'Klarita', art: 'juice',
    price: 699, orig: 0, rating: 4.6, reviews: 1210, sold: 4310, flash: false, age: 3,
    sizes: ['500ml', '1L'], kw: 'orange juice cold pressed 1l fresh drink breakfast',
    desc: 'Not-from-concentrate juice pressed from Valencia oranges and bottled within hours. Nothing added, nothing taken out.',
  },
  {
    id: 'p136', name: 'Mendo Greek Yogurt, 500g', cat: 'groceries', sub: 'fresh', brand: 'Mendo', art: 'yogurt',
    price: 499, orig: 0, rating: 4.7, reviews: 1640, sold: 5820, flash: false, age: 2,
    sizes: ['500g'], kw: 'greek yogurt 500g natural protein fresh dairy',
    desc: 'Strained Greek yogurt with 10 g of protein per 100 g and a thick, creamy set. No added sugar and no thickeners.',
  },
  {
    id: 'p137', name: 'Pikol Hass Avocados, Pack of 4', cat: 'groceries', sub: 'fresh', brand: 'Pikol', art: 'avocado',
    price: 599, orig: 799, rating: 4.5, reviews: 980, sold: 3610, flash: false, age: 4,
    kw: 'avocado hass pack four fresh fruit ripe',
    desc: 'Four Hass avocados picked at the firm-ripe stage and packed in a protective tray so they arrive ready to ripen on the counter.',
  },
  {
    id: 'p138', name: 'Aurex Still Mineral Water, 6 Pack 1.5L', cat: 'groceries', sub: 'beverages', brand: 'Aurex', art: 'water bottle',
    price: 549, orig: 699, rating: 4.5, reviews: 1420, sold: 5240, flash: false, age: 6,
    sizes: ['6 pack', '12 pack'], kw: 'still mineral water six pack 1.5l bottled drinks',
    desc: 'Six 1.5 L bottles of natural still mineral water from a protected spring, with a naturally balanced mineral content.',
  },
  {
    id: 'p139', name: 'Strida Whole Wheat Pasta, 500g', cat: 'groceries', sub: 'pantry', brand: 'Strida', art: 'pasta',
    price: 399, orig: 0, rating: 4.6, reviews: 1340, sold: 4820, flash: false, age: 15,
    sizes: ['500g'], kw: 'whole wheat pasta 500g penne durum pantry cooking',
    desc: 'Bronze-cut penne made from 100% whole durum wheat. Holds sauce in its ridges and keeps a proper bite.',
  },
  {
    id: 'p140', name: 'Vantia Raw Forest Honey, 500g', cat: 'groceries', sub: 'pantry', brand: 'Vantia', art: 'honey',
    price: 1099, orig: 1399, rating: 4.7, reviews: 920, sold: 3240, flash: false, age: 24,
    sizes: ['250g', '500g'], kw: 'honey raw forest 500g natural sweet spread',
    desc: 'Raw forest honey gathered from wildflower and tree blossom, unheated and unfiltered, so it keeps its depth and aroma.',
  },
  {
    id: 'p141', name: 'Luma Dark Chocolate 70%, 100g', cat: 'groceries', sub: 'snacks', brand: 'Luma', art: 'chocolate',
    price: 449, orig: 599, rating: 4.8, reviews: 1980, sold: 7120, flash: false, age: 8,
    kw: 'dark chocolate 70 percent 100g snack bar cocoa',
    desc: 'A 70% single-origin dark chocolate bar with tasting notes of cherry and toasted nut. Conched for 48 hours for a clean snap.',
  },
  {
    id: 'p142', name: 'Klarita Roasted Almonds, 200g', cat: 'groceries', sub: 'snacks', brand: 'Klarita', art: 'nuts',
    price: 649, orig: 849, rating: 4.6, reviews: 1110, sold: 3860, flash: false, age: 12,
    sizes: ['200g', '500g'], kw: 'roasted almonds 200g nuts snack healthy',
    desc: 'Dry-roasted whole almonds with a pinch of sea salt, packed in a resealable pouch that keeps them crunchy.',
  },
  {
    id: 'p143', name: 'Mendo Sourdough Bread, 800g', cat: 'groceries', sub: 'fresh', brand: 'Mendo', art: 'bread',
    price: 599, orig: 0, rating: 4.7, reviews: 870, sold: 3120, flash: false, age: 1,
    kw: 'sourdough bread 800g bakery fresh loaf',
    desc: 'A slow-fermented sourdough with a crackling crust and an open crumb, baked the morning it ships and good for days in a paper bag.',
  },
  {
    id: 'p144', name: 'Freshly Organic Brown Rice, 5kg', cat: 'groceries', sub: 'pantry', brand: 'Freshly', art: 'rice bag',
    price: 1899, orig: 2399, rating: 4.6, reviews: 760, sold: 2810, flash: true, pct: 64, age: 10,
    sizes: ['1kg', '5kg'], kw: 'brown rice organic 5kg pantry grain staple',
    desc: 'Five kilos of organic long-grain brown rice in a sturdy resealable sack. Nutty, separate grains that cook in 25 minutes.',
  },

  // Accessories (expanded)
  {
    id: 'p145', name: 'Vantia Chronograph Watch, Steel Bracelet', cat: 'accessories', sub: 'watches', brand: 'Vantia', art: 'chronograph',
    price: 12999, orig: 15999, rating: 4.7, reviews: 320, sold: 890, flash: false, age: 38,
    colors: col('silver', 'black'), kw: 'chronograph watch steel bracelet men analog quartz',
    desc: 'A 42 mm chronograph with three sub-dials, a screw-down crown and a brushed steel bracelet. Water resistant to 10 ATM.',
  },
  {
    id: 'p146', name: 'Strida Canvas Baseball Cap, Adjustable', cat: 'accessories', sub: 'headwear', brand: 'Strida', art: 'baseball cap',
    price: 1499, orig: 0, rating: 4.5, reviews: 680, sold: 2340, flash: false, age: 7,
    colors: col('navy', 'beige', 'black'), kw: 'baseball cap canvas adjustable hat headwear',
    desc: 'A washed-cotton baseball cap with a curved brim, a brass slider and an unbranded front panel ready for anything.',
  },
  {
    id: 'p147', name: 'Mendo Packable Sun Hat, UPF 50', cat: 'accessories', sub: 'headwear', brand: 'Mendo', art: 'sun hat',
    price: 2199, orig: 2799, rating: 4.6, reviews: 410, sold: 1420, flash: false, age: 31,
    colors: col('beige', 'white'), kw: 'sun hat packable upf 50 wide brim travel beach',
    desc: 'A wide-brim sun hat in UPF 50 fabric with a chin cord and a roll-up design that springs back to shape from a suitcase.',
  },
  {
    id: 'p148', name: 'Pikol Polarised Aviator Sunglasses', cat: 'accessories', sub: 'eyewear', brand: 'Pikol', art: 'sunglasses',
    price: 3499, orig: 4599, rating: 4.6, reviews: 540, sold: 1820, flash: false, age: 18,
    colors: col('silver', 'brown'), kw: 'aviator sunglasses polarised uv metal frame classic',
    desc: 'Classic aviators with polarised UV400 lenses, a lightweight metal frame and adjustable silicone nose pads. Hard case included.',
  },
  {
    id: 'p149', name: 'Ombra Leather Passport Holder, RFID', cat: 'accessories', sub: 'travel', brand: 'Ombra', art: 'passport holder',
    price: 2299, orig: 2999, rating: 4.7, reviews: 480, sold: 1640, flash: false, age: 21,
    colors: col('brown', 'black', 'navy'), kw: 'passport holder leather rfid travel cover wallet',
    desc: 'A slim full-grain passport holder with a boarding-pass slot, two card pockets and an RFID-blocking layer.',
  },
  {
    id: 'p150', name: 'Strida Cuff Bracelet, Brushed Brass', cat: 'accessories', sub: 'jewelry', brand: 'Strida', art: 'bracelet',
    price: 2799, orig: 3599, rating: 4.5, reviews: 360, sold: 1120, flash: false, age: 16,
    colors: col('silver', 'brown'), kw: 'cuff bracelet brushed brass jewelry bangle gift',
    desc: 'An open cuff in brushed brass with an adjustable fit that slides on at the wrist. Develops a soft patina with wear.',
  },
];

/* ---------------------------------------------------------------------------
 * Lookups and derived helpers.
 * ------------------------------------------------------------------------- */

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
    shipping: 399,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-48073', status: 'to_ship', daysAgo: 1.3,
    items: [{ id: 'p05', qty: 2 }],
    payment: 'MVP Marketplace Pay', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    shipping: 0,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-47156', status: 'shipped', daysAgo: 2.6,
    items: [{ id: 'p22', qty: 1 }],
    payment: 'Visa ending in 4242', shipMethod: 'Express delivery', shipEta: '1-2 business days',
    shipping: 799,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-46402', status: 'shipped', daysAgo: 3.4,
    items: [{ id: 'p06', qty: 1 }, { id: 'p07', qty: 1 }],
    payment: 'MVP Marketplace Pay', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    shipping: 0,
    address: { name: 'Sam Taylor', phone: '+1 555 0198', line1: '8 Cedar Lane', city: 'Austin, TX', zip: '78701' },
  },
  {
    no: 'BZ-45201', status: 'completed', daysAgo: 9,
    items: [{ id: 'p19', qty: 1 }, { id: 'p20', qty: 1 }],
    payment: 'Visa ending in 4242', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    shipping: 0,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
  {
    no: 'BZ-43810', status: 'completed', daysAgo: 15,
    items: [{ id: 'p14', qty: 3 }],
    payment: 'MVP Marketplace Pay', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    shipping: 0,
    address: { name: 'Sam Taylor', phone: '+1 555 0198', line1: '8 Cedar Lane', city: 'Austin, TX', zip: '78701' },
  },
  {
    no: 'BZ-42087', status: 'cancelled', daysAgo: 21, cancelledAfterHours: 5,
    items: [{ id: 'p23', qty: 1 }, { id: 'p24', qty: 1 }],
    payment: 'Visa ending in 4242', shipMethod: 'Standard delivery', shipEta: '3-5 business days',
    shipping: 399,
    address: { name: 'Alex Rivera', phone: '+1 555 0134', line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205' },
  },
];

export function productById(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
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
 * Specifications. Per-product specs keyed by the product's artwork kind, so
 * values stay plausible for what the item actually is.
 * ------------------------------------------------------------------------- */
const SPEC_BY_ART = {
  headphones: [['Driver', '40 mm dynamic'], ['Battery life', 'Up to 40 hours'], ['Bluetooth', '5.3'], ['Charging', 'USB-C, 10 min = 4 h']],
  smartphone: [['Display', '6.7" AMOLED, 120 Hz'], ['Storage', '128 GB'], ['Camera', '50 MP triple'], ['Battery', '5000 mAh, 65 W fast charge']],
  laptop: [['Material', 'Water-repellent polyester'], ['Padding', '8 mm closed-cell foam'], ['Fits', 'Up to 14" laptops'], ['Pockets', 'Front zip + slip pocket']],
  camera: [['Sensor', '1/1.7" CMOS'], ['Video', '4K at 60 fps'], ['Waterproof', '10 m, no case needed'], ['Stabilisation', '3-axis EIS']],
  tv: [['Panel', '55" LED, 4K UHD'], ['Refresh rate', '60 Hz'], ['Smart platform', 'BazTV OS'], ['Ports', '3x HDMI, 2x USB']],
  speaker: [['Output', '12 W full-range'], ['Battery', 'Up to 18 hours'], ['Water resistance', 'IPX7'], ['Bluetooth', '5.3, 30 m range']],
  watch: [['Display', '1.4" AMOLED'], ['Battery', 'Up to 10 days'], ['Sensors', 'Heart rate, SpO2, GPS'], ['Water resistance', '5 ATM']],
  shirt: [['Material', 'See description'], ['Fit', 'True to size'], ['Care', 'Machine wash 30°C'], ['Origin', 'Made in Portugal']],
  bag: [['Material', 'Water-resistant canvas'], ['Dimensions', '26 × 20 × 9 cm'], ['Strap', 'Adjustable, up to 130 cm'], ['Pockets', 'Inner zip + phone slot']],
  glasses: [['Lens', 'UV400 polarised'], ['Frame', 'Hand-polished acetate'], ['Width', '142 mm'], ['Includes', 'Hard case + cloth']],
  sparkles: [['Size', 'Standard retail'], ['Formula', 'Talc-free, fragrance-free'], ['Cruelty free', 'Yes'], ['Shelf life', '24 months unopened']],
  droplet: [['Volume', '30 ml'], ['Key actives', 'See description'], ['Skin types', 'All, patch test first'], ['Free from', 'Parabens, alcohol, dyes']],
  armchair: [['Dimensions', '82 W × 88 D × 78 H cm'], ['Upholstery', 'Woven polyester blend'], ['Frame', 'Solid oak legs'], ['Assembly', 'Legs attach, tool included']],
  lamp: [['Height', '46 cm'], ['Shade', 'Natural linen'], ['Bulb', 'E27, 8 W LED included'], ['Switch', 'Inline dimmer']],
  bed: [['Thread count', '300 TC percale'], ['Includes', 'Flat + fitted + 2 cases'], ['Fitted depth', 'Up to 35 cm'], ['Care', 'Machine wash 40°C']],
  dumbbell: [['Material', 'See description'], ['Included', 'See description'], ['Grip', 'Knurled, rubber-coated'], ['Storage', 'Compact stand or mesh bag']],
  ball: [['Construction', 'Machine-stitched TPU'], ['Bladder', 'Butyl, air-tight'], ['Sizes', 'See variants'], ['Use', 'Match and training']],
  bottle: [['Capacity', '1 L'], ['Material', '18/8 stainless steel'], ['Insulation', 'Cold 24 h / hot 12 h'], ['Lid', 'Flip, leak-proof']],
  apple: [['Origin', 'Orchard: Rioja valley'], ['Count', '6 apples'], ['Class', 'Organic certified'], ['Storage', 'Keep cool and dry']],
  coffee: [['Roast', 'Medium'], ['Origin', 'Single estate'], ['Grind', 'Whole bean / sachets'], ['Storage', 'Resealable, valve bag']],
  jar: [['Net weight', 'See variants'], ['Ingredients', '100% single-source'], ['Additives', 'None'], ['Storage', 'Room temperature']],
  wallet: [['Material', 'Full-grain vegetable-tanned leather'], ['Capacity', '6 cards + cash fold'], ['Protection', 'RFID-blocking layer'], ['Dimensions', '10.5 × 8 cm']],
  gem: [['Stone', '4 mm lab-grown'], ['Metal', 'Rhodium-plated 925 silver'], ['Backing', 'Hypoallergenic posts'], ['Packaging', 'Gift box']],
  shoe: [['Upper', 'Draining mesh'], ['Midsole', 'EVA with rock plate'], ['Outsole', '4 mm lugs, rubber'], ['Drop', '8 mm']],
  keyboard: [['Switches', 'Hot-swappable, tactile'], ['Layout', '75%, 82 keys'], ['Connection', 'USB-C, detachable'], ['Backlight', 'Per-key RGB']],
  drone: [['Camera', '4K, 3-axis gimbal'], ['Flight time', 'Up to 30 min'], ['Range', '6 km transmission'], ['Weight', '249 g']],
  cream: [['Volume', '50 ml'], ['Key actives', 'Hyaluronic acid, ceramides'], ['Skin types', 'All, fragrance-free'], ['Use', 'Morning, under makeup']],
  table: [['Material', 'Solid oak'], ['Dimensions', '45 Ø × 45 H cm'], ['Finish', 'Hardwax oil'], ['Assembly', 'Legs attach, tool included']],
  mat: [['Thickness', '6 mm'], ['Material', 'TPE, closed-cell'], ['Dimensions', '183 × 61 cm'], ['Weight', '1.1 kg']],
  tent: [['Capacity', '2 person'], ['Waterproofing', '3000 mm fly'], ['Weight', '4.2 kg packed'], ['Pitch time', 'About 12 min']],
  banana: [['Origin', 'Ecuador'], ['Count', 'About 9 bananas'], ['Class', 'Category I'], ['Storage', 'Ripen at room temperature']],
  belt: [['Material', 'Full-grain leather'], ['Width', '3.5 cm'], ['Buckle', 'Rotating, reversible'], ['Lengths', 'S to XL']],
};

export function specsFor(p) {
  const base = SPEC_BY_ART[p.art] || [['Material', 'See description']];
  return base.concat([['Brand', p.brand], ['Warranty', p.cat === 'electronics' ? '24 months' : '12 months']]);
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
