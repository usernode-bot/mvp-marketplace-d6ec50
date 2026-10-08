/* Filter & sort UI: the components the home grid and the browse pages share.
 *
 *   FilterBar          the "Filters" button (with active count) and the sort
 *                      dropdown, one row above the product grid
 *   LocationSelect     a province -> city two-level multi-select combobox
 *                      with type-ahead, chips and "Use my current location"
 *   PriceRange         a min/max price pair (integer cents in, dollars out)
 *   SortDropdown       the toolbar's sort menu
 *   ActiveFilterChips  one removable pill per active filter, plus Clear all
 *   filterSheetHtml    the mobile bottom sheet / desktop modal that holds
 *                      Location, Price and Sort with Apply and Reset
 *
 * The markup is rendered as strings (the app's pattern) and behavior is
 * wired with one delegated listener in bindFilterControls, so the same code
 * drives the home grid and the browse grid. All state comes from a filter
 * service (filters.js); this module only reads it and reports changes.
 */

import { icon } from './icons.js';
import { esc } from './ui.js';
import { LOCATIONS, citiesByProvince, nearestCity } from './locations.js';
import { SORT_OPTIONS } from './sort-options.js';
import { plural, sortOptionLabel, t } from './i18n.js';
import {
  DEFAULT_LIMIT,
  activeFilterCount,
  emptyFilters,
  filterChips,
  hasActiveFilters,
  normalizeRange,
  parseAmount,
} from './filters.js';

/* ------------------------------------------------------------------ */
/* Small builders                                                       */
/* ------------------------------------------------------------------ */

function sectionHeading(text) {
  return '<h3 class="text-xs font-semibold uppercase tracking-wide text-zinc-400">' + esc(text) + '</h3>';
}

/* "$499" / "$499.50" from integer cents, for the price inputs. */
function centsToInput(cents) {
  if (cents === null || cents === undefined) return '';
  const d = cents / 100;
  return Number.isInteger(d) ? String(d) : d.toFixed(2);
}

/* "[data-product]" count for the sheet's Apply button. */
function countLabel(n) {
  return plural('count.products', n);
}

/* ------------------------------------------------------------------ */
/* Active filter chips + result count                                  */
/* ------------------------------------------------------------------ */

export function activeFilterChipsHtml(f) {
  const chips = filterChips(f);
  if (!chips.length) return '';
  const pills = chips.map((c) =>
    '<span class="fchip" title="' + esc(c.title) + '">'
    + esc(c.label)
    + '<button type="button" data-chip-remove="' + c.key + '" aria-label="' + esc(t('aria.removeFilter', { title: c.title }))
    + '" class="fchip-x">' + icon('x', 'h-3 w-3') + '</button></span>').join('');
  return '<div class="mt-3 flex flex-wrap items-center gap-2" data-active-chips>'
    + pills
    + '<button type="button" data-filter-clear class="ml-1 text-xs font-semibold text-brand-700 hover:underline">' + esc(t('common.clearAll')) + '</button>'
    + '</div>';
}

/* aria-live region so a screen reader hears the count change after a filter
 * is applied. Visually it is the small line above the grid. */
export function resultCountHtml(total) {
  return '<p class="mt-3 text-xs text-zinc-500" aria-live="polite" data-result-count>'
    + esc(plural('count.products', total)) + '</p>';
}

/* ------------------------------------------------------------------ */
/* Filter bar (toolbar) + sort dropdown                                */
/* ------------------------------------------------------------------ */

export function filterBarHtml(f) {
  const n = activeFilterCount(f);
  const sortLabel = sortOptionLabel((SORT_OPTIONS.find((o) => o.id === f.sort) || SORT_OPTIONS[0]).id);
  return '<div class="mt-4 flex items-center gap-2" data-filter-toolbar>'
    + '<button type="button" data-filter-open class="btn-outline btn-sm" aria-haspopup="dialog">'
    + icon('sliders', 'h-4 w-4') + esc(t('aria.filters'))
    + '<span data-filter-badge class="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9px] font-bold leading-none text-white'
    + (n ? '' : ' hidden') + '">' + n + '</span>'
    + '</button>'
    + '<div class="relative ml-auto">'
    + '<button type="button" data-sort-toggle class="btn-outline btn-sm" aria-haspopup="menu" aria-expanded="false">'
    + t('browse.sort', { label: '<span data-sort-label>' + esc(sortLabel) + '</span>' }) + icon('chevronDown', 'h-3.5 w-3.5')
    + '</button>'
    + '<div data-sort-menu class="absolute right-0 top-full z-30 mt-1.5 hidden w-56 rounded-xl border border-zinc-100 bg-white p-1.5 shadow-card-lg" role="menu">'
    + sortMenuItemsHtml(f.sort)
    + '</div></div></div>';
}

function sortMenuItemsHtml(current) {
  return SORT_OPTIONS.map((o) =>
    '<button type="button" data-sort-item="' + o.id + '" role="menuitemradio" aria-checked="' + (o.id === current)
    + '" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50">'
    + '<span class="check-slot w-4 shrink-0">' + (o.id === current ? icon('check', 'h-4 w-4 text-brand-600') : '') + '</span>'
    + esc(sortOptionLabel(o.id)) + '</button>').join('');
}

/* Refresh just the sort control + chip row in place, so applying a filter
 * does not rebuild the grid's parent and lose scroll. */
export function updateFilterBar(root, f) {
  root.querySelectorAll('[data-sort-label]').forEach((el) => {
    el.textContent = sortOptionLabel((SORT_OPTIONS.find((o) => o.id === f.sort) || SORT_OPTIONS[0]).id);
  });
  root.querySelectorAll('[data-sort-menu] [data-sort-item]').forEach((btn) => {
    const on = btn.dataset.sortItem === f.sort;
    btn.setAttribute('aria-checked', String(on));
    const slot = btn.querySelector('.check-slot');
    if (slot) slot.innerHTML = on ? icon('check', 'h-4 w-4 text-brand-600') : '';
  });
  const badge = root.querySelector('[data-filter-badge]');
  if (badge) {
    const n = activeFilterCount(f);
    badge.textContent = String(n);
    badge.classList.toggle('hidden', n === 0);
  }
}

/* ------------------------------------------------------------------ */
/* Location select (province -> city, multi-select combobox)           */
/* ------------------------------------------------------------------ */

/* The chips for the cities chosen so far (inside the combobox). */
function selectedCitiesHtml(f) {
  if (!f.cities.length) return '';
  return '<div class="mt-2 flex flex-wrap gap-1.5" data-city-chips>'
    + f.cities.map((c) =>
      '<span class="fchip">' + esc(c)
      + '<button type="button" data-city-remove="' + esc(c) + '" aria-label="' + esc(t('aria.removeCity', { city: c }))
      + '" class="fchip-x">' + icon('x', 'h-3 w-3') + '</button></span>').join('')
    + '</div>';
}

export function locationSelectHtml(f) {
  const provinceLabel = f.province || t('filter.allLocations');
  const list = LOCATIONS.map((p) => {
    const open = f.province === p.name;
    const options = p.cities.map((c) => {
      const on = f.cities.includes(c.name);
      return '<button type="button" role="option" id="' + cityOptionId(p.name, c.name)
        + '" data-city-option="' + esc(c.name) + '" aria-selected="' + on
        + '" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm '
        + (on ? 'bg-brand-50 font-semibold text-brand-700' : 'text-zinc-700 hover:bg-zinc-50') + '">'
        + '<span class="check-slot w-4 shrink-0">' + (on ? icon('check', 'h-4 w-4') : '') + '</span>'
        + esc(c.name) + '</button>';
    }).join('');
    return '<div data-province-group="' + esc(p.name) + '">'
      + '<button type="button" data-province="' + esc(p.name) + '" aria-expanded="' + open
      + '" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50">'
      + '<span>' + esc(p.name) + '</span>'
      + '<span class="ml-auto text-zinc-400">' + icon(open ? 'chevronDown' : 'chevronRight', 'h-4 w-4') + '</span>'
      + '</button>'
      + '<div class="mt-0.5 space-y-0.5 pl-2' + (open ? '' : ' hidden') + '" data-province-cities>' + options + '</div>'
      + '</div>';
  }).join('');

  return '<div data-location-select>'
    + '<div class="relative">'
    + '<button type="button" id="loc-combobox" data-loc-toggle role="combobox" aria-expanded="false" aria-controls="loc-list" aria-haspopup="listbox" aria-label="' + esc(t('aria.filterByLocation')) + '" class="field flex items-center justify-between text-left">'
    + '<span class="truncate' + (f.province ? ' text-zinc-900' : ' text-zinc-400') + '" data-loc-label>' + esc(provinceLabel) + '</span>'
    + icon('chevronDown', 'h-4 w-4 text-zinc-400')
    + '</button>'
    + '<div id="loc-popover" class="mt-1.5 hidden rounded-xl border border-zinc-100 bg-white p-2 shadow-card-lg">'
    + '<div class="relative">'
    + '<span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400">' + icon('search', 'h-4 w-4') + '</span>'
    + '<input type="search" id="loc-search" role="combobox" aria-controls="loc-list" aria-autocomplete="list" aria-expanded="true" autocomplete="off" placeholder="' + esc(t('filter.searchCities')) + '" class="field pl-8" data-loc-search>'
    + '</div>'
    + '<div id="loc-list" role="listbox" aria-multiselectable="true" aria-label="' + esc(t('filter.cities')) + '" class="mt-1.5 max-h-60 overflow-y-auto pr-0.5" data-loc-list>'
    + list
    + '<p class="hidden p-2 text-sm text-zinc-500" data-loc-none>' + esc(t('filter.noCities')) + '</p>'
    + '</div>'
    + '</div></div>'
    + selectedCitiesHtml(f)
    + '<button type="button" data-use-location class="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50">'
    + icon('mapPin', 'h-4 w-4') + esc(t('filter.useMyLocation')) + '</button>'
    + '</div>';
}

function cityOptionId(province, city) {
  return 'city-' + province.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-' + city.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Price range                                                         */
/* ------------------------------------------------------------------ */

export function priceRangeHtml(f) {
  return '<div data-price-range>'
    + '<div class="flex items-center gap-2">'
    + '<input type="text" inputmode="decimal" id="price-min" data-price-min class="field" placeholder="' + esc(t('filter.min')) + '" aria-label="' + esc(t('aria.minPrice')) + '" value="' + esc(centsToInput(f.min)) + '">'
    + '<span class="text-zinc-400" aria-hidden="true">-</span>'
    + '<input type="text" inputmode="decimal" id="price-max" data-price-max class="field" placeholder="' + esc(t('filter.max')) + '" aria-label="' + esc(t('aria.maxPrice')) + '" value="' + esc(centsToInput(f.max)) + '">'
    + '</div>'
    + '<p class="mt-1.5 text-xs text-zinc-500" data-price-msg>' + esc(t('filter.priceHint')) + '</p>'
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* Sort (sheet radio group)                                            */
/* ------------------------------------------------------------------ */

export function sortRadioHtml(f) {
  return '<div role="radiogroup" aria-label="' + esc(t('aria.sortBy')) + '" class="mt-1.5">'
    + SORT_OPTIONS.map((o) =>
      '<button type="button" role="radio" aria-checked="' + (o.id === f.sort) + '" data-sort-radio="' + o.id
      + '" class="flex w-full items-center gap-3 py-2.5 text-left text-sm '
      + (o.id === f.sort ? 'font-semibold text-brand-700' : 'text-zinc-700') + '">'
      + '<span class="dot flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 '
      + (o.id === f.sort ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-300') + '">'
      + (o.id === f.sort ? icon('check', 'h-2.5 w-2.5') : '') + '</span>'
      + esc(sortOptionLabel(o.id)) + '</button>').join('')
    + '</div>';
}

/* ------------------------------------------------------------------ */
/* The sheet / modal shell                                             */
/* ------------------------------------------------------------------ */

export function filterSheetHtml({ filters, resultCount }) {
  return '<div class="absolute inset-0 bg-zinc-900/40" data-filter-close></div>'
    + '<div class="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white shadow-card-lg md:inset-0 md:my-auto md:h-fit md:max-w-md md:rounded-2xl" role="document">'
    + '<div class="flex items-center justify-between border-b border-zinc-100 px-4 py-3">'
    + '<h2 class="text-base font-bold text-zinc-900">' + esc(t('aria.filters')) + '</h2>'
    + '<button type="button" data-filter-close class="icon-btn" aria-label="' + esc(t('aria.closeFilters')) + '">' + icon('x', 'h-5 w-5') + '</button>'
    + '</div>'
    + '<div class="flex-1 space-y-5 overflow-y-auto px-4 py-4">'
    + '<div>' + sectionHeading(t('filter.location')) + '<div class="mt-2">' + locationSelectHtml(filters) + '</div></div>'
    + '<div>' + sectionHeading(t('filter.price')) + '<div class="mt-2">' + priceRangeHtml(filters) + '</div></div>'
    + '<div>' + sectionHeading(t('filter.sortBy')) + sortRadioHtml(filters) + '</div>'
    + '</div>'
    + '<div class="border-t border-zinc-100 p-3" style="padding-bottom: calc(0.75rem + var(--un-safe-inset-bottom, 0px));">'
    + '<div class="flex gap-2">'
    + '<button type="button" data-filter-reset class="btn-outline flex-1">' + esc(t('common.reset')) + '</button>'
    + '<button type="button" data-filter-apply class="btn-primary flex-1">' + esc(t('common.apply')) + '</button>'
    + '</div>'
    + '<p class="mt-2 text-center text-xs text-zinc-500" data-sheet-count>' + esc(countLabel(resultCount)) + '</p>'
    + '</div></div>';
}

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */

/* Wire one filter service (filters.js) to a container. The container holds
 * the toolbar and the overlay element; the service owns the state and asks
 * its subscribers to re-render the list. Returns nothing; the caller keeps a
 * reference to the service for its own grid rendering.
 *
 * While the sheet is open its edits are STAGED (a copy of the service's
 * filters); Apply commits them and Reset restores the defaults. The sheet is
 * not rebuilt on service changes, so a date a shopper typed is never lost. */
export function bindFilterControls(root, service) {
  if (!root) return;
  const overlay = root.querySelector('[data-filter-overlay]');
  let staged = null; // the sheet's working copy, or null when closed

  const openSheet = () => {
    if (!overlay) return;
    staged = Object.assign(emptyFilters(), service.filters, { cities: service.filters.cities.slice() });
    overlay.innerHTML = filterSheetHtml({ filters: staged, resultCount: service.total });
    overlay.classList.remove('hidden');
    const focusTarget = overlay.querySelector('[data-loc-toggle]') || overlay.querySelector('[data-filter-reset]');
    if (focusTarget) focusTarget.focus();
  };

  const closeSheet = () => {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.innerHTML = '';
    staged = null;
    const opener = root.querySelector('[data-filter-open]');
    if (opener) opener.focus();
  };

  const applyStaged = () => {
    if (!staged) return;
    service.setFilters(normalizeRange(staged));
    closeSheet();
  };

  const patchStaged = (patch) => {
    if (!staged) return;
    Object.assign(staged, patch);
  };

  const closeSortMenu = () => {
    root.querySelectorAll('[data-sort-menu]').forEach((m) => m.classList.add('hidden'));
    root.querySelectorAll('[data-sort-toggle]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  };

  root.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-sort-toggle]');
    if (toggle) {
      const menu = root.querySelector('[data-sort-menu]');
      if (menu) {
        const hidden = menu.classList.toggle('hidden');
        toggle.setAttribute('aria-expanded', String(!hidden));
      }
      return;
    }

    const sortItem = e.target.closest('[data-sort-item]');
    if (sortItem) {
      service.setFilters({ sort: sortItem.dataset.sortItem });
      closeSortMenu();
      return;
    }

    if (e.target.closest('[data-filter-open]')) {
      openSheet();
      return;
    }

    if (e.target.closest('[data-filter-close]')) {
      closeSheet();
      return;
    }

    if (e.target.closest('[data-filter-apply]')) {
      applyStaged();
      return;
    }

    if (e.target.closest('[data-filter-reset]')) {
      staged = emptyFilters();
      if (overlay) overlay.innerHTML = filterSheetHtml({ filters: staged, resultCount: service.total });
      return;
    }

    if (e.target.closest('[data-filter-clear]')) {
      service.reset();
      return;
    }

    const chipKey = e.target.closest('[data-chip-remove]');
    if (chipKey) {
      service.removeChip(chipKey.dataset.chipRemove);
      return;
    }

    // --- inside the sheet (staged edits) ---
    const province = e.target.closest('[data-province]');
    if (province && staged) {
      const name = province.dataset.province;
      patchStaged({ province: staged.province === name ? '' : name, cities: [] });
      updateLocationSection();
      return;
    }

    const cityOption = e.target.closest('[data-city-option]');
    if (cityOption && staged) {
      const name = cityOption.dataset.cityOption;
      const cities = staged.cities.includes(name)
        ? staged.cities.filter((c) => c !== name)
        : staged.cities.concat(name);
      patchStaged({ cities });
      // Selecting a city implies its province when none is chosen yet.
      if (cities.length && !staged.province) {
        const prov = LOCATIONS.find((p) => p.cities.some((c) => c.name === name));
        if (prov) patchStaged({ province: prov.name });
      }
      updateLocationSection();
      return;
    }

    const cityRemove = e.target.closest('[data-city-remove]');
    if (cityRemove && staged) {
      patchStaged({ cities: staged.cities.filter((c) => c !== cityRemove.dataset.cityRemove) });
      updateLocationSection();
      return;
    }

    const locToggle = e.target.closest('[data-loc-toggle]');
    if (locToggle) {
      toggleLocPopover();
      return;
    }

    const sortRadio = e.target.closest('[data-sort-radio]');
    if (sortRadio && staged) {
      patchStaged({ sort: sortRadio.dataset.sortRadio });
      refreshSheet();
      return;
    }

    if (e.target.closest('[data-use-location]')) {
      useCurrentLocation();
      return;
    }
  });

  // The sheet's text inputs update the staged copy live but never re-render
  // (that would drop focus and the caret).
  function onSheetInput(e) {
    if (!staged) return;
    const el = e.target;
    if (el.matches('[data-price-min]')) {
      patchStaged({ min: el.value.trim() === '' ? null : parseAmount(el.value) });
      setPriceMessage();
    } else if (el.matches('[data-price-max]')) {
      patchStaged({ max: el.value.trim() === '' ? null : parseAmount(el.value) });
      setPriceMessage();
    } else if (el.matches('[data-loc-search]')) {
      filterCityList(el.value);
    }
  }
  root.addEventListener('input', onSheetInput);

  root.addEventListener('change', (e) => {
    if (!staged) return;
    const el = e.target;
    if (el.matches('[data-price-min]') || el.matches('[data-price-max]')) onSheetInput(e);
  });

  // Keyboard support: Escape closes the sheet (and any open menu/popover);
  // Tab is trapped inside the open sheet so focus cannot wander to the page
  // behind it; the combobox search moves its active option with the arrows
  // and toggles it with Enter, tracked by aria-activedescendant.
  root.addEventListener('keydown', (e) => {
    const sheetOpen = overlay && !overlay.classList.contains('hidden');
    if (e.key === 'Escape') {
      if (sheetOpen) closeSheet();
      closeSortMenu();
      const popover = root.querySelector('#loc-popover');
      if (popover) popover.classList.add('hidden');
      return;
    }
    if (e.key === 'Tab' && sheetOpen) {
      trapSheetFocus(e);
      return;
    }
    const search = e.target.closest('[data-loc-search]');
    if (search) {
      const options = visibleCityOptions(root);
      if (!options.length) return;
      let idx = options.findIndex((o) => o.id === search.getAttribute('aria-activedescendant'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        idx = e.key === 'ArrowDown' ? Math.min(options.length - 1, idx + 1) : Math.max(0, idx - 1);
        const chosen = options[idx];
        search.setAttribute('aria-activedescendant', chosen.id);
        chosen.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (options[idx]) options[idx].click();
      }
    }
  });

  document.addEventListener('pointerdown', (e) => {
    const menu = root.querySelector('[data-sort-menu]');
    if (menu && !menu.classList.contains('hidden') && !menu.contains(e.target) && !e.target.closest('[data-sort-toggle]')) {
      closeSortMenu();
    }
    const popover = root.querySelector('#loc-popover');
    if (popover && !popover.classList.contains('hidden') && !popover.contains(e.target) && !e.target.closest('[data-loc-toggle]')) {
      popover.classList.add('hidden');
      const toggle = root.querySelector('[data-loc-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---- internal helpers ---- */

  /* Keep Tab inside the open sheet: focus the first control when Tab runs
   * off the end, the last when Shift+Tab runs off the front. */
  function trapSheetFocus(e) {
    const focusables = [...overlay.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* Re-render just the Location section: the combobox label, the selected
   * city chips and the province/city list. Toggling a province or a city then
   * leaves the popover open (and the typed search intact) instead of
   * rebuilding the whole sheet and slamming the list shut between the two
   * levels. Focus returns to the search box so the keyboard flow survives. */
  function updateLocationSection() {
    if (!overlay || !staged) return;
    const section = overlay.querySelector('[data-location-select]');
    if (!section) return;
    const search = overlay.querySelector('[data-loc-search]');
    const value = search ? search.value : '';
    // The rebuilt markup starts with the popover closed, so remember whether
    // the shopper had it open and reopen it after the swap.
    const wasOpen = !!overlay.querySelector('#loc-popover:not(.hidden)');
    section.outerHTML = locationSelectHtml(staged);
    const nextSearch = overlay.querySelector('[data-loc-search]');
    const nextPopover = overlay.querySelector('#loc-popover');
    if (nextSearch) {
      nextSearch.value = value;
      filterCityList(value);
    }
    if (wasOpen && nextPopover) {
      nextPopover.classList.remove('hidden');
      const toggle = overlay.querySelector('[data-loc-toggle]');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
      if (nextSearch) nextSearch.focus();
    }
  }

  function refreshSheet() {
    if (!overlay || !staged) return;
    const scrollTop = (overlay.querySelector('.overflow-y-auto') || {}).scrollTop || 0;
    overlay.innerHTML = filterSheetHtml({ filters: staged, resultCount: service.total });
    const scroller = overlay.querySelector('.overflow-y-auto');
    if (scroller) scroller.scrollTop = scrollTop;
  }

  function toggleLocPopover() {
    const popover = root.querySelector('#loc-popover');
    const toggle = root.querySelector('[data-loc-toggle]');
    if (!popover) return;
    const hidden = popover.classList.toggle('hidden');
    if (toggle) toggle.setAttribute('aria-expanded', String(!hidden));
    if (!hidden) {
      const search = popover.querySelector('[data-loc-search]');
      if (search) search.focus();
    }
  }

  function visibleCityOptions(scope) {
    const list = scope.querySelector('#loc-list');
    if (!list) return [];
    return [...list.querySelectorAll('[data-city-option]')].filter((el) => {
      const group = el.closest('[data-province-cities]');
      return group && !group.classList.contains('hidden');
    });
  }

  function filterCityList(term) {
    const list = root.querySelector('#loc-list');
    if (!list) return;
    const q = term.trim().toLowerCase();
    let anyVisible = false;
    list.querySelectorAll('[data-province-group]').forEach((group) => {
      const cities = group.querySelector('[data-province-cities]');
      const provinceName = group.dataset.provinceGroup.toLowerCase();
      let groupVisible = false;
      cities.querySelectorAll('[data-city-option]').forEach((opt) => {
        const match = !q || opt.dataset.cityOption.toLowerCase().includes(q) || provinceName.includes(q);
        opt.classList.toggle('hidden', !match);
        if (match) groupVisible = true;
      });
      cities.classList.toggle('hidden', !groupVisible);
      const provinceBtn = group.querySelector('[data-province]');
      if (provinceBtn) provinceBtn.classList.toggle('hidden', !groupVisible && !!q);
      group.classList.toggle('hidden', !groupVisible && !!q);
      if (groupVisible) anyVisible = true;
    });
    const none = list.querySelector('[data-loc-none]');
    if (none) none.classList.toggle('hidden', anyVisible);
  }

  function setPriceMessage() {
    const msg = root.querySelector('[data-price-msg]');
    if (!msg || !staged) return;
    if (staged.min !== null && staged.max !== null && staged.min > staged.max) {
      msg.textContent = t('filter.priceSwap');
      msg.classList.add('text-rose-600');
    } else {
      msg.textContent = t('filter.priceHint');
      msg.classList.remove('text-rose-600');
    }
  }

  /* Geolocation is a gated capability: ask on this tap, read the answer, and
   * read `active` twice - a first grant reloads the frame, so we stop and let
   * the reload land rather than calling the web API against a policy that
   * cannot apply yet. Degrades to a message when the bridge is absent or the
   * document has no grant. */
  async function useCurrentLocation() {
    const bridge = window.usernode;
    const msg = root.querySelector('[data-price-msg]');
    if (!bridge || typeof bridge.requestPermission !== 'function'
      || (typeof bridge.hasCapability === 'function' && !bridge.hasCapability('geolocation'))) {
      if (msg) msg.textContent = t('filter.locationUnavailable');
      return;
    }
    if (!navigator.geolocation) return;
    try {
      const r = await bridge.requestPermission('geolocation');
      if (!r || r.state !== 'granted') {
        if (msg) msg.textContent = r && r.reason === 'declined'
          ? t('filter.locationDeclined')
          : t('filter.locationUnavailable');
        return;
      }
      if (!r.active) return; // granted; the frame is about to reload
      navigator.geolocation.getCurrentPosition((pos) => {
        const city = nearestCity(pos.coords.latitude, pos.coords.longitude);
        const prov = city && LOCATIONS.find((p) => p.cities.some((c) => c.name === city));
        // Only an independently known city in the taxonomy may be applied.
        if (!city || !prov || !citiesByProvince(prov.name).includes(city)) {
          if (msg) msg.textContent = t('filter.noCityNearby');
          return;
        }
        if (!staged) return;
        patchStaged({ province: prov.name, cities: [city] });
        refreshSheet();
      }, () => {
        if (msg) msg.textContent = t('filter.locationError');
      }, { timeout: 8000 });
    } catch {
      if (msg) msg.textContent = t('filter.locationError');
    }
  }
}

export { hasActiveFilters, DEFAULT_LIMIT };
