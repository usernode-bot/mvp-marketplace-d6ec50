/* Icon set + product artwork generator.
 *
 * One consistent style across the whole app: 24-unit stroke grid, 2px round
 * strokes (Lucide-style), currentColor, aria-hidden. Product artwork is
 * generated SVG: a soft per-category gradient with the category icon drawn
 * large in its deep hue. No external image requests, so the grid renders
 * instantly and offline.
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
  const stroke = STROKE_ICONS[name];
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
  const paths = ART_ICONS[p.art] || ART_ICONS.bag;
  const v = GALLERY_VIEWS[view % GALLERY_VIEWS.length];
  const from = v.from || hue.from;
  const to = view % GALLERY_VIEWS.length === 1 ? hue.to : (view % GALLERY_VIEWS.length === 3 ? hue.from : hue.to);
  const [c1x, c1y, c1r, c1o] = v.c1;
  const [c2x, c2y, c2r, c2o] = v.c2;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">'
    + '<defs><linearGradient id="g-' + p.id + '-' + view + '" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" stop-color="' + from + '"/><stop offset="1" stop-color="' + to + '"/>'
    + '</linearGradient></defs>'
    + '<rect width="400" height="400" fill="url(#g-' + p.id + '-' + view + ')"/>'
    + '<circle cx="' + c1x + '" cy="' + c1y + '" r="' + c1r + '" fill="#ffffff" opacity="' + c1o + '"/>'
    + '<circle cx="' + c2x + '" cy="' + c2y + '" r="' + c2r + '" fill="#ffffff" opacity="' + c2o + '"/>'
    + '<g transform="' + v.t + '" fill="none" stroke="' + hue.fg + '" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g>'
    + '</svg>';
}
