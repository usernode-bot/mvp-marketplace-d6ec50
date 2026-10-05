/* Color themes (Purple Dream, Ocean Breeze, Sunset Glow, Fresh Mint,
 * Midnight). The variables themselves live in styles/tailwind-input.css —
 * this module only switches them: it validates the saved id, toggles the
 * data-theme attribute on <html>, persists the choice and keeps every
 * swatch's selected state in sync (the header group on desktop, the Profile
 * "Color theme" row on mobile).
 *
 * The theme persists under one app-level localStorage key, deliberately NOT
 * keyed on the signed-in user (same policy as store.js). Purple Dream is
 * the fallback whenever nothing valid is saved; the CSS :root variables ARE
 * Purple Dream, so an unset data-theme attribute renders the default.
 */

export const THEMES = [
  { id: 'purple', name: 'Purple Dream' },
  { id: 'ocean', name: 'Ocean Breeze' },
  { id: 'sunset', name: 'Sunset Glow' },
  { id: 'mint', name: 'Fresh Mint' },
  { id: 'midnight', name: 'Midnight' },
];

const STORAGE_KEY = 'bazario:theme';
const DEFAULT_THEME = 'purple';

function isValid(id) {
  return THEMES.some((t) => t.id === id);
}

export function getTheme() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return isValid(raw) ? raw : DEFAULT_THEME;
  } catch {
    // Storage refused (private mode, cross-origin WebView): default theme.
    return DEFAULT_THEME;
  }
}

function applyTheme(id) {
  if (id === DEFAULT_THEME) {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', id);
  }
}

/* Mark the active swatch everywhere it is rendered. */
export function syncSwatches() {
  const current = getTheme();
  document.querySelectorAll('[data-theme-swatch]').forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.getAttribute('data-theme-swatch') === current));
  });
}

export function setTheme(id) {
  if (!isValid(id)) return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage refused: the theme still applies for this session.
  }
  applyTheme(id);
  syncSwatches();
}

export function themeName(id) {
  const theme = THEMES.find((t) => t.id === id);
  return theme ? theme.name : 'Purple Dream';
}

/* The swatch buttons themselves, shared by the header group (desktop) and
 * the Profile row (mobile). Whole-literal class names so the Tailwind
 * compiler sees them. */
export function swatchButtons() {
  const current = getTheme();
  return THEMES.map((t) =>
    '<button type="button" class="theme-swatch theme-swatch-' + t.id + '" data-theme-swatch="' + t.id + '"'
    + ' role="radio" aria-checked="' + (t.id === current) + '"'
    + ' aria-label="Switch to ' + t.name + ' theme" title="' + t.name + '"></button>'
  ).join('');
}

/* Boot: apply the saved theme (the inline head bootstrap has usually already
 * set it before first paint; this is the authoritative pass) and fill the
 * static header container. */
export function initTheme() {
  applyTheme(getTheme());
  const header = document.getElementById('theme-swatches');
  if (header) header.innerHTML = swatchButtons();
  syncSwatches();
}
