// Tailwind config for this app's precompiled stylesheet.
//
// npm run build (Docker or Paketo) runs the Tailwind CLI over the globs below
// and writes public/tailwind.css, which public/index.html links as
// /tailwind.css. Nothing is committed — every image build regenerates it.
//
// To build it locally (optional; the image build does this for you):
//   npm ci --include=dev
//   npm run build
module.exports = {
  // Every file that can contain a class name. Tailwind's extractor is a
  // regex over source text, so it finds class names written as whole
  // literals — including ones inside JS strings in these files.
  content: [
    './public/**/*.html',
    './public/**/*.js',
  ],

  // Classes this app builds dynamically (if it ever does) go here, since the
  // extractor cannot see them. Prefer whole literals in the markup instead.
  safelist: [],

  // This app does not use Tailwind's dark: variants; its five background
  // color themes (see styles/tailwind-input.css) are driven by CSS variables
  // swapped through the data-theme attribute on <html>.
  darkMode: 'class',

  // Stops hover: styles sticking after a tap on touch screens. Required by
  // the usernode-native UI kit and harmless without it.
  future: { hoverOnlyWhenSupported: true },

  theme: {
    extend: {
      // Design-system tokens. `brand` is the app's single accent. It is NOT
      // a fixed violet ramp any more: every shade reads an --accent-*-rgb
      // CSS variable defined per theme in styles/tailwind-input.css (Purple
      // Dream default = the original violet values). Themes follow the
      // codebase's two-shade pattern: --accent-500 is the vivid identity
      // accent (bars, dots, rings), --accent-600 the darkened AA-safe shade
      // for white-on-color button fills — same rationale as sale-600 below.
      // The <alpha-value> placeholder keeps slash-opacity variants like
      // bg-brand-50/50 working.
      //
      // `sale` is the warm orange/red reserved for sale, discount and
      // countdown elements, and stays literal in every theme: 500 (#FF4D2E)
      // is the pure accent for bars, fills, borders and icons; 600 (#C7360F)
      // is the darkened AA-safe shade for small white-on-color text (raw 500
      // under white is ~3.3:1, below the 4.5:1 small-text threshold);
      // 50 (#FFF1F0) is the Purple Dream Flash Sale tint. `page` is the
      // layered page base, `line` the panel hairline. Amber stays the
      // ratings color; spacing and radii use the default 4px scale.
      colors: {
        brand: {
          50: 'rgb(var(--accent-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--accent-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--accent-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--accent-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--accent-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--accent-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--accent-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--accent-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--accent-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--accent-900-rgb) / <alpha-value>)',
        },
        sale: {
          50: '#FFF1F0',
          500: '#FF4D2E',
          600: '#C7360F',
        },
        page: 'rgb(var(--page-rgb) / <alpha-value>)',
        line: 'rgb(var(--line-rgb) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 24, 27, 0.06), 0 1px 3px rgba(24, 24, 27, 0.08)',
        'card-lg': '0 4px 12px rgba(24, 24, 27, 0.08), 0 2px 4px rgba(24, 24, 27, 0.06)',
        // Home section panels: soft layered shadow with a faint purple cast.
        panel: '0 1px 2px rgba(24, 24, 27, 0.04), 0 8px 24px rgba(76, 29, 149, 0.06)',
        // Sticky header: hairline plus a soft drop so panels slide under it.
        header: '0 1px 0 #ECEDF3, 0 4px 12px rgba(24, 24, 27, 0.06)',
      },
    },
  },
  plugins: [],
};
