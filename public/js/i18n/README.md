# Translations

Every user-facing string in MVP Marketplace comes from the dictionaries under
`public/js/locales/<code>/<namespace>.js`, read through `t()` in
`public/js/i18n.js`. Components never hard-code copy: they call
`t('some.key')` (or `t('key', { count })` for plurals).

## Files

```
public/js/i18n.js                      t(), setLocale(), translateStatic(), LOCALES
public/js/locales/en/<namespace>.js    English source, flat key -> string
public/js/locales/id/<namespace>.js    Bahasa Indonesia overrides
```

`en` is the source of truth and the default locale. A key missing from the
active locale falls back to English; a key missing everywhere renders as an
empty string.

## Adding a language

1. Copy `locales/en/` to `locales/<code>/` and translate the values (keep keys).
2. Import the new files in `i18n.js`, extend `NAMESPACES` and `DICTS`.
3. Add `{ code, label, intl }` to `LOCALES` so it appears in the Settings picker.

Static markup in `index.html` is translated through `data-i18n`,
`data-i18n-placeholder` and `data-i18n-aria-label` attributes.
`tests/i18n.test.mjs` checks that every literal `t()` key exists in English.
