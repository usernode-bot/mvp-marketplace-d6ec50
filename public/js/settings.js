/* Phase 5: Settings. Grouped preference sections (account, notifications,
 * language and theme, privacy), the Edit Profile form and Log out.
 *
 * Toggle rows are the native kit's `un-switch` on a checkbox; changes go
 * through the store's prefs (persisted under the bazario: prefix). The
 * Theme row shows the active color theme (the swatches themselves live in
 * the desktop header and the Profile page, see theme.js). Language: English
 * is the only shipped locale so far; the picker lists the upcoming ones as
 * disabled rows.
 */

import { icon } from './icons.js';
import { store } from './store.js';
import { avatarHtml, confirmDialog, esc, toast } from './ui.js';
import { getTheme, themeName } from './theme.js';
import { displayName } from './profile.js';
import { getAvatarState } from './profile-photo.js';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

function pageHeader(title, backRoute) {
  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="' + backRoute + '" class="icon-btn -ml-2" aria-label="Back">'
    + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + title + '</h1>'
    + '</div>';
}

function sectionLabel(text) {
  return '<h2 class="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 first:mt-0">' + text + '</h2>';
}

function valueRow(iconName, label, attr, value) {
  return '<button type="button" ' + attr + ' class="menu-row">'
    + '<span class="shrink-0 text-zinc-400">' + icon(iconName, 'h-5 w-5') + '</span>' + esc(label)
    + '<span class="ml-auto text-sm font-normal text-zinc-400">' + esc(value) + '</span>'
    + '<span class="text-zinc-300">' + icon('chevronRight', 'h-4 w-4') + '</span></button>';
}

function toggleRow(iconName, label, prefKey, checked) {
  return '<label class="menu-row cursor-pointer">'
    + '<span class="shrink-0 text-zinc-400">' + icon(iconName, 'h-5 w-5') + '</span>' + esc(label)
    + '<input type="checkbox" data-pref="' + prefKey + '" class="un-switch ml-auto"'
    + (checked ? ' checked' : '') + ' aria-label="' + esc(label) + '"></label>';
}

/* ------------------------------------------------------------------ */
/* Settings page                                                       */
/* ------------------------------------------------------------------ */

function localeLabel() {
  const found = LOCALES.find((l) => l.code === store.prefs.locale);
  return found ? found.label : 'English';
}

export function renderSettingsView() {
  const segs = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (segs[1] === 'edit') return renderEditProfile();

  const view = document.getElementById('view-profile');
  const name = displayName();

  view.innerHTML =
    pageHeader('Settings', 'profile')
    + '<div class="mt-4">'
    + sectionLabel('Account')
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + valueRow('user', 'Account settings', 'data-route="profile/edit"', name ? '@' + name : 'Guest shopper')
    + '</div>'

    + sectionLabel('Notification settings')
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + toggleRow('package', 'Order updates', 'orderUpdates', store.prefs.orderUpdates)
    + toggleRow('percent', 'Promotions and deals', 'promotions', store.prefs.promotions)
    + '</div>'

    + sectionLabel('Preferences')
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + valueRow('globe', 'Language', 'data-lang-pick', localeLabel())
    + valueRow('moon', 'Theme', 'data-theme-info', themeName(getTheme()))
    + '</div>'

    + sectionLabel('Privacy')
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + toggleRow('sparkles', 'Personalized recommendations', 'personalized', store.prefs.personalized)
    + toggleRow('search', 'Save search history', 'saveSearch', store.prefs.saveSearch)
    + '</div>'
    + '</div>'

    + '<div class="card mt-6 overflow-hidden">'
    + '<button type="button" data-logout class="menu-row justify-center text-rose-600 hover:bg-rose-50">'
    + icon('logout', 'h-5 w-5') + 'Log out</button>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Edit profile                                                        */
/* ------------------------------------------------------------------ */

function fieldRow(label, inputHtml) {
  return '<label class="block">'
    + '<span class="mb-1.5 block text-xs font-semibold text-zinc-500">' + label + '</span>'
    + inputHtml
    + '</label>';
}

function renderEditProfile() {
  const view = document.getElementById('view-profile');
  const p = store.profile || {};
  const name = displayName();

  view.innerHTML =
    pageHeader('Edit profile', 'profile')
    + '<div class="card mt-4 flex items-center gap-4 p-4">'
    + '<button type="button" data-avatar-edit class="relative shrink-0 rounded-full" aria-label="Change profile photo">'
    + avatarHtml({
      url: getAvatarState().url,
      name: name || (p.name || null),
      badge: true,
      loading: getAvatarState().loading,
    })
    + '</button>'
    + '<input type="file" id="avatar-file-input" class="hidden" accept="image/jpeg,image/png,image/webp">'
    + '<div class="min-w-0 flex-1">'
    + '<p class="text-sm font-semibold text-zinc-900">Profile photo</p>'
    + '<p class="mt-0.5 text-xs text-zinc-500">Tap the photo to choose from your gallery or remove it.</p>'
    + '</div>'
    + '<button type="button" data-avatar-edit class="btn-outline btn-sm shrink-0">Change</button>'
    + '</div>'
    + '<form data-profile-form class="card mt-4 space-y-4 p-4">'
    + fieldRow('Display name', '<input name="name" class="field" required maxlength="40" value="' + esc(p.name || name || '') + '">')
    + fieldRow('Email', '<input name="email" type="email" class="field" maxlength="80" value="' + esc(p.email || '') + '" autocomplete="email">')
    + fieldRow('Phone', '<input name="phone" type="tel" class="field" maxlength="30" value="' + esc(p.phone || '') + '" autocomplete="tel">')
    + '<button type="submit" class="btn-primary w-full">Save changes</button>'
    + '</form>'
    + '<p class="mt-3 px-1 text-xs text-zinc-400">Your sign-in stays with Homeroom. These details personalize your MVP Marketplace account.</p>';
}

/* ------------------------------------------------------------------ */
/* Pickers + logout                                                    */
/* ------------------------------------------------------------------ */

function pickLanguage(anchorEl) {
  if (window.unNative && typeof window.unNative.menu === 'function') {
    window.unNative.menu({
      anchorEl,
      title: 'Language',
      cancelLabel: 'Cancel',
      items: LOCALES.map((l) => ({
        label: l.label,
        disabled: l.code !== 'en',
      })),
    }).then((picked) => {
      if (!picked || picked.disabled) return;
      store.setPref('locale', 'en');
      toast('Language set to English');
    });
    return;
  }
  toast('More languages arrive in a later phase');
}

function logout() {
  confirmDialog({
    title: 'Log out?',
    message: 'MVP Marketplace keeps your cart, wishlist, addresses and settings on this device. Logging out clears them.',
    confirmLabel: 'Log out',
  }).then((ok) => {
    if (!ok) return;
    store.clearAll();
    toast('Logged out');
    location.hash = '/home';
  });
}

/* ------------------------------------------------------------------ */
/* Delegated listeners                                                 */
/* ------------------------------------------------------------------ */

export function initSettings() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-lang-pick], [data-theme-info], [data-logout]');
    if (!el) return;

    if (el.hasAttribute('data-lang-pick')) {
      pickLanguage(el);
      return;
    }
    if (el.hasAttribute('data-theme-info')) {
      toast('Use the color swatches to change the theme (header on desktop, Profile page on mobile)');
      return;
    }
    logout();
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-pref]');
    if (el) store.setPref(el.dataset.pref, el.checked);
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-profile-form]');
    if (!form) return;
    e.preventDefault();
    store.setProfile({
      name: form.elements.name.value,
      email: form.elements.email.value,
      phone: form.elements.phone.value,
    });
    toast('Profile saved');
    location.hash = '/profile';
  });
}
