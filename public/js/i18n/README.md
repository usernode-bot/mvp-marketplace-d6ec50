# Translations

Every user-facing string in MVP Marketplace comes from `public/js/i18n.js`.
Components never hard-code copy: they call `t('some.key')`, or look a key up
through a helper (`categoryName`, `sortOptionLabel`, `shippingEta`, …).

## Files

```
public/js/i18n.js          the dictionaries, the `t()` lookup and the locale lifecycle
public/js/i18n/README.md   this guide
```

The dictionaries live in one module as plain objects:

- `EN` is the **source of truth**. It is complete and it is the default locale,
  so an English visitor (and every existing English assertion) is unchanged.
- `ES` is a complete Spanish dictionary. `COMPLETE_LOCALES` lists the complete
  ones, and only those appear in the Settings language picker.
- `PT_BR` and `ID` are **partial** dictionaries: a handful of keys each. They
  are still shipped so `?lang=pt-BR` / `?lang=id` render, but they are hidden
  from the picker until every key is translated. Any key they omit falls back
  to English.

## Lookup and fallback

`t(key, params)` resolves in this order, then returns the key itself:

1. the active locale's dictionary,
2. the English dictionary,
3. the `params.default` you passed,
4. the key (and logs a one-time `console.warn` in development so a missing key
   is visible without ever raising a console *error*).

`{name}` slots in a value are filled from `params`.

## Adding a new language

1. Copy the whole `EN` object in `public/js/i18n.js` to a new `const`, say
   `const FR = { … }`, and translate the **values**. Keep every key identical
   to English: the dictionaries must share the same key set.
2. Add the dictionary to `DICTS`:
   `const DICTS = { en: EN, es: ES, 'pt-BR': PT_BR, id: ID, fr: FR };`
3. Add the BCP-47 tag to `SHIPPED_LOCALES`, and to `INTL_TAGS` if the tag Intl
   should use differs from the dictionary key (English maps to `en-US`).
4. Add its endonym to `LOCALE_NAMES` (for example `fr: 'Français'`), plus a
   `SERVER_STRINGS` entry in `server.js` for the localized API error copy.
5. Once **every** key is translated, add the tag to `COMPLETE_LOCALES` so the
   language appears in the Settings picker. Until then it stays reachable with
   `?lang=<tag>` only.
6. Check parity before committing:

   ```sh
   node -e "const fs=require('fs');const s=fs.readFileSync('public/js/i18n.js','utf8');
   const g=(n)=>eval('({'+s.match(new RegExp('const '+n+' = \\\\{([\\\\s\\\\S]*?)\\\\n\\\\};'))[1]+'})');
   const en=g('EN'),fr=g('FR');
   console.log(Object.keys(en).filter((k)=>!(k in fr)));"
   ```

## Localized catalog content

Product content is not in the dictionaries. The API answers localized
name/description/specs from the `product_i18n` table (see the "Localized
catalog" note in the repository README / the change that added it), keyed by
`(product_id, locale)`, and falls back to the English columns. Add rows there,
not in `i18n.js`, to translate product content.
