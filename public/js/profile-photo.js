/* Profile photo (Phase 6). The single seam for the avatar's photo state and
 * the whole choose/crop/save/remove flow.
 *
 * The photo lives platform-side: the browser uploads it with the hosted
 * bridge (usernode.uploadFile), and this app's server keeps only the
 * returned URL + file id against the user's platform id. The server is the
 * source of truth, so state here is in memory only and re-hydrates from
 * GET /api/profile; nothing is cached on the device (the store is
 * deliberately not keyed per user).
 *
 * Routes: the crop screen is the profile sub-route #/profile/photo.
 */

import { icon } from './icons.js';
import { confirmDialog, emptyState, esc, toast } from './ui.js';
import { apiFetch } from './api.js';
import { renderProfileView } from './profile.js';
import { t } from './i18n.js';

const MAX_OUTPUT_BYTES = 1024 * 1024; // 1 MB
const OUTPUT_EDGE = 512;
const MAX_INPUT_BYTES = 20 * 1024 * 1024; // pre-decode guard
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

/* Message text resolved lazily so it follows the active locale (call sites
 * below read MESSAGES.invalid and friends exactly as before). */
const MESSAGES = {
  get invalid() { return t('photo.invalid'); },
  get tooLarge() { return t('photo.tooLarge'); },
  get failed() { return t('photo.failed'); },
  get unavailable() { return t('photo.unavailable'); },
};

/* In-memory photo state. `url` is the platform file URL (or the staging demo
 * data URI); `loading` drives the avatar spinner. */
const state = { url: null, fileId: null, loading: false, hydrated: false };

/* The staging/demo avatar. The server serves the same value behind
 * ?demo=1 on an authenticated GET /api/profile, which is the real path in a
 * preview. This client copy is the fallback for a demo page opened where the
 * request cannot be authenticated (a plain local run), so the demo state is
 * still reviewable without a token and without a console error. */
const DEMO_AVATAR = 'data:image/svg+xml,'
  + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
    + '<rect width="128" height="128" fill="#7c3aed"/>'
    + '<text x="64" y="86" font-family="system-ui,sans-serif" font-size="64" font-weight="700"'
    + ' fill="#ffffff" text-anchor="middle">S</text></svg>');

/* Pending crop. `pending.decoded` is the decoded image source; offsets/zoom
 * describe the framing; `view` is the measured frame edge in CSS px. */
let pending = null;
let crop = null;

export function getAvatarState() {
  return { url: state.url, fileId: state.fileId, loading: state.loading };
}

/* ------------------------------------------------------------------ */
/* Hydration                                                           */
/* ------------------------------------------------------------------ */

function pageDemo() {
  try {
    return new URLSearchParams(window.location.search).get('demo');
  } catch {
    return null;
  }
}

/* Load the signed-in user's photo from the server. Quiet on failure: the
 * letter fallback is the honest empty state. Re-renders the profile view if
 * the shopper is looking at it. */
export async function loadProfilePhoto() {
  const demo = pageDemo();
  const isDemo = demo === '1' || demo === 'checkout';
  // The route is identity-optional and answers nulls when nobody is signed
  // in, so this never 401s. On a real network failure the demo page still
  // shows its avatar from the local copy; the plain page shows the letter.
  const res = await apiFetch('/api/profile' + (isDemo ? '?demo=1' : ''));
  if (res.ok && res.data) {
    state.url = res.data.avatarUrl || null;
    state.fileId = res.data.avatarFileId || null;
  } else if (isDemo) {
    state.url = DEMO_AVATAR;
  }
  state.hydrated = true;
  const hash = (location.hash || '').replace(/^#\/?/, '');
  if (hash === 'profile' || hash.startsWith('profile/')) renderProfileView();
}

/* ------------------------------------------------------------------ */
/* The photo menu                                                      */
/* ------------------------------------------------------------------ */

function chooseFromGallery(anchorEl) {
  const input = document.getElementById('avatar-file-input');
  if (!input) return;
  input.value = '';
  input.click();
}

function removePhoto() {
  const hasPhoto = !!state.url;
  if (!hasPhoto) return;
  confirmDialog({
    title: t('photo.removeTitle'),
    message: t('photo.removeMessage'),
    confirmLabel: t('photo.removeConfirm'),
  }).then(async (ok) => {
    if (!ok) return;
    if (state.fileId && window.usernode && typeof window.usernode.deleteFile === 'function') {
      try {
        await window.usernode.deleteFile(state.fileId);
      } catch {
        // Best effort: the row is cleared regardless of the file delete.
      }
    }
    state.loading = true;
    renderProfileView();
    const res = await apiFetch('/api/profile/photo', { method: 'DELETE' });
    state.loading = false;
    if (res.ok) {
      state.url = null;
      state.fileId = null;
      toast(t('photo.removed'));
    } else {
      toast(MESSAGES.failed);
    }
    renderProfileView();
  });
}

function openPhotoMenu(anchorEl) {
  const items = [{ label: t('photo.none.action'), value: 'choose' }];
  if (state.url) items.push({ label: t('photo.removeConfirm'), value: 'remove', destructive: true });

  if (window.unNative && typeof window.unNative.menu === 'function') {
    window.unNative.menu({
      anchorEl,
      title: t('photo.title'),
      cancelLabel: t('photo.cancel'),
      items,
    }).then((picked) => {
      if (!picked) return;
      if (picked.value === 'choose') chooseFromGallery(anchorEl);
      else if (picked.value === 'remove') removePhoto();
    });
    return;
  }

  // Standalone fallback: a small card under the avatar with the same rows.
  document.querySelectorAll('[data-photo-menu]').forEach((el) => el.remove());
  const menu = document.createElement('div');
  menu.setAttribute('data-photo-menu', '');
  menu.className = 'card absolute z-50 mt-2 w-48 divide-y divide-zinc-100 overflow-hidden';
  menu.innerHTML = items.map((it) =>
    '<button type="button" class="menu-row' + (it.destructive ? ' text-rose-600' : '') + '" data-photo-action="' + it.value + '">'
    + esc(it.label) + '</button>').join('');
  const host = anchorEl.parentElement;
  if (host) {
    host.style.position = host.style.position || 'relative';
    host.appendChild(menu);
  }
}

/* ------------------------------------------------------------------ */
/* Picking + validating a file                                         */
/* ------------------------------------------------------------------ */

function fileExtension(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

function isAcceptedFile(file) {
  if (ACCEPTED.includes(file.type)) return true;
  // Some Android pickers return an empty type; fall back to the extension.
  if (!file.type) {
    const ext = fileExtension(file.name);
    if (['jpg', 'jpeg'].includes(ext)) return true;
    if (['png', 'webp'].includes(ext)) return true;
  }
  return false;
}

async function handleFilePicked(file) {
  if (!file) return;
  if (!isAcceptedFile(file)) {
    toast(MESSAGES.invalid);
    return;
  }
  if (file.size > MAX_INPUT_BYTES) {
    toast(MESSAGES.tooLarge);
    return;
  }
  try {
    const decoded = await decodeImage(file);
    pending = { decoded, file };
    crop = null;
    location.hash = '/profile/photo';
    // renderRoute fires on hashchange; if already there, force a render.
    if ((location.hash || '') === '#/profile/photo') renderProfileView();
  } catch {
    toast(MESSAGES.invalid);
  }
}

/* Decode a picked file into a drawable source with its true pixel size.
 * Prefers createImageBitmap (honours EXIF orientation via the option form),
 * and falls back to an <img> element, which modern browsers also orient by
 * default, so a picker/preview mismatch is impossible. */
async function decodeImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fall through to the <img> path.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  if (img.decode) await img.decode();
  else await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, objectUrl: url };
}

/* ------------------------------------------------------------------ */
/* Crop screen                                                         */
/* ------------------------------------------------------------------ */

function cropMarkup() {
  return '<div class="flex items-center gap-1">'
    + '<button type="button" data-route="profile" class="icon-btn -ml-2" aria-label="' + esc(t('common.back')) + '">'
    + icon('chevronLeft', 'h-5 w-5') + '</button>'
    + '<h1 class="section-title">' + esc(t('photo.addTitle')) + '</h1>'
    + '</div>'
    + '<div class="card mt-4 flex flex-col items-center gap-4 p-4">'
    + '<div data-crop-frame class="relative h-72 w-72 max-w-full touch-none select-none overflow-hidden rounded-xl bg-zinc-900">'
    + '<img data-crop-img alt="" class="absolute max-w-none" draggable="false">'
    + '<div class="pointer-events-none absolute inset-0">'
    + '<div class="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90" style="box-shadow:0 0 0 9999px rgba(0,0,0,0.55)"></div>'
    + '</div>'
    + '</div>'
    + '<label class="flex w-full max-w-xs items-center gap-3">'
    + '<span class="text-xs font-semibold text-zinc-500">' + esc(t('photo.zoom')) + '</span>'
    + '<input type="range" data-crop-zoom min="1" max="4" step="0.01" value="1" class="w-full accent-brand-600" aria-label="' + esc(t('photo.zoom')) + '">'
    + '</label>'
    + '<p data-crop-error class="field-msg hidden" role="alert"></p>'
    + '<div class="flex w-full max-w-xs gap-2">'
    + '<button type="button" data-crop-cancel class="btn-outline flex-1">' + esc(t('photo.cancel')) + '</button>'
    + '<button type="button" data-crop-save class="btn-primary flex-1">' + esc(t('photo.save')) + '</button>'
    + '</div>'
    + '</div>'
    + '<p class="mt-3 px-1 text-xs text-zinc-400">' + esc(t('photo.cropHint')) + '</p>';
}

/* Position the image inside the frame for the current zoom + offset. */
function applyCropTransform() {
  if (!crop) return;
  const img = document.querySelector('[data-crop-img]');
  if (!img) return;
  const s = crop.cover * crop.zoom;
  const w = crop.decoded.width * s;
  const h = crop.decoded.height * s;
  crop.imgW = w;
  crop.imgH = h;
  const maxOx = Math.max(0, (w - crop.view) / 2);
  const maxOy = Math.max(0, (h - crop.view) / 2);
  crop.ox = Math.max(-maxOx, Math.min(maxOx, crop.ox));
  crop.oy = Math.max(-maxOy, Math.min(maxOy, crop.oy));
  const left = crop.view / 2 + crop.ox - w / 2;
  const top = crop.view / 2 + crop.oy - h / 2;
  img.style.width = w + 'px';
  img.style.height = h + 'px';
  img.style.left = left + 'px';
  img.style.top = top + 'px';
}

function setZoom(z) {
  if (!crop) return;
  crop.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
  const slider = document.querySelector('[data-crop-zoom]');
  if (slider && Number(slider.value) !== crop.zoom) slider.value = String(crop.zoom);
  applyCropTransform();
}

/* Wire drag / pinch / wheel on the frame once it is mounted. */
function mountCropInteractions() {
  const frame = document.querySelector('[data-crop-frame]');
  const img = document.querySelector('[data-crop-img]');
  if (!frame || !img || !pending) return;

  crop = {
    decoded: pending.decoded,
    view: frame.clientWidth || 288,
    zoom: 1,
    ox: 0,
    oy: 0,
    imgW: 0,
    imgH: 0,
  };
  crop.cover = Math.max(crop.view / crop.decoded.width, crop.view / crop.decoded.height);
  applyCropTransform();

  const pointers = new Map();
  let lastDist = 0;
  let lastMid = null;

  frame.addEventListener('pointerdown', (e) => {
    frame.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lastMid = null;
    lastDist = 0;
  });

  frame.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId) || !crop) return;
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      if (lastDist) setZoom(crop.zoom * (dist / lastDist));
      if (lastMid && crop) {
        crop.ox += mid.x - lastMid.x;
        crop.oy += mid.y - lastMid.y;
      }
      lastDist = dist;
      lastMid = mid;
      applyCropTransform();
      return;
    }

    crop.ox += e.clientX - prev.x;
    crop.oy += e.clientY - prev.y;
    applyCropTransform();
  });

  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) {
      lastDist = 0;
      lastMid = null;
    }
  };
  frame.addEventListener('pointerup', endPointer);
  frame.addEventListener('pointercancel', endPointer);

  frame.addEventListener('wheel', (e) => {
    if (!crop) return;
    e.preventDefault();
    setZoom(crop.zoom * (e.deltaY < 0 ? 1.1 : 0.9));
  }, { passive: false });
}

/* Encode the framed square, stepping quality (and then size) down until the
 * blob is under 1 MB. Returns { blob, name }. */
function encodeAvatar() {
  return new Promise((resolve, reject) => {
    if (!crop) return reject(new Error('no-crop'));
    const edge = OUTPUT_EDGE;
    const canvas = document.createElement('canvas');
    canvas.width = edge;
    canvas.height = edge;
    const ctx = canvas.getContext('2d');

    const s = crop.cover * crop.zoom;
    // The visible square's top-left in source-image pixels.
    const srcX = (crop.imgW / 2 - crop.view / 2 - crop.ox) / s;
    const srcY = (crop.imgH / 2 - crop.view / 2 - crop.oy) / s;
    const srcSize = crop.view / s;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, edge, edge);
    ctx.drawImage(crop.decoded.source, srcX, srcY, srcSize, srcSize, 0, 0, edge, edge);

    const attempts = [
      { type: 'image/webp', q: 0.85, edge },
      { type: 'image/webp', q: 0.7, edge },
      { type: 'image/webp', q: 0.55, edge },
      { type: 'image/jpeg', q: 0.8, edge },
      { type: 'image/jpeg', q: 0.6, edge },
      { type: 'image/jpeg', q: 0.5, edge: 384 },
      { type: 'image/jpeg', q: 0.5, edge: 256 },
    ];

    function attempt(i) {
      if (i >= attempts.length) return reject(new Error('encode-failed'));
      const a = attempts[i];
      if (a.edge !== edge) {
        canvas.width = a.edge;
        canvas.height = a.edge;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, a.edge, a.edge);
        ctx.drawImage(crop.decoded.source, srcX, srcY, srcSize, srcSize, 0, 0, a.edge, a.edge);
      }
      canvas.toBlob((blob) => {
        if (!blob) return attempt(i + 1);
        // Some browsers silently substitute PNG when webp is unsupported.
        let type = blob.type;
        if (a.type === 'image/webp' && type !== 'image/webp') type = '';
        if (type === '' || blob.size > MAX_OUTPUT_BYTES) return attempt(i + 1);
        const ext = type === 'image/webp' ? 'webp' : (type === 'image/png' ? 'png' : 'jpg');
        resolve({ blob, name: 'avatar.' + ext });
      }, a.type, a.q);
    }
    attempt(0);
  });
}

function setCropError(msg) {
  const el = document.querySelector('[data-crop-error]');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}

async function saveCrop() {
  if (!crop || !pending) return;
  const saveBtn = document.querySelector('[data-crop-save]');
  const cancelBtn = document.querySelector('[data-crop-cancel]');
  setCropError('');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = icon('loader', 'h-4 w-4 animate-spin') + '<span>' + esc(t('photo.saving')) + '</span>';
  }
  if (cancelBtn) cancelBtn.disabled = true;

  let encoded;
  try {
    encoded = await encodeAvatar();
  } catch {
    setCropError(MESSAGES.failed);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('photo.save'); }
    if (cancelBtn) cancelBtn.disabled = false;
    return;
  }

  if (!window.usernode || typeof window.usernode.uploadFile !== 'function') {
    setCropError(MESSAGES.unavailable);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('photo.save'); }
    if (cancelBtn) cancelBtn.disabled = false;
    return;
  }

  let stored;
  try {
    const file = new File([encoded.blob], encoded.name, { type: encoded.blob.type });
    stored = await window.usernode.uploadFile(file, { visibility: 'public' });
  } catch (err) {
    setCropError(uploadErrorMessage(err));
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('photo.save'); }
    if (cancelBtn) cancelBtn.disabled = false;
    return;
  }

  const res = await apiFetch('/api/profile/photo', {
    method: 'PUT',
    body: JSON.stringify({ url: stored.url, fileId: stored.id }),
  });
  if (!res.ok) {
    setCropError(MESSAGES.failed);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('photo.save'); }
    if (cancelBtn) cancelBtn.disabled = false;
    return;
  }

  state.url = stored.url;
  state.fileId = stored.id;
  discardPending();
  toast(t('photo.updated'));
  location.hash = '/profile';
}

function uploadErrorMessage(err) {
  const code = err && (err.code || err.message) ? String(err.code || err.message) : '';
  if (code.includes('file_too_large')) return MESSAGES.tooLarge;
  if (code.includes('invalid_image')) return MESSAGES.invalid;
  if (code.includes('quota')) return MESSAGES.failed;
  if (code.includes('storage_unavailable')) return MESSAGES.unavailable;
  return MESSAGES.failed;
}

function cancelCrop() {
  discardPending();
  location.hash = '/profile';
}

function discardPending() {
  if (pending && pending.decoded && pending.decoded.objectUrl) {
    try { URL.revokeObjectURL(pending.decoded.objectUrl); } catch { /* ignore */ }
  }
  pending = null;
  crop = null;
}

/* Render into #view-profile. Called from the profile dispatcher. */
export function renderCropView() {
  const view = document.getElementById('view-profile');
  if (!pending) {
    view.innerHTML =
      '<div class="flex items-center gap-1">'
      + '<button type="button" data-route="profile" class="icon-btn -ml-2" aria-label="' + esc(t('common.back')) + '">'
      + icon('chevronLeft', 'h-5 w-5') + '</button>'
      + '<h1 class="section-title">' + esc(t('photo.addTitle')) + '</h1>'
      + '</div>'
      + '<div class="card mt-4">' + emptyState({
        icon: 'camera',
        title: t('photo.none.title'),
        body: t('photo.none.body'),
        actionLabel: t('photo.none.action'),
        actionAttr: 'data-avatar-choose',
      }) + '</div>';
    return;
  }
  view.innerHTML = cropMarkup();
  const img = document.querySelector('[data-crop-img]');
  if (img) {
    img.src = previewDataUrl(pending.decoded);
    mountCropInteractions();
  }
}

/* Preview the DECODED image (EXIF orientation already applied) so what the
 * crop frame shows is exactly what the canvas will encode, capped at 1024px
 * so the data URL stays small. */
function previewDataUrl(decoded) {
  const max = 1024;
  const scale = Math.min(1, max / Math.max(decoded.width, decoded.height));
  const w = Math.max(1, Math.round(decoded.width * scale));
  const h = Math.max(1, Math.round(decoded.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(decoded.source, 0, 0, w, h);
  try {
    return canvas.toDataURL('image/jpeg', 0.9);
  } catch {
    return '';
  }
}

/* ------------------------------------------------------------------ */
/* Listeners                                                           */
/* ------------------------------------------------------------------ */

export function initProfilePhoto() {
  document.addEventListener('click', (e) => {
    const avatar = e.target.closest('[data-avatar-edit]');
    if (avatar) {
      openPhotoMenu(avatar);
      return;
    }
    const choose = e.target.closest('[data-avatar-choose]');
    if (choose) {
      chooseFromGallery(choose);
      return;
    }
    const action = e.target.closest('[data-photo-action]');
    if (action) {
      document.querySelectorAll('[data-photo-menu]').forEach((el) => el.remove());
      if (action.getAttribute('data-photo-action') === 'choose') chooseFromGallery(action);
      else removePhoto();
      return;
    }
    if (e.target.closest('[data-crop-save]')) {
      saveCrop();
      return;
    }
    if (e.target.closest('[data-crop-cancel]')) {
      cancelCrop();
      return;
    }
    // Any other click closes a standalone photo menu.
    if (!e.target.closest('[data-photo-menu]')) {
      document.querySelectorAll('[data-photo-menu]').forEach((el) => el.remove());
    }
  });

  document.addEventListener('change', (e) => {
    const el = e.target.closest('#avatar-file-input');
    if (el && el.files && el.files[0]) handleFilePicked(el.files[0]);
  });

  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-crop-zoom]');
    if (el) setZoom(Number(el.value));
  });
}
