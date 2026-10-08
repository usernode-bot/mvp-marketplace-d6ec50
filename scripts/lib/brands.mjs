/* Fictional, unique brand names. Each category gets its own pool so a brand
 * reads as a specialist ("Zorvex" makes electronics, not groceries). Names are
 * built from syllables and checked against a blocklist of real brands and
 * against every brand the app already ships, so none can collide. */

import { makeRng } from './rng.mjs';

const PREFIX = ['Zor', 'Vel', 'Kir', 'Tal', 'Mon', 'Sev', 'Ori', 'Bry', 'Lum', 'Nex', 'Dov', 'Fen', 'Quil', 'Har', 'Jun', 'Pel',
  'Wyn', 'Cas', 'Rho', 'Ulm', 'Ash', 'Brin', 'Cael', 'Dra', 'Elo', 'Fyn', 'Gal', 'Hol', 'Isk', 'Jor', 'Kes', 'Lor', 'Mar', 'Nim',
  'Oxa', 'Pri', 'Rav', 'Sol', 'Tov', 'Vor', 'Wen', 'Yar', 'Zan', 'Alder', 'Birch', 'Cove', 'Dune', 'Ember', 'Fable', 'Grove'];
const SUFFIX = ['vex', 'ora', 'ine', 'ley', 'ton', 'mark', 'ova', 'wick', 'dell', 'ra', 'lio', 'nova', 'sen', 'ford', 'mere', 'tek',
  'wood', 'quist', 'bell', 'rin', 'dale', 'vale', 'lyn', 'ro', 'ware', 'field'];

/* Real brands (and near-misses) a generated name must never equal. */
const REAL = new Set(['sony', 'bose', 'apple', 'samsung', 'dell', 'nike', 'adidas', 'puma', 'lego', 'canon', 'nikon', 'asus', 'acer',
  'lenovo', 'hp', 'logitech', 'razer', 'jbl', 'philips', 'panasonic', 'sharp', 'xiaomi', 'huawei', 'oppo', 'vivo', 'google', 'garmin',
  'fitbit', 'casio', 'seiko', 'timex', 'fossil', 'rolex', 'omega', 'gucci', 'prada', 'zara', 'hm', 'uniqlo', 'levis', 'gap', 'ikea',
  'nestle', 'lindt', 'oreo', 'kraft', 'heinz', 'loreal', 'dove', 'nivea', 'olay', 'maybelline', 'revlon', 'mac', 'clinique', 'tiffany',
  'cartier', 'pandora', 'swarovski', 'samsonite', 'tumi', 'yeti', 'hydroflask', 'northface', 'patagonia', 'columbia', 'wilson',
  'spalding', 'molten', 'mikasa', 'lululemon', 'gopro', 'dji', 'tcl', 'hisense', 'vizio', 'roku', 'ring', 'nest', 'wyze']);

export function makeBrandPools(sizes, taken = []) {
  const used = new Set([...REAL, ...taken.map((b) => String(b).toLowerCase())]);
  const pools = {};
  for (const cat of Object.keys(sizes)) {
    const rng = makeRng('brands:' + cat);
    pools[cat] = [];
    let guard = 0;
    while (pools[cat].length < sizes[cat] && guard++ < 5000) {
      const name = rng.pick(PREFIX) + rng.pick(SUFFIX);
      const key = name.toLowerCase();
      if (used.has(key)) continue;
      used.add(key);
      pools[cat].push(name);
    }
  }
  return pools;
}

export function isRealBrand(name) {
  return REAL.has(String(name).toLowerCase());
}
