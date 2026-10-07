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

import { t } from './i18n.js';
import { esc } from './ui.js';

export const THEMES = [
  { id: 'purple', key: 'theme.purple' },
  { id: 'ocean', key: 'theme.ocean' },
  { id: 'sunset', key: 'theme.sunset' },
  { id: 'mint', key: 'theme.mint' },
  { id: 'midnight', key: 'theme.midnight' },
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
  const theme = THEMES.find((x) => x.id === id) || THEMES[0];
  return t(theme.key);
}

/* The swatch buttons themselves, shared by the header group (desktop) and
 * the Profile row (mobile). Whole-literal class names so the Tailwind
 * compiler sees them. */
export function swatchButtons() {
  const current = getTheme();
  return THEMES.map((sw) => {
    const name = t(sw.key);
    return '<button type="button" class="theme-swatch theme-swatch-' + sw.id + '" data-theme-swatch="' + sw.id + '"'
      + ' role="radio" aria-checked="' + (sw.id === current) + '"'
      + ' aria-label="' + esc(t('theme.switchTo', { name })) + '" title="' + esc(name) + '"></button>';
  }).join('');
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
