/* Phase 5: Settings. Grouped preference sections (account, notifications,
 * language and theme, privacy), the Edit Profile form and Log out.
 *
 * Toggle rows are the native kit's `un-switch` on a checkbox; changes go
 * through the store's prefs (persisted under the bazario: prefix). The
 * Theme row shows the active color theme (the swatches themselves live in
 * the desktop header and the Profile page, see theme.js). Language: English
 * Bahasa Indonesia, Arabic, Chinese, Korean, Japanese and Spanish (each shown by its own name); the picker calls i18n.setLocale, which changes the
 * whole app.
 */

import { icon } from './icons.js';
import { store } from './store.js';
import { avatarHtml, confirmDialog, esc, toast } from './ui.js';
import { getTheme, themeName } from './theme.js';
import { displayName } from './profile.js';
import { getAvatarState } from './profile-photo.js';
import { LOCALES, locale, localeLabel, setLocale, t } from './i18n.js';

function pageHeader(title, backRoute) {
  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="' + backRoute + '" class="icon-btn -ml-2" aria-label="' + esc(t('common.back')) + '">'
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

export function renderSettingsView() {
  const segs = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (segs[1] === 'edit') return renderEditProfile();

  const view = document.getElementById('view-profile');
  const name = displayName();

  view.innerHTML =
    pageHeader(t('settings.title'), 'profile')
    + '<div class="mt-4">'
    + sectionLabel(t('settings.account'))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + valueRow('user', t('settings.accountSettings'), 'data-route="profile/edit"', name ? '@' + name : t('settings.guest'))
    + '</div>'

    + sectionLabel(t('settings.notifications'))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + toggleRow('package', t('settings.orderUpdates'), 'orderUpdates', store.prefs.orderUpdates)
    + toggleRow('percent', t('settings.promotions'), 'promotions', store.prefs.promotions)
    + '</div>'

    + sectionLabel(t('settings.preferences'))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + valueRow('globe', t('settings.language'), 'data-lang-pick', localeLabel())
    + valueRow('moon', t('settings.theme'), 'data-theme-info', themeName(getTheme()))
    + '</div>'

    + sectionLabel(t('settings.privacy'))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + toggleRow('sparkles', t('settings.personalized'), 'personalized', store.prefs.personalized)
    + toggleRow('search', t('settings.saveSearch'), 'saveSearch', store.prefs.saveSearch)
    + '</div>'
    + '</div>'

    + '<div class="card mt-6 overflow-hidden">'
    + '<button type="button" data-logout class="menu-row justify-center text-rose-600 hover:bg-rose-50">'
    + icon('logout', 'h-5 w-5') + esc(t('settings.logout')) + '</button>'
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
    pageHeader(t('settings.editProfile'), 'profile')
    + '<div class="card mt-4 flex items-center gap-4 p-4">'
    + '<button type="button" data-avatar-edit class="relative shrink-0 rounded-full" aria-label="' + esc(t('settings.changePhotoLabel')) + '">'
    + avatarHtml({
      url: getAvatarState().url,
      name: name || (p.name || null),
      badge: true,
      loading: getAvatarState().loading,
    })
    + '</button>'
    + '<input type="file" id="avatar-file-input" class="hidden" accept="image/jpeg,image/png,image/webp">'
    + '<div class="min-w-0 flex-1">'
    + '<p class="text-sm font-semibold text-zinc-900">' + esc(t('settings.profilePhoto')) + '</p>'
    + '<p class="mt-0.5 text-xs text-zinc-500">' + esc(t('settings.profilePhotoHint')) + '</p>'
    + '</div>'
    + '<button type="button" data-avatar-edit class="btn-outline btn-sm shrink-0">' + esc(t('settings.change')) + '</button>'
    + '</div>'
    + '<form data-profile-form class="card mt-4 space-y-4 p-4">'
    + fieldRow(esc(t('settings.displayName')), '<input name="name" class="field" required maxlength="40" value="' + esc(p.name || name || '') + '">')
    + fieldRow(esc(t('settings.email')), '<input name="email" type="email" class="field" maxlength="80" value="' + esc(p.email || '') + '" autocomplete="email">')
    + fieldRow(esc(t('settings.phone')), '<input name="phone" type="tel" class="field" maxlength="30" value="' + esc(p.phone || '') + '" autocomplete="tel">')
    + '<button type="submit" class="btn-primary w-full">' + esc(t('settings.saveChanges')) + '</button>'
    + '</form>'
    + '<p class="mt-3 px-1 text-xs text-zinc-400">' + esc(t('settings.signInNote')) + '</p>';
}

/* ------------------------------------------------------------------ */
/* Pickers + logout                                                    */
/* ------------------------------------------------------------------ */

function langMark(selected) {
  const el = document.createElement('span');
  if (selected) {
    el.innerHTML = icon('check', 'h-5 w-5');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', t('settings.selected'));
  } else {
    el.className = 'lang-check-slot';
  }
  return el;
}

function pickLanguage(anchorEl) {
  if (window.unNative && typeof window.unNative.menu === 'function') {
    window.unNative.menu({
      anchorEl,
      title: t('settings.language'),
      cancelLabel: t('common.cancel'),
      // The active language carries a checkmark; the others get an empty
      // slot of the same width so every native name lines up.
      items: LOCALES.map((l) => ({
        label: l.label,
        code: l.code,
        iconEl: langMark(l.code === locale()),
      })),
    }).then((picked) => {
      if (!picked || !picked.code) return;
      // setLocale persists, retranslates and fires `localechange`; app.js
      // re-renders the current screen from that event.
      setLocale(picked.code);
      toast(t('settings.languageSet', { language: localeLabel() }));
    });
    return;
  }
  toast(t('settings.languageFallback'));
}

function logout() {
  confirmDialog({
    title: t('settings.logoutTitle'),
    message: t('settings.logoutMessage'),
    confirmLabel: t('settings.logout'),
  }).then((ok) => {
    if (!ok) return;
    store.clearAll();
    toast(t('settings.loggedOut'));
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
      toast(t('settings.themeInfo'));
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
