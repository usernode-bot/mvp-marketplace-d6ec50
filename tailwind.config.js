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

  // Matches the <html class="dark"> in public/index.html: dark: variants key
  // off that class rather than the OS colour-scheme preference.
  darkMode: 'class',

  // Stops hover: styles sticking after a tap on touch screens. Required by
  // the usernode-native UI kit and harmless without it.
  future: { hoverOnlyWhenSupported: true },

  theme: {
    extend: {
      // Design-system tokens. `brand` is the app's single accent (a violet
      // ramp, deliberately not any existing marketplace's color). `sale` is
      // the warm orange/red reserved for sale, discount and countdown
      // elements: 500 (#FF4D2E) is the pure accent for bars, fills, borders
      // and icons; 600 (#C7360F) is the darkened AA-safe shade for small
      // white-on-color text (raw 500 under white is ~3.3:1, below the 4.5:1
      // small-text threshold); 50 (#FFF1F0) doubles as the Flash Sale tint.
      // `page` is the layered page base, `line` the panel hairline. Amber
      // stays the ratings color; spacing and radii use the default 4px scale.
      colors: {
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        sale: {
          50: '#FFF1F0',
          500: '#FF4D2E',
          600: '#C7360F',
        },
        page: '#F5F6FA',
        line: '#ECEDF3',
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
