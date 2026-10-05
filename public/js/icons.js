/* Icon set + product artwork generator.
 *
 * One consistent style across the whole app: 24-unit stroke grid, 2px round
 * strokes (Lucide-style), currentColor, aria-hidden. Product artwork is
 * generated SVG: a soft per-category gradient with either a detailed flat
 * product illustration (rich art, keyed by product id — used for the Flash
 * Sale cards and every other surface that renders the same product) or the
 * category icon drawn large in its deep hue. No external image requests, so
 * the grid renders instantly and offline, and there is nothing that can
 * fail to load (the legacy category tile doubles as the fallback when a
 * product has no rich illustration).
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
  /* Line glyphs for the app-shortcuts strip (same 24-unit grid, 2px round
   * strokes, so the set reads as one icon family). `star` above (fill) is
   * reserved for ratings; shortcuts use the outline. */
  starOutline: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  tally: '<path d="M5 5v14M9 5v14M13 5v14M17 5v14"/><path d="M2.5 17 21.5 7"/>',
  map: '<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15"/><path d="M15 6v15"/>',
  gamepad: '<line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
  chartLine: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m7 12 3-3 4 2 5-5"/>',
  chefHat: '<path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.1A5 5 0 1 0 6.273 13.55c.411.256.727.643.727 1.1V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/>',
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

const RICH_ART = {
  p01: artHeadphones, // Aurex Over-Ear Wireless Headphones
  p02: artPhone, // Novo X4 Pro Smartphone
  p05: artSpeaker, // Pikol Mini Bluetooth Speaker
  p06: artEarbuds, // Aurex Wireless Earbuds Pro
  p08: artWatchFit, // Strida Smart Watch Fit
  p09: artTee, // Vantia Oversized Cotton Tee
  p14: artSerum, // Klarita Vitamin C Glow Serum
  p18: artArmchair, // Vantia Cloud Armchair
  p22: artDumbbell, // Strida Adjustable Dumbbell Set
  p26: artCoffee, // Mendo Arabica Coffee Beans
  p30: artWatchSteel, // Strida Minimal Steel Watch
  p36: artDress, // Vantia Linen Summer Dress
  p42: artShoe, // Strida Trail Runner Shoes
};

/* Generate the artwork SVG for a product. */
export function productArt(p) {
  return productArtView(p, 0);
}

/* ---------------------------------------------------------------------------
 * Gallery views. Four believable "photos" per product: the same product
 * illustration re-composed with different zoom, placement and background, so
 * the PDP carousel has real images to switch between without any external
 * image requests.
 * ------------------------------------------------------------------------- */
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

  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="product-img h-full w-full" preserveAspectRatio="' + par + '" role="img" aria-hidden="true">'
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
