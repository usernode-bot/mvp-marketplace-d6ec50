/* Payment methods (Profile > Payment methods). The catalogue of available
 * methods lives in the one typed config below — every entry carries
 * { id, name, type, icon, enabled } plus small presentation extras
 * (subtitle, badge, colour, and what the link form asks for), so a new
 * method is a data edit, not a new branch of rendering code.
 *
 * Linking and the chosen default are mock and client-side: they persist in
 * the store (localStorage under the bazario: prefix) as { list,
 * defaultPayment }. No payment gateway is contacted and no card number is
 * ever stored in full — only the last four digits, masked.
 *
 * Rendering is HTML strings with data-* attributes and a delegated
 * listener (initPayment), the app-wide pattern (see addresses.js).
 */

import { icon } from './icons.js';
import { store } from './store.js';
import { confirmDialog, emptyState, esc, toast } from './ui.js';
import { t } from './i18n.js';

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

/* `type` is one of 'bank' | 'ewallet' | 'card' | 'other'. `icon` is a
 * Lucide-style icon name, or null to render the coloured initial badge.
 * `requires` names what linking collects: 'bank' (account + holder),
 * 'phone' (e-wallet number), 'card' (card details) or null (link directly). */
export const PAYMENT_GROUPS = [
  {
    id: 'bank',
    titleKey: 'payment.group.bank',
    methods: [
      { id: 'bca', name: 'BCA', type: 'bank', icon: null, subtitleKey: 'payment.sub.virtualAccount', badge: 'BCA', color: 'bg-blue-700', requires: 'bank', enabled: true },
      { id: 'mandiri', name: 'Mandiri', type: 'bank', icon: null, subtitleKey: 'payment.sub.virtualAccount', badge: 'MDR', color: 'bg-blue-900', requires: 'bank', enabled: true },
      { id: 'bni', name: 'BNI', type: 'bank', icon: null, subtitleKey: 'payment.sub.virtualAccount', badge: 'BNI', color: 'bg-orange-600', requires: 'bank', enabled: true },
      { id: 'bri', name: 'BRI', type: 'bank', icon: null, subtitleKey: 'payment.sub.virtualAccount', badge: 'BRI', color: 'bg-blue-600', requires: 'bank', enabled: true },
      { id: 'permata', name: 'Permata', type: 'bank', icon: null, subtitleKey: 'payment.sub.virtualAccount', badge: 'PRM', color: 'bg-teal-600', requires: 'bank', enabled: true },
      { id: 'cimb', name: 'CIMB Niaga', type: 'bank', icon: null, subtitleKey: 'payment.sub.virtualAccount', badge: 'CIMB', color: 'bg-red-600', requires: 'bank', enabled: true },
    ],
  },
  {
    id: 'ewallet',
    titleKey: 'payment.group.ewallet',
    methods: [
      { id: 'dana', name: 'DANA', type: 'ewallet', icon: null, subtitleKey: 'payment.sub.ewallet', badge: 'DANA', color: 'bg-sky-600', requires: 'phone', enabled: true },
      { id: 'shopeepay', name: 'ShopeePay', type: 'ewallet', icon: null, subtitleKey: 'payment.sub.ewallet', badge: 'SP', color: 'bg-orange-600', requires: 'phone', enabled: true },
      { id: 'gopay', name: 'GoPay', type: 'ewallet', icon: null, subtitleKey: 'payment.sub.ewallet', badge: 'GO', color: 'bg-emerald-600', requires: 'phone', enabled: true },
      { id: 'ovo', name: 'OVO', type: 'ewallet', icon: null, subtitleKey: 'payment.sub.ewallet', badge: 'OVO', color: 'bg-violet-700', requires: 'phone', enabled: true },
      { id: 'linkaja', name: 'LinkAja', type: 'ewallet', icon: null, subtitleKey: 'payment.sub.ewallet', badge: 'LA', color: 'bg-red-600', requires: 'phone', enabled: true },
    ],
  },
  {
    id: 'card',
    titleKey: 'payment.group.card',
    methods: [
      { id: 'card', name: 'Credit / Debit Card', nameKey: 'payment.name.card', type: 'card', icon: 'creditCard', subtitleKey: 'payment.sub.card', badge: '', color: 'bg-brand-600', requires: 'card', enabled: true },
    ],
  },
  {
    id: 'other',
    titleKey: 'payment.group.other',
    methods: [
      { id: 'qris', name: 'QRIS', type: 'other', icon: null, subtitleKey: 'payment.sub.qris', badge: 'QR', color: 'bg-rose-600', requires: null, enabled: true },
      { id: 'cod', name: 'Cash on Delivery', nameKey: 'payment.name.cod', type: 'other', icon: 'banknote', subtitleKey: 'payment.sub.cod', badge: '', color: 'bg-emerald-700', requires: null, enabled: true },
      { id: 'cvs', name: 'Convenience stores', nameKey: 'payment.name.cvs', type: 'other', icon: 'store', subtitleKey: 'payment.sub.cvs', badge: '', color: 'bg-slate-600', requires: null, enabled: true },
    ],
  },
];

/* A method's display name and subtitle come from its keys (brand names like
 * BCA stay literal; generic ones translate). */
export function methodName(m) {
  return m.nameKey ? t(m.nameKey) : m.name;
}

export function methodSubtitle(m) {
  return m.subtitleKey ? t(m.subtitleKey) : (m.subtitle || '');
}

export function methodById(id) {
  for (const group of PAYMENT_GROUPS) {
    const found = group.methods.find((m) => m.id === id && m.enabled);
    if (found) return found;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Field helpers                                                       */
/* ------------------------------------------------------------------ */

/* Keep only the last four characters of an account number. */
function maskAccount(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length > 4 ? '•••• ' + digits.slice(-4) : '••••';
}

function metaLine(m, p) {
  if (!p) return '';
  if (m.requires === 'bank') {
    const holder = p.holder ? esc(p.holder) : '';
    const acct = maskAccount(p.account);
    return [holder, acct].filter(Boolean).join(' · ');
  }
  if (m.requires === 'phone') return p.phone ? esc(p.phone) : '';
  if (m.requires === 'card') return p.masked ? esc(p.masked) : '';
  return '';
}

function badgeEl(m) {
  const cls = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ' + m.color;
  if (m.icon) return '<span class="' + cls + '">' + icon(m.icon, 'h-5 w-5') + '</span>';
  return '<span class="' + cls + '">' + esc(m.badge) + '</span>';
}

/* ------------------------------------------------------------------ */
/* Rows                                                                */
/* ------------------------------------------------------------------ */

function methodRow(m) {
  const linked = store.isPaymentLinked(m.id);
  const isDefault = linked && store.defaultPayment === m.id;
  const p = linked ? store.paymentById(m.id) : null;
  const meta = metaLine(m, p);

  let actions;
  if (!linked) {
    actions = '<button type="button" data-pay-link="' + m.id + '" class="btn-ghost btn-sm shrink-0">' + esc(t('payment.addShort')) + '</button>';
  } else {
    actions = (isDefault ? '' : '<button type="button" data-pay-default="' + m.id + '" class="btn-ghost btn-sm shrink-0">' + esc(t('payment.setDefault')) + '</button>')
      + '<button type="button" data-pay-unlink="' + m.id + '" aria-label="' + esc(t('payment.removeAria', { name: methodName(m) })) + '"'
      + ' class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600">'
      + icon('x', 'h-4 w-4') + '</button>';
  }

  return '<div class="flex items-center gap-3 px-4 py-3" data-pay-row="' + m.id + '">'
    + badgeEl(m)
    + '<div class="min-w-0 flex-1">'
    + '<div class="flex items-center gap-2">'
    + '<p class="truncate text-sm font-semibold text-zinc-900">' + esc(methodName(m)) + '</p>'
    + (isDefault ? '<span class="badge-brand shrink-0">' + esc(t('addresses.defaultBadge')) + '</span>' : '')
    + (linked && !isDefault ? '<span class="badge-soft shrink-0">' + esc(t('payment.saved')) + '</span>' : '')
    + '</div>'
    + '<p class="mt-0.5 truncate text-xs text-zinc-500">' + esc(methodSubtitle(m)) + '</p>'
    + (meta ? '<p class="mt-0.5 truncate text-xs text-zinc-400">' + meta + '</p>' : '')
    + '</div>'
    + '<div class="flex shrink-0 items-center gap-1">' + actions + '</div>'
    + '</div>';
}

function groupSection(group) {
  const rows = group.methods.filter((m) => m.enabled).map(methodRow).join('');
  if (!rows) return '';
  return '<h2 class="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 first:mt-0">' + esc(t(group.titleKey)) + '</h2>'
    + '<div class="card divide-y divide-zinc-100 overflow-hidden">' + rows + '</div>';
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function renderPaymentView() {
  const view = document.getElementById('view-profile');
  const linkedCount = store.payments.length;

  const header = '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="profile" class="icon-btn -ml-2" aria-label="' + esc(t('payment.backAria')) + '">'
    + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + esc(t('payment.title')) + '</h1>'
    + '</div>';

  const empty = linkedCount
    ? ''
    : '<div class="card mt-4">' + emptyState({
      icon: 'creditCard',
      title: t('payment.empty.title'),
      body: t('payment.empty.body'),
      actionLabel: t('payment.empty.action'),
      actionAttr: 'data-pay-add',
    }) + '</div>';

  const groups = PAYMENT_GROUPS.map(groupSection).join('');

  const addButton = linkedCount
    ? '<button type="button" data-pay-add class="btn-primary mt-4 w-full">' + icon('plus', 'h-4 w-4') + esc(t('payment.add')) + '</button>'
    : '';

  view.innerHTML = header + empty + groups + addButton;
}

/* ------------------------------------------------------------------ */
/* Bottom sheet: add a method / link details                           */
/* ------------------------------------------------------------------ */

let sheetEl = null;
let sheetView = 'list'; // list | form
let sheetMethodId = null;

function onSheetKeydown(e) {
  if (e.key === 'Escape') closeSheet();
}

function closeSheet() {
  if (!sheetEl) return;
  sheetEl.remove();
  sheetEl = null;
  sheetView = 'list';
  sheetMethodId = null;
  document.body.style.overflow = '';
  document.removeEventListener('keydown', onSheetKeydown);
}

function sheetShell(title, bodyHtml) {
  return '<div class="absolute inset-0 bg-zinc-900/40" data-pay-sheet-close></div>'
    + '<div class="relative flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-card-lg sm:max-w-md sm:rounded-2xl">'
    + '<div class="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-3">'
    + '<h2 class="text-sm font-semibold text-zinc-900">' + esc(title) + '</h2>'
    + '<button type="button" class="icon-btn h-8 w-8" data-pay-sheet-close aria-label="' + esc(t('common.close')) + '">' + icon('x', 'h-4 w-4') + '</button>'
    + '</div>'
    + '<div class="min-h-0 flex-1 overflow-y-auto p-3">' + bodyHtml + '</div>'
    + '<div class="hidden h-2 shrink-0 sm:block"></div>'
    + '<div class="shrink-0 sm:hidden" style="padding-bottom: var(--un-safe-inset-bottom, env(safe-area-inset-bottom, 0px));"></div>'
    + '</div>';
}

function openSheet() {
  closeSheet();
  sheetView = 'list';
  sheetMethodId = null;
  sheetEl = document.createElement('div');
  sheetEl.id = 'pay-sheet';
  sheetEl.setAttribute('role', 'dialog');
  sheetEl.setAttribute('aria-modal', 'true');
  sheetEl.setAttribute('aria-label', t('payment.add'));
  sheetEl.className = 'fixed inset-0 z-50 flex items-end justify-center sm:items-center';
  document.body.appendChild(sheetEl);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onSheetKeydown);
  paintSheet();
}

function paintSheet() {
  if (!sheetEl) return;
  if (sheetView === 'form' && sheetMethodId) {
    const m = methodById(sheetMethodId);
    sheetEl.innerHTML = m ? sheetShell(sheetTitle(m), sheetForm(m)) : '';
  } else {
    sheetEl.innerHTML = sheetShell(t('payment.add'), sheetList());
  }
}

function sheetTitle(m) {
  const name = methodName(m);
  if (m.requires === 'bank') return t('payment.addAccount', { name });
  if (m.requires === 'phone') return t('payment.link', { name });
  if (m.requires === 'card') return t('payment.addACard');
  return name;
}

function sheetList() {
  return PAYMENT_GROUPS.map((group) => {
    const rows = group.methods.filter((m) => m.enabled).map((m) => {
      const linked = store.isPaymentLinked(m.id);
      const isDefault = linked && store.defaultPayment === m.id;
      return '<button type="button" data-pay-pick="' + m.id + '"'
        + (linked ? ' aria-disabled="true"' : '')
        + ' class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ' + (linked ? 'opacity-60' : 'hover:bg-zinc-50') + '">'
        + badgeEl(m)
        + '<span class="min-w-0 flex-1">'
        + '<span class="block truncate text-sm font-semibold text-zinc-900">' + esc(methodName(m)) + '</span>'
        + '<span class="block truncate text-xs text-zinc-500">' + esc(methodSubtitle(m)) + '</span>'
        + '</span>'
        + (isDefault
          ? '<span class="badge-brand shrink-0">' + esc(t('addresses.defaultBadge')) + '</span>'
          : linked
            ? '<span class="shrink-0 text-brand-600">' + icon('check', 'h-5 w-5') + '</span>'
            : '<span class="shrink-0 text-zinc-300">' + icon('plus', 'h-5 w-5') + '</span>')
        + '</button>';
    }).join('');
    return '<h3 class="mb-1 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 first:mt-0">' + esc(t(group.titleKey)) + '</h3>'
      + '<div class="flex flex-col">' + rows + '</div>';
  }).join('');
}

function fieldRow(label, inputHtml) {
  return '<label class="block">'
    + '<span class="mb-1.5 block text-xs font-semibold text-zinc-500">' + esc(label) + '</span>'
    + inputHtml
    + '</label>';
}

function sheetForm(m) {
  let fields = '';
  if (m.requires === 'bank') {
    fields = fieldRow(t('payment.accountNumber'), '<input name="account" inputmode="numeric" autocomplete="off" maxlength="26" class="field" placeholder="' + esc(t('payment.accountNumberPh')) + '">')
      + fieldRow(t('payment.accountHolder'), '<input name="holder" maxlength="60" autocomplete="name" class="field" placeholder="' + esc(t('payment.accountHolderPh')) + '">');
  } else if (m.requires === 'phone') {
    fields = fieldRow(t('payment.phoneNumber'), '<input name="phone" type="tel" autocomplete="tel" maxlength="20" class="field" placeholder="' + esc(t('payment.phonePh')) + '">');
  } else if (m.requires === 'card') {
    fields = fieldRow(t('payment.cardNumber'), '<input name="cardNumber" inputmode="numeric" autocomplete="cc-number" maxlength="23" class="field" placeholder="' + esc(t('payment.cardNumberPh')) + '">')
      + fieldRow(t('payment.nameOnCard'), '<input name="holder" maxlength="60" autocomplete="cc-name" class="field" placeholder="' + esc(t('payment.nameOnCardPh')) + '">')
      + '<div class="grid grid-cols-2 gap-3">'
      + fieldRow(t('payment.expiry'), '<input name="expiry" inputmode="numeric" autocomplete="cc-exp" maxlength="5" class="field" placeholder="MM/YY">')
      + fieldRow(t('payment.cvv'), '<input name="cvv" inputmode="numeric" autocomplete="cc-csc" maxlength="4" class="field" placeholder="123">')
      + '</div>';
  }

  const note = m.requires === 'card'
    ? '<p class="mt-3 text-xs text-zinc-400">' + esc(t('payment.onlyLastFour')) + ' (' + '•••• 4242). No full card number is stored.</p>'
    : '';

  return '<form data-pay-form data-pay-form-method="' + m.id + '" class="space-y-4">'
    + '<p class="field-msg hidden" data-pay-form-msg></p>'
    + fields
    + note
    + '<button type="submit" class="btn-primary w-full">' + sheetTitle(m) + '</button>'
    + '<button type="button" data-pay-back class="btn-ghost w-full">' + esc(t('common.back')) + '</button>'
    + '</form>';
}

/* Show the form error and highlight the first offending field. */
function showFormErrors(form, errors) {
  const msg = form.querySelector('[data-pay-form-msg]');
  let firstEl = null;
  Object.entries(errors).forEach(([name, text]) => {
    const el = form.elements[name];
    if (el) {
      el.classList.add('field-error');
      if (!firstEl) firstEl = el;
    }
    if (msg) {
      msg.textContent = text;
      msg.classList.remove('hidden');
    }
  });
  if (firstEl) firstEl.focus();
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function validateForm(m, values) {
  const errors = {};
  if (m.requires === 'phone') {
    const digits = (values.phone.match(/\d/g) || []).length;
    if (digits < 9 || digits > 15) errors.phone = t('payment.err.phone');
  } else if (m.requires === 'bank') {
    const digits = (values.account.match(/\d/g) || []).length;
    if (digits < 6 || digits > 20) errors.account = t('payment.err.account');
    if (values.holder.trim().length < 2) errors.holder = t('payment.err.holder');
  } else if (m.requires === 'card') {
    const digits = (values.cardNumber.match(/\d/g) || []).length;
    if (digits < 13 || digits > 19) errors.cardNumber = t('payment.err.cardNumber');
    if (values.holder.trim().length < 2) errors.holder = t('payment.err.cardHolder');
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(values.expiry.trim())) errors.expiry = t('payment.err.expiry');
    if (!/^\d{3,4}$/.test(values.cvv.trim())) errors.cvv = t('payment.err.cvv');
  }
  return errors;
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function startLink(id) {
  const m = methodById(id);
  if (!m || store.isPaymentLinked(id)) return;
  if (m.requires) {
    sheetView = 'form';
    sheetMethodId = id;
    paintSheet();
    return;
  }
  store.linkPayment(id);
  closeSheet();
  toast(t('payment.added', { name: methodName(m) }));
  renderPaymentView();
}

function submitForm(form) {
  const id = form.getAttribute('data-pay-form-method');
  const m = methodById(id);
  if (!m) return;
  const values = {
    phone: (form.elements.phone ? form.elements.phone.value : '').trim(),
    account: (form.elements.account ? form.elements.account.value : '').trim(),
    holder: (form.elements.holder ? form.elements.holder.value : '').trim(),
    cardNumber: (form.elements.cardNumber ? form.elements.cardNumber.value : '').trim(),
    expiry: (form.elements.expiry ? form.elements.expiry.value : '').trim(),
    cvv: (form.elements.cvv ? form.elements.cvv.value : '').trim(),
  };
  const errors = validateForm(m, values);
  if (Object.keys(errors).length) {
    showFormErrors(form, errors);
    return;
  }
  if (m.requires === 'card') {
    const digits = values.cardNumber.replace(/\D/g, '');
    store.linkPaymentDetails(id, { holder: values.holder, masked: '•••• ' + digits.slice(-4) });
  } else if (m.requires === 'bank') {
    store.linkPaymentDetails(id, { account: values.account, holder: values.holder });
  } else {
    store.linkPaymentDetails(id, { phone: values.phone });
  }
  closeSheet();
  toast(t('payment.added', { name: methodName(m) }));
  renderPaymentView();
}

function unlink(id) {
  const m = methodById(id);
  const p = store.paymentById(id);
  if (!m || !p) return;
  const detail = m.requires === 'bank' ? maskAccount(p.account) : (m.requires === 'card' ? p.masked : (m.requires === 'phone' ? p.phone : ''));
  confirmDialog({
    title: t('payment.removeTitle', { name: methodName(m) }),
    message: t('payment.removeMessage', { detail: detail ? t('payment.removeDetail', { detail }) : '' }),
    confirmLabel: t('common.remove'),
  }).then((ok) => {
    if (!ok) return;
    store.unlinkPayment(id);
    toast(t('payment.removed', { name: methodName(m) }));
    renderPaymentView();
  });
}

/* ------------------------------------------------------------------ */
/* Wiring                                                              */
/* ------------------------------------------------------------------ */

export function initPayment() {
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-pay-add]')) {
      openSheet();
      return;
    }
    if (sheetEl && e.target.closest('[data-pay-sheet-close]')) {
      closeSheet();
      return;
    }
    if (sheetEl && e.target.closest('[data-pay-back]')) {
      sheetView = 'list';
      sheetMethodId = null;
      paintSheet();
      return;
    }
    const pick = e.target.closest('[data-pay-pick]');
    if (pick) {
      startLink(pick.getAttribute('data-pay-pick'));
      return;
    }
    const link = e.target.closest('[data-pay-link]');
    if (link) {
      startLink(link.getAttribute('data-pay-link'));
      return;
    }
    const def = e.target.closest('[data-pay-default]');
    if (def) {
      const id = def.getAttribute('data-pay-default');
      const m = methodById(id);
      store.setDefaultPayment(id);
      toast(t('payment.setDefaultToast', { name: m ? methodName(m) : t('payment.method') }));
      renderPaymentView();
      return;
    }
    const un = e.target.closest('[data-pay-unlink]');
    if (un) unlink(un.getAttribute('data-pay-unlink'));
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-pay-form]');
    if (!form) return;
    e.preventDefault();
    submitForm(form);
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.classList && el.classList.contains('field-error')) el.classList.remove('field-error');
    if (sheetEl) {
      const msg = sheetEl.querySelector('[data-pay-form-msg]');
      if (msg) {
        msg.textContent = '';
        msg.classList.add('hidden');
      }
    }
  });
}
