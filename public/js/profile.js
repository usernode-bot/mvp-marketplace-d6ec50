/* Phase 5: Profile. The account home (avatar, name, edit, quick stats and
 * the menu groups), plus the Wishlist, Coupons, Payment methods,
 * Notifications and Help Center sub-pages it links to. Addresses live in
 * addresses.js and Settings (with Edit Profile) in settings.js; this module
 * is the dispatcher that renders the right sub-page for the current hash.
 *
 * Same rendering pattern as the rest of the app: HTML strings wired through
 * data-* attributes (data-route for in-profile navigation is delegated in
 * app.js; data-nav reaches the top-level tabs).
 */

import { icon } from './icons.js';
import { VOUCHERS, productById } from './data.js';
import { store } from './store.js';
import { avatarHtml, emptyState, esc, productCard } from './ui.js';
import { swatchButtons } from './theme.js';
import { countOrders } from './orders.js';
import { renderAddressesView } from './addresses.js';
import { renderSettingsView } from './settings.js';
import { renderPaymentView } from './payment.js';
import { getAvatarState, renderCropView } from './profile-photo.js';
import { plural, t, voucherLabel } from './i18n.js';

/* ------------------------------------------------------------------ */
/* Demo seeding for staging previews and proposal checks (?demo=1)      */
/* ------------------------------------------------------------------ */

const DEMO_FLAG = 'bazario:demo-account-seeded';

/* ?demo=1 seeds a representative account once per browser: a few wishlist
 * favorites and two saved addresses. Only fills empty state, so the plain
 * routes stay honest (a fresh browser sees the real empty states). */
export function seedDemoAccount() {
  const demo = new URLSearchParams(window.location.search).get('demo');
  if (demo !== '1' && demo !== 'checkout') return;
  try {
    if (localStorage.getItem(DEMO_FLAG)) return;
    ['p02', 'p11', 'p15', 'p26'].forEach((id) => {
      if (!store.isFavorite(id)) store.toggleFavorite(id);
    });
    if (!store.addresses.length) {
      store.addAddress({
        name: 'Alex Rivera', phone: '+1 555 0134',
        line1: '221 Maple Street, Apt 4B', city: 'Portland, OR', zip: '97205',
        isDefault: true,
      });
      store.addAddress({
        name: 'Sam Taylor', phone: '+1 555 0198',
        line1: '8 Cedar Lane', city: 'Austin, TX', zip: '78701',
      });
    }
    // A few linked payment methods, including the default, so the
    // populated Payment methods page is reachable from a URL. Only fills
    // an empty list, so the plain route keeps its real empty state.
    if (!store.payments.length) {
      store.linkPaymentDetails('bca', { account: '1234567890', holder: 'Alex Rivera' });
      store.linkPaymentDetails('gopay', { phone: '+62 812 3456 7890' });
      store.linkPaymentDetails('card', { holder: 'Alex Rivera', masked: '•••• 4242' });
      store.setDefaultPayment('bca');
    }
    localStorage.setItem(DEMO_FLAG, '1');
  } catch {
    // Storage refused: run with whatever state exists.
  }
}

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

/* The username comes from the platform-issued iframe token (same decode as
 * earlier phases). */
function decodeUsername() {
  try {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return null;
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(part + '='.repeat((4 - (part.length % 4)) % 4)));
    return typeof payload.username === 'string' ? payload.username : null;
  } catch {
    return null;
  }
}

export function displayName() {
  return (store.profile && store.profile.name) || decodeUsername() || null;
}

/* Sub-page header with a back affordance. backRoute is a data-route value. */
function pageHeader(title, backRoute) {
  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="' + backRoute + '" class="icon-btn -ml-2" aria-label="' + esc(t('aria.back')) + '">'
    + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + esc(title) + '</h1>'
    + '</div>';
}

function menuRow(iconName, label, attr) {
  return '<button type="button" ' + attr + ' class="menu-row">'
    + '<span class="shrink-0 text-zinc-400">' + icon(iconName, 'h-5 w-5') + '</span>' + esc(label)
    + '<span class="ml-auto text-zinc-300">' + icon('chevronRight', 'h-4 w-4') + '</span></button>';
}

/* ------------------------------------------------------------------ */
/* Profile home                                                        */
/* ------------------------------------------------------------------ */

function renderProfileHome() {
  const view = document.getElementById('view-profile');
  const name = displayName();
  const email = store.profile && store.profile.email;

  const statTile = (label, count, attr, iconName) =>
    '<button type="button" ' + attr + ' class="flex flex-col items-center gap-1 py-4 transition-colors hover:bg-zinc-50">'
    + '<span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">' + icon(iconName, 'h-5 w-5') + '</span>'
    + '<span class="text-base font-bold leading-none tabular-nums text-zinc-900">' + count + '</span>'
    + '<span class="text-xs text-zinc-500">' + label + '</span>'
    + '</button>';

  view.innerHTML =
    '<h1 class="section-title">' + esc(t('profile.title')) + '</h1>'
    + '<div class="card mt-4 flex items-center gap-4 p-4">'
    + '<button type="button" data-avatar-edit class="relative shrink-0 rounded-full" aria-label="' + esc(t('aria.changeProfilePhoto')) + '">'
    + avatarHtml({
      url: getAvatarState().url,
      name,
      badge: true,
      loading: getAvatarState().loading,
    })
    + '</button>'
    + '<input type="file" id="avatar-file-input" class="hidden" accept="image/jpeg,image/png,image/webp">'
    + '<div class="min-w-0 flex-1">'
    + '<p class="truncate text-base font-semibold text-zinc-900">' + (name ? '@' + esc(name) : esc(t('profile.guest'))) + '</p>'
    + '<p class="mt-0.5 truncate text-xs text-zinc-500">' + (email ? esc(email) : esc(name ? t('profile.signedInVia') : t('profile.signInHint'))) + '</p>'
    + '</div>'
    + '<button type="button" data-route="profile/edit" class="btn-outline btn-sm shrink-0">' + icon('pencil', 'h-3.5 w-3.5') + esc(t('profile.editProfile')) + '</button>'
    + '</div>'
    + '<div class="card mt-4 grid grid-cols-3 divide-x divide-zinc-100 overflow-hidden">'
    + statTile(esc(t('profile.statOrders')), countOrders(), 'data-nav="orders"', 'package')
    + statTile(esc(t('profile.statWishlist')), store.favoriteCount(), 'data-route="profile/wishlist"', 'heart')
    + statTile(esc(t('profile.statCoupons')), VOUCHERS.length, 'data-route="profile/coupons"', 'ticket')
    + '</div>'
    + /* Color theme switcher (mobile; the desktop header hosts the same
       * swatches next to the bell, so this row hides there). */
      '<div class="card mt-4 flex items-center gap-3 p-4 lg:hidden">'
    + '<span class="text-sm font-medium text-zinc-800">' + esc(t('profile.colorTheme')) + '</span>'
    + '<div class="ml-auto flex items-center gap-2" role="radiogroup" aria-label="' + esc(t('aria.colorTheme')) + '">'
    + swatchButtons()
    + '</div>'
    + '</div>'
    + '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">'
    + menuRow('package', t('profile.myOrders'), 'data-nav="orders"')
    + menuRow('heart', t('profile.wishlist'), 'data-route="profile/wishlist"')
    + menuRow('mapPin', t('profile.addresses'), 'data-route="profile/addresses"')
    + '</div>'
    + '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">'
    + menuRow('creditCard', t('profile.paymentMethods'), 'data-route="profile/payment"')
    + menuRow('ticket', t('profile.coupons'), 'data-route="profile/coupons"')
    + menuRow('bell', t('profile.notifications'), 'data-route="profile/notifications"')
    + '</div>'
    + '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">'
    + menuRow('help', t('profile.helpCenter'), 'data-route="profile/help"')
    + menuRow('settings', t('profile.settings'), 'data-route="profile/settings"')
    + '</div>'
    + '<div class="card mt-4 overflow-hidden">'
    + '<button type="button" data-logout class="menu-row justify-center text-rose-600 hover:bg-rose-50">'
    + icon('logout', 'h-5 w-5') + esc(t('profile.logout')) + '</button>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Wishlist                                                            */
/* ------------------------------------------------------------------ */

function renderWishlist() {
  const view = document.getElementById('view-profile');
  const items = [...store.favorites]
    .map((id) => productById(id))
    .filter(Boolean);

  const body = items.length
    ? '<div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">'
      + items.map((p) => productCard(p)).join('') + '</div>'
    : '<div class="card mt-4">' + emptyState({
      icon: 'heart',
      title: esc(t('profile.wishlistEmpty')),
      body: esc(t('profile.wishlistEmptyBody')),
      actionLabel: esc(t('cart.startShopping')),
      actionAttr: 'data-nav="home"',
    }) + '</div>';

  view.innerHTML =
    pageHeader(t('profile.wishlist'), 'profile')
    + '<div class="mt-1 flex items-center gap-2"><span class="badge-soft">'
    + esc(plural('count.items', items.length)) + '</span></div>'
    + body;
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

function renderCoupons() {
  const view = document.getElementById('view-profile');
  const rows = VOUCHERS.map((v) =>
    '<div class="flex items-center gap-3 p-4">'
    + '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">' + icon('ticket', 'h-5 w-5') + '</span>'
    + '<div class="min-w-0 flex-1">'
    + '<p class="text-sm font-semibold text-zinc-900">' + esc(v.code) + '</p>'
    + '<p class="mt-0.5 text-xs text-zinc-500">' + esc(voucherLabel(v)) + '</p>'
    + '</div>'
    + '<button type="button" data-nav="cart" class="btn-ghost btn-sm shrink-0">' + esc(t('profile.useInCart')) + '</button>'
    + '</div>').join('');

  view.innerHTML =
    pageHeader(t('profile.coupons'), 'profile')
    + '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">' + rows + '</div>'
    + '<p class="mt-3 px-1 text-xs text-zinc-400">' + esc(t('profile.couponsNote')) + '</p>';
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

function renderNotifications() {
  const view = document.getElementById('view-profile');
  view.innerHTML =
    pageHeader(t('profile.notifications'), 'profile')
    + '<div class="card mt-4">'
    + emptyState({
      icon: 'bell',
      title: esc(t('profile.notificationsEmpty')),
      body: esc(t('profile.notificationsEmptyBody')),
      actionLabel: esc(t('profile.notificationSettings')),
      actionAttr: 'data-route="profile/settings"',
    })
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Help Center                                                         */
/* ------------------------------------------------------------------ */

const HELP_ENTRIES = [
  ['profile.helpQ1', 'profile.helpA1'],
  ['profile.helpQ2', 'profile.helpA2'],
  ['profile.helpQ3', 'profile.helpA3'],
  ['profile.helpQ4', 'profile.helpA4'],
  ['profile.helpQ5', 'profile.helpA5'],
];

function renderHelp() {
  const view = document.getElementById('view-profile');
  const rows = HELP_ENTRIES.map(([q, a]) =>
    '<div class="px-4 py-3.5">'
    + '<p class="text-sm font-semibold text-zinc-900">' + esc(t(q)) + '</p>'
    + '<p class="mt-1 text-sm leading-relaxed text-zinc-500">' + esc(t(a)) + '</p>'
    + '</div>').join('');

  view.innerHTML =
    pageHeader(t('profile.helpCenter'), 'profile')
    + '<div class="card mt-4 divide-y divide-zinc-100 overflow-hidden">' + rows + '</div>';
}

/* ------------------------------------------------------------------ */
/* Dispatcher                                                          */
/* ------------------------------------------------------------------ */

export function renderProfileView() {
  seedDemoAccount();

  const segs = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  const sub = segs[1];

  if (sub === 'wishlist') return renderWishlist();
  if (sub === 'addresses') return renderAddressesView();
  if (sub === 'photo') return renderCropView();
  if (sub === 'settings' || sub === 'edit') return renderSettingsView();
  if (sub === 'coupons') return renderCoupons();
  if (sub === 'payment') return renderPaymentView();
  if (sub === 'notifications') return renderNotifications();
  if (sub === 'help') return renderHelp();
  return renderProfileHome();
}
