/* Icon set + product artwork generator.
 *
 * One consistent style across the whole app: 24-unit stroke grid, 2px round
 * strokes (Lucide-style), currentColor, aria-hidden. Product artwork is
 * generated SVG: a soft per-category gradient with a detailed flat product
 * illustration (rich art, keyed by product id — every current catalog
 * product has one, and the same artwork feeds the Flash Sale cards and every
 * other surface that renders the product). There are no external image
 * requests, so the grid renders instantly and offline and nothing can fail
 * to load — there is also nothing to "lazy load" (no network fetch at all);
 * the art is built synchronously on the client and the .product-img fade-in
 * in styles/tailwind-input.css supplies the perceived-loading polish. The
 * category glyph tier below remains as the fallback for any future product
 * without a rich illustration.
 */

const STROKE_ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  percent: '<path d="m19 5-14 14"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  arrowRight: '<path d="M5 12h14m-7-7 7 7-7 7"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  store: '<path d="M2 7l2.5-4h15L22 7"/><path d="M4 7v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7"/><path d="M9 21v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/><path d="M2 7h20"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  returns: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  mapPin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
  creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
  bank: '<path d="M3 22h18"/><path d="M6 18v-7M10 18v-7M14 18v-7M18 18v-7"/><path d="m12 2 9 5H3z"/>',
  banknote: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  loader: '<path d="M21 12a9 9 0 1 1-6.22-8.56"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  mapPin: '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  creditCard: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  pencil: '<path d="M21.17 6.81a1 1 0 0 0-3.98-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/><path d="m15 5 4 4"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 0 0 18 14 14 0 0 0 0-18"/><path d="M3 12h18"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  messageCircle: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
};

const FILL_ICONS = {
  heartFilled: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  star: '<path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.57l-5.9 3.09 1.13-6.57L2.45 9.44l6.6-.96z"/>',
  ellipsis: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
};

/* Return one icon as an SVG string. */
export function icon(name, cls = 'w-5 h-5') {
  // ART_ICONS holds the product-artwork glyphs on the same 24-unit stroke
  // grid; serving them as ordinary stroke icons lets category tiles and
  // empty states reuse the same artwork instead of rendering nothing.
  const stroke = STROKE_ICONS[name] || ART_ICONS[name];
  if (stroke) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + cls + '" aria-hidden="true">' + stroke + '</svg>';
  }
  const fill = FILL_ICONS[name];
  if (fill) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="' + cls + '" aria-hidden="true">' + fill + '</svg>';
  }
  return '';
}

/* Replace every <span data-icon="..."> placeholder with its SVG. */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon, el.dataset.cls || 'w-5 h-5');
  });
}

/* ---------------------------------------------------------------------------
 * Product artwork. Each entry draws cleanly on the 24-unit stroke grid; the
 * generator scales it onto a soft per-category gradient.
 * --------------------------------------------------------------------------- */
const ART_ICONS = {
  headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="2"/><rect x="17" y="14" width="4" height="6" rx="2"/>',
  smartphone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18h2"/>',
  laptop: '<rect x="4" y="4" width="16" height="11" rx="1.5"/><path d="M2.5 18.5h19"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="m9 7 1.5-2.5h3L15 7"/><circle cx="12" cy="13" r="3.5"/>',
  imagePlus: '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="m3 16 4.5-4.5a2 2 0 0 1 2.83 0L15 16"/><circle cx="9" cy="9" r="1.5"/><path d="M18 2v6M15 5h6"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 21h6"/><path d="M12 17v4"/>',
  speaker: '<rect x="7" y="3" width="10" height="18" rx="2"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="7" r="1.2"/>',
  watch: '<circle cx="12" cy="12" r="5"/><rect x="9" y="2.5" width="6" height="4" rx="1.5"/><rect x="9" y="17.5" width="6" height="4" rx="1.5"/>',
  shirt: '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .98-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  glasses: '<circle cx="6.5" cy="14" r="3.5"/><circle cx="17.5" cy="14" r="3.5"/><path d="M10 14h4"/><path d="M3 12l1-4M21 12l-1-4"/>',
  sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  droplet: '<path d="M12 3s6 6.2 6 10a6 6 0 0 1-12 0c0-3.8 6-10 6-10z"/>',
  armchair: '<path d="M6 11V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3"/><path d="M4 11a2 2 0 0 1 2 2v1h12v-1a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z"/><path d="M6 17v2M18 17v2"/>',
  lamp: '<path d="M9 3h6l3 8H6z"/><path d="M12 11v9"/><path d="M8 20h8"/>',
  bed: '<path d="M3 5v15"/><path d="M21 20v-8a3 3 0 0 0-3-3H3"/><path d="M3 16h18"/><path d="M7 9V6h4v3"/>',
  dumbbell: '<rect x="2.5" y="9" width="3" height="6" rx="1"/><rect x="18.5" y="9" width="3" height="6" rx="1"/><rect x="5.5" y="7" width="3" height="10" rx="1"/><rect x="15.5" y="7" width="3" height="10" rx="1"/><path d="M8.5 12h7"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M3.6 8.4c5.4-2.6 11.4-2.6 16.8 0M3.6 15.6c5.4 2.6 11.4 2.6 16.8 0"/><path d="M12 3v18"/>',
  bottle: '<path d="M9.5 2.5h5"/><path d="M10 2.5V6L8 9v10.5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9l-2-3V2.5"/><path d="M8 13h8"/>',
  basket: '<path d="m5 9 3.5-6h7L19 9"/><path d="M3 9h18l-1.4 9.2A2 2 0 0 1 17.6 20H6.4a2 2 0 0 1-2-1.8z"/><path d="M10 13v3M14 13v3"/>',
  apple: '<path d="M12 7c3-1.8 6.5.2 6.5 4 0 4.5-2.7 9.5-6.5 9.5S5.5 15.5 5.5 11c0-3.8 3.5-5.8 6.5-4z"/><path d="M12 6.5c0-2 1.2-3.5 3-4"/>',
  coffee: '<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 5c0 1-1 1.5-1 2.5M12 5c0 1-1 1.5-1 2.5"/>',
  jar: '<rect x="7" y="9" width="10" height="12" rx="3"/><path d="M8 9V7h8v2"/><rect x="7.5" y="3.5" width="9" height="3.5" rx="1"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="16.5" cy="14.5" r="1"/>',
  gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/>',
  shoe: '<path d="M2.5 17.5h19V15a4 4 0 0 0-4-4h-5.5L9 8.5 6.5 11H4a1.5 1.5 0 0 0-1.5 1.5z"/><path d="M2.5 17.5v1h19v-1"/><path d="m9 8.5 2 2.6"/>',
  smarthome: '<circle cx="12" cy="10" r="7"/><circle cx="12" cy="8.2" r="1"/><circle cx="9.9" cy="11.6" r="1"/><circle cx="14.1" cy="11.6" r="1"/><path d="M12 17v2.5"/><path d="M8.5 21.5h7"/>',
  mouse: '<rect x="7.5" y="3.5" width="9" height="17" rx="4.5"/><path d="M12 3.5v2.5"/><rect x="11.2" y="6" width="1.6" height="3" rx="0.8"/>',
  keyboard: '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M18 13.5H6"/>',
  drone: '<rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M9.2 9.2 6.3 6.3M14.8 9.2l2.9-2.9M9.2 14.8l-2.9 2.9M14.8 14.8l2.9 2.9"/><path d="M3.5 5.5h5M15.5 5.5h5M3.5 18.5h5M15.5 18.5h5"/>',
  cream: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="3"/><path d="M7 10.5V9.2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.3"/><path d="M12 7.2V4.5"/><path d="M9 4.5h6"/>',
  table: '<ellipse cx="12" cy="6" rx="7.5" ry="2.4"/><path d="M4.5 6.4V19M19.5 6.4V19M12 8.4V19"/><path d="M4.5 19h15"/>',
  mat: '<circle cx="7.5" cy="12" r="4"/><circle cx="7.5" cy="12" r="1.2"/><path d="M7.5 8H16a4 4 0 0 1 0 8H7.5"/><path d="M16 9.5v5"/>',
  tent: '<path d="m12 3.5 9.5 17h-19z"/><path d="m12 11 3 9.5h-6z"/>',
  banana: '<path d="M4.5 3.5c.4 6.7 5.3 12 12 12 1.7 0 3.2-.4 4.4-1.2-.9 4.6-5.4 7.2-9.7 7.2C5.7 21.5 2.5 16.6 2.5 10.5c0-2.5.7-5 2-7z"/><path d="M4.5 3.5 3 2"/>',
  belt: '<rect x="10" y="7" width="9.5" height="10" rx="2.5"/><path d="M10 10.5H5a2 2 0 0 0 0 4h5"/><path d="M14.5 7v10"/><path d="M19.5 12h1.5"/>',

  // Additional product-art glyphs for the Recommended-for-you catalog
  // (recommended-data.js). Same 24-unit stroke grid as the set above.
  notebook: '<rect x="4" y="5" width="16" height="10.5" rx="1.5"/><path d="M2.5 18.5h19"/><path d="M3 18.5 4 15.5h16l1 3"/>',
  tablet: '<rect x="4.5" y="3" width="15" height="18" rx="2.5"/><circle cx="12" cy="18" r="0.8"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="12" rx="2"/><path d="M12 16v3.5"/><path d="M8.5 19.5h7"/>',
  webcam: '<circle cx="12" cy="10" r="4.2"/><path d="M12 14.2v2.3a3 3 0 0 0 3 3h2"/><rect x="17.5" y="17.5" width="4" height="4" rx="1"/><path d="M5 18.5h4"/>',
  powerbank: '<rect x="6" y="3" width="12" height="18" rx="2.5"/><rect x="9.5" y="6" width="5" height="3" rx="1"/><path d="M12.6 11 10 15h3l-1 4 3.4-5h-3z"/>',
  charger: '<rect x="5" y="8" width="14" height="4" rx="2"/><path d="M12 12v3.5"/><path d="M8 20.5a4 4 0 0 1 8 0z"/>',
  cable: '<path d="M6 4v5a3 3 0 0 0 3 3h6"/><path d="M15 12h3.5"/><rect x="18.5" y="9.5" width="3" height="5" rx="1.2"/><path d="M6 4h4"/>',
  usbhub: '<rect x="3" y="7.5" width="13" height="7.5" rx="2"/><rect x="16" y="9.5" width="5" height="3.5" rx="1"/><path d="M6.5 15v3M9.5 15v3M12.5 15v3"/>',
  jacket: '<path d="m9 3 3 2 3-2 3.5 1.5 1.5 5-2.5 1.2V20a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9.3L5.5 9.5 7 4.5z"/><path d="M12 6v15"/>',
  cap: '<path d="M4.5 13.5a7.5 7.5 0 0 1 15 0"/><path d="M3 15.5h18"/><path d="M12 6v7.5"/><path d="M17 15.5c3 .4 4.5 1.6 4.5 3h-5"/>',
  backpack: '<path d="M7 8a5 5 0 0 1 10 0v11a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z"/><path d="M9.5 8V6a2.5 2.5 0 0 1 5 0v2"/><rect x="9" y="13" width="6" height="4" rx="1"/>',
  airfryer: '<rect x="4" y="6" width="16" height="13" rx="3"/><rect x="6.5" y="9.5" width="11" height="3" rx="1.5"/><path d="M9 16.5h6"/><path d="M12 6V3.5"/>',
  vacuum: '<circle cx="12" cy="13" r="7.5"/><circle cx="12" cy="13" r="2"/><path d="M12 5.5V3"/><path d="M4.6 8 2.8 6.4M19.4 8l1.8-1.6"/>',
  coffeeMaker: '<path d="M6 3h9v4H6z"/><path d="M6.5 7h8l1 12a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2z"/><path d="M15.5 11h3a2 2 0 0 1 0 4h-3.4"/>',
  diffuser: '<path d="M9 8h6l1.5 10a2 2 0 0 1-2 2.5h-5a2 2 0 0 1-2-2.5z"/><path d="M10.5 8V6.5a1.5 1.5 0 0 1 3 0V8"/><path d="M12 2.5c1.5 1.6 1.2 2.8 0 3-1.2-.2-1.5-1.4 0-3z"/>',
};

/* Soft gradient (light -> deeper tint of the category hue) + deep icon stroke. */
export const CATEGORY_HUES = {
  electronics: { from: '#EEF2FF', to: '#C7D2FE', fg: '#4F46E5' },
  fashion: { from: '#FFF1F2', to: '#FECDD3', fg: '#E11D48' },
  beauty: { from: '#FAF5FF', to: '#E9D5FF', fg: '#9333EA' },
  home: { from: '#F0FDFA', to: '#99F6E4', fg: '#0D9488' },
  sports: { from: '#FFF7ED', to: '#FED7AA', fg: '#EA580C' },
  groceries: { from: '#F0FDF4', to: '#BBF7D0', fg: '#16A34A' },
  accessories: { from: '#F8FAFC', to: '#E2E8F0', fg: '#475569' },
};

/* ---------------------------------------------------------------------------
 * Rich product illustrations. Every Flash Sale item (and the product page
 * gallery of the same products) gets a detailed flat-vector product drawing
 * instead of the small stroke-glyph tile. Same generated-SVG approach as
 * everything above: no image files, no external URLs, nothing to 404.
 *
 * Keyed by product id, not art kind, so lookalike products diverge (over-ear
 * headphones vs earbuds, fitness smartwatch vs steel watch, tee vs dress).
 * Products without an entry fall back to the category tile above.
 *
 * Each builder returns inner SVG for the shared 400x400 canvas with the
 * product centered on (200, ~200) above a shared ground shadow, drawn flat
 * with one accent family + neutrals so the set reads as one catalog.
 * --------------------------------------------------------------------------- */

function groundShadow(cx, cy, rx, ry) {
  return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#1e293b" opacity="0.10"/>';
}

function artHeadphones() {
  return groundShadow(200, 330, 108, 16)
    + '<path d="M112 208v-26a88 88 0 0 1 176 0v26" fill="none" stroke="#312E81" stroke-width="26" stroke-linecap="round"/>'
    + '<path d="M124 196v-14a76 76 0 0 1 152 0v14" fill="none" stroke="#8B5CF6" stroke-width="6" stroke-linecap="round" opacity="0.85"/>'
    + '<rect x="102" y="200" width="20" height="24" rx="9" fill="#312E81"/>'
    + '<rect x="278" y="200" width="20" height="24" rx="9" fill="#312E81"/>'
    + '<rect x="82" y="212" width="60" height="88" rx="28" fill="#5B21B6"/>'
    + '<rect x="258" y="212" width="60" height="88" rx="28" fill="#5B21B6"/>'
    + '<ellipse cx="112" cy="256" rx="17" ry="30" fill="#EDE9FE"/>'
    + '<ellipse cx="288" cy="256" rx="17" ry="30" fill="#EDE9FE"/>'
    + '<circle cx="288" cy="224" r="3" fill="#F5F3FF" opacity="0.9"/>';
}

function artPhone() {
  return groundShadow(200, 330, 84, 13)
    + '<rect x="260" y="122" width="6" height="30" rx="3" fill="#0F172A"/>'
    + '<rect x="134" y="114" width="6" height="22" rx="3" fill="#0F172A"/>'
    + '<rect x="142" y="72" width="116" height="232" rx="28" fill="#0F172A"/>'
    + '<rect x="150" y="82" width="100" height="212" rx="20" fill="#3730A3"/>'
    + '<path d="M160 82h24l-26 212h-10z" fill="#ffffff" opacity="0.10"/>'
    + '<rect x="184" y="90" width="32" height="9" rx="4.5" fill="#0F172A"/>'
    + '<circle cx="200" cy="278" r="9" fill="#0F172A"/>';
}

function artSpeaker() {
  return groundShadow(200, 330, 84, 13)
    + '<path d="M189 106c0-13 22-13 22 0" fill="none" stroke="#134E4A" stroke-width="7" stroke-linecap="round"/>'
    + '<rect x="150" y="106" width="100" height="200" rx="46" fill="#0D9488"/>'
    + '<circle cx="200" cy="178" r="38" fill="#115E59"/>'
    + '<circle cx="200" cy="178" r="24" fill="none" stroke="#5EEAD4" stroke-width="3" opacity="0.9"/>'
    + '<circle cx="200" cy="178" r="7" fill="#5EEAD4"/>'
    + '<rect x="168" y="242" width="64" height="30" rx="15" fill="#134E4A" opacity="0.55"/>'
    + '<circle cx="200" cy="288" r="4" fill="#99F6E4"/>';
}

function artEarbuds() {
  return groundShadow(200, 330, 104, 15)
    + '<g transform="rotate(-10 168 150)">'
    + '<rect x="160" y="148" width="15" height="70" rx="7.5" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="2"/>'
    + '<circle cx="167" cy="136" r="21" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>'
    + '<circle cx="160" cy="131" r="6" fill="#C7D2FE"/>'
    + '</g>'
    + '<g transform="rotate(10 232 150)">'
    + '<rect x="224" y="148" width="15" height="70" rx="7.5" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="2"/>'
    + '<circle cx="232" cy="136" r="21" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>'
    + '<circle cx="225" cy="131" r="6" fill="#C7D2FE"/>'
    + '</g>'
    + '<rect x="114" y="216" width="172" height="100" rx="34" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>'
    + '<path d="M122 252h156" stroke="#E2E8F0" stroke-width="3"/>'
    + '<circle cx="200" cy="268" r="5" fill="#A5B4FC"/>';
}

function artWatchFit() {
  return groundShadow(200, 344, 86, 12)
    + '<rect x="170" y="64" width="60" height="88" rx="20" fill="#312E81"/>'
    + '<rect x="170" y="248" width="60" height="88" rx="20" fill="#312E81"/>'
    + '<circle cx="200" cy="300" r="3" fill="#1E1B4B"/><circle cx="200" cy="316" r="3" fill="#1E1B4B"/>'
    + '<rect x="146" y="140" width="108" height="122" rx="32" fill="#1E1B4B"/>'
    + '<rect x="156" y="150" width="88" height="102" rx="26" fill="#0F172A"/>'
    + '<circle cx="200" cy="201" r="34" fill="none" stroke="#F43F5E" stroke-width="9" stroke-dasharray="160 214" stroke-linecap="round" transform="rotate(-90 200 201)"/>'
    + '<circle cx="200" cy="201" r="23" fill="none" stroke="#2DD4BF" stroke-width="9" stroke-dasharray="108 145" stroke-linecap="round" transform="rotate(-90 200 201)"/>'
    + '<circle cx="200" cy="201" r="12" fill="none" stroke="#F59E0B" stroke-width="9" stroke-dasharray="57 76" stroke-linecap="round" transform="rotate(-90 200 201)"/>'
    + '<rect x="252" y="168" width="10" height="24" rx="5" fill="#8B5CF6"/>';
}

function artTee() {
  return groundShadow(200, 336, 104, 14)
    + '<path d="M150 92 L94 120 L116 188 L146 176 V310 Q200 322 254 310 V176 L284 188 L306 120 L250 92 Q226 116 200 116 Q174 116 150 92 Z" fill="#FAFAF9" stroke="#D6D3D1" stroke-width="3" stroke-linejoin="round"/>'
    + '<path d="M150 92 Q174 116 200 116 Q226 116 250 92" fill="none" stroke="#D6D3D1" stroke-width="6" stroke-linecap="round"/>'
    + '<path d="M146 176 L156 130 M254 176 L244 130" stroke="#E7E5E4" stroke-width="3"/>'
    + '<path d="M146 304 Q200 316 254 304" fill="none" stroke="#E7E5E4" stroke-width="3"/>'
    + '<rect x="192" y="150" width="16" height="12" rx="2" fill="#E7E5E4"/>';
}

function artDress() {
  return groundShadow(200, 340, 96, 14)
    + '<path d="M164 78 L172 122 M236 78 L228 122" stroke="#B98A5A" stroke-width="5" stroke-linecap="round" fill="none"/>'
    + '<path d="M162 120 Q200 136 238 120 L242 194 Q200 208 158 194 Z" fill="#EAD9BC" stroke="#C4A47C" stroke-width="2.5" stroke-linejoin="round"/>'
    + '<path d="M158 196 Q200 210 242 196 L246 210 Q200 224 154 210 Z" fill="#D9BE9B"/>'
    + '<circle cx="200" cy="218" r="6" fill="#C4A47C"/>'
    + '<path d="M156 212 Q200 226 244 212 L274 328 Q200 348 126 328 Z" fill="#EAD9BC" stroke="#C4A47C" stroke-width="2.5" stroke-linejoin="round"/>'
    + '<path d="M176 228 Q180 280 168 330 M200 232 Q202 288 200 340 M224 228 Q220 280 232 330" stroke="#C4A47C" stroke-width="2" fill="none" opacity="0.55"/>'
    + '<path d="M128 330 Q200 350 272 330" stroke="#C4A47C" stroke-width="3" fill="none"/>';
}

function artSerum() {
  return groundShadow(200, 326, 78, 12)
    + '<circle cx="200" cy="98" r="17" fill="#1E293B"/>'
    + '<rect x="186" y="110" width="28" height="16" rx="5" fill="#334155"/>'
    + '<rect x="182" y="124" width="36" height="34" rx="7" fill="#D97706"/>'
    + '<rect x="168" y="156" width="64" height="142" rx="14" fill="#F59E0B"/>'
    + '<rect x="176" y="164" width="14" height="126" rx="7" fill="#FCD34D" opacity="0.55"/>'
    + '<rect x="176" y="192" width="48" height="62" rx="7" fill="#FFFBEB"/>'
    + '<rect x="184" y="204" width="32" height="5" rx="2.5" fill="#D97706" opacity="0.6"/>'
    + '<rect x="188" y="216" width="24" height="5" rx="2.5" fill="#D97706" opacity="0.45"/>'
    + '<rect x="184" y="228" width="28" height="5" rx="2.5" fill="#D97706" opacity="0.35"/>';
}

function artArmchair() {
  return groundShadow(200, 322, 112, 15)
    + '<rect x="126" y="112" width="148" height="112" rx="38" fill="#DED3C0"/>'
    + '<circle cx="164" cy="158" r="4" fill="#B5A284" opacity="0.9"/>'
    + '<circle cx="200" cy="150" r="4" fill="#B5A284" opacity="0.9"/>'
    + '<circle cx="236" cy="158" r="4" fill="#B5A284" opacity="0.9"/>'
    + '<rect x="104" y="148" width="36" height="104" rx="18" fill="#C9B99F"/>'
    + '<rect x="260" y="148" width="36" height="104" rx="18" fill="#C9B99F"/>'
    + '<rect x="118" y="196" width="164" height="56" rx="24" fill="#D6C6AC"/>'
    + '<rect x="112" y="240" width="176" height="24" rx="12" fill="#C9B99F"/>'
    + '<rect x="130" y="262" width="14" height="32" rx="5" fill="#8A5A2B"/>'
    + '<rect x="256" y="262" width="14" height="32" rx="5" fill="#8A5A2B"/>';
}

function artDumbbell() {
  return groundShadow(200, 318, 110, 14)
    + '<rect x="118" y="192" width="164" height="17" rx="8.5" fill="#94A3B8"/>'
    + '<line x1="158" y1="200.5" x2="242" y2="200.5" stroke="#64748B" stroke-width="5" stroke-dasharray="5 5"/>'
    + '<rect x="146" y="168" width="9" height="65" rx="4.5" fill="#475569"/>'
    + '<rect x="245" y="168" width="9" height="65" rx="4.5" fill="#475569"/>'
    + '<rect x="122" y="152" width="24" height="98" rx="10" fill="#334155"/>'
    + '<rect x="254" y="152" width="24" height="98" rx="10" fill="#334155"/>'
    + '<rect x="94" y="142" width="30" height="118" rx="12" fill="#1E293B"/>'
    + '<rect x="276" y="142" width="30" height="118" rx="12" fill="#1E293B"/>';
}

function artCoffee() {
  return groundShadow(200, 330, 92, 14)
    + '<rect x="140" y="102" width="120" height="30" rx="8" fill="#78350F"/>'
    + '<path d="M138 128 L262 128 L272 314 Q200 332 128 314 Z" fill="#B45309"/>'
    + '<path d="M138 128 L262 128 L264 152 L136 152 Z" fill="#92400E"/>'
    + '<circle cx="200" cy="216" r="44" fill="#FEF3C7"/>'
    + '<g transform="rotate(-28 200 216)"><ellipse cx="200" cy="216" rx="13" ry="19" fill="none" stroke="#92400E" stroke-width="4.5"/><path d="M200 197v38" stroke="#92400E" stroke-width="4.5" fill="none"/></g>';
}

function artWatchSteel() {
  return groundShadow(200, 338, 92, 13)
    + '<rect x="178" y="66" width="44" height="80" rx="10" fill="#CBD5E1"/>'
    + '<path d="M182 84h36M182 100h36M182 116h36" stroke="#94A3B8" stroke-width="3"/>'
    + '<rect x="178" y="254" width="44" height="80" rx="10" fill="#CBD5E1"/>'
    + '<path d="M182 270h36M182 286h36M182 302h36" stroke="#94A3B8" stroke-width="3"/>'
    + '<circle cx="200" cy="200" r="76" fill="#E2E8F0"/>'
    + '<circle cx="200" cy="200" r="62" fill="#F8FAFC"/>'
    + '<rect x="272" y="190" width="14" height="20" rx="6" fill="#94A3B8"/>'
    + '<path d="M200 156v9M200 235v9M156 200h9M235 200h9" stroke="#475569" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M200 200 L200 170" stroke="#1E293B" stroke-width="5" stroke-linecap="round"/>'
    + '<path d="M200 200 L222 212" stroke="#1E293B" stroke-width="4" stroke-linecap="round"/>'
    + '<circle cx="200" cy="200" r="5" fill="#1E293B"/>';
}

function artShoe() {
  return groundShadow(200, 324, 118, 13)
    + '<path d="M100 250 C100 238 108 232 118 230 L130 196 Q134 184 148 184 Q162 184 168 172 L178 160 Q186 150 198 154 L262 196 Q296 214 302 240 L304 250 Z" fill="#F43F5E"/>'
    + '<path d="M262 196 Q296 214 302 240 L304 250 L282 250 Q278 218 254 204 Z" fill="#FDA4AF" opacity="0.8"/>'
    + '<path d="M130 196 Q134 184 148 184 Q162 184 168 172 L172 166 L146 190 Q136 202 132 216 L118 230 Z" fill="#BE123C" opacity="0.5"/>'
    + '<path d="M208 166l-15 17 M225 176l-15 17 M242 186l-15 17" stroke="#FFF1F2" stroke-width="5" stroke-linecap="round" fill="none"/>'
    + '<rect x="92" y="244" width="224" height="30" rx="15" fill="#F8FAFC"/>'
    + '<path d="M92 262 L316 262 Q318 282 296 282 L112 282 Q90 282 92 262 Z" fill="#0F172A"/>'
    + '<rect x="106" y="282" width="14" height="6" rx="2" fill="#0F172A"/><rect x="134" y="282" width="14" height="6" rx="2" fill="#0F172A"/><rect x="162" y="282" width="14" height="6" rx="2" fill="#0F172A"/><rect x="190" y="282" width="14" height="6" rx="2" fill="#0F172A"/><rect x="218" y="282" width="14" height="6" rx="2" fill="#0F172A"/><rect x="246" y="282" width="14" height="6" rx="2" fill="#0F172A"/><rect x="274" y="282" width="14" height="6" rx="2" fill="#0F172A"/>';
}

/* -----------------------------------------------------------------------
 * Second wave: the remaining catalog products. Same drawing rules as the
 * builders above — 400x400 canvas, product centered near (200, ~200) over
 * the shared ground shadow, flat rounded shapes, a soft white highlight,
 * one accent family + indigo/slate neutrals. No backgrounds here: the
 * halo circle and per-category gradient come from productArtView().
 * ----------------------------------------------------------------------- */

function artActionCamera() {
  return groundShadow(200, 314, 104, 13)
    + '<rect x="186" y="98" width="28" height="16" rx="6" fill="#475569"/>'
    + '<rect x="118" y="110" width="164" height="116" rx="26" fill="#312E81"/>'
    + '<rect x="130" y="122" width="12" height="92" rx="6" fill="#ffffff" opacity="0.10"/>'
    + '<circle cx="180" cy="168" r="44" fill="#1E1B4B"/>'
    + '<circle cx="180" cy="168" r="33" fill="none" stroke="#8B5CF6" stroke-width="5"/>'
    + '<circle cx="180" cy="168" r="18" fill="#7C3AED"/>'
    + '<circle cx="174" cy="161" r="5" fill="#F5F3FF" opacity="0.85"/>'
    + '<rect x="238" y="132" width="32" height="56" rx="8" fill="#E0E7FF"/>'
    + '<circle cx="246" cy="144" r="4" fill="#F43F5E"/>'
    + '<rect x="242" y="154" width="24" height="24" rx="4" fill="#A5B4FC"/>'
    + '<rect x="134" y="226" width="16" height="44" rx="6" fill="#475569"/>'
    + '<rect x="250" y="226" width="16" height="44" rx="6" fill="#475569"/>'
    + '<rect x="126" y="268" width="148" height="16" rx="8" fill="#334155"/>';
}

function artSmartTV() {
  return groundShadow(200, 320, 122, 13)
    + '<defs><clipPath id="tvs-p04"><rect x="72" y="120" width="256" height="150" rx="7"/></clipPath></defs>'
    + '<rect x="60" y="108" width="280" height="174" rx="12" fill="#0F172A"/>'
    + '<g clip-path="url(#tvs-p04)">'
    + '<rect x="72" y="120" width="256" height="150" fill="#1E1B4B"/>'
    + '<circle cx="130" cy="150" r="90" fill="#7C3AED" opacity="0.9"/>'
    + '<circle cx="260" cy="250" r="110" fill="#4C1D95" opacity="0.9"/>'
    + '<circle cx="310" cy="140" r="70" fill="#2DD4BF" opacity="0.45"/>'
    + '<circle cx="205" cy="205" r="55" fill="#F43F5E" opacity="0.28"/>'
    + '<circle cx="110" cy="250" r="50" fill="#2DD4BF" opacity="0.3"/>'
    + '<circle cx="150" cy="128" r="3" fill="#F5F3FF" opacity="0.9"/>'
    + '<circle cx="286" cy="236" r="2.5" fill="#F5F3FF" opacity="0.8"/>'
    + '</g>'
    + '<rect x="138" y="280" width="18" height="28" rx="5" fill="#334155"/>'
    + '<rect x="244" y="280" width="18" height="28" rx="5" fill="#334155"/>';
}

function artSleeve() {
  return groundShadow(200, 304, 112, 13)
    + '<rect x="236" y="88" width="56" height="66" rx="8" fill="#E2E8F0"/>'
    + '<rect x="242" y="94" width="44" height="54" rx="5" fill="#F8FAFC"/>'
    + '<rect x="236" y="144" width="56" height="10" rx="5" fill="#94A3B8"/>'
    + '<rect x="100" y="142" width="190" height="134" rx="20" fill="#1E3A8A"/>'
    + '<rect x="100" y="142" width="190" height="28" rx="14" fill="#1E40AF"/>'
    + '<path d="M106 170 H284" stroke="#E2E8F0" stroke-width="3" stroke-dasharray="3 5"/>'
    + '<rect x="266" y="176" width="20" height="9" rx="4" fill="#CBD5E1"/>'
    + '<rect x="114" y="152" width="12" height="112" rx="6" fill="#ffffff" opacity="0.10"/>';
}

function artChargingStand() {
  return groundShadow(200, 306, 96, 12)
    + '<rect x="170" y="140" width="60" height="124" rx="12" fill="#1E293B"/>'
    + '<g transform="rotate(-14 200 190)">'
    + '<rect x="152" y="88" width="96" height="196" rx="20" fill="#0F172A"/>'
    + '<rect x="160" y="96" width="80" height="180" rx="14" fill="#312E81"/>'
    + '<rect x="166" y="102" width="12" height="120" rx="6" fill="#ffffff" opacity="0.10"/>'
    + '<circle cx="206" cy="180" r="40" fill="#2DD4BF" opacity="0.18"/>'
    + '<path d="M206 158 l-20 34 h16 l-8 30 26 -40 h-16 z" fill="#5EEAD4"/>'
    + '</g>'
    + '<rect x="128" y="252" width="144" height="24" rx="12" fill="#0F172A"/>'
    + '<circle cx="200" cy="264" r="4" fill="#5EEAD4"/>';
}

function artUsbHub() {
  return groundShadow(200, 306, 126, 12)
    + '<path d="M304 204 C338 204 348 226 348 252" fill="none" stroke="#475569" stroke-width="10" stroke-linecap="round"/>'
    + '<rect x="338" y="252" width="20" height="32" rx="5" fill="#1E293B"/>'
    + '<rect x="342" y="284" width="12" height="14" rx="2" fill="#94A3B8"/>'
    + '<rect x="118" y="236" width="18" height="12" rx="4" fill="#94A3B8"/>'
    + '<rect x="264" y="236" width="18" height="12" rx="4" fill="#94A3B8"/>'
    + '<rect x="96" y="176" width="208" height="64" rx="16" fill="#CBD5E1"/>'
    + '<rect x="96" y="170" width="208" height="20" rx="10" fill="#E2E8F0"/>'
    + '<rect x="104" y="173" width="56" height="5" rx="2.5" fill="#ffffff" opacity="0.6"/>'
    + '<rect x="114" y="196" width="54" height="20" rx="3" fill="#0F172A"/>'
    + '<rect x="119" y="202" width="44" height="8" rx="2" fill="#334155"/>'
    + '<rect x="180" y="196" width="34" height="20" rx="3" fill="#0F172A"/>'
    + '<rect x="185" y="201" width="24" height="10" rx="2" fill="#94A3B8"/>'
    + '<rect x="222" y="196" width="34" height="20" rx="3" fill="#0F172A"/>'
    + '<rect x="227" y="201" width="24" height="10" rx="2" fill="#94A3B8"/>'
    + '<rect x="264" y="196" width="32" height="20" rx="3" fill="#0F172A"/>'
    + '<rect x="268" y="200" width="24" height="12" rx="2" fill="#64748B"/>';
}

function artHomeHub() {
  return groundShadow(200, 298, 92, 12)
    + '<ellipse cx="200" cy="272" rx="66" ry="14" fill="#334155"/>'
    + '<ellipse cx="200" cy="264" rx="66" ry="14" fill="#475569"/>'
    + '<circle cx="200" cy="192" r="76" fill="#8B5CF6"/>'
    + '<ellipse cx="176" cy="162" rx="24" ry="17" fill="#ffffff" opacity="0.25"/>'
    + '<ellipse cx="200" cy="212" rx="42" ry="13" fill="none" stroke="#C4B5FD" stroke-width="6" opacity="0.95"/>'
    + '<circle cx="200" cy="212" r="7" fill="#EDE9FE"/>';
}

function artVerticalMouse() {
  return groundShadow(200, 318, 84, 12)
    + '<g transform="rotate(-14 200 200)">'
    + '<rect x="166" y="106" width="68" height="188" rx="34" fill="#312E81"/>'
    + '<path d="M200 114 V152" stroke="#1E1B4B" stroke-width="3"/>'
    + '<rect x="193" y="120" width="14" height="28" rx="7" fill="#C4B5FD"/>'
    + '<rect x="162" y="170" width="8" height="20" rx="4" fill="#8B5CF6"/>'
    + '<rect x="162" y="196" width="8" height="20" rx="4" fill="#8B5CF6"/>'
    + '<rect x="178" y="126" width="10" height="110" rx="5" fill="#ffffff" opacity="0.12"/>'
    + '<rect x="176" y="280" width="48" height="8" rx="4" fill="#1E1B4B"/>'
    + '</g>';
}

function artClearCase() {
  return groundShadow(200, 338, 82, 12)
    + '<rect x="148" y="86" width="104" height="228" rx="24" fill="#334155"/>'
    + '<rect x="156" y="96" width="88" height="208" rx="16" fill="#1E293B"/>'
    + '<rect x="140" y="80" width="120" height="240" rx="27" fill="#ffffff" opacity="0.26"/>'
    + '<rect x="140" y="80" width="120" height="240" rx="27" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.7"/>'
    + '<rect x="152" y="94" width="42" height="42" rx="15" fill="#ffffff" opacity="0.55"/>'
    + '<circle cx="166" cy="108" r="7" fill="#334155"/>'
    + '<circle cx="181" cy="122" r="7" fill="#334155"/>'
    + '<path d="M154 306 L242 100" stroke="#ffffff" stroke-width="12" stroke-linecap="round" opacity="0.14"/>';
}

function artDenimJacket() {
  return groundShadow(200, 322, 112, 14)
    + '<path d="M126 130 L158 108 H242 L274 130 L296 158 L272 192 L262 174 V298 Q200 312 138 298 V174 L128 192 L104 158 Z" fill="#2563EB"/>'
    + '<path d="M158 108 L134 148 M242 108 L266 148" stroke="#1E40AF" stroke-width="4" fill="none"/>'
    + '<path d="M158 108 L180 128 L166 144 L148 122 Z" fill="#1E40AF"/>'
    + '<path d="M242 108 L220 128 L234 144 L252 122 Z" fill="#1E40AF"/>'
    + '<path d="M200 128 V302" stroke="#1E40AF" stroke-width="5"/>'
    + '<rect x="146" y="178" width="42" height="34" rx="6" fill="#1E40AF"/>'
    + '<rect x="212" y="178" width="42" height="34" rx="6" fill="#1E40AF"/>'
    + '<circle cx="167" cy="196" r="3" fill="#D97706"/><circle cx="233" cy="196" r="3" fill="#D97706"/>'
    + '<circle cx="200" cy="158" r="4" fill="#D97706"/><circle cx="200" cy="192" r="4" fill="#D97706"/>'
    + '<circle cx="200" cy="226" r="4" fill="#D97706"/><circle cx="200" cy="260" r="4" fill="#D97706"/>'
    + '<path d="M138 292 q62 14 124 0 v10 q-62 14 -124 0 z" fill="#1E40AF"/>'
    + '<path d="M156 128 l-24 22 12 40" stroke="#ffffff" stroke-width="6" opacity="0.12" fill="none" stroke-linecap="round"/>';
}

function artCrossbody() {
  return groundShadow(200, 292, 104, 13)
    + '<path d="M132 92 C164 58 236 58 268 92 M132 92 L154 152 M268 92 L246 152" fill="none" stroke="#B98A5A" stroke-width="9" stroke-linecap="round"/>'
    + '<rect x="130" y="148" width="140" height="110" rx="28" fill="#1F2937"/>'
    + '<path d="M130 176 h140 v14 q-70 24 -140 0 z" fill="#374151"/>'
    + '<rect x="188" y="188" width="24" height="13" rx="4" fill="#D97706"/>'
    + '<circle cx="146" cy="152" r="5" fill="#D97706"/>'
    + '<circle cx="254" cy="152" r="5" fill="#D97706"/>'
    + '<path d="M146 244 h108" stroke="#4B5563" stroke-width="3" stroke-dasharray="4 4"/>'
    + '<rect x="142" y="156" width="10" height="88" rx="5" fill="#ffffff" opacity="0.08"/>';
}

function artRetroSunglasses() {
  return groundShadow(200, 276, 112, 11)
    + '<path d="M104 192 L74 172" stroke="#92400E" stroke-width="10" stroke-linecap="round"/>'
    + '<path d="M296 192 L326 172" stroke="#92400E" stroke-width="10" stroke-linecap="round"/>'
    + '<circle cx="148" cy="196" r="37" fill="#44403C"/>'
    + '<circle cx="252" cy="196" r="37" fill="#44403C"/>'
    + '<circle cx="148" cy="196" r="44" fill="none" stroke="#92400E" stroke-width="13"/>'
    + '<circle cx="252" cy="196" r="44" fill="none" stroke="#92400E" stroke-width="13"/>'
    + '<path d="M186 186 q14 -14 28 0" fill="none" stroke="#92400E" stroke-width="11" stroke-linecap="round"/>'
    + '<ellipse cx="134" cy="182" rx="11" ry="7" fill="#ffffff" opacity="0.3"/>'
    + '<ellipse cx="238" cy="182" rx="11" ry="7" fill="#ffffff" opacity="0.3"/>';
}

function artTote() {
  return groundShadow(200, 322, 106, 13)
    + '<path d="M156 152 C156 100 244 100 244 152" fill="none" stroke="#C4A47C" stroke-width="10"/>'
    + '<path d="M168 152 C168 114 232 114 232 152" fill="none" stroke="#C4A47C" stroke-width="5" opacity="0.6"/>'
    + '<path d="M114 152 H286 L268 294 Q200 308 132 294 Z" fill="#D9C5A0"/>'
    + '<path d="M120 170 H280" stroke="#C4A47C" stroke-width="3" stroke-dasharray="7 6"/>'
    + '<path d="M162 176 L152 288" stroke="#C4A47C" stroke-width="3" opacity="0.55"/>'
    + '<path d="M238 176 L248 288" stroke="#C4A47C" stroke-width="3" opacity="0.55"/>'
    + '<rect x="126" y="180" width="12" height="100" rx="6" fill="#ffffff" opacity="0.14"/>';
}

function artCardigan() {
  return groundShadow(200, 318, 108, 13)
    + '<path d="M150 98 L96 124 L114 190 L146 178 V294 Q200 308 254 294 V178 L286 190 L304 124 L250 98 Q226 122 200 122 Q174 122 150 98 Z" fill="#D9C5A0"/>'
    + '<path d="M150 98 Q200 130 250 98" fill="none" stroke="#B98A5A" stroke-width="6"/>'
    + '<path d="M200 126 V296" stroke="#B98A5A" stroke-width="5"/>'
    + '<circle cx="200" cy="156" r="4.5" fill="#8A5A2B"/><circle cx="200" cy="196" r="4.5" fill="#8A5A2B"/>'
    + '<circle cx="200" cy="236" r="4.5" fill="#8A5A2B"/><circle cx="200" cy="276" r="4.5" fill="#8A5A2B"/>'
    + '<rect x="100" y="176" width="20" height="18" rx="5" fill="#C4A47C"/>'
    + '<rect x="280" y="176" width="20" height="18" rx="5" fill="#C4A47C"/>'
    + '<path d="M146 288 q54 12 108 0 v14 q-54 12 -108 0 z" fill="#C4A47C"/>'
    + '<path d="M166 292 v8 M186 294 v8 M206 294 v8 M226 292 v8" stroke="#B98A5A" stroke-width="2"/>'
    + '<rect x="150" y="140" width="12" height="120" rx="6" fill="#ffffff" opacity="0.12"/>';
}

function artEyeshadowPalette() {
  return groundShadow(200, 306, 116, 12)
    + '<rect x="118" y="90" width="164" height="52" rx="14" fill="#374151"/>'
    + '<rect x="128" y="98" width="144" height="36" rx="9" fill="#E2E8F0" opacity="0.92"/>'
    + '<rect x="138" y="102" width="40" height="8" rx="4" fill="#ffffff" opacity="0.8"/>'
    + '<path d="M112 156 H288" stroke="#D97706" stroke-width="4"/>'
    + '<rect x="100" y="158" width="200" height="122" rx="16" fill="#1F2937"/>'
    + '<rect x="108" y="166" width="184" height="106" rx="10" fill="none" stroke="#D97706" stroke-width="2.5" opacity="0.8"/>'
    + '<circle cx="134" cy="200" r="12" fill="#F5D0C5"/><circle cx="162" cy="200" r="12" fill="#EAB6A2"/>'
    + '<circle cx="190" cy="200" r="12" fill="#D98E73"/><circle cx="218" cy="200" r="12" fill="#B96D55"/>'
    + '<circle cx="246" cy="200" r="12" fill="#8C4A3A"/><circle cx="274" cy="200" r="12" fill="#5C3327"/>'
    + '<circle cx="134" cy="236" r="12" fill="#F9A8D4"/><circle cx="162" cy="236" r="12" fill="#FDA4AF"/>'
    + '<circle cx="190" cy="236" r="12" fill="#FCD34D"/><circle cx="218" cy="236" r="12" fill="#A78BFA"/>'
    + '<circle cx="246" cy="236" r="12" fill="#FDBA74"/><circle cx="274" cy="236" r="12" fill="#FDE68A"/>'
    + '<circle cx="159" cy="232" r="2.5" fill="#ffffff" opacity="0.9"/>'
    + '<circle cx="215" cy="232" r="2.5" fill="#ffffff" opacity="0.9"/>'
    + '<circle cx="271" cy="232" r="2.5" fill="#ffffff" opacity="0.9"/>';
}

function artFaceMist() {
  return groundShadow(200, 308, 78, 12)
    + '<circle cx="242" cy="84" r="4" fill="#ffffff" opacity="0.85"/>'
    + '<circle cx="252" cy="72" r="3" fill="#ffffff" opacity="0.7"/>'
    + '<circle cx="260" cy="62" r="2.5" fill="#ffffff" opacity="0.55"/>'
    + '<path d="M232 80 l14 -10 M240 88 l16 -6" stroke="#ffffff" stroke-width="2" opacity="0.5" stroke-linecap="round"/>'
    + '<rect x="212" y="92" width="16" height="12" rx="3" fill="#DB2777"/>'
    + '<rect x="182" y="86" width="36" height="28" rx="7" fill="#F472B6"/>'
    + '<rect x="188" y="112" width="24" height="22" rx="4" fill="#FBCFE8"/>'
    + '<rect x="168" y="132" width="64" height="158" rx="16" fill="#F9A8D4"/>'
    + '<rect x="174" y="140" width="10" height="132" rx="5" fill="#ffffff" opacity="0.4"/>'
    + '<rect x="176" y="192" width="48" height="62" rx="8" fill="#FFF1F2"/>'
    + '<circle cx="200" cy="212" r="9" fill="#FB7185"/>'
    + '<path d="M184 232 h32 M184 240 h24" stroke="#F9A8D4" stroke-width="3" stroke-linecap="round"/>';
}

function artClayMaskKit() {
  return groundShadow(200, 302, 114, 13)
    + '<path d="M118 96 C158 70 242 70 282 96" fill="none" stroke="#FFF7ED" stroke-width="16" stroke-linecap="round"/>'
    + '<path d="M176 79 q12 6 24 0" stroke="#FDBA74" stroke-width="4" fill="none" opacity="0.7"/>'
    + '<g transform="rotate(-8 150 210)">'
    + '<rect x="108" y="156" width="84" height="108" rx="10" fill="#CD6B4F"/>'
    + '<path d="M118 156 l8 8 M132 156 l8 8" stroke="#B14E36" stroke-width="3"/>'
    + '<rect x="120" y="184" width="60" height="42" rx="6" fill="#FFEDD5"/>'
    + '<path d="M128 196 h44 M128 206 h32" stroke="#CD6B4F" stroke-width="3" stroke-linecap="round"/>'
    + '</g>'
    + '<g transform="rotate(26 258 200)">'
    + '<rect x="250" y="112" width="16" height="92" rx="8" fill="#D97706"/>'
    + '<rect x="248" y="202" width="20" height="14" rx="3" fill="#94A3B8"/>'
    + '<rect x="246" y="214" width="24" height="42" rx="10" fill="#8A5A2B"/>'
    + '</g>'
    + '<ellipse cx="200" cy="258" rx="24" ry="10" fill="#CD6B4F" opacity="0.85"/>'
    + '<ellipse cx="222" cy="250" rx="14" ry="7" fill="#B14E36" opacity="0.85"/>';
}

function artLipstickSet() {
  return groundShadow(200, 306, 104, 12)
    + '<path d="M156 152 v-22 q0 -10 9 -14 l9 5 v31 z" fill="#E11D48"/>'
    + '<rect x="152" y="152" width="30" height="114" rx="7" fill="#FDA4AF"/>'
    + '<rect x="158" y="160" width="6" height="98" rx="3" fill="#ffffff" opacity="0.5"/>'
    + '<path d="M200 178 v-16 q0 -8 7 -11 l7 4 v23 z" fill="#9D174D"/>'
    + '<rect x="196" y="178" width="30" height="88" rx="7" fill="#F9A8D4"/>'
    + '<path d="M244 164 v-18 q0 -9 8 -12 l8 4 v26 z" fill="#BE185D"/>'
    + '<rect x="240" y="164" width="30" height="102" rx="7" fill="#FBCFE8"/>'
    + '<rect x="116" y="266" width="168" height="18" rx="9" fill="#881337"/>'
    + '<path d="M148 296 q52 16 104 0" fill="none" stroke="#E11D48" stroke-width="9" stroke-linecap="round" opacity="0.5"/>';
}

function artTableLamp() {
  return groundShadow(200, 292, 92, 12)
    + '<ellipse cx="200" cy="184" rx="60" ry="12" fill="#FDE68A" opacity="0.8"/>'
    + '<path d="M148 96 H252 L268 178 H132 Z" fill="#FEF3C7"/>'
    + '<path d="M148 96 H252" stroke="#D97706" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M132 178 H268" stroke="#D97706" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M162 108 L150 170" stroke="#ffffff" stroke-width="10" opacity="0.35" stroke-linecap="round"/>'
    + '<rect x="192" y="176" width="16" height="18" fill="#B45309"/>'
    + '<circle cx="200" cy="228" r="36" fill="#FFEDD5"/>'
    + '<ellipse cx="188" cy="216" rx="11" ry="15" fill="#ffffff" opacity="0.5"/>'
    + '<ellipse cx="200" cy="262" rx="27" ry="8" fill="#92400E"/>';
}

function artBedSheets() {
  return groundShadow(200, 302, 114, 13)
    + '<rect x="112" y="234" width="176" height="46" rx="10" fill="#93C5FD"/>'
    + '<rect x="120" y="196" width="160" height="42" rx="10" fill="#BFDBFE"/>'
    + '<path d="M132 196 H268" stroke="#60A5FA" stroke-width="2.5" opacity="0.5"/>'
    + '<rect x="132" y="148" width="136" height="52" rx="20" fill="#F8FAFC" stroke="#BFDBFE" stroke-width="2.5"/>'
    + '<path d="M148 172 q52 10 104 0" stroke="#BFDBFE" stroke-width="3" fill="none"/>'
    + '<ellipse cx="154" cy="162" rx="18" ry="9" fill="#ffffff" opacity="0.7"/>'
    + '<path d="M124 234 H276" stroke="#60A5FA" stroke-width="2.5" opacity="0.7"/>'
    + '<path d="M124 266 H276" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.8"/>';
}

function artWeightedBlanket() {
  return groundShadow(200, 312, 116, 13)
    + '<rect x="104" y="234" width="192" height="48" rx="10" fill="#64748B"/>'
    + '<path d="M124 238 V278 M148 238 V278 M172 238 V278 M196 238 V278 M220 238 V278 M244 238 V278 M268 238 V278" stroke="#475569" stroke-width="2.5" opacity="0.7"/>'
    + '<rect x="112" y="190" width="176" height="48" rx="10" fill="#94A3B8"/>'
    + '<path d="M136 194 V234 M160 194 V234 M184 194 V234 M208 194 V234 M232 194 V234 M256 194 V234" stroke="#64748B" stroke-width="2.5" opacity="0.7"/>'
    + '<path d="M112 240 H288" stroke="#475569" stroke-width="2.5"/>'
    + '<rect x="104" y="276" width="192" height="12" rx="6" fill="#475569"/>'
    + '<rect x="118" y="196" width="12" height="38" rx="6" fill="#ffffff" opacity="0.18"/>';
}

function artCandleTrio() {
  return groundShadow(200, 296, 104, 12)
    + '<circle cx="152" cy="207" r="16" fill="#FDE68A" opacity="0.35"/>'
    + '<rect x="124" y="196" width="56" height="80" rx="10" fill="#FFFBEB" stroke="#FDE68A" stroke-width="2.5"/>'
    + '<rect x="129" y="220" width="46" height="52" rx="7" fill="#FCD34D"/>'
    + '<path d="M152 220 v-12" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M152 200 C158 208 156 214 152 214 C148 214 146 208 152 200 Z" fill="#F59E0B"/>'
    + '<circle cx="152" cy="208" r="3" fill="#FFF7ED"/>'
    + '<rect x="188" y="210" width="52" height="66" rx="10" fill="#FFFBEB" stroke="#FDE68A" stroke-width="2.5"/>'
    + '<rect x="193" y="232" width="42" height="40" rx="7" fill="#FDE68A"/>'
    + '<path d="M214 232 v-10" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>'
    + '<circle cx="214" cy="219" r="2.5" fill="#78350F"/>'
    + '<rect x="248" y="224" width="44" height="52" rx="10" fill="#FFFBEB" stroke="#FDE68A" stroke-width="2.5"/>'
    + '<rect x="253" y="244" width="34" height="28" rx="7" fill="#FCD34D"/>'
    + '<rect x="130" y="202" width="5" height="64" rx="2.5" fill="#ffffff" opacity="0.6"/>'
    + '<rect x="193" y="216" width="5" height="50" rx="2.5" fill="#ffffff" opacity="0.6"/>'
    + '<rect x="253" y="230" width="5" height="38" rx="2.5" fill="#ffffff" opacity="0.6"/>'
    + '<rect x="134" y="236" width="36" height="18" rx="4" fill="#FEF3C7" stroke="#FDE68A" stroke-width="2"/>'
    + '<path d="M140 245 h24" stroke="#D97706" stroke-width="2" stroke-linecap="round"/>';
}

function artSoccerBall() {
  return groundShadow(200, 314, 96, 12)
    + '<defs><clipPath id="ball-p23"><circle cx="200" cy="196" r="86"/></clipPath></defs>'
    + '<circle cx="200" cy="196" r="86" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="2"/>'
    + '<g clip-path="url(#ball-p23)">'
    + '<polygon points="200,166 228,187 218,220 182,220 172,187" fill="#1E293B"/>'
    + '<polygon points="250,100 275,118 265,148 235,148 225,118" fill="#334155"/>'
    + '<polygon points="290,198 308,223 280,248 259,238 259,208" fill="#334155"/>'
    + '<polygon points="226,282 208,307 179,297 179,267 208,257" fill="#334155"/>'
    + '<polygon points="126,248 97,238 97,208 126,198 144,223" fill="#7C3AED"/>'
    + '<polygon points="128,141 128,111 157,101 175,126 157,151" fill="#334155"/>'
    + '<path d="M250 126 L228 187 M282 223 L218 220 M200 282 L182 220 M118 223 L182 220 M149 126 L200 166" stroke="#CBD5E1" stroke-width="2.5" fill="none"/>'
    + '</g>'
    + '<ellipse cx="170" cy="162" rx="22" ry="13" fill="#ffffff" opacity="0.5"/>';
}

function artWaterBottle() {
  return groundShadow(200, 318, 84, 12)
    + '<rect x="188" y="78" width="24" height="16" rx="6" fill="#1E3A8A"/>'
    + '<rect x="176" y="92" width="48" height="30" rx="9" fill="#1E40AF"/>'
    + '<rect x="216" y="96" width="12" height="10" rx="3" fill="#93C5FD"/>'
    + '<rect x="164" y="122" width="72" height="176" rx="24" fill="#60A5FA"/>'
    + '<rect x="164" y="206" width="72" height="20" fill="#2563EB"/>'
    + '<path d="M164 206 h72 M164 226 h72" stroke="#1D4ED8" stroke-width="3"/>'
    + '<circle cx="216" cy="160" r="3" fill="#DBEAFE" opacity="0.8"/>'
    + '<circle cx="206" cy="256" r="2.5" fill="#DBEAFE" opacity="0.8"/>'
    + '<circle cx="222" cy="180" r="2" fill="#DBEAFE" opacity="0.7"/>'
    + '<rect x="172" y="130" width="10" height="156" rx="5" fill="#ffffff" opacity="0.45"/>';
}

function artTrailSunglasses() {
  return groundShadow(200, 278, 118, 11)
    + '<path d="M98 184 L60 168" stroke="#F43F5E" stroke-width="10" stroke-linecap="round"/>'
    + '<path d="M302 184 L340 168" stroke="#F43F5E" stroke-width="10" stroke-linecap="round"/>'
    + '<rect x="96" y="162" width="90" height="72" rx="28" fill="#1E293B"/>'
    + '<rect x="214" y="162" width="90" height="72" rx="28" fill="#1E293B"/>'
    + '<rect x="96" y="162" width="90" height="72" rx="28" fill="none" stroke="#F43F5E" stroke-width="10"/>'
    + '<rect x="214" y="162" width="90" height="72" rx="28" fill="none" stroke="#F43F5E" stroke-width="10"/>'
    + '<path d="M186 180 q14 -12 28 0" fill="none" stroke="#F43F5E" stroke-width="9" stroke-linecap="round"/>'
    + '<ellipse cx="126" cy="186" rx="12" ry="7" fill="#ffffff" opacity="0.35"/>'
    + '<ellipse cx="244" cy="186" rx="12" ry="7" fill="#ffffff" opacity="0.35"/>';
}

function artResistanceBands() {
  return groundShadow(200, 302, 108, 12)
    + '<path d="M110 200 C114 228 158 240 188 244" fill="none" stroke="#94A3B8" stroke-width="4"/>'
    + '<path d="M290 200 C286 228 242 240 212 244" fill="none" stroke="#94A3B8" stroke-width="4"/>'
    + '<ellipse cx="200" cy="252" rx="56" ry="20" fill="none" stroke="#2DD4BF" stroke-width="14"/>'
    + '<ellipse cx="200" cy="214" rx="56" ry="20" fill="none" stroke="#14B8A6" stroke-width="14"/>'
    + '<ellipse cx="200" cy="176" rx="56" ry="20" fill="none" stroke="#0D9488" stroke-width="14"/>'
    + '<g transform="rotate(24 118 168)">'
    + '<rect x="108" y="128" width="20" height="72" rx="10" fill="#134E4A"/>'
    + '<rect x="112" y="132" width="12" height="24" rx="6" fill="#5EEAD4" opacity="0.6"/>'
    + '</g>'
    + '<g transform="rotate(-24 282 168)">'
    + '<rect x="272" y="128" width="20" height="72" rx="10" fill="#134E4A"/>'
    + '<rect x="276" y="132" width="12" height="24" rx="6" fill="#5EEAD4" opacity="0.6"/>'
    + '</g>';
}

function artApples() {
  return groundShadow(200, 306, 108, 12)
    + '<ellipse cx="200" cy="286" rx="98" ry="12" fill="#FEF3C7" opacity="0.85"/>'
    + '<circle cx="248" cy="230" r="42" fill="#EF4444"/>'
    + '<path d="M248 188 q2 -12 10 -18" stroke="#78350F" stroke-width="5" fill="none" stroke-linecap="round"/>'
    + '<circle cx="158" cy="242" r="48" fill="#DC2626"/>'
    + '<path d="M158 194 q0 -14 10 -20" stroke="#78350F" stroke-width="5" fill="none" stroke-linecap="round"/>'
    + '<path d="M168 176 q24 -12 34 2 q-16 12 -34 -2 z" fill="#22C55E"/>'
    + '<ellipse cx="142" cy="226" rx="11" ry="17" fill="#ffffff" opacity="0.35"/>'
    + '<ellipse cx="234" cy="216" rx="8" ry="12" fill="#ffffff" opacity="0.3"/>';
}

function artOliveOil() {
  return groundShadow(200, 318, 92, 12)
    + '<path d="M292 148 q-16 46 -46 70" fill="none" stroke="#65A30D" stroke-width="4" stroke-linecap="round"/>'
    + '<ellipse cx="282" cy="164" rx="13" ry="5" fill="#84CC16" transform="rotate(-32 282 164)"/>'
    + '<ellipse cx="266" cy="192" rx="12" ry="5" fill="#84CC16" transform="rotate(24 266 192)"/>'
    + '<circle cx="252" cy="212" r="8" fill="#4D7C0F"/>'
    + '<circle cx="268" cy="226" r="7" fill="#65A30D"/>'
    + '<rect x="190" y="76" width="20" height="24" rx="5" fill="#D97706"/>'
    + '<rect x="184" y="98" width="32" height="44" rx="6" fill="#3F6212"/>'
    + '<path d="M184 142 H216 L248 178 H152 Z" fill="#3F6212"/>'
    + '<rect x="152" y="176" width="96" height="120" rx="15" fill="#3F6212"/>'
    + '<rect x="164" y="206" width="72" height="54" rx="6" fill="#FEF9C3"/>'
    + '<circle cx="200" cy="226" r="7" fill="#65A30D"/>'
    + '<path d="M174 244 h52" stroke="#65A30D" stroke-width="3" stroke-linecap="round"/>'
    + '<rect x="160" y="186" width="9" height="98" rx="4.5" fill="#A3E635" opacity="0.35"/>';
}

function artHoney() {
  return groundShadow(200, 310, 104, 12)
    + '<g transform="rotate(26 292 168)">'
    + '<rect x="288" y="84" width="11" height="86" rx="5.5" fill="#B98A5A"/>'
    + '<ellipse cx="293.5" cy="184" rx="16" ry="7" fill="#D97706"/>'
    + '<ellipse cx="293.5" cy="194" rx="13" ry="6" fill="#D97706"/>'
    + '<ellipse cx="293.5" cy="203" rx="9" ry="5" fill="#B45309"/>'
    + '</g>'
    + '<circle cx="292" cy="226" r="4" fill="#F59E0B" opacity="0.85"/>'
    + '<rect x="154" y="180" width="92" height="100" rx="12" fill="#F59E0B"/>'
    + '<rect x="146" y="152" width="108" height="134" rx="18" fill="none" stroke="#FCD34D" stroke-width="3"/>'
    + '<rect x="146" y="152" width="108" height="134" rx="18" fill="#ffffff" opacity="0.15"/>'
    + '<rect x="142" y="126" width="116" height="30" rx="10" fill="#92400E"/>'
    + '<path d="M158 126 v30 M176 126 v30 M194 126 v30 M212 126 v30 M230 126 v30 M248 126 v30" stroke="#78350F" stroke-width="3"/>'
    + '<rect x="160" y="200" width="80" height="46" rx="7" fill="#FFFBEB" stroke="#F59E0B" stroke-width="2.5"/>'
    + '<path d="M200 212 q8 10 0 18 q-8 -8 0 -18" fill="#F59E0B"/>'
    + '<path d="M172 238 h56" stroke="#F59E0B" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M246 258 q7 12 0 19 q-7 -7 0 -19" fill="#F59E0B"/>'
    + '<rect x="152" y="158" width="6" height="112" rx="3" fill="#ffffff" opacity="0.5"/>';
}

function artGreenTea() {
  return groundShadow(200, 314, 112, 13)
    + '<g transform="rotate(8 288 226)">'
    + '<rect x="252" y="170" width="72" height="102" rx="8" fill="#F0FDF4" stroke="#86EFAC" stroke-width="2.5"/>'
    + '<rect x="252" y="170" width="72" height="14" rx="7" fill="#86EFAC"/>'
    + '<path d="M282 220 q16 -10 24 2 q-14 10 -24 -2 z" fill="#22C55E"/>'
    + '<path d="M266 244 h44 M266 254 h30" stroke="#86EFAC" stroke-width="3" stroke-linecap="round"/>'
    + '</g>'
    + '<rect x="112" y="150" width="122" height="136" rx="10" fill="#166534"/>'
    + '<path d="M112 168 H234" stroke="#22C55E" stroke-width="2.5" opacity="0.8"/>'
    + '<circle cx="173" cy="216" r="30" fill="none" stroke="#BBF7D0" stroke-width="6" stroke-dasharray="150 40" stroke-linecap="round" transform="rotate(-60 173 216)"/>'
    + '<rect x="112" y="256" width="122" height="30" rx="10" fill="#14532D"/>'
    + '<path d="M124 271 h40" stroke="#4ADE80" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M176 236 q8 -14 0 -26 M198 236 q-8 -14 0 -26" fill="none" stroke="#BBF7D0" stroke-width="4" stroke-linecap="round" opacity="0.85"/>'
    + '<path d="M148 244 h78 l-7 42 q-1.5 10 -11 10 h-42 q-9.5 0 -11 -10 z" fill="#F0FDF4" stroke="#86EFAC" stroke-width="2.5"/>'
    + '<path d="M226 252 q18 6 0 26" fill="none" stroke="#86EFAC" stroke-width="5"/>'
    + '<ellipse cx="187" cy="244" rx="39" ry="6" fill="#4ADE80"/>';
}

function artCardWallet() {
  return groundShadow(200, 296, 106, 13)
    + '<g transform="rotate(-6 176 168)">'
    + '<rect x="138" y="144" width="76" height="50" rx="8" fill="#60A5FA"/>'
    + '<rect x="146" y="152" width="20" height="14" rx="3" fill="#DBEAFE"/>'
    + '</g>'
    + '<g transform="rotate(5 224 166)">'
    + '<rect x="186" y="140" width="76" height="50" rx="8" fill="#FDA4AF"/>'
    + '<rect x="194" y="148" width="20" height="14" rx="3" fill="#FFE4E6"/>'
    + '</g>'
    + '<rect x="116" y="168" width="168" height="106" rx="15" fill="#92400E"/>'
    + '<path d="M284 206 h-46 q-10 0 -10 11 v18 q0 11 10 11 h46 z" fill="#7C2D12"/>'
    + '<circle cx="262" cy="226" r="5.5" fill="#FBBF24"/>'
    + '<rect x="126" y="178" width="148" height="86" rx="10" fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.85"/>'
    + '<rect x="124" y="176" width="10" height="88" rx="5" fill="#ffffff" opacity="0.12"/>';
}

function artStudEarrings() {
  return groundShadow(200, 278, 92, 11)
    + '<polygon points="156,166 179,179 179,205 156,218 133,205 133,179" fill="#A78BFA" stroke="#DDD6FE" stroke-width="2.5"/>'
    + '<path d="M156 166 V218 M133 179 L179 205 M179 179 L133 205" stroke="#8B5CF6" stroke-width="2" opacity="0.7" fill="none"/>'
    + '<polygon points="156,180 167,186 167,198 156,204 145,198 145,186" fill="#C4B5FD"/>'
    + '<rect x="152" y="218" width="8" height="30" rx="4" fill="#CBD5E1"/>'
    + '<rect x="146" y="244" width="20" height="12" rx="5" fill="#94A3B8"/>'
    + '<polygon points="244,166 267,179 267,205 244,218 221,205 221,179" fill="#C4B5FD" stroke="#DDD6FE" stroke-width="2.5"/>'
    + '<path d="M244 166 V218 M221 179 L267 205 M267 179 L221 205" stroke="#8B5CF6" stroke-width="2" opacity="0.7" fill="none"/>'
    + '<polygon points="244,180 255,186 255,198 244,204 233,198 233,186" fill="#EDE9FE"/>'
    + '<rect x="240" y="218" width="8" height="30" rx="4" fill="#CBD5E1"/>'
    + '<rect x="234" y="244" width="20" height="12" rx="5" fill="#94A3B8"/>'
    + '<path d="M200 128 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 z" fill="#EDE9FE"/>';
}

function artTravelPouch() {
  return groundShadow(200, 302, 110, 13)
    + '<rect x="104" y="146" width="192" height="44" rx="14" fill="#1E40AF"/>'
    + '<g transform="rotate(-4 162 152)">'
    + '<rect x="136" y="132" width="52" height="36" rx="6" fill="#E2E8F0"/>'
    + '<rect x="136" y="140" width="52" height="10" fill="#334155"/>'
    + '</g>'
    + '<circle cx="240" cy="152" r="17" fill="none" stroke="#2DD4BF" stroke-width="6"/>'
    + '<rect x="104" y="178" width="192" height="102" rx="18" fill="#1E3A8A"/>'
    + '<path d="M104 178 H296" stroke="#FBBF24" stroke-width="3" stroke-dasharray="2 5"/>'
    + '<circle cx="112" cy="178" r="5" fill="#FBBF24"/>'
    + '<circle cx="288" cy="178" r="5" fill="#FBBF24"/>'
    + '<rect x="122" y="198" width="58" height="11" rx="5.5" fill="#3B82F6"/>'
    + '<rect x="122" y="218" width="58" height="11" rx="5.5" fill="#3B82F6"/>'
    + '<rect x="194" y="198" width="84" height="38" rx="9" fill="none" stroke="#93C5FD" stroke-width="2.5"/>'
    + '<path d="M202 210 h68" stroke="#93C5FD" stroke-width="2.5" stroke-dasharray="4 4"/>'
    + '<rect x="112" y="186" width="10" height="84" rx="5" fill="#ffffff" opacity="0.10"/>';
}

const RICH_ART = {
  p01: artHeadphones, // Aurex Over-Ear Wireless Headphones
  p02: artPhone, // Novo X4 Pro Smartphone
  p03: artActionCamera, // Klarita 4K Action Camera
  p04: artSmartTV, // Vantia 55" Smart TV (sold out — card dims it)
  p05: artSpeaker, // Pikol Mini Bluetooth Speaker
  p06: artEarbuds, // Aurex Wireless Earbuds Pro
  p07: artSleeve, // Mendo Laptop Sleeve 14 inch
  p08: artWatchFit, // Strida Smart Watch Fit
  p09: artTee, // Vantia Oversized Cotton Tee
  p10: artDenimJacket, // Ombra Classic Denim Jacket
  p11: artCrossbody, // Pikol Everyday Crossbody Bag
  p12: artRetroSunglasses, // Ombra Retro Sunglasses
  p13: artTote, // Pikol Canvas Tote Bag
  p14: artSerum, // Klarita Vitamin C Glow Serum
  p15: artEyeshadowPalette, // Luma 12-Shade Eyeshadow Palette
  p16: artFaceMist, // Ombra Rosewater Face Mist
  p17: artClayMaskKit, // Strida Clay Mask Kit
  p18: artArmchair, // Vantia Cloud Armchair
  p19: artTableLamp, // Mendo Ceramic Table Lamp
  p20: artBedSheets, // Klarita Cotton Bed Sheet Set
  p21: artWeightedBlanket, // Vantia Weighted Blanket 5kg
  p22: artDumbbell, // Strida Adjustable Dumbbell Set
  p23: artSoccerBall, // Mendo Match Soccer Ball
  p24: artWaterBottle, // Aurex Sport Water Bottle 1L
  p25: artTrailSunglasses, // Pikol Trail Sport Sunglasses
  p26: artCoffee, // Mendo Arabica Coffee Beans
  p27: artApples, // Pikol Organic Apples, 6 Pack
  p28: artOliveOil, // Klarita Extra Virgin Olive Oil 750ml
  p29: artHoney, // Ombra Wildflower Honey 500g
  p30: artWatchSteel, // Strida Minimal Steel Watch
  p31: artCardWallet, // Ombra Leather Card Wallet
  p32: artStudEarrings, // Pikol Gemstone Stud Earrings
  p33: artTravelPouch, // Vantia Travel Organizer Pouch
  p34: artChargingStand, // Luma Wireless Charging Stand
  p35: artUsbHub, // Novo USB-C Hub, 7-in-1
  p36: artDress, // Vantia Linen Summer Dress
  p37: artCardigan, // Pikol Knit Cardigan
  p38: artLipstickSet, // Luma Matte Lipstick Set
  p39: artCandleTrio, // Mendo Scented Candle Trio
  p40: artResistanceBands, // Pikol Resistance Band Set
  p41: artGreenTea, // Klarita Green Tea, 100 Bags
  p42: artShoe, // Strida Trail Runner Shoes
  p43: artClearCase, // Novo Clear Case for X4 Pro
  p44: artHomeHub, // Mendo Smart Home Hub
  p45: artVerticalMouse, // Ombra Vertical Mouse
};

/* A neutral placeholder for a product that has no photo (or whose photo
 * failed to load): a flat image glyph in the current text colour, so it reads
 * in every theme. Used only by the product detail gallery, when there is truly
 * nothing to show; the generated illustration (productArtView) is a different,
 * richer fallback and is not used for a missing photo. */
export function productPlaceholder(p, cls = 'absolute inset-0 h-full w-full text-zinc-400') {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="' + cls
    + '" role="img" aria-label="' + attrEsc(p && p.name ? p.name : 'Product') + '">'
    + '<rect x="120" y="140" width="160" height="120" rx="12" fill="none" stroke="currentColor" stroke-width="10"/>'
    + '<circle cx="162" cy="184" r="14" fill="currentColor"/>'
    + '<path d="M136 244 L186 196 L224 232 L264 190 L292 218" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'
    + '</svg>';
}

/* Generate the artwork SVG for a product. */
export function productArt(p) {
  // A generated marketplace product has no illustration: wherever the app
  // shows a small thumbnail (cart, checkout, orders) it shows the product's
  // real first photo, with the neutral placeholder if that photo fails.
  if (!p.art && p.generated && p.images && p.images.length) {
    return '<span class="relative block h-full w-full bg-zinc-100"><img src="' + attrEsc(sizedImage(p.images[0], 240))
      + '" alt="" loading="lazy" width="240" height="240" class="h-full w-full object-cover" onerror="unImgFail(this)"></span>';
  }
  return productArtView(p, 0);
}

/* Pexels' CDN resizes on request: ask for the width a surface shows. Any
 * other URL (a committed photo, a data URI) is returned unchanged. */
export function sizedImage(url, w) {
  if (typeof url !== 'string' || !/^https:\/\/images\.pexels\.com\//.test(url)) return url;
  return url.split('?')[0] + '?auto=compress&cs=tinysrgb&fit=crop&w=' + w + '&h=' + w;
}

/* ---------------------------------------------------------------------------
 * Gallery views. Four believable "photos" per product: the same product
 * illustration re-composed with different zoom, placement and background, so
 * the PDP carousel has real images to switch between without any external
 * image requests.
 * ------------------------------------------------------------------------- */
/* Escape a product name for use inside the artwork SVG's aria-label
 * attribute (names can contain quotes, e.g. Vantia 55" Smart TV). */
function attrEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

const GALLERY_VIEWS = [
  { c1: [330, 64, 88, 0.4], c2: [56, 352, 56, 0.3], t: 'translate(140 140) scale(5)' },
  { c1: [60, 70, 100, 0.35], c2: [340, 340, 70, 0.3], t: 'translate(92 92) scale(9)' },
  { c1: [200, 40, 120, 0.3], c2: [80, 360, 90, 0.25], t: 'translate(48 184) scale(7)' },
  { c1: [320, 320, 110, 0.35], c2: [70, 80, 80, 0.3], t: 'translate(115 115) scale(6)', from: '#FFFFFF' },
];

export function productArtView(p, view = 0) {
  const hue = CATEGORY_HUES[p.cat] || CATEGORY_HUES.accessories;
  const v = GALLERY_VIEWS[view % GALLERY_VIEWS.length];
  const from = v.from || hue.from;
  const to = view % GALLERY_VIEWS.length === 1 ? hue.to : (view % GALLERY_VIEWS.length === 3 ? hue.from : hue.to);
  const gid = 'g-' + p.id + '-' + view;
  const rich = RICH_ART[p.id];

  // Rich illustration: a soft white halo behind the product, then the
  // drawing, composed once per product (gallery views vary the background
  // gradient instead of re-composing the drawing). The drawing is centered
  // inside its own 400x400 square, which the square containers render
  // 1:1 — "contain" semantics, never cropped.
  let inner;
  let par = 'xMidYMid slice';
  if (rich) {
    par = 'xMidYMid meet';
    inner = '<circle cx="200" cy="192" r="132" fill="url(#glow-' + gid + ')"/>' + rich();
  } else {
    const paths = ART_ICONS[p.art] || ART_ICONS.bag;
    const [c1x, c1y, c1r, c1o] = v.c1;
    const [c2x, c2y, c2r, c2o] = v.c2;
    inner = '<circle cx="' + c1x + '" cy="' + c1y + '" r="' + c1r + '" fill="#ffffff" opacity="' + c1o + '"/>'
      + '<circle cx="' + c2x + '" cy="' + c2y + '" r="' + c2r + '" fill="#ffffff" opacity="' + c2o + '"/>'
      + '<g transform="' + v.t + '" fill="none" stroke="' + hue.fg + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g>';
  }

  // The artwork is an <img>-equivalent, so it exposes the product name to
  // assistive tech (data-art marks the tier: "rich" illustration vs the
  // glyph fallback — dapp.json tests assert on it).
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="product-img h-full w-full" preserveAspectRatio="' + par + '" data-art="' + (rich ? 'rich' : 'glyph') + '" role="img" aria-label="' + attrEsc(p.name || 'Product') + '">'
    + '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" stop-color="' + from + '"/><stop offset="1" stop-color="' + to + '"/>'
    + '</linearGradient>'
    + (rich
      ? '<radialGradient id="glow-' + gid + '"><stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>'
      : '')
    + '</defs>'
    + '<rect width="400" height="400" fill="url(#' + gid + ')"/>'
    + inner
    + '</svg>';
}
