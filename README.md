# MVP Marketplace (Bazario)

A mobile-first marketplace app on [Homeroom](https://app.onhomeroom.com):
modern, clean UI for browsing deals, categories and products.

Roadmap: **MVP (this phase)** → Beta → Add Seller → Payment → Logistics →
Advanced Features → Production.

## Phase 1 — scope

- **Design system**: typography scale, buttons, cards, badges, inputs,
  spacing/radii/shadows and a single brand accent (`brand`, violet) with
  rose reserved for sale urgency and amber for ratings. Tokens live in
  `tailwind.config.js`; reusable component classes in
  `styles/tailwind-input.css`.
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

## Run locally

```sh
npm ci --include=dev
npm run build   # compiles public/tailwind.css
npm start       # needs DATABASE_URL + USERNODE_* env (provided by Homeroom)
```
