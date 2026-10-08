/* Phase 5 / i18n: Settings. Grouped preference sections (account,
 * notifications, language and theme, privacy), the Edit Profile form and
 * Log out.
 *
 * Every string is a translation key resolved through i18n.js, so switching
 * the language re-renders this whole screen in the chosen locale.
 *
 * Language: all four shipped locales are selectable. Picking one calls
 * setLocale(), which persists the choice (bazario:locale) and re-renders the
 * active view; the picker marks the active locale and leaves the others
 * fully clickable. The Theme row shows the active color theme (the swatches
 * themselves live in the desktop header and the Profile page, see theme.js).
 */

import { icon } from './icons.js';
import { store } from './store.js';
import { avatarHtml, confirmDialog, esc, toast } from './ui.js';
import { getTheme, themeName } from './theme.js';
import { displayName } from './profile.js';
import { getAvatarState } from './profile-photo.js';
import { LOCALES, getLocale, localeLabel, setLocale, t } from './i18n.js';

function pageHeader(title, backRoute) {
  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="' + backRoute + '" class="icon-btn -ml-2" aria-label="' + esc(t('common.back')) + '">'
    + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + esc(title) + '</h1>'
    + '</div>';
}

function sectionLabel(text) {
  return '<h2 class="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 first:mt-0">' + esc(text) + '</h2>';
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
    + valueRow('user', t('settings.accountSettings'), 'data-route="profile/edit"',
      name ? '@' + name : t('profile.guest'))
    + '</div>'

    + sectionLabel(t('settings.notificationSettings'))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + toggleRow('package', t('settings.orderUpdates'), 'orderUpdates', store.prefs.orderUpdates)
    + toggleRow('percent', t('settings.promotions'), 'promotions', store.prefs.promotions)
    + '</div>'

    + sectionLabel(t('settings.preferences'))
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">'
    + valueRow('globe', t('settings.language'), 'data-lang-pick', localeLabel(getLocale()))
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
    + '<span class="mb-1.5 block text-xs font-semibold text-zinc-500">' + esc(label) + '</span>'
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
    + '<button type="button" data-avatar-edit class="relative shrink-0 rounded-full" aria-label="' + esc(t('profile.changePhotoAria')) + '">'
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
    + '<p class="mt-3 px-1 text-xs text-zinc-400">' + esc(t('settings.profileNote')) + '</p>';
}

/* ------------------------------------------------------------------ */
/* Pickers + logout                                                    */
/* ------------------------------------------------------------------ */

/* The language picker. Every shipped locale is a live option; the active one
 * is marked, none are disabled. Choosing a locale updates the whole app
 * through setLocale() (which persists the choice and fires the locale-change
 * listeners that re-render the current screen). */
function pickLanguage(anchorEl) {
  const current = getLocale();
  const items = LOCALES.map((l) => ({
    label: localeLabel(l.code),
    value: l.code,
    icon: 'globe',
    checked: l.code === current,
  }));

  if (window.unNative && typeof window.unNative.menu === 'function') {
    // The native menu has no selected-item concept: it ignores `checked` and
    // would render the active language exactly like the others. Mark it in
    // the label so every row stays tappable while the current one is clear.
    window.unNative.menu({
      anchorEl,
      title: t('settings.languageTitle'),
      cancelLabel: t('common.cancel'),
      items: items.map((it) => ({
        label: it.checked ? it.label + ' \u2713' : it.label,
        value: it.value,
        icon: it.icon,
      })),
    }).then((picked) => {
      if (!picked || picked.disabled || !picked.value) return;
      setLocale(picked.value);
      toast(t('settings.languageSet', { language: localeLabel(picked.value) }));
    });
    return;
  }

  // Standalone fallback (no native kit): a plain card menu under the row with
  // the same options, so the picker still works outside the platform shell.
  document.querySelectorAll('[data-lang-menu]').forEach((el) => el.remove());
  const menu = document.createElement('div');
  menu.setAttribute('data-lang-menu', '');
  menu.className = 'card absolute z-50 mt-2 w-56 divide-y divide-zinc-100 overflow-hidden';
  menu.innerHTML = items.map((it) => (
    '<button type="button" class="menu-row' + (it.checked ? ' font-semibold text-violet-700' : '') + '"'
    + ' data-lang-value="' + it.value + '" aria-current="' + (it.checked ? 'true' : 'false') + '">'
    + esc(it.label)
    + (it.checked ? '<span class="ml-auto text-violet-600">' + icon('check', 'h-4 w-4') + '</span>' : '')
    + '</button>')).join('');
  const host = anchorEl.parentElement;
  if (host) {
    host.style.position = host.style.position || 'relative';
    host.appendChild(menu);
  }
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
    const langOption = e.target.closest('[data-lang-value]');
    if (langOption) {
      const code = langOption.dataset.langValue;
      setLocale(code);
      document.querySelectorAll('[data-lang-menu]').forEach((el) => el.remove());
      toast(t('settings.languageSet', { language: localeLabel(code) }));
      return;
    }

    const el = e.target.closest('[data-lang-pick], [data-theme-info], [data-logout]');
    if (!el) return;

    if (el.hasAttribute('data-lang-pick')) {
      pickLanguage(el);
      return;
    }
    if (el.hasAttribute('data-theme-info')) {
      toast(t('settings.themeHint'));
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
