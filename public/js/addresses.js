/* Phase 5: Address management. The saved-address list (add, edit, delete,
 * set default) and the shared add/edit form. Addresses persist in the store
 * (localStorage under the bazario: prefix); orders keep their own snapshot
 * of the address used at purchase, so editing here never rewrites history.
 *
 * Routes (under the profile view):
 *   #/profile/addresses          list
 *   #/profile/addresses/new      add form
 *   #/profile/addresses/<id>     edit form
 */

import { icon } from './icons.js';
import { store } from './store.js';
import { confirmDialog, emptyState, esc, toast } from './ui.js';
import { t } from './i18n.js';

const ROUTE_LIST = 'profile/addresses';
const ROUTE_NEW = 'profile/addresses/new';

function pageHeader(title, backRoute) {
  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="' + backRoute + '" class="icon-btn -ml-2" aria-label="' + esc(t('common.back')) + '">'
    + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + esc(title) + '</h1>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* List                                                                */
/* ------------------------------------------------------------------ */

function addressCard(a) {
  const defaultBadge = a.isDefault
    ? '<span class="badge-brand shrink-0">' + esc(t('addresses.defaultBadge')) + '</span>'
    : '';
  return '<div class="card p-4" data-address-row="' + a.id + '">'
    + '<div class="flex items-start gap-3">'
    + '<span class="mt-0.5 shrink-0 text-zinc-400">' + icon('mapPin', 'h-5 w-5') + '</span>'
    + '<div class="min-w-0 flex-1">'
    + '<div class="flex items-center gap-2">'
    + '<p class="truncate text-sm font-semibold text-zinc-900">' + esc(a.name) + '</p>'
    + defaultBadge
    + '</div>'
    + '<p class="mt-0.5 text-xs text-zinc-500">' + esc(a.phone) + '</p>'
    + '<p class="mt-1 text-sm text-zinc-700">' + esc(a.line1) + ', ' + esc(a.city) + ' ' + esc(a.zip) + '</p>'
    + '</div>'
    + '</div>'
    + '<div class="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3">'
    + (a.isDefault
      ? '<span class="text-xs font-medium text-zinc-400">' + esc(t('addresses.defaultAddress')) + '</span>'
      : '<button type="button" data-address-default="' + a.id + '" class="btn-ghost btn-sm">' + esc(t('addresses.setDefault')) + '</button>')
    + '<span class="ml-auto"></span>'
    + '<button type="button" data-address-edit="' + a.id + '" class="btn-outline btn-sm">' + esc(t('addresses.edit')) + '</button>'
    + '<button type="button" data-address-delete="' + a.id + '" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600" aria-label="' + esc(t('addresses.deleteAria')) + '">' + icon('trash', 'h-4 w-4') + '</button>'
    + '</div>'
    + '</div>';
}

function renderAddressList() {
  const view = document.getElementById('view-profile');
  const list = store.addresses;

  const body = list.length
    ? '<div class="mt-4 flex flex-col gap-3">' + list.map(addressCard).join('') + '</div>'
    : '<div class="card mt-4">' + emptyState({
      icon: 'mapPin',
      title: t('addresses.empty.title'),
      body: t('addresses.empty.body'),
      actionLabel: t('addresses.add'),
      actionAttr: 'data-route="' + ROUTE_NEW + '"',
    }) + '</div>';

  view.innerHTML =
    pageHeader(t('addresses.title'), 'profile')
    + body
    + (list.length
      ? '<button type="button" data-route="' + ROUTE_NEW + '" class="btn-primary mt-4 w-full">'
        + icon('plus', 'h-4 w-4') + esc(t('addresses.add')) + '</button>'
      : '');
}

/* ------------------------------------------------------------------ */
/* Add / edit form                                                     */
/* ------------------------------------------------------------------ */

function fieldRow(label, inputHtml) {
  return '<label class="block">'
    + '<span class="mb-1.5 block text-xs font-semibold text-zinc-500">' + esc(label) + '</span>'
    + inputHtml
    + '</label>';
}

function renderAddressForm(id) {
  const view = document.getElementById('view-profile');
  const editing = id ? store.addressById(id) : null;
  if (id && !editing) {
    renderAddressList();
    return;
  }
  const v = editing || {};
  const title = editing ? t('addresses.editTitle') : t('addresses.newTitle');

  view.innerHTML =
    pageHeader(title, ROUTE_LIST)
    + '<form data-address-form' + (editing ? ' data-address-form-id="' + editing.id + '"' : '')
    + ' class="card mt-4 space-y-4 p-4">'
    + fieldRow(t('addresses.fullName'), '<input name="name" class="field" required maxlength="60" value="' + esc(v.name || '') + '" autocomplete="name">')
    + fieldRow(t('addresses.phone'), '<input name="phone" type="tel" class="field" required maxlength="30" value="' + esc(v.phone || '') + '" autocomplete="tel">')
    + fieldRow(t('addresses.street'), '<input name="line1" class="field" required maxlength="120" value="' + esc(v.line1 || '') + '" autocomplete="street-address">')
    + '<div class="grid grid-cols-2 gap-3">'
    + fieldRow(t('addresses.city'), '<input name="city" class="field" required maxlength="60" value="' + esc(v.city || '') + '">')
    + fieldRow(t('addresses.zip'), '<input name="zip" class="field" required maxlength="12" inputmode="numeric" value="' + esc(v.zip || '') + '" autocomplete="postal-code">')
    + '</div>'
    + '<label class="flex items-center gap-3 text-sm font-medium text-zinc-800">'
    + '<input type="checkbox" name="isDefault" class="un-switch"'
    + (editing && editing.isDefault ? ' checked' : '') + '> ' + esc(t('addresses.makeDefault')) + '</label>'
    + '<button type="submit" class="btn-primary w-full">' + esc(editing ? t('common.saveChanges') : t('addresses.save')) + '</button>'
    + '</form>';
}

/* ------------------------------------------------------------------ */
/* View entry + delegated listeners                                    */
/* ------------------------------------------------------------------ */

export function renderAddressesView() {
  const segs = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  // #/profile/addresses[/new|/<id>]
  if (segs[2] === 'new') renderAddressForm(null);
  else if (segs[2]) renderAddressForm(decodeURIComponent(segs[2]));
  else renderAddressList();
}

export function initAddresses() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-address-default], [data-address-delete]');
    if (!el) return;

    const makeDefault = el.getAttribute('data-address-default');
    if (makeDefault) {
      store.updateAddress(makeDefault, { isDefault: true });
      toast(t('addresses.defaultUpdated'));
      renderAddressesView(); // refresh the badges in place
      return;
    }

    const remove = el.getAttribute('data-address-delete');
    if (remove) {
      const target = store.addressById(remove);
      confirmDialog({
        title: t('addresses.deleteTitle'),
        message: target ? t('addresses.deleteMessage', { name: target.name }) : t('addresses.deleteMessageGeneric'),
        confirmLabel: t('common.delete'),
      }).then((ok) => {
        if (!ok) return;
        store.removeAddress(remove);
        toast(t('addresses.deleted'));
        renderAddressesView();
      });
    }
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-address-form]');
    if (!form) return;
    e.preventDefault();
    const data = {
      name: form.elements.name.value,
      phone: form.elements.phone.value,
      line1: form.elements.line1.value,
      city: form.elements.city.value,
      zip: form.elements.zip.value,
      isDefault: form.elements.isDefault.checked,
    };
    const id = form.getAttribute('data-address-form-id');
    if (id) store.updateAddress(id, data);
    else store.addAddress(data);
    toast(t('addresses.saved'));
    location.hash = '/' + ROUTE_LIST;
  });
}