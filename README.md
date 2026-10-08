# MVP Marketplace

A mobile-first marketplace app on [Homeroom](https://app.onhomeroom.com):
modern, clean UI for browsing deals, categories and products.

Roadmap: **MVP (this phase)** → Beta → Add Seller → Payment → Logistics →
Advanced Features → Production.

## Phase 1 — scope

- **Design system**: typography scale, buttons, cards, badges, inputs,
  spacing/radii/shadows and a single brand accent (`brand`) with rose
  reserved for sale urgency and amber for ratings. Tokens live in
  `tailwind.config.js`; reusable component classes in
  `styles/tailwind-input.css`.
- **Color themes**: five switchable background themes (Purple Dream by
  default, plus Ocean Breeze, Sunset Glow, Fresh Mint and the dark
  Midnight), driven by CSS variables in `styles/tailwind-input.css` and
  switched from the header swatches (desktop) or the Profile page (mobile);
  the choice persists on the device under the `bazario:` prefix.
- **App shell**: sticky header (logo, search, notification + cart), mobile
  bottom navigation (Home, Categories, Cart, Orders, Profile) and a desktop
  top navigation on wider screens.
- **Home page**: promotional carousel (3 banners), category tiles, Flash
  Sale row with a live countdown and sold-progress bars, and a Recommended
  products grid (2 columns on mobile, up to 6 on desktop) with ratings,
  review/sold counts, prices, discount badges, favorites and add-to-cart.
- **Interactions**: search with recents/trending/suggestions and an
  empty-search state, category and deal filters (shareable via `?q=` /
  `?cat=` deep links), favorite toggles, add-to-cart with toast feedback,
  cart quantity management, and loading skeletons on boot.
- **Mock data**: 33 invented products across 7 categories, generated SVG
  artwork (no external image requests), served from `public/js/data.js`.

Out of scope until later phases: checkout, payment, order management and
seller tools. Where a control would lead there, the UI says so ("coming
soon") instead of hiding it.

## Phase 2 — scope

- **Category pages** (`#/category/<id>`): subcategory chips, search within
  the category, result count, filter and sort toolbar, and the product
  grid. Reached from the Categories tab, the Home category tiles and the
  arrivals banner.
- **Search results** (`#/search?q=...`): the header search and the search
  panel now route here. Shows the query, result count, filter and sort
  controls, and (with an empty query) recent + popular searches.
- **Filters**: price buckets, minimum rating, brand checkboxes, minimum
  discount and in-stock-only, applying live to the grid. Bottom sheet on
  mobile, centered panel on desktop.
- **Sorting**: Recommended, Popular, Newest, and price low→high / high→low.
- **Product detail** (`#/product/<id>`): image gallery (dots, arrows,
  thumbnails), rating/reviews/sold summary, price with discount, shipping
  and returns, color and size variants where the product has them, quantity
  stepper, description, specifications, seller card with Chat seller,
  customer reviews (distribution bars, verified purchases, reviewer
  photos), related products and recently viewed.
- **Cart**: entries are keyed by product + variant, so the same product in
  two colors stays separate; rows show the chosen color/size. Buy Now adds
  the configured variant and opens the cart (checkout remains out of scope).
- **Recently viewed**: persisted locally (`bazario:viewed`) and shown on
  the product page.
- **Mock data**: grown to 43 products with subcategories, brands, keywords,
  variants and specs; deterministic per-product reviews, shipping terms and
  rating distributions generated in `public/js/data.js`.

## Phase 3 — Cart

- **Cart page**: each item shows its artwork, name, variant, unit price,
  original price and discount badge, a quantity stepper (minus disabled at
  1; removal goes through the remove button), line total, and favorite /
  save-for-later / remove actions.
- **Selection**: per-item checkboxes, select all / deselect all and an
  "n of m selected" count. Totals always cover only the selected items.
- **Order summary**: subtotal, product discounts (savings vs original
  prices), estimated shipping (free over $50, otherwise $3.99), voucher
  discount and total, recalculated on every change. Checkout is a
  "coming in a later phase" stub; no payment.
- **Vouchers**: code input, available-voucher list, applied state with its
  discount, and invalid states (unknown code, order below the voucher
  minimum). The applied voucher persists for the session.
- **Saved for later**: items moved out of the cart persist and can be moved
  back or removed, including from the empty cart.
- **Responsive**: on mobile a sticky checkout bar sits above the bottom
  navigation; on desktop the cart is two columns (items left, sticky
  summary right).
- **Demo state**: `/?demo=1#/cart` seeds a representative cart once per
  browser, so the populated cart is reachable from a URL for previews and
  checks; `/#/cart` always shows the real cart.

## Reviews, photos and orders

The product page's Reviews section is driven by real data
(`public/js/reviews.js`; the page only supplies the mount point):

- **Reviews** are stored in the public `reviews` and `review_images`
  tables. A shopper may review a product only after a verified purchase —
  a completed order containing it — and one review per purchased line is
  allowed (a second attempt edits the first). Owners can edit or delete
  their own review; nobody else can.
- **Photos** are picked in the composer (up to 5). Each is resized to a
  1600px longest edge on a canvas and re-encoded, which strips EXIF/GPS,
  then uploaded through the platform bridge; only the returned URL is
  stored. Images render with `loading="lazy"`, a tinted placeholder while
  they load, and a neutral fallback if they fail. Tapping one opens a
  keyboard- and swipe-navigable lightbox.
- **Live updates**: the reviews section subscribes to
  `GET /api/reviews/stream` (SSE) and applies another shopper's posted,
  edited or deleted review without a reload, reconciling the author's own
  optimistic card so it never doubles.
- **Orders** are mirrored into the `orders` / `order_items` tables at
  place-order time. The client keeps its local order path (so placing
  works offline); the server write is best-effort and idempotent. Both
  tables are `staging:private`, and the reviews tables never carry a
  foreign key into them.
- Image moderation is a documented hook, off unless the platform LLM proxy
  is configured (it never is in staging), with a "Pending review" chip in
  the UI for a pending row.

## Run locally

```sh
npm ci --include=dev
npm run build   # compiles public/tailwind.css
npm start       # needs DATABASE_URL + USERNODE_* env (provided by Homeroom)
```
