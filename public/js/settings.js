/* Phase 5: Settings. Grouped preference sections (account, notifications,
 * language and theme, privacy), the Edit Profile form and Log out.
 *
 * Toggle rows are the native kit's `un-switch` on a checkbox; changes go
 * through the store's prefs (persisted under the bazario: prefix). The
 * Theme row shows the active color theme (the swatches themselves live in
 * the desktop header and the Profile page, see theme.js).
 *
 * Language: the picker lists every COMPLETE locale (English, Español) by its
 * endonym and is wired to i18n.js's applyLocale, which switches the whole app
 * immediately, persists the choice to the store, writes <html lang> and
 * re-renders the current page. A partial locale (pt-BR, id) can still be
 * forced with ?lang= but is not offered here until its dictionary is complete.
 */

import { icon } from './icons.js';
import { store } from './store.js';
import { avatarHtml, confirmDialog, esc, toast } from './ui.js';
import { getTheme, themeName } from './theme.js';
import { displayName } from './profile.js';
import { getAvatarState } from './profile-photo.js';
import {
  COMPLETE_LOCALES,
  LOCALE_NAMES,
  applyLocale,
  locale,
  t,
} from './i18n.js';

const LOCALES = COMPLETE_LOCALES.map((code) => ({ code, label: LOCALE_NAMES[code] || code }));

/* Best-effort mirror of the in-app choice to the signed-in user's platform
 * profile, so the language follows them. The bridge API may be absent (a
 * plain local run) or may not offer a setter; either way the store is the
 * source of truth and the choice still persists on this device. */
function syncPlatformLocale(code) {
  try {
    if (window.usernode && typeof window.usernode.setUserLocale === 'function') {
      Promise.resolve(window.usernode.setUserLocale(code)).catch(() => {});
    }
  } catch {
    // Bridge absent or refused: the in-app choice still stands.
  }
}

/* Change the app language: switch, persist, mirror to the profile and confirm.
 * applyLocale() re-renders the current route (via the listener in app.js) and
 * re-applies the static chrome, so every page updates without a reload. */
function changeLanguage(code) {
  applyLocale(code, { persist: true });
  syncPlatformLocale(code);
  toast(t('settings.languageSet', { label: LOCALE_NAMES[code] || code }));
}

function pageHeader(title, backRoute) {
  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="' + backRoute + '" class="icon-btn -ml-2" aria-label="' + esc(t('common.back')) + '">'
    + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + esc(title) + '</h1>'
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
  const code = locale();
  return LOCALE_NAMES[code] || LOCALE_NAMES.en;
}

export function renderSettingsView() {
  const segs = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (segs[1] === 'edit') return renderEditProfile();

  const view = document.getElementById('view-profile');
  const name = displayName();

  view.innerHTML =
    pageHeader(t('settings.title'), 'profile')
    + '<div class="mt-4">'
    + sectionLabel(esc(t('settings.account')))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + valueRow('user', t('settings.accountSettings'), 'data-route="profile/edit"', name ? '@' + name : t('profile.guest'))
    + '</div>'

    + sectionLabel(esc(t('settings.notifications')))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + toggleRow('package', t('settings.orderUpdates'), 'orderUpdates', store.prefs.orderUpdates)
    + toggleRow('percent', t('settings.promotions'), 'promotions', store.prefs.promotions)
    + '</div>'

    + sectionLabel(esc(t('settings.preferences')))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + valueRow('globe', t('settings.language'), 'data-lang-pick', localeLabel())
    + valueRow('moon', t('settings.theme'), 'data-theme-info', themeName(getTheme()))
    + '</div>'

    + sectionLabel(esc(t('settings.privacy')))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + toggleRow('sparkles', t('settings.personalized'), 'personalized', store.prefs.personalized)
    + toggleRow('search', t('settings.saveSearch'), 'saveSearch', store.prefs.saveSearch)
    + '</div>'
    + '</div>'

    + '<div class="card mt-6 overflow-hidden">'
    + '<button type="button" data-logout class="menu-row justify-center text-rose-600 hover:bg-rose-50">'
    + icon('logout', 'h-5 w-5') + esc(t('profile.logout')) + '</button>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Edit profile                                                        */
/* ------------------------------------------------------------------ */

function fieldRow(label, inputHtml) {
  return '<label class="block">'
    + '<span class="mb-1.5 block text-xs font-semibold text-zinc-500">' + esc(label) + '</span>'
    + inputHtml
    + '</label>';
}

function renderEditProfile() {
  const view = document.getElementById('view-profile');
  const p = store.profile || {};
  const name = displayName();

  view.innerHTML =
    pageHeader(t('settings.editTitle'), 'profile')
    + '<div class="card mt-4 flex items-center gap-4 p-4">'
    + '<button type="button" data-avatar-edit class="relative shrink-0 rounded-full" aria-label="' + esc(t('aria.changeProfilePhoto')) + '">'
    + avatarHtml({
      url: getAvatarState().url,
      name: name || (p.name || null),
      badge: true,
      loading: getAvatarState().loading,
    })
    + '</button>'
    + '<input type="file" id="avatar-file-input" class="hidden" accept="image/jpeg,image/png,image/webp">'
    + '<div class="min-w-0 flex-1">'
    + '<p class="text-sm font-semibold text-zinc-900">' + esc(t('settings.photo')) + '</p>'
    + '<p class="mt-0.5 text-xs text-zinc-500">' + esc(t('settings.photoHint')) + '</p>'
    + '</div>'
    + '<button type="button" data-avatar-edit class="btn-outline btn-sm shrink-0">' + esc(t('settings.change')) + '</button>'
    + '</div>'
    + '<form data-profile-form class="card mt-4 space-y-4 p-4">'
    + fieldRow(t('settings.displayName'), '<input name="name" class="field" required maxlength="40" value="' + esc(p.name || name || '') + '">')
    + fieldRow(t('settings.email'), '<input name="email" type="email" class="field" maxlength="80" value="' + esc(p.email || '') + '" autocomplete="email">')
    + fieldRow(t('settings.phone'), '<input name="phone" type="tel" class="field" maxlength="30" value="' + esc(p.phone || '') + '" autocomplete="tel">')
    + '<button type="submit" class="btn-primary w-full">' + esc(t('settings.saveChanges')) + '</button>'
    + '</form>'
    + '<p class="mt-3 px-1 text-xs text-zinc-400">' + esc(t('settings.signInNote')) + '</p>';
}

/* ------------------------------------------------------------------ */
/* Pickers + logout                                                    */
/* ------------------------------------------------------------------ */

function pickLanguage(anchorEl) {
  if (window.unNative && typeof window.unNative.menu === 'function') {
    window.unNative.menu({
      anchorEl,
      title: t('settings.languagePickerTitle'),
      cancelLabel: t('common.cancel'),
      items: LOCALES.map((l) => ({
        label: l.label,
        code: l.code,
      })),
    }).then((picked) => {
      if (!picked || !picked.code) return;
      changeLanguage(picked.code);
    });
    return;
  }
  toast(t('settings.useLanguagePicker'));
}

function logout() {
  confirmDialog({
    title: t('profile.logoutTitle'),
    message: t('profile.logoutBody'),
    confirmLabel: t('profile.logoutConfirm'),
  }).then((ok) => {
    if (!ok) return;
    store.clearAll();
    toast(t('profile.loggedOut'));
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
      toast(t('settings.useSwatches'));
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
    toast(t('settings.profileSaved'));
    location.hash = '/profile';
  });
}
